"""
Kolam Dataset with Class-Specific Augmentations
Using Albumentations + PyTorch

This implementation applies semantically-aware augmentations that preserve
the cultural and geometric meaning of each Kolam motif type.

Key principle: Animals, symbols, and oriented patterns should not be flipped
or rotated in ways that create unrealistic or semantically invalid variants.
"""

from pathlib import Path
from typing import Dict, Tuple, Optional
import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader
import albumentations as A
from albumentations.pytorch import ToTensorV2

target_H, target_W = 380, 380


class KolamAugmentationPolicy:
    """
    Defines augmentation strategies for each Kolam category.
    
    Design Philosophy:
    - Animals (peacock, elephant, cow, fish) have natural upright orientation
    - Sacred symbols (om) have canonical fixed orientation
    - Footprints convey directional meaning and should not be flipped
    - Geometric and floral patterns often have rotational symmetry
    - All categories can handle photometric variations (lighting, contrast)
    """
    
    def __init__(self, img_size: int = 224):
        """
        Initialize augmentation policies for all Kolam categories.
        
        Args:
            img_size: Target image size (224 for EfficientNet-B0/B1, 380 for B4)
        """
        self.img_size = img_size
        self.policies = self._create_policies()
    
    def _create_policies(self) -> Dict[str, A.Compose]:
        """
        Create class-specific augmentation pipelines.
        
        Returns:
            Dictionary mapping class names to Albumentations Compose objects
        """
        
        # ===================================================================
        # CATEGORY 1: ANIMALS WITH NATURAL ORIENTATION
        # (peacock, elephant, cow, fish)
        # ===================================================================
        animal_augmentation = A.Compose([
            A.HorizontalFlip(p=0.5),
            A.Rotate(limit=8, border_mode=0, p=0.3),
            A.Affine(
                scale=(0.9, 1.1),
                translate_percent={"x": (-0.1, 0.1), "y": (-0.1, 0.1)},
                rotate=0.0,
                shear=(0.0, 0.0),
                border_mode=0,
                fill=0,
                p=0.3,
            ),
            A.OneOf([
                A.RandomBrightnessContrast(
                    brightness_limit=0.2,
                    contrast_limit=0.2,
                    p=1.0
                ),
                A.HueSaturationValue(
                    hue_shift_limit=10,
                    sat_shift_limit=20,
                    val_shift_limit=20,
                    p=1.0
                ),
            ], p=0.5),
            A.OneOf([
                A.GaussNoise(std_range=(0.02, 0.08), mean_range=(0.0, 0.0), p=1.0),
                A.GaussianBlur(blur_limit=(3, 5), p=1.0),
                A.Sharpen(alpha=(0.1, 0.3), lightness=(0.5, 1.0), p=1.0),
            ], p=0.2),
            A.LongestMaxSize(max_size=target_H, p=1.0),
            A.PadIfNeeded(
                min_height=target_H,
                min_width=target_W,
                border_mode=0,
                fill=0,
                p=1.0,
            ),
            A.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
            ToTensorV2()
        ])
        
        # ===================================================================
        # CATEGORY 2: SACRED SYMBOLS AND ORIENTED PATTERNS
        # (om, footprint)
        # ===================================================================
        symbol_augmentation = A.Compose([
            A.Rotate(limit=3, border_mode=0, p=0.2),
            A.Affine(
                scale=(0.95, 1.05),
                translate_percent={"x": (-0.05, 0.05), "y": (-0.05, 0.05)},
                rotate=0.0,
                shear=(0.0, 0.0),
                border_mode=0,
                fill=0,
                p=0.2,
            ),
            A.RandomBrightnessContrast(
                brightness_limit=0.25,
                contrast_limit=0.25,
                p=0.6
            ),
            A.OneOf([
                A.GaussNoise(std_range=(0.02, 0.08), mean_range=(0.0, 0.0), p=1.0),
                A.GaussianBlur(blur_limit=(3, 5), p=1.0),
            ], p=0.3),
            A.LongestMaxSize(max_size=target_H, p=1.0),
            A.PadIfNeeded(
                min_height=target_H,
                min_width=target_W,
                border_mode=0,
                fill=0,
                p=1.0,
            ),
            A.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
            ToTensorV2()
        ])
        
        # ===================================================================
        # CATEGORY 3: SYMMETRIC PATTERNS
        # (geometric, flower, creeper, loops, kambi)
        # ===================================================================
        symmetric_augmentation = A.Compose([
            A.HorizontalFlip(p=0.5),
            A.VerticalFlip(p=0.3),
            A.Rotate(limit=20, border_mode=0, p=0.5),
            A.Affine(
                scale=(0.85, 1.15),
                translate_percent={"x": (-0.1, 0.1), "y": (-0.1, 0.1)},
                rotate=0.0,
                shear=(0.0, 0.0),
                border_mode=0,
                fill=0,
                p=0.4,
            ),
            A.OneOf([
                A.RandomBrightnessContrast(
                    brightness_limit=0.2,
                    contrast_limit=0.2,
                    p=1.0
                ),
                A.HueSaturationValue(
                    hue_shift_limit=15,
                    sat_shift_limit=25,
                    val_shift_limit=25,
                    p=1.0
                ),
            ], p=0.5),
            A.OneOf([
                A.GaussNoise(std_range=(0.02, 0.08), mean_range=(0.0, 0.0), p=1.0),
                A.GaussianBlur(blur_limit=(3, 5), p=1.0),
                A.Sharpen(alpha=(0.1, 0.3), lightness=(0.5, 1.0), p=1.0),
            ], p=0.2),
            A.LongestMaxSize(max_size=target_H, p=1.0),
            A.PadIfNeeded(
                min_height=target_H,
                min_width=target_W,
                border_mode=0,
                fill=0,
                p=1.0,
            ),
            A.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
            ToTensorV2()
        ])
        
        # ===================================================================
        # CATEGORY 4: MODERATE SYMMETRY (butterfly, fish)
        # ===================================================================
        butterfly_augmentation = A.Compose([
            A.HorizontalFlip(p=0.5),
            A.Rotate(limit=12, border_mode=0, p=0.4),
            A.Affine(
                scale=(0.9, 1.1),
                translate_percent={"x": (-0.1, 0.1), "y": (-0.1, 0.1)},
                rotate=0.0,
                shear=(0.0, 0.0),
                border_mode=0,
                fill=0,
                p=0.3,
            ),
            A.RandomBrightnessContrast(
                brightness_limit=0.2,
                contrast_limit=0.2,
                p=0.5
            ),
            A.OneOf([
                A.GaussNoise(std_range=(0.02, 0.08), mean_range=(0.0, 0.0), p=1.0),
                A.GaussianBlur(blur_limit=(3, 5), p=1.0),
            ], p=0.2),
            A.LongestMaxSize(max_size=target_H, p=1.0),
            A.PadIfNeeded(
                min_height=target_H,
                min_width=target_W,
                border_mode=0,
                fill=0,
                p=1.0,
            ),
            A.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
            ToTensorV2()
        ])
        
        # ===================================================================
        # CATEGORY 5: MISC / UNKNOWN (extra)
        # ===================================================================
        conservative_augmentation = A.Compose([
            A.HorizontalFlip(p=0.3),
            A.Rotate(limit=10, border_mode=0, p=0.3),
            A.RandomBrightnessContrast(
                brightness_limit=0.15,
                contrast_limit=0.15,
                p=0.4
            ),
            A.LongestMaxSize(max_size=target_H, p=1.0),
            A.PadIfNeeded(
                min_height=target_H,
                min_width=target_W,
                border_mode=0,
                fill=0,
                p=1.0,
            ),
            A.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
            ToTensorV2()
        ])
        
        # Mapping
        return {
            # Animals
            "peacock": animal_augmentation,
            "elephant": animal_augmentation,
            "cow": animal_augmentation,
            
            # Symbols / oriented
            "om": symbol_augmentation,
            "footprint": symbol_augmentation,
            
            # Symmetric patterns
            "geometric": symmetric_augmentation,
            "flower": symmetric_augmentation,
            "creeper": symmetric_augmentation,
            "loops": symmetric_augmentation,
            "kambi": symmetric_augmentation,
            
            # Bilateral
            "butterfly": butterfly_augmentation,
            "fish": butterfly_augmentation,
            
            # Fallback
            "extra": conservative_augmentation,
        }

    def get_policy(self, class_name: str) -> A.Compose:
        return self.policies.get(
            class_name.lower(),
            self.policies["extra"],
        )


class KolamDataset(Dataset):
    """
    PyTorch Dataset for Kolam images with class-specific augmentations.
    """
    
    def __init__(
        self,
        root_dir: str,
        augmentation_policy: Optional[KolamAugmentationPolicy] = None,
        split: str = "train",
        img_size: int = 224,
    ):
        self.root_dir = Path(root_dir) / split
        self.split = split
        self.img_size = img_size
        
        if augmentation_policy is None:
            self.aug_policy = KolamAugmentationPolicy(img_size=img_size)
        else:
            self.aug_policy = augmentation_policy
        
        self.val_test_transform = A.Compose([
            A.LongestMaxSize(max_size=target_H, p=1.0),
            A.PadIfNeeded(
                min_height=target_H,
                min_width=target_W,
                border_mode=0,
                fill=0,
                p=1.0,
            ),
            A.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
            ToTensorV2()
        ])
        
        self.samples = []
        self.class_to_idx = {}
        self.idx_to_class = {}
        self._build_dataset_index()
    
    def _build_dataset_index(self):
        class_dirs = sorted([d for d in self.root_dir.iterdir() if d.is_dir()])
        
        self.class_to_idx = {cls_dir.name: idx for idx, cls_dir in enumerate(class_dirs)}
        self.idx_to_class = {idx: cls_name for cls_name, idx in self.class_to_idx.items()}
        
        valid_extensions = {".jpg", ".jpeg", ".png", ".bmp"}
        
        for class_dir in class_dirs:
            class_name = class_dir.name
            class_idx = self.class_to_idx[class_name]
            
            for img_path in class_dir.iterdir():
                if img_path.suffix.lower() in valid_extensions:
                    self.samples.append(
                        {
                            "path": img_path,
                            "class_name": class_name,
                            "class_idx": class_idx,
                        }
                    )
        
        print(f"\n{self.split.upper()} Dataset:")
        print(f"  Total images: {len(self.samples)}")
        print(f"  Number of classes: {len(self.class_to_idx)}")
        print(f"  Classes: {list(self.class_to_idx.keys())}")
    
    def __len__(self) -> int:
        return len(self.samples)
    
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        sample = self.samples[idx]
        
        image = Image.open(sample["path"]).convert("RGB")
        image = np.array(image)
        
        if self.split == "train":
            transform = self.aug_policy.get_policy(sample["class_name"])
        else:
            transform = self.val_test_transform
        
        augmented = transform(image=image)
        image_tensor = augmented["image"]
        
        return image_tensor, sample["class_idx"]
    
    def get_class_distribution(self) -> Dict[str, int]:
        distribution = {}
        for sample in self.samples:
            class_name = sample["class_name"]
            distribution[class_name] = distribution.get(class_name, 0) + 1
        return distribution


def create_kolam_dataloaders(
    data_dir: str,
    batch_size: int = 32,
    num_workers: int = 4,
    img_size: int = 224,
) -> Tuple[DataLoader, DataLoader, DataLoader, torch.FloatTensor]:
    """
    Create train, validation, and test dataloaders for Kolam dataset.
    Uses persistent_workers when num_workers > 0 for speed.
    """
    
    aug_policy = KolamAugmentationPolicy(img_size=img_size)
    
    train_dataset = KolamDataset(
        root_dir=data_dir,
        augmentation_policy=aug_policy,
        split="train",
        img_size=img_size,
    )
    
    val_dataset = KolamDataset(
        root_dir=data_dir,
        augmentation_policy=aug_policy,
        split="val",
        img_size=img_size,
    )
    
    test_dataset = KolamDataset(
        root_dir=data_dir,
        augmentation_policy=aug_policy,
        split="test",
        img_size=img_size,
    )
    
    class_distribution = train_dataset.get_class_distribution()
    total_samples = len(train_dataset)
    num_classes = len(class_distribution)
    
    class_weights = []
    for idx in range(num_classes):
        class_name = train_dataset.idx_to_class[idx]
        count = class_distribution[class_name]
        weight = total_samples / (num_classes * count)
        class_weights.append(weight)
    
    class_weights = torch.FloatTensor(class_weights)
    
    print("\nClass Weights (for handling imbalance):")
    for idx, weight in enumerate(class_weights):
        class_name = train_dataset.idx_to_class[idx]
        count = class_distribution[class_name]
        print(f"  {class_name}: {count} samples, weight: {weight:.3f}")
    
    use_persistent = num_workers > 0
    
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
        drop_last=True,
        persistent_workers=use_persistent,
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
        persistent_workers=use_persistent,
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
        persistent_workers=use_persistent,
    )
    
    return train_loader, val_loader, test_loader, class_weights


# ============================================================================
# EXAMPLE USAGE AND VISUALIZATION
# ============================================================================
if __name__ == "__main__":
    from torchvision.utils import make_grid, save_image

    train_loader, val_loader, test_loader, class_weights = create_kolam_dataloaders(
        data_dir="kolam_processed",
        batch_size=32,
        num_workers=0,  # set >0 to actually use persistent_workers
        img_size=380,
    )

    print("\n" + "=" * 70)
    print("DATALOADER SUMMARY")
    print("=" * 70)
    print(f"Training batches:   {len(train_loader)}")
    print(f"Validation batches: {len(val_loader)}")
    print(f"Test batches:       {len(test_loader)}")

    recommended_lr = 1e-3
    print(f"\nRecommended starting learning rate: {recommended_lr:.4f}")
    print("Use this when you define your optimizer, e.g.:")
    print("  optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)")

    print("\nTesting batch loading and augmentation...")
    images, labels = next(iter(train_loader))
    print(f" Batch shape:  {images.shape}")
    print(f" Labels shape: {labels.shape}")
    print(f" Image value range: [{images.min():.3f}, {images.max():.3f}]")
    print("\n✓ Dataloaders and augmentations are ready for training.")

    vis_root = Path("augmented_vis")
    vis_root.mkdir(parents=True, exist_ok=True)

    classes_to_visualize = [
        "butterfly",
        "cow",
        "creeper",
        "elephant",
        "fish",
        "flower",
        "footprint",
        "geometric",
        "kambi",
        "loops",
        "om",
        "peacock",
    ]

    train_dataset = train_loader.dataset
    idx_to_class = train_dataset.idx_to_class

    print("\nSaving augmented samples for manual inspection...")
    for target_class in classes_to_visualize:
        class_idx = None
        for idx, name in idx_to_class.items():
            if name.lower() == target_class.lower():
                class_idx = idx
                break

        if class_idx is None:
            print(f"  ⚠️  Class '{target_class}' not found in this dataset, skipping.")
            continue

        mask = labels == class_idx
        class_images = images[mask]

        if class_images.numel() == 0:
            print(
                f"  ⚠️  No '{target_class}' samples in the first batch, "
                f"you may rerun or inspect a different batch."
            )
            continue

        class_images = class_images[:16]
        grid = make_grid(class_images, nrow=4, normalize=True, value_range=(0.0, 1.0))
        out_path = vis_root / f"augmented_{target_class}.png"
        save_image(grid, out_path)
        print(f"  Saved augmented grid for '{target_class}' to {out_path}")

    print("\nNext steps:")
    print(" 1. Open the PNGs in 'augmented_vis/' and visually inspect them.")
    print(" 2. If Om or footprint look too mild/strongly augmented, adjust")
    print("    the symbol_augmentation photometric parameters.")
    print(" 3. If cow or other animals look weird under horizontal flip,")
    print("    lower the flip probability or disable it for that class.")
