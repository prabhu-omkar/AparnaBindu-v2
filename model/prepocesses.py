""" 
Kolam Image Preprocessing Pipeline for Classification
Based on KolamNetV2 architecture requirements

This script performs comprehensive preprocessing for Kolam heritage art images:
- Validates and cleans the dataset
- Creates stratified train/val/test splits (70/15/15)
- Resizes images while preserving aspect ratios
- Generates preprocessing reports
"""

import os
import json
import hashlib
import shutil
from pathlib import Path
from collections import defaultdict, Counter
import random
from PIL import Image, ImageFile
import numpy as np

# Allow loading of truncated images
ImageFile.LOAD_TRUNCATED_IMAGES = True

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)


class KolamPreprocessor:
    """Handles all preprocessing steps for Kolam image dataset."""
    
    def __init__(self, source_dir, output_dir, target_size=224):
        """
        Initialize the preprocessor.
        
        Args:
            source_dir: Path to raw kolam images organized by class folders
            output_dir: Path where processed dataset will be saved
            target_size: Target dimension for square images (default: 224 for EfficientNet)
        """
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir)
        self.target_size = target_size
        
        # Statistics tracking
        self.stats = {
            'total_images': 0,
            'corrupt_images': [],
            'duplicate_images': [],
            'class_distribution': {},
            'dimension_stats': defaultdict(list),
            'processed_counts': {'train': {}, 'val': {}, 'test': {}}
        }
        
    def validate_image(self, img_path):
        """
        Validate if an image file is readable and not corrupt.
        
        Args:
            img_path: Path to image file
            
        Returns:
            True if valid, False otherwise
        """
        try:
            with Image.open(img_path) as img:
                img.verify()  # Verify image integrity
            
            # Re-open for actual loading test (verify() closes the file)
            with Image.open(img_path) as img:
                img.load()  # Actually load the image data
                
                # Check if image has valid dimensions
                if img.size[0] < 10 or img.size[1] < 10:
                    return False
                    
                return True
        except Exception as e:
            print(f"  ✗ Corrupt image: {img_path.name} - {str(e)}")
            return False
    
    def compute_md5(self, img_path):
        """
        Compute MD5 hash of an image file for duplicate detection.
        
        Args:
            img_path: Path to image file
            
        Returns:
            MD5 hash string
        """
        hash_md5 = hashlib.md5()
        with open(img_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    
    def find_duplicates(self, image_paths):
        """
        Find duplicate images using MD5 hashing.
        
        Args:
            image_paths: List of image file paths
            
        Returns:
            List of duplicate image paths to remove
        """
        print("\n2. Detecting duplicate images...")
        hash_dict = {}
        duplicates = []
        
        for img_path in image_paths:
            img_hash = self.compute_md5(img_path)
            if img_hash in hash_dict:
                duplicates.append(img_path)
                print(f"  ✗ Duplicate found: {img_path.name} (same as {hash_dict[img_hash].name})")
            else:
                hash_dict[img_hash] = img_path
        
        print(f"  Found {len(duplicates)} duplicate images")
        return duplicates
    
    def resize_with_padding(self, img, target_size, padding_color=(255, 255, 255)):
        """
        Resize image while preserving aspect ratio, then pad to square.
        
        This is crucial for Kolam images to avoid distorting symmetric patterns.
        
        Args:
            img: PIL Image object
            target_size: Target dimension for square output
            padding_color: RGB tuple for padding (default: white)
            
        Returns:
            Resized and padded PIL Image
        """
        # Convert to RGB if necessary (handles RGBA, grayscale, etc.)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Calculate scaling factor to fit within target size
        ratio = min(target_size / img.size[0], target_size / img.size[1])
        new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
        
        # Resize using high-quality Lanczos resampling
        img_resized = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Create new square image with padding
        new_img = Image.new('RGB', (target_size, target_size), padding_color)
        
        # Paste resized image in center
        paste_x = (target_size - new_size[0]) // 2
        paste_y = (target_size - new_size[1]) // 2
        new_img.paste(img_resized, (paste_x, paste_y))
        
        return new_img
    
    def stratified_split(self, class_images, train_ratio=0.70, val_ratio=0.15, test_ratio=0.15):
        """
        Perform stratified split maintaining class proportions across splits.
        
        Critical for handling class imbalance in Kolam dataset where classes
        range from 99 images (kurma) to 402 images (loop).
        
        Args:
            class_images: Dictionary mapping class names to list of image paths
            train_ratio, val_ratio, test_ratio: Split proportions (should sum to 1.0)
            
        Returns:
            Dictionary with 'train', 'val', 'test' keys containing class-wise splits
        """
        splits = {'train': {}, 'val': {}, 'test': {}}
        
        for class_name, images in class_images.items():
            # Shuffle images for this class
            shuffled = images.copy()
            random.shuffle(shuffled)
            
            n = len(shuffled)
            train_end = int(n * train_ratio)
            val_end = train_end + int(n * val_ratio)
            
            splits['train'][class_name] = shuffled[:train_end]
            splits['val'][class_name] = shuffled[train_end:val_end]
            splits['test'][class_name] = shuffled[val_end:]
            
            print(f"  {class_name}: {len(splits['train'][class_name])} train, "
                  f"{len(splits['val'][class_name])} val, "
                  f"{len(splits['test'][class_name])} test")
        
        return splits
    
    def analyze_dimensions(self, image_paths):
        """
        Analyze image dimensions to inform resize strategy.
        
        Args:
            image_paths: List of image file paths
        """
        print("\n3. Analyzing image dimensions...")
        widths, heights, aspect_ratios = [], [], []
        
        for img_path in image_paths[:100]:  # Sample first 100 images
            try:
                with Image.open(img_path) as img:
                    w, h = img.size
                    widths.append(w)
                    heights.append(h)
                    aspect_ratios.append(w / h)
            except:
                continue
        
        print(f"  Width  - Mean: {np.mean(widths):.0f}, Median: {np.median(widths):.0f}, Range: [{min(widths)}, {max(widths)}]")
        print(f"  Height - Mean: {np.mean(heights):.0f}, Median: {np.median(heights):.0f}, Range: [{min(heights)}, {max(heights)}]")
        print(f"  Aspect Ratio - Mean: {np.mean(aspect_ratios):.2f}, Median: {np.median(aspect_ratios):.2f}")
        
        self.stats['dimension_stats'] = {
            'width_mean': np.mean(widths),
            'height_mean': np.mean(heights),
            'aspect_ratio_mean': np.mean(aspect_ratios)
        }
    
    def process_dataset(self):
        """
        Main processing pipeline that orchestrates all preprocessing steps.
        """
        print("="*70)
        print("KOLAM IMAGE PREPROCESSING PIPELINE")
        print("="*70)
        
        # Step 1: Scan and validate images
        print("\n1. Scanning and validating images...")
        class_images = defaultdict(list)
        all_images = []
        
        for class_dir in sorted(self.source_dir.iterdir()):
            if not class_dir.is_dir():
                continue
                
            class_name = class_dir.name
            valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp'}
            
            for img_path in class_dir.iterdir():
                if img_path.suffix.lower() not in valid_extensions:
                    continue
                
                if self.validate_image(img_path):
                    class_images[class_name].append(img_path)
                    all_images.append(img_path)
                else:
                    self.stats['corrupt_images'].append(str(img_path))
        
        self.stats['total_images'] = len(all_images)
        self.stats['class_distribution'] = {k: len(v) for k, v in class_images.items()}
        
        print(f"\n  Valid images found: {len(all_images)}")
        print(f"  Classes: {len(class_images)}")
        print(f"  Corrupt images removed: {len(self.stats['corrupt_images'])}")
        
        # Show class distribution
        print("\n  Class distribution:")
        for class_name, count in sorted(self.stats['class_distribution'].items()):
            print(f"    {class_name}: {count} images")
        
        # Step 2: Find duplicates
        duplicates = self.find_duplicates(all_images)
        self.stats['duplicate_images'] = [str(p) for p in duplicates]
        
        # Remove duplicates from class_images
        duplicate_set = set(duplicates)
        for class_name in class_images:
            class_images[class_name] = [p for p in class_images[class_name] 
                                       if p not in duplicate_set]
        
        # Step 3: Analyze dimensions
        self.analyze_dimensions(all_images)
        
        # Step 4: Create stratified splits
        print("\n4. Creating stratified train/val/test splits (70/15/15)...")
        splits = self.stratified_split(class_images)
        
        # Step 5: Process and save images
        print("\n5. Processing and saving images...")
        
        for split_name in ['train', 'val', 'test']:
            split_dir = self.output_dir / split_name
            
            for class_name, images in splits[split_name].items():
                class_dir = split_dir / class_name
                class_dir.mkdir(parents=True, exist_ok=True)
                
                for img_path in images:
                    try:
                        with Image.open(img_path) as img:
                            # Resize with padding to preserve aspect ratio
                            processed_img = self.resize_with_padding(img, self.target_size)
                            
                            # Save with consistent naming
                            output_path = class_dir / img_path.name
                            processed_img.save(output_path, 'JPEG', quality=95)
                    
                    except Exception as e:
                        print(f"  ✗ Error processing {img_path.name}: {str(e)}")
                        continue
                
                # Track processed counts
                self.stats['processed_counts'][split_name][class_name] = len(images)
        
        print("\n  ✓ Processing complete!")
        
        # Step 6: Save preprocessing report
        self.save_report()
        
        # Print summary
        self.print_summary()
    
    def save_report(self):
        """Save detailed preprocessing report as JSON."""
        base_dir = Path(__file__).resolve().parent
        report_path = base_dir / "preprocessing_report.json"
        
        with open(report_path, 'w') as f:
            json.dump(self.stats, f, indent=2)
        
        print(f"\n6. Preprocessing report saved to: {report_path}")
    
    def print_summary(self):
        """Print final summary of preprocessing."""
        print("\n" + "="*70)
        print("PREPROCESSING SUMMARY")
        print("="*70)
        
        total_train = sum(self.stats['processed_counts']['train'].values())
        total_val = sum(self.stats['processed_counts']['val'].values())
        total_test = sum(self.stats['processed_counts']['test'].values())
        
        print(f"\nTotal images processed: {total_train + total_val + total_test}")
        print(f"  Training:   {total_train} images ({total_train/(total_train+total_val+total_test)*100:.1f}%)")
        print(f"  Validation: {total_val} images ({total_val/(total_train+total_val+total_test)*100:.1f}%)")
        print(f"  Test:       {total_test} images ({total_test/(total_train+total_val+total_test)*100:.1f}%)")
        
        print(f"\nImages removed:")
        print(f"  Corrupt:    {len(self.stats['corrupt_images'])}")
        print(f"  Duplicates: {len(self.stats['duplicate_images'])}")
        
        print(f"\nOutput directory: {self.output_dir}")
        print("="*70)


# Example usage
if __name__ == "__main__":
    # Configure paths
    SOURCE_DIR = "kolam_folders" # Your raw dataset folder
    OUTPUT_DIR = "kolam_processed"  # Where processed data will be saved
    TARGET_SIZE = 224  # Use 224 for EfficientNet-B0/B1, 380 for B4
    
    # Create preprocessor
    preprocessor = KolamPreprocessor(
        source_dir=SOURCE_DIR,
        output_dir=OUTPUT_DIR,
        target_size=TARGET_SIZE
    )
    
    # Run full preprocessing pipeline
    preprocessor.process_dataset()
    
    print("\n✓ Ready for training! Use the 'kolam_processed/train/' folder as input.")
    print("✓ Check 'preprocessing_report.json' for detailed statistics.")