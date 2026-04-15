const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔑 DADOS Z-API
const ZAPI_INSTANCE = "SUA_INSTANCIA";
const ZAPI_TOKEN = "SEU_TOKEN";

const ZAPI_URL = https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN};

// 🔥 ROTA PRINCIPAL
app.get("/", (req, res) => {
  res.send("🚀 Maxcar ONLINE");
});

// 📩 WEBHOOK
app.post("/webhook", async (req, res) => {
  try {
    const data = req.body || {};

    console.log("📩 Recebido:", JSON.stringify(data));

    const numero = data.phone || data.from || "";
    const mensagem =
      data.text?.message || data.body || data.message || "";

    if (!numero || !mensagem) {
      return res.sendStatus(200);
    }

    const msg = mensagem.toLowerCase();

    if (msg.includes("oi")) {
      await enviarMensagem(numero, "👋 Olá! Bem-vindo à Maxcar 🚗");
    }

    res.sendStatus(200);

  } catch (erro) {
    console.log("❌ ERRO WEBHOOK:", erro.message);
    res.sendStatus(200);
  }
});

// 📤 ENVIO SEGURO (NUNCA CRASHA)
async function enviarMensagem(numero, texto) {
  try {
    const response = await axios.post(
      ${ZAPI_URL}/send-text,
      {
        phone: numero,
        message: texto
      },
      {
        timeout: 5000 // evita travar
      }
    );

    console.log("✅ Mensagem enviada");

  } catch (erro) {
    console.log("⚠️ Erro Z-API:", erro.response?.data || erro.message);
    // NÃO lança erro → não derruba o servidor
  }
}

// 🚀 START
app.listen(PORT, () => {
  console.log("🚀 Rodando na porta " + PORT);
});

// 🔥 KEEP ALIVE
setInterval(() => {
  console.log("🟢 ativo");
}, 10000);
