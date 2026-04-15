const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔑 CONFIG Z-API
const ZAPI_INSTANCE = "3F157D917E4C40749416BA4D31290A14";
const ZAPI_TOKEN = "7E812EC62CB58F3DE0EAA342";

const ZAPI_URL = https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN};

// 🔥 ROTA PRINCIPAL (Railway precisa disso)
app.get("/", (req, res) => {
  res.send("🚀 Maxcar bot rodando");
});

// 🧠 WEBHOOK SUPER SEGURO (NÃO QUEBRA NUNCA)
app.post("/webhook", async (req, res) => {
  try {
    const data = req.body || {};

    console.log("📩 WEBHOOK:", JSON.stringify(data));

    const numero =
      data.phone ||
      data.from ||
      data.sender ||
      null;

    const mensagem =
      data.text?.message ||
      data.message ||
      data.body ||
      "";

    if (!numero || !mensagem) {
      return res.sendStatus(200);
    }

    const msg = mensagem.toLowerCase();

    if (msg.includes("oi")) {
      await enviarMensagem(numero, "👋 Olá! Bem-vindo à Maxcar!\nDigite 1 para corrida 🚗");
    }

    if (msg === "1") {
      await enviarMensagem(numero, "🚗 Buscando motorista...");
    }

    res.sendStatus(200);

  } catch (erro) {
    console.log("❌ ERRO WEBHOOK:", erro);
    res.sendStatus(200); // nunca quebra o servidor
  }
});

// 📤 ENVIO Z-API (COM PROTEÇÃO)
async function enviarMensagem(numero, texto) {
  try {
    await axios.post(${ZAPI_URL}/send-text, {
      phone: numero,
      message: texto
    });
  } catch (erro) {
    console.log("Erro ao enviar:", erro.response?.data || erro.message);
  }
}

// 🚀 START
app.listen(PORT, () => {
  console.log("🚀 Rodando na porta " + PORT);
});
