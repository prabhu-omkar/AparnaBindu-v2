import math
import torch
import torch.nn as nn
import torch.nn.functional as F

import timm  # pip install timm


# ---------------------------------------------
# DropPath (Stochastic Depth) implementation
# ---------------------------------------------
class DropPath(nn.Module):
    """
    Drop paths (Stochastic Depth) per sample.
    From: https://arxiv.org/abs/1603.09382
    """

    def __init__(self, drop_prob: float = 0.0):
        super().__init__()
        self.drop_prob = drop_prob

    def forward(self, x):
        if self.drop_prob == 0.0 or not self.training:
            return x
        keep_prob = 1 - self.drop_prob
        shape = (x.shape[0],) + (1,) * (x.ndim - 1)
        random_tensor = keep_prob + torch.rand(shape, dtype=x.dtype, device=x.device)
        random_tensor.floor_()
        return x / keep_prob * random_tensor


# ---------------------------------------------
# LayerScale — per-block learnable scaling
# (from CaiT / Going Deeper with Image Transformers)
# ---------------------------------------------
class LayerScale(nn.Module):
    def __init__(self, dim: int, init_value: float = 1e-4):
        super().__init__()
        self.gamma = nn.Parameter(init_value * torch.ones(dim))

    def forward(self, x):
        return x * self.gamma


# ---------------------------------------------
# Multi-Head Self-Attention with Relative Position Bias
# (Swin-Transformer style)
# ---------------------------------------------
class RelativePositionBias(nn.Module):
    """
    Learnable 2-D relative-position bias table.
    Given a grid of (H, W) tokens, the table stores a bias for every
    possible (delta_y, delta_x) pair used inside attention.
    """

    def __init__(self, num_heads: int, grid_size: int):
        super().__init__()
        self.num_heads = num_heads
        self.grid_size = grid_size  # H = W = grid_size for the patch grid
        num_tokens = grid_size * grid_size  # without CLS

        # Range of relative coords: -(grid_size-1) ... 0 ... +(grid_size-1)
        self.table_size = 2 * grid_size - 1
        self.relative_position_bias_table = nn.Parameter(
            torch.zeros(self.table_size * self.table_size, num_heads)
        )
        nn.init.trunc_normal_(self.relative_position_bias_table, std=0.02)

        # Build the index that maps every (token_i, token_j) pair to a table entry
        coords_h = torch.arange(grid_size)
        coords_w = torch.arange(grid_size)
        coords = torch.stack(torch.meshgrid(coords_h, coords_w, indexing="ij"))  # (2, H, W)
        coords_flat = coords.reshape(2, -1)  # (2, H*W)

        relative_coords = coords_flat[:, :, None] - coords_flat[:, None, :]  # (2, N, N)
        relative_coords = relative_coords.permute(1, 2, 0).contiguous()  # (N, N, 2)
        relative_coords[:, :, 0] += grid_size - 1  # shift to 0-indexed
        relative_coords[:, :, 1] += grid_size - 1
        relative_coords[:, :, 0] *= self.table_size
        relative_index = relative_coords.sum(-1)  # (N, N)
        self.register_buffer("relative_position_index", relative_index)

    def forward(self, seq_len: int):
        """
        Returns bias of shape (num_heads, seq_len, seq_len).
        seq_len = 1 (CLS) + num_patches.
        """
        num_patches = self.grid_size * self.grid_size
        # Patch-to-patch bias
        bias = self.relative_position_bias_table[
            self.relative_position_index.view(-1)
        ].view(num_patches, num_patches, -1)  # (N, N, nH)
        bias = bias.permute(2, 0, 1).contiguous()  # (nH, N, N)

        # Expand to include CLS token (row 0, col 0) with zero bias
        full_bias = torch.zeros(
            self.num_heads, seq_len, seq_len,
            device=bias.device, dtype=bias.dtype,
        )
        full_bias[:, 1:, 1:] = bias  # patch↔patch
        return full_bias.unsqueeze(0)  # (1, nH, S, S)


class Attention(nn.Module):
    """Multi-head self-attention with explicit QKV projections."""

    def __init__(self, dim, num_heads, attn_drop=0.0, proj_drop=0.0):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = dim // num_heads
        self.scale = self.head_dim ** -0.5

        self.qkv = nn.Linear(dim, dim * 3)
        self.attn_drop = nn.Dropout(attn_drop)
        self.proj = nn.Linear(dim, dim)
        self.proj_drop = nn.Dropout(proj_drop)

    def forward(self, x, attn_bias=None):
        B, N, C = x.shape
        qkv = (
            self.qkv(x)
            .reshape(B, N, 3, self.num_heads, self.head_dim)
            .permute(2, 0, 3, 1, 4)
        )
        q, k, v = qkv.unbind(0)  # each: (B, nH, N, head_dim)

        attn = (q @ k.transpose(-2, -1)) * self.scale  # (B, nH, N, N)
        if attn_bias is not None:
            attn = attn + attn_bias
        attn = attn.softmax(dim=-1)
        attn = self.attn_drop(attn)

        x = (attn @ v).transpose(1, 2).reshape(B, N, C)
        x = self.proj(x)
        x = self.proj_drop(x)
        return x


# ---------------------------------------------
# Transformer / ViT Blocks
# ---------------------------------------------
class MLP(nn.Module):
    def __init__(self, dim, mlp_ratio=4.0, drop=0.0):
        super().__init__()
        hidden_dim = int(dim * mlp_ratio)
        self.fc1 = nn.Linear(dim, hidden_dim)
        self.act = nn.GELU()
        self.fc2 = nn.Linear(hidden_dim, dim)
        self.drop = nn.Dropout(drop)

    def forward(self, x):
        x = self.fc1(x)
        x = self.act(x)
        x = self.drop(x)
        x = self.fc2(x)
        x = self.drop(x)
        return x


class TransformerBlock(nn.Module):
    def __init__(
        self,
        dim,
        num_heads,
        mlp_ratio=4.0,
        attn_drop=0.0,
        proj_drop=0.0,
        drop_path=0.0,
        layer_scale_init=1e-4,
    ):
        super().__init__()
        self.norm1 = nn.LayerNorm(dim)
        self.attn = Attention(
            dim=dim,
            num_heads=num_heads,
            attn_drop=attn_drop,
            proj_drop=proj_drop,
        )
        self.ls1 = LayerScale(dim, init_value=layer_scale_init)
        self.drop_path = DropPath(drop_path) if drop_path > 0.0 else nn.Identity()

        self.norm2 = nn.LayerNorm(dim)
        self.mlp = MLP(dim, mlp_ratio=mlp_ratio, drop=proj_drop)
        self.ls2 = LayerScale(dim, init_value=layer_scale_init)

    def forward(self, x, attn_bias=None):
        # Self-attention with LayerScale
        x = x + self.drop_path(self.ls1(self.attn(self.norm1(x), attn_bias=attn_bias)))
        # MLP with LayerScale
        x = x + self.drop_path(self.ls2(self.mlp(self.norm2(x))))
        return x


# ---------------------------------------------
# ConvNeXt-Tiny + Improved ViT Hybrid for Kolam
# ---------------------------------------------
class KolamConvNeXtViT(nn.Module):
    """
    Hybrid model (v2 — improved architecture):
      - ConvNeXt-Tiny backbone (ImageNet pretrained) as CNN feature extractor
      - Enhanced ViT with:
          · Relative position bias (Swin-style)
          · LayerScale for stable deep training
          · Explicit QKV attention
          · Dual pooling head (CLS + global-average of patch tokens)
      - Classification head for Kolam categories

    Designed for input: [B, 3, 380, 380]
    ConvNeXt-Tiny final feature map: [B, 768, 12, 12] → 144 patch tokens
    """

    def __init__(
        self,
        num_classes: int = 12,
        backbone_name: str = "convnext_tiny",
        vit_dim: int = 768,
        vit_depth: int = 8,
        vit_heads: int = 12,
        vit_mlp_ratio: float = 4.0,
        attn_drop: float = 0.0,
        proj_drop: float = 0.15,
        drop_path_rate: float = 0.2,
        layer_scale_init: float = 1e-4,
    ):
        super().__init__()

        self.num_classes = num_classes
        self.vit_dim = vit_dim

        # ---------------------------------------------
        # ConvNeXt-Tiny backbone as feature extractor
        # ---------------------------------------------
        self.backbone = timm.create_model(
            backbone_name,
            pretrained=True,
            features_only=True,
            out_indices=[3],
        )
        self.backbone_out_channels = self.backbone.feature_info.channels()[-1]  # 768

        # ---------------------------------------------
        # Projection: backbone channels -> ViT dim
        # (identity when both are 768)
        # ---------------------------------------------
        if self.backbone_out_channels != vit_dim:
            self.proj = nn.Linear(self.backbone_out_channels, vit_dim)
        else:
            self.proj = nn.Identity()

        # ---------------------------------------------
        # Grid size for relative-position bias
        # For 380×380 with ConvNeXt-Tiny the final map is 11×11
        # (380 / 32 stride ≈ 11.875, floor → 11)
        # ---------------------------------------------
        self.grid_size = 11  # expected spatial dim
        self.num_patches = self.grid_size * self.grid_size  # 121
        self.seq_len = self.num_patches + 1  # +1 for CLS

        # CLS token
        self.cls_token = nn.Parameter(torch.zeros(1, 1, vit_dim))
        nn.init.trunc_normal_(self.cls_token, std=0.02)

        # Positional embedding (additive, on top of relative bias)
        self.pos_embed = nn.Parameter(torch.zeros(1, self.seq_len, vit_dim))
        nn.init.trunc_normal_(self.pos_embed, std=0.02)

        # Relative position bias
        self.rel_pos_bias = RelativePositionBias(
            num_heads=vit_heads,
            grid_size=self.grid_size,
        )

        # ---------------------------------------------
        # Transformer encoder (ViT)
        # ---------------------------------------------
        dpr = torch.linspace(0, drop_path_rate, vit_depth).tolist()

        self.blocks = nn.ModuleList(
            [
                TransformerBlock(
                    dim=vit_dim,
                    num_heads=vit_heads,
                    mlp_ratio=vit_mlp_ratio,
                    attn_drop=attn_drop,
                    proj_drop=proj_drop,
                    drop_path=dpr[i],
                    layer_scale_init=layer_scale_init,
                )
                for i in range(vit_depth)
            ]
        )
        self.norm = nn.LayerNorm(vit_dim)

        # ---------------------------------------------
        # Dual-pool classification head
        # Concatenate CLS token + global avg of patch tokens → 2*vit_dim
        # Then project down → num_classes
        # ---------------------------------------------
        head_dim = vit_dim * 2
        self.head_norm = nn.LayerNorm(head_dim)
        self.head_dropout = nn.Dropout(0.3)
        self.head = nn.Linear(head_dim, num_classes)

    def forward_features(self, x):
        """
        x: [B, 3, 380, 380]
        """
        features = self.backbone(x)[0]  # [B, C, H', W']
        B, C, H, W = features.shape

        # Flatten spatial dims: [B, C, H, W] -> [B, H*W, C]
        x_tokens = features.reshape(B, C, H * W).permute(0, 2, 1)  # [B, N, C]

        # Linear projection: C -> vit_dim
        x_tokens = self.proj(x_tokens)  # [B, N, vit_dim]

        # Add CLS token
        cls_tokens = self.cls_token.expand(B, -1, -1)  # [B, 1, vit_dim]
        x_tokens = torch.cat((cls_tokens, x_tokens), dim=1)  # [B, 1+N, vit_dim]

        # Add positional encoding
        # Handle potential size mismatch (if feature map is not exactly 12×12)
        seq_len = x_tokens.shape[1]
        if seq_len == self.pos_embed.shape[1]:
            x_tokens = x_tokens + self.pos_embed
        else:
            # Interpolate pos_embed to match actual sequence length
            cls_pe = self.pos_embed[:, :1, :]
            patch_pe = self.pos_embed[:, 1:, :]
            patch_pe = F.interpolate(
                patch_pe.transpose(1, 2),
                size=seq_len - 1,
                mode="linear",
                align_corners=False,
            ).transpose(1, 2)
            x_tokens = x_tokens + torch.cat([cls_pe, patch_pe], dim=1)

        # Compute relative position bias
        attn_bias = self.rel_pos_bias(seq_len)

        # Pass through Transformer blocks
        for blk in self.blocks:
            x_tokens = blk(x_tokens, attn_bias=attn_bias)

        # Final norm
        x_tokens = self.norm(x_tokens)

        # Dual pooling: CLS token + global average of patch tokens
        cls_out = x_tokens[:, 0]  # [B, vit_dim]
        patch_avg = x_tokens[:, 1:].mean(dim=1)  # [B, vit_dim]
        combined = torch.cat([cls_out, patch_avg], dim=-1)  # [B, 2*vit_dim]

        return combined

    def forward(self, x):
        combined = self.forward_features(x)  # [B, 2*vit_dim]
        x = self.head_norm(combined)
        x = self.head_dropout(x)
        logits = self.head(x)  # [B, num_classes]
        return logits
