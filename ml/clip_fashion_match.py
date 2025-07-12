import os
import clip
import torch
import numpy as np
from PIL import Image
from tqdm import tqdm
import matplotlib.pyplot as plt

# Load model
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

def get_image_features(image_path):
    image = preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(device)
    with torch.no_grad():
        return model.encode_image(image).cpu().numpy()

def show_similar_images(query_path, gallery_folder, top_k=5):
    print(f"🔍 Query: {query_path}")
    query_feature = get_image_features(query_path)

    gallery_features = []
    gallery_paths = []

    for filename in os.listdir(gallery_folder):
        if filename.lower().endswith((".jpg", ".jpeg", ".png")):
            path = os.path.join(gallery_folder, filename)
            feature = get_image_features(path)
            gallery_features.append(feature)
            gallery_paths.append(path)

    gallery_features = np.vstack(gallery_features)
    similarities = (query_feature @ gallery_features.T).flatten()
    top_indices = similarities.argsort()[-top_k:][::-1]

    print("\n🎯 Top Matches:")
    plt.figure(figsize=(15, 5))
    for i, idx in enumerate(top_indices):
        print(f"{i+1}: {gallery_paths[idx]} (score: {(similarities[idx]/2.0):.3f})")
        img = Image.open(gallery_paths[idx])
        plt.subplot(1, top_k, i+1)
        plt.imshow(img)
        plt.axis("off")
    plt.suptitle("Top Matches", fontsize=16)
    plt.show()

# 🧪 Example usage
if __name__ == "__main__":
    query_image_path = "query.jpg"  # replace with your query image
    gallery_folder_path = "gallery/"  # replace with your folder of images
    show_similar_images(query_image_path, gallery_folder_path, top_k=5)
