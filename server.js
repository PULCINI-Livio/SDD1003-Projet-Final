const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const Release = require("./models/Release");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Connexion MongoDB Atlas
mongoose.connect(
  "mongodb+srv://liviopulcini_db_user:VxUuSxhqjM6SefAI@cluster0.b2yzikb.mongodb.net/TP1?retryWrites=true&w=majority"
).then(() => console.log("MongoDB connecté"))
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

// POST
app.post("/releases", async (req, res) => {
  const newRelease = await Release.create(req.body);
  res.json(newRelease);
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
