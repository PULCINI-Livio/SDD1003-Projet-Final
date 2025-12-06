require('dotenv').config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const Release = require("./models/Release.js");

const app = express();
app.use(cors());
app.use(express.json());

const { spawn } = require("child_process");

// Servir le front-end
app.use(express.static(path.join(__dirname, "../../frontend"))); // chemin depuis server.js

// Endpoint exemple pour le test
app.get("/test", (req, res) => res.send("Backend OK"));

// Connexion MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connecté"))
  .catch(err => console.log(err));


// CRUD API //

// GET
app.get("/releases", async (req, res) => {
  const releases = await Release.find().limit(100);
  res.json(releases);
});

app.get("/releases/autocomplete", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);

  const results = await Release.find(
    { game: { $regex: q, $options: "i" } },
    { game: 1 }      // on renvoie seulement game
  ).limit(10);

  res.json(results);
});

app.get("/releases/first10", async (req, res) => {
  const list = await Release.find().limit(10);
  res.json(list);
});

app.get("/releases/search", async (req, res) => {
  const q = req.query.q || "";
  const results = await Release.find({
    game: { $regex: q, $options: "i" }
  }).limit(30); // évite les milliers de résultats

  res.json(results);
});

app.get("/releases/:id", async (req, res) => {
  const item = await Release.findById(req.params.id);
  res.json(item);
});

app.get("/db-status", (req, res) => {
  const state = mongoose.connection.readyState;

  // 1 = connecté
  if (state === 1) {
    return res.json({ connected: true });
  }

  res.json({ connected: false });
});


// POST
app.post("/releases", async (req, res) => {
  const newRelease = await Release.create(req.body);
  res.json(newRelease);
});

app.post("/vector-search", async (req, res) => {
  const { query } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Query text is required" });
  }

  const pythonScriptPath = path.join(__dirname, "../python/generate_embedding.py");
  // 1. Exécuter le script Python pour générer l'embedding
  const py = spawn("python3", [pythonScriptPath, query]);

  let output = "";
  let errorOutput = "";

  // stdout → données JSON
  py.stdout.on("data", (data) => {
    output += data.toString();
  });

  // stderr → erreurs Python
  py.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  py.on("close", async () => {
    // Si le script a écrit dans stderr → log + erreur
    if (errorOutput.trim()) {
      console.error("Python error:", errorOutput);
      return res.status(500).json({ error: "Python embedding error", details: errorOutput });
    }

    // Si aucune donnée → erreur
    if (!output.trim()) {
      console.error("Python returned empty output");
      return res.status(500).json({ error: "Python returned empty output" });
    }

    let parsed;
    try {
      parsed = JSON.parse(output);
    } catch (err) {
      console.error("Invalid JSON returned by Python:", output);
      return res.status(500).json({ error: "Invalid JSON from Python", raw: output });
    }

    // Si Python a renvoyé {"error": "..."}
    if (parsed.error) {
      console.error("Embedding generation failed:", parsed);
      return res.status(500).json({ error: "Embedding generation failed", details: parsed });
    }

    const embedding = parsed;

    // 2. Requête vectorielle MongoDB
    try {
      const results = await Release.aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: embedding,
            numCandidates: 100,
            limit: 10
          }
        }
      ]);

      return res.json(results);

    } catch (err) {
      console.error("MongoDB vector search error:", err);
      return res.status(500).json({ error: "MongoDB vector search failed" });
    }
  });
});



// PUT
app.put("/releases/:id", async (req, res) => {
  const updated = await Release.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

// DELETE
app.delete("/releases/:id", async (req, res) => {
  await Release.findByIdAndDelete(req.params.id);
  res.json({ message: "Supprimé" });
});



app.listen(3000, () => console.log("Serveur sur http://localhost:3000"));
