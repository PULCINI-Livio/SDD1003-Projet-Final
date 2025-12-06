from sentence_transformers import SentenceTransformer
import sys
import json

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

text = sys.argv[1]  # texte reçu depuis Node
embedding = model.encode(text).tolist()

print(json.dumps(embedding))  # Node récupère le vecteur