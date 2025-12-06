# Dockerfile pour ton python-worker (ultra-rapide et petit)
FROM python:3.11-slim

WORKDIR /app

# Installe uv (x20 plus rapide que pip)
RUN pip install --no-cache-dir uv

# Installe TOUT en SEULEMENT DEUX LIGNES : torch d'abord (avec index custom), puis sentence-transformers et les autres
RUN --mount=type=cache,target=/root/.cache \
    uv pip install --system torch==2.4.0 --index-url https://download.pytorch.org/whl/cpu

RUN --mount=type=cache,target=/root/.cache \
    uv pip install --system \
      sentence-transformers \
      pymongo \
      numpy \
      python-dotenv

# Copie seulement le code à la fin (cette layer change souvent → mais coûte 0 seconde)
COPY . .

CMD ["python", "main.py"]