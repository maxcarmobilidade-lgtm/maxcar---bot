const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = process.env.PORT || 3000;

// WhatsApp client
const client = new Client();

// QR Code
client.on('qr', (qr) => {
  console.log('📲 Escaneie o QR Code abaixo:');
  qrcode.generate(qr, { small: true });
});

// Quando conectar
client.on('ready', () => {
  console.log('✅ WhatsApp conectado!');
});

// Inicializa WhatsApp
client.initialize();

// Rota teste
app.get('/', (req, res) => {
  res.send('Bot Maxcar rodando 🚀');
});

// Start servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
