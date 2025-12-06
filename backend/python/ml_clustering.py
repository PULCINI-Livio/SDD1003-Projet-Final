# ml_clustering.py
import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.cluster import KMeans
from sklearn.decomposition import PCA

def run_clustering(train_docs, candidate_docs, charts_dir, n_clusters=5):
    """
    Fit KMeans on embeddings (prefer train_docs else candidates) and assign clusters to candidates.
    Save PCA 2D scatter plot.
    """
    # Choose embedding pool for clustering
    pool = []
    for d in train_docs:
        emb = d.get("embedding")
        if emb:
            pool.append(emb)
    if len(pool) < 2:
        # fallback to candidate embeddings
        pool = [c.get("embedding") for c in candidate_docs if c.get("embedding")]

    if len(pool) < 1:
        preds = []
        for c in candidate_docs:
            preds.append({"_id": c.get("_id"), "game": c.get("game"), "cluster": None})
        return {"predictions": preds, "chart": None, "note": "Not enough embeddings for clustering"}

    X = np.array(pool)
    n_clusters = min(n_clusters, max(1, int(len(X)**0.5)))  # derive reasonable clusters if small dataset
    n_clusters = max(1, min(n_clusters, 10))

    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    kmeans.fit(X)

    preds = []
    for c in candidate_docs:
        emb = c.get("embedding")
        if emb:
            cl = int(kmeans.predict([emb])[0])
            preds.append({"_id": c.get("_id"), "game": c.get("game"), "cluster": cl})
        else:
            preds.append({"_id": c.get("_id"), "game": c.get("game"), "cluster": None})

    # Visualization: PCA to 2D of candidate embeddings and color by cluster
    candidates_with_emb = [c for c in candidate_docs if c.get("embedding")]
    if candidates_with_emb:
        Xc = np.array([c.get("embedding") for c in candidates_with_emb])
        assigned = [p["cluster"] for p in preds if p["cluster"] is not None]
        pca = PCA(n_components=2)
        X2 = pca.fit_transform(Xc)
        df = pd.DataFrame({
            "x": X2[:,0],
            "y": X2[:,1],
            "game": [c.get("game") for c in candidates_with_emb],
            "cluster": [p["cluster"] for p in preds if p["cluster"] is not None]
        })
        chart_path = os.path.join(charts_dir, "clustering.png")
        plt.figure(figsize=(7,6))
        sns.scatterplot(data=df, x="x", y="y", hue="cluster", palette="tab10", legend="full")
        for _, row in df.iterrows():
            plt.text(row["x"]+0.01, row["y"]+0.01, row["game"], fontsize=8)
        plt.title("KMeans clustering (PCA 2D)")
        plt.tight_layout()
        plt.savefig(chart_path)
        plt.close()
    else:
        chart_path = None

    return {"predictions": preds, "chart": chart_path, "note": None}