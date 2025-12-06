# ml_regression.py
import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
try:
    from xgboost import XGBRegressor
    XGB_AVAILABLE = True
except Exception:
    XGB_AVAILABLE = False

def run_regression(train_docs, candidate_docs, charts_dir):
    """
    Train a regressor to predict rating (or a relevance score).
    Use XGBoost if available, otherwise LinearRegression.
    """
    X_train = []
    y_train = []
    for d in train_docs:
        emb = d.get("embedding")
        rating = d.get("rating")
        if emb is not None and rating is not None:
            X_train.append(emb)
            y_train.append(float(rating))

    if len(X_train) < 2:
        preds = []
        for c in candidate_docs:
            preds.append({"_id": c.get("_id"), "game": c.get("game"), "predicted_score": None})
        return {"predictions": preds, "chart": None, "note": "Not enough training data for regression"}

    X = np.array(X_train)
    y = np.array(y_train)

    # Standardize embeddings (optional)
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)

    if XGB_AVAILABLE:
        model = XGBRegressor(n_estimators=100, random_state=42, verbosity=0, eval_metric='rmse')
    else:
        model = LinearRegression()

    model.fit(Xs, y)

    preds = []
    for c in candidate_docs:
        emb = c.get("embedding")
        if emb:
            pred = float(model.predict(scaler.transform([emb]))[0])
            preds.append({"_id": c.get("_id"), "game": c.get("game"), "predicted_score": pred})
        else:
            preds.append({"_id": c.get("_id"), "game": c.get("game"), "predicted_score": None})

    # Chart: barplot of predicted scores for candidates
    dfp = pd.DataFrame([p for p in preds if p["predicted_score"] is not None])
    chart_path = os.path.join(charts_dir, "regression.png")
    plt.figure(figsize=(8,5))
    if not dfp.empty:
        sns.barplot(x="predicted_score", y="game", data=dfp.sort_values("predicted_score", ascending=False))
        plt.title("Predicted score (candidates)")
    else:
        plt.text(0.5, 0.5, "No predictions", ha='center')
    plt.tight_layout()
    plt.savefig(chart_path)
    plt.close()

    return {"predictions": preds, "chart": chart_path, "note": None}
