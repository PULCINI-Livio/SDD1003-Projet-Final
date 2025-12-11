# ml_classification.py
import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

def run_classification(train_docs, candidate_docs, charts_dir):
    """
    Train a RandomForest classifier on train_docs (expects field 'primary_genre' and 'embedding')
    Predict genre for candidate_docs. Save a chart and return predictions.
    """
    # Prepare training data
    X_train = []
    y_train = []
    for d in train_docs:
        emb = d.get("embedding")
        genre = d.get("primary_genre")
        if emb and genre:
            X_train.append(emb)
            y_train.append(genre)

    if len(X_train) < 2:
        # not enough training data
        preds = []
        for c in candidate_docs:
            preds.append({"_id": c.get("_id"), "game": c.get("game"), "genre_pred": None, "prob": None})
        return {"predictions": preds, "chart": None, "note": "Not enough training data for classification"}

    X = np.array(X_train)
    le = LabelEncoder()
    y = le.fit_transform(y_train)

    # Train RandomForest (simple parameters)
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X, y)

    # Predict on candidates
    preds = []
    for c in candidate_docs:
        emb = c.get("embedding")
        if emb:
            probs = clf.predict_proba([emb])[0]
            top_idx = int(np.argmax(probs))
            preds.append({
                "_id": c.get("_id"),
                "game": c.get("game"),
                "genre_pred": le.inverse_transform([top_idx])[0],
                "prob": float(probs[top_idx])
            })
        else:
            preds.append({"_id": c.get("_id"), "game": c.get("game"), "genre_pred": None, "prob": None})

    # Build chart: distribution of predicted genres (bar)
    df_pred = pd.DataFrame([p for p in preds if p["genre_pred"] is not None])
    chart_path = os.path.join(charts_dir, "classification.png")
    plt.figure(figsize=(8,5))
    if not df_pred.empty:
        sns.countplot(y="genre_pred", data=df_pred, order=df_pred['genre_pred'].value_counts().index)
        plt.title("Predicted genres (candidates)")
        plt.xlabel("Count")
        plt.ylabel("Genre")
    else:
        plt.text(0.5, 0.5, "No predictions", ha='center')
    plt.tight_layout()
    plt.savefig(chart_path)
    plt.close()

    return {"predictions": preds, "chart": chart_path, "note": None}