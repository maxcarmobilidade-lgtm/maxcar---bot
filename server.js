const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

/* 🔐 CONFIG Z-API (COLOCA OS SEUS DADOS) */
const ZAPI_INSTANCE = 'SUA_INSTANCIA';
const ZAPI_TOKEN = 'SEU_TOKEN';

const ZAPI_URL = https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN};

/* 🌐 TESTE */
app.get('/', (req, res) => {
  res.send('Maxcar bot online 🚀');
});

/* 📩 WEBHOOK */
app.post('/webhook', async (req, res) => {

  const data = req.body;

  console.log('📩 Mensagem:', data);

  const numero = data.phone;
  const mensagem = data.text?.message;

  if (!mensagem) return res.sendStatus(200);

  /* 🤖 RESPOSTAS */

  if (mensagem.toLowerCase() === 'oi') {
    await enviarMensagem(numero,
`👋 Olá! Bem-vindo à Maxcar 🚗

Digite:
1 - Solicitar corrida
2 - Suporte`);
  }

  if (mensagem === '1') {
    await enviarMensagem(numero,
`🚗 Me envie seu endereço:

Rua, número e cidade`);
  }

  if (mensagem === '2') {
    await enviarMensagem(numero,
`📞 Suporte Maxcar:
(27) 99999-9999`);
  }

  res.sendStatus(200);
});

/* 📤 ENVIAR MSG */
async function enviarMensagem(numero, texto) {
  try {
    await axios.post(${ZAPI_URL}/send-text, {
      phone: numero,
      message: texto
    });
  } catch (error) {
    console.error('Erro ao enviar:', error.message);
  }
}

/* 🚀 START */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Servidor rodando 🚀');
});
