const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔑 CONFIG (PODE DEIXAR VAZIO PRA TESTE)
const ZAPI_INSTANCE = process.env.ZAPI_INSTANCE || "";
const ZAPI_TOKEN = process.env.ZAPI_TOKEN || "";

const ZAPI_URL = ZAPI_INSTANCE && ZAPI_TOKEN
  ? https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}
  : null;

// 🔥 ROTA PRINCIPAL
app.get("/", (req, res) => {
  res.send("🚀 Maxcar ONLINE ESTÁVEL");
});

// 📩 WEBHOOK
app.post("/webhook", async (req, res) => {
  try {
    const data = req.body || {};
    console.log("📩:", JSON.stringify(data));

    const numero = data.phone || data.from || "";
    const mensagem =
      data.text?.message || data.body || data.message || "";

    if (!numero || !mensagem) {
      return res.sendStatus(200);
    }

    if (mensagem.toLowerCase().includes("oi")) {
      await enviarMensagem(numero, "👋 Olá! Maxcar aqui 🚗");
    }

    res.sendStatus(200);

  } catch (erro) {
    console.log("❌ ERRO WEBHOOK:", erro.message);
    res.sendStatus(200);
  }
});

// 📤 ENVIO 100% SEGURO
async function enviarMensagem(numero, texto) {
  try {
    if (!ZAPI_URL) {
      console.log("⚠️ ZAPI não configurada");
      return;
    }

    await axios.post(${ZAPI_URL}/send-text, {
      phone: numero,
      message: texto
    }, {
      timeout: 5000
    });

    console.log("✅ Mensagem enviada");

  } catch (erro) {
    console.log("⚠️ Erro Z-API:", erro.response?.data || erro.message);
    // NÃO quebra o servidor
  }
}

// 🚀 START
app.listen(PORT, () => {
  console.log("🚀 Rodando na porta " + PORT);
});

// 🔥 PROTEÇÃO TOTAL
process.on("uncaughtException", (err) => {
  console.log("💥 ERRO GLOBAL:", err.message);
});

process.on("unhandledRejection", (err) => {
  console.log("💥 PROMISE ERROR:", err);
});

// 🔄 KEEP ALIVE
setInterval(() => {
  console.log("🟢 vivo");
}, 10000);
