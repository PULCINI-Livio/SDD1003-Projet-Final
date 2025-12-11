# ml_master_pipeline.py
import os
import sys
import json
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ensure charts dir exists
BASE_DIR = Path(__file__).resolve().parent
CHARTS_DIR = BASE_DIR / "charts"
CHARTS_DIR.mkdir(parents=True, exist_ok=True)

# imports of modules above (assume in same folder)
from ml_classification import run_classification
from ml_regression import run_regression
from ml_clustering import run_clustering

# Optionally connect to MongoDB if needed for training data
def load_from_mongo_if_needed():
    try:
        from pymongo import MongoClient
        uri = os.getenv("MONGODB_URI")
        if not uri:
            return None
        client = MongoClient(uri)
        db_name = os.getenv("MONGODB_DBNAME") or client.list_database_names()[0]
        db = client[db_name]
        coll_name = os.getenv("MONGODB_COLLECTION") or "steam_releases"
        coll = db[coll_name]
        docs = list(coll.find({}, {"game":1, "embedding":1, "primary_genre":1, "rating":1}))
        return docs
    except Exception as e:
        print(json.dumps({"error": "mongo_load_failed", "details": str(e)}))
        return None

def main():
    raw = sys.stdin.read()
    if not raw:
        print(json.dumps({"error": "no input"}))
        sys.exit(1)
    payload = json.loads(raw)

    # Expect payload keys:
    # payload = { "candidates": [...], optional "train": [...] }
    candidates = payload.get("candidates", [])
    train = payload.get("train")

    # If no train provided try to fetch from Mongo
    if train is None:
        train = load_from_mongo_if_needed()
        if train is None:
            # fallback: use candidates as training
            train = candidates

    timestamp = int(time.time())
    # create per-run subdir for charts to avoid overwriting
    run_dir = CHARTS_DIR / f"run_{timestamp}"
    run_dir.mkdir(parents=True, exist_ok=True)

    # call classification
    classification_res = run_classification(train, candidates, str(run_dir))
    # call regression
    regression_res = run_regression(train, candidates, str(run_dir))
    # call clustering
    clustering_res = run_clustering(train, candidates, str(run_dir))

    output = {
        "classification": classification_res,
        "regression": regression_res,
        "clustering": clustering_res,
        "charts_dir": str(run_dir)
    }

    print(json.dumps(output))
    sys.stdout.flush()

if __name__ == "__main__":
    main()
