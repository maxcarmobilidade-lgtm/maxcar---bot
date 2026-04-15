const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔐 CONFIG Z-API
const ZAPI_TOKEN = "7E812EC62CB58F3DE0EAA342";
const ZAPI_INSTANCE = "3F157D917E4C40749416BA4D31290A14";

// 🚀 TESTE
app.get("/", (req, res) => {
  res.send("Servidor rodando 🚀");
});

// 📩 WEBHOOK
app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    if (data.type === "ReceivedCallback") {
      const mensagem = data.text.message;
      const numero = data.phone;

      console.log("Mensagem:", mensagem);

      await axios.post(
        https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text,
        {
          phone: numero,
          message: "🚗 Olá! Bem-vindo à Maxcar! Digite 1 para pedir corrida."
        }
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.log("ERRO:", err.message);
    res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
