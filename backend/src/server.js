require('dotenv').config();
const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const Release = require("./models/Release.js");
const { spawn } = require("child_process");
const fs = require("fs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Servir le front-end
app.use(express.static(path.join(__dirname, "../../frontend"))); // chemin depuis server.js

// Servir le dossier charts statiquement
app.use("/charts", express.static(path.join(__dirname, "../python/charts")));

// Connexion MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connecté"))
  .catch(err => console.log(err));

// GENERATEUR D'EMBEDDING //
const generateEmbedding = (text) => {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, "../python/generate_embedding.py");

    const py = spawn("python3", [pythonScriptPath, text]);
    let output = "";
    let errorOutput = "";

    py.stdout.on("data", (data) => output += data.toString());
    py.stderr.on("data", (data) => errorOutput += data.toString());

    py.on("close", () => {
      if (errorOutput.trim()) {
        return reject(new Error("Python error: " + errorOutput));
      }

      if (!output.trim()) {
        return reject(new Error("Python returned empty output"));
      }

      try {
        const parsed = JSON.parse(output);

        if (parsed.error) {
          return reject(new Error("Embedding generation failed: " + parsed.error));
        }

        resolve(parsed);

      } catch (err) {
        reject(new Error("Invalid JSON from Python: " + output));
      }
    });
  });
};

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
  try {
    const releaseData = req.body;

    if (!releaseData.game || !releaseData.game.trim()) {
      return res.status(400).json({ error: "The field 'game' (title) is required" });
    }

    const embedding = await generateEmbedding(releaseData.game);

    // Ajouter l'embedding au document
    releaseData.embedding = embedding;

    // Enregistrer la release
    const newRelease = await Release.create(releaseData);

    res.json(newRelease);

  } catch (err) {
    console.error("Error creating release:", err);
    res.status(500).json({ error: "Failed to create release" });
  }
});


app.post("/vector-search", async (req, res) => {
  const { query } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Query text is required" });
  }

  try {
    const embedding = await generateEmbedding(query);

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

    res.json(results);

  } catch (err) {
    console.error("Vector search error:", err);
    res.status(500).json({ error: "Vector search failed" });
  }
});

app.post("/ml/postprocess", async (req, res) => {
  const candidates = req.body.candidates;
  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ error: "Candidates array is required" });
  }

  const pythonScriptPath = path.join(__dirname, "../python/ml_master_pipeline.py");
  const py = spawn("python3", [pythonScriptPath]);

  let outputData = "";
  let errorData = "";

  // Écrire le JSON candidates dans stdin de Python
  py.stdin.write(JSON.stringify({ candidates }));
  py.stdin.end();

  py.stdout.on("data", (data) => {
    outputData += data.toString();
  });

  py.stderr.on("data", (data) => {
    errorData += data.toString();
  });

  py.on("close", (code) => {
    if (errorData) {
      console.error("Python error:", errorData);
      return res.status(500).json({ error: "Python ML error", details: errorData });
    }

    let parsed;
    try {
      parsed = JSON.parse(outputData);
    } catch (err) {
      console.error("Invalid JSON from Python:", outputData);
      return res.status(500).json({ error: "Invalid JSON from Python", raw: outputData });
    }

    // Vérifie que les chemins de graphiques existent
    if (parsed.charts_dir && fs.existsSync(parsed.charts_dir)) {
      parsed.charts = {
        classification: fs.existsSync(path.join(parsed.charts_dir, "classification.png"))
          ? `/charts/${path.basename(parsed.charts_dir)}/classification.png`
          : null,
        regression: fs.existsSync(path.join(parsed.charts_dir, "regression.png"))
          ? `/charts/${path.basename(parsed.charts_dir)}/regression.png`
          : null,
        clustering: fs.existsSync(path.join(parsed.charts_dir, "clustering.png"))
          ? `/charts/${path.basename(parsed.charts_dir)}/clustering.png`
          : null
      };
    }

    res.json(parsed);
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
