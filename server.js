const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🚨 PORTA OBRIGATÓRIA DO RAILWAY
const PORT = process.env.PORT || 3000;

// 🔑 CONFIG Z-API (COLOCA OS SEUS DADOS)
const ZAPI_INSTANCE = "3F157D917E4C40749416BA4D31290A14";
const ZAPI_TOKEN = "7E812EC62CB58F3DE0EAA342";
const ZAPI_URL = https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN};

// 🔥 ROTA PRINCIPAL (EVITA O APP CAIR)
app.get("/", (req, res) => {
  res.send("🚀 Maxcar Bot Online com Z-API");
});

// 📩 WEBHOOK (Z-API ENVIA MENSAGENS AQUI)
app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    console.log("📩 Mensagem recebida:", data);

    const numero = data.phone;
    const mensagem = data.text?.message;

    if (!numero || !mensagem) {
      return res.sendStatus(200);
    }

    // 🔥 RESPOSTA AUTOMÁTICA SIMPLES
    if (mensagem.toLowerCase() === "oi") {
      await enviarMensagem(numero, "👋 Olá! Bem-vindo à Maxcar!\nDigite 1 para solicitar corrida 🚗");
    }

    if (mensagem === "1") {
      await enviarMensagem(numero, "🚗 Estamos buscando um motorista para você...");
    }

    res.sendStatus(200);

  } catch (erro) {
    console.log("❌ ERRO:", erro.message);
    res.sendStatus(200);
  }
});

// 📤 FUNÇÃO PARA ENVIAR MENSAGEM
async function enviarMensagem(numero, texto) {
  try {
    await axios.post(${ZAPI_URL}/send-text, {
      phone: numero,
      message: texto
    });
  } catch (erro) {
    console.log("Erro ao enviar mensagem:", erro.message);
  }
}

// 🚀 INICIA SERVIDOR
app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta " + PORT);
});
