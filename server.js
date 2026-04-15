const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

const INSTANCE = process.env.ZAPI_INSTANCE;
const TOKEN = process.env.ZAPI_TOKEN;

app.get("/", (req, res) => {
  res.send("Servidor rodando");
});

app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    if (!data || !data.message) {
      return res.sendStatus(200);
    }

    const numero = data.phone;
    const mensagem = data.message.text;

    console.log("Mensagem:", mensagem);

    await axios.post(
      https://api.z-api.io/instances/${INSTANCE}/token/${TOKEN}/send-text,
      {
        phone: numero,
        message: "Olá! Bem-vindo à Maxcar Mobilidade!"
      }
    );

    res.sendStatus(200);
  } catch (error) {
    console.log("Erro:", error.message);
    res.sendStatus(200);
  }
});

app.listen(PORT, () => {
  console.log("Rodando na porta", PORT);
});

