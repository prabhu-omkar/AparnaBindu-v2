import torch
from PIL import Image, ImageOps
import io
from pathlib import Path
import torchvision.transforms as transforms

from kolam_hybrid_model import KolamConvNeXtViT

# We no longer need kolam_dataset to fetch class names or dimensions
TARGET_H, TARGET_W = 380, 380

CLASS_NAMES = [
    'butterfly', 'cow', 'creeper', 'elephant', 'fish', 'flower', 
    'footprint', 'geometric', 'kambi', 'loops', 'om', 'peacock'
]

def pad_and_resize(img: Image.Image, target_size=380):
    # Resize so that the longest side is exactly target_size
    img.thumbnail((target_size, target_size), Image.Resampling.LANCZOS)
    
    # Pad evenly on all sides to make it target_size x target_size
    delta_w = target_size - img.size[0]
    delta_h = target_size - img.size[1]
    padding = (delta_w // 2, delta_h // 2, delta_w - (delta_w // 2), delta_h - (delta_h // 2))
    
    # fill=0 is black padding
    img = ImageOps.expand(img, padding, fill=0)
    return img

val_transform = transforms.Compose([
    transforms.ToTensor(), # Converts HWC (0-255) to CHW (0.0-1.0)
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def load_and_preprocess_image(img_source):
    """
    Load image and apply validation transforms.
    img_source can be a path (str/Path) or a PIL Image or bytes.
    Returns a tensor of shape [1, 3, H, W]
    """
    if isinstance(img_source, (str, Path)):
        img = Image.open(img_source).convert("RGB")
    elif isinstance(img_source, bytes):
        img = Image.open(io.BytesIO(img_source)).convert("RGB")
    elif isinstance(img_source, Image.Image):
        img = img_source.convert("RGB")
    else:
        raise ValueError("Unsupported image source type")

    img = pad_and_resize(img, TARGET_H)
    tensor = val_transform(img).unsqueeze(0)  # add batch dimension

    return tensor

def get_model(ckpt_path="kolam_convnext_vit_best(early).pth", device=None):
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    model = KolamConvNeXtViT(
        num_classes=len(CLASS_NAMES),
        backbone_name="convnext_tiny",
        vit_dim=768,
        vit_depth=8,
        vit_heads=12,
        vit_mlp_ratio=4.0,
        attn_drop=0.0,
        proj_drop=0.1,
        drop_path_rate=0.1,
    ).to(device)

    # Use weights_only=True for secure loading
    state_dict = torch.load(ckpt_path, map_location=device, weights_only=True)
    model.load_state_dict(state_dict)
    model.eval()
    return model

@torch.no_grad()
def predict_single_image(model, img_tensor, device):
    """
    Predict the class for a single image tensor.
    """
    img_tensor = img_tensor.to(device)

    # Use autocast if cuda is available for speed
    if device.type == "cuda":
        with torch.amp.autocast(device_type="cuda", dtype=torch.float16):
            logits = model(img_tensor)
            probs = torch.softmax(logits, dim=1)
            conf, pred = probs.max(dim=1)
            pred = pred.item()
            conf = conf.item()
    else:
        logits = model(img_tensor)
        probs = torch.softmax(logits, dim=1)
        conf, pred = probs.max(dim=1)
        pred = pred.item()
        conf = conf.item()

    return CLASS_NAMES[pred], conf

# Example usage for testing locally
if __name__ == "__main__":
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Loading model on {device}...")
    model = get_model("kolam_convnext_vit_best(early).pth", device) # local folder
    
    img_path = "kolam_testttt.jpg" # replace with real image
    try:
        tensor = load_and_preprocess_image(img_path)
        result, conf = predict_single_image(model, tensor, device)
        print(f"Prediction: {result} with confidence {conf:.4f}")
    except FileNotFoundError:
        print(f"Create a test image named {img_path} to test locally.")
