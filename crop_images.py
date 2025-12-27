import os
from PIL import Image

# Mapping of uploaded files to target names
# Assuming the script is run from the project root
SOURCE_DIR = r"C:/Users/Arya Verma/.gemini/antigravity/brain/1a377586-b107-4031-83ba-e095e3529bff"
TARGET_DIR = "assets/screenshots"

FILES_MAP = {
    "uploaded_image_0_1766870585875.png": "discovery.png",
    "uploaded_image_1_1766870585875.png": "landing.png",
    "uploaded_image_2_1766870585875.png": "profile_setup.png",
    "uploaded_image_3_1766870585875.png": "dashboard.png",
    "uploaded_image_4_1766870585875.png": "chat.png"
}

# Crop Analysis from typical browser screenshot (1920x1080 usually)
# The user wants to "crop the outer part show only the page window"
# Looking at the screenshots, they include the browser tabs and address bar.
# We need to estimate the crop box.
# Standard Chrome on Windows: Address bar ends around Y=110-120 roughly?
# Let's be safe and try to detect or just crop a fixed top margin.
# From visual inspection of previous artifacts (although I can't see pixel coords),
# browser UI is usually top 110px. Scrollbar on right might be 15px.
# Let's try cropping top 120 pixels and right 20 pixels, bottom 0, left 0.

def crop_image(source_path, target_path):
    try:
        img = Image.open(source_path)
        width, height = img.size
        
        # Crop parameters (Adjust as needed based on visual inspection)
        # Top: Remove address bar/tabs (Approx 120px)
        # Bottom: Keep as is
        # Left: Keep as is
        # Right: Remove scrollbar (Approx 15px) or keep if partial
        
        left = 0
        top = 110 # Estimating browser UI height
        right = width
        bottom = height
        
        # If it's a full desktop screenshot, we might want to crop the taskbar too?
        # The screenshots look like window captures maybe?
        # "show only the page window"
        
        cropped_img = img.crop((left, top, right, bottom))
        
        # Save
        cropped_img.save(target_path)
        print(f"Processed {target_path}")
        
    except Exception as e:
        print(f"Error processing {source_path}: {e}")

if __name__ == "__main__":
    if not os.path.exists(TARGET_DIR):
        os.makedirs(TARGET_DIR)
        
    for source_name, target_name in FILES_MAP.items():
        source_path = os.path.join(SOURCE_DIR, source_name)
        target_path = os.path.join(TARGET_DIR, target_name)
        
        if os.path.exists(source_path):
            crop_image(source_path, target_path)
        else:
            print(f"Source file not found: {source_path}")
