const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🚀 SERVIDOR OK - TESTE");
});

app.post("/webhook", (req, res) => {
  console.log("Recebido:", req.body);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log("Rodando na porta " + PORT);
});

// mantém vivo
setInterval(() => {
  console.log("alive");
}, 10000);
