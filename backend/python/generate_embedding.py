from sentence_transformers import SentenceTransformer
import sys
import json
import traceback

try:
    # Vérifier qu'un texte est bien passé
    if len(sys.argv) < 2:
        print(json.dumps({"error": "no input text"}))
        sys.stdout.flush()
        sys.exit(1)

    text = " ".join(sys.argv[1:]).strip()

    if text == "":
        print(json.dumps({"error": "empty input"}))
        sys.stdout.flush()
        sys.exit(1)

    # Charger le modèle (mise en cache dans Docker)
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

    # Encoder en vecteur
    embedding = model.encode(text).tolist()

    # Sortie JSON
    print(json.dumps(embedding))
    sys.stdout.flush()

except Exception as e:
    # Capturer toute erreur et renvoyer à Node.js
    error_msg = {
        "error": str(e),
        "trace": traceback.format_exc()
    }
    print(json.dumps(error_msg))
    sys.stdout.flush()
    sys.exit(1)
