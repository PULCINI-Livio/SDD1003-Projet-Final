from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import numpy as np

# Charger le .env
load_dotenv()

# Récupérer l'URI depuis le .env
MONGO_URI = os.getenv("MONGODB_URI")

if not MONGO_URI:
    raise Exception("MONGODB_URI n'est pas défini dans le .env !")

# Connexion MongoDB
client = MongoClient(MONGO_URI)
db = client["TP1"]                 
collection = db["steam_releases"]        

print("hello")

# Récupérer tous les documents
documents = list(collection.find({}))
total = len(documents)
print(f"{total} documents chargés.")

# Charger le modèle d'embedding
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

# Générer les embeddings et mettre à jour
for i, doc in enumerate(documents, 1):
    title = doc.get("game", "")
    if not title:
        continue  # on ignore les titres vides

    # générer l’embedding
    vector = model.encode(title).tolist()  # liste 384 floats

    # mise à jour du document
    collection.update_one(
        {"_id": doc["_id"]},
        {"$set": {"embedding": vector}}
    )

    # Progress bar simple
    percent = int(i / total * 100)
    bar_length = 30
    filled_length = int(bar_length * i // total)
    bar = "█" * filled_length + "-" * (bar_length - filled_length)
    print(f"\rProgress : |{bar}| {percent}% ({i}/{total})", end="", flush=True)

print("\nEmbeddings ajoutés avec succès !")
