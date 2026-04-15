const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔑 CONFIG Z-API
const ZAPI_INSTANCE = "3F157D917E4C40749416BA4D31290A14";
const ZAPI_TOKEN = "7E812EC62CB58F3DE0EAA342";

const ZAPI_URL = https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN};

// 🔥 ROTA PRINCIPAL
app.get("/", (req, res) => {
  res.send("🚀 Maxcar rodando 100%");
});

// 🧠 WEBHOOK
app.post("/webhook", async (req, res) => {
  try {
    const data = req.body || {};

    console.log("📩:", JSON.stringify(data));

    const numero = data.phone || data.from || null;
    const mensagem =
      data.text?.message || data.body || data.message || "";

    if (!numero || !mensagem) return res.sendStatus(200);

    const msg = mensagem.toLowerCase();

    if (msg.includes("oi")) {
      await enviarMensagem(numero, "👋 Olá! Maxcar aqui 🚗");
    }

    res.sendStatus(200);

  } catch (erro) {
    console.log("ERRO:", erro.message);
    res.sendStatus(200);
  }
});

// 📤 ENVIO
async function enviarMensagem(numero, texto) {
  try {
    await axios.post(${ZAPI_URL}/send-text, {
      phone: numero,
      message: texto
    });
  } catch (erro) {
    console.log("Erro envio:", erro.message);
  }
}

// 🚀 START
app.listen(PORT, () => {
  console.log("🚀 Rodando na porta " + PORT);
});

// 🔥 ANTI-QUEDA (ESSENCIAL)
setInterval(() => {
  console.log("🟢 Servidor ativo...");
}, 15000);
