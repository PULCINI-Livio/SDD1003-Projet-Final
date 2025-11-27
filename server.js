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


// CRUD API
app.get("/releases", async (req, res) => {
  const q = req.query.q || "";
  const releases = await Release.find({ 
    game: { $regex: q, $options: "i" } })
    .limit(10);
  res.json(releases);
});

app.post("/releases", async (req, res) => {
  const newRelease = await Release.create(req.body);
  res.json(newRelease);
});

app.put("/releases/:id", async (req, res) => {
  const updated = await Release.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

app.delete("/releases/:id", async (req, res) => {
  await Release.findByIdAndDelete(req.params.id);
  res.json({ message: "Supprimé" });
});


app.listen(3000, () => console.log("Serveur sur http://localhost:3000"));
