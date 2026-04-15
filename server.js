const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

console.log("🚀 Rodando");

// ===== PORTA (IMPORTANTE PRA RAILWAY) =====
const PORT = process.env.PORT || 3000;

// ===== CONFIG =====
const API_KEYS = {
    PADRAO: "mch_api_FW10GUY4Sq6TfpBPbaF4CB7s",
    COLATINA: "mch_api_boAlJh8U218AM6B4GDpUCiyQ"
};

const CONTAS = {
    PADRAO: {
        login: "2477maxcarmobilidade@gmail.com",
        senha: "Digo@4358"
    },
    COLATINA: {
        login: "matheus07lirio@gmail.com",
        senha: "Digo@435835"
    }
};

const BASE_URL = "https://api.taximachine.com.br/api/integracao";
const MACHINE_URL = `${BASE_URL}/abrirSolicitacao`;

const ZAPI_INSTANCE = "3F157D917E4C40749416BA4D31290A14";
const ZAPI_TOKEN = "7E812EC62CB58F3DE0EAA342";
const ZAPI_CLIENT_TOKEN = "F248eb0420f064965938d1c10578f9f86S";

const usuarios = {};
const TEMPO_EXPIRACAO = 5 * 60 * 1000;

// ===== CIDADES =====
const cidadesAtendidas = [
    "aimores", "baixo guandu", "colatina", "barra de sao francisco",
    "resplendor", "itueta", "ipanema", "conselheiro pena", "mantena"
];

function identificarCidade(endereco) {
    endereco = endereco.toLowerCase();
    if (endereco.includes("colatina")) return "Colatina";
    return "Aimorés";
}

function headersPorCidade(cidade) {
    const conta = cidade === "Colatina" ? CONTAS.COLATINA : CONTAS.PADRAO;
    const apiKey = cidade === "Colatina" ? API_KEYS.COLATINA : API_KEYS.PADRAO;

    return {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${conta.login}:${conta.senha}`).toString("base64"),
        "api-key": apiKey
    };
}

// ===== WHATSAPP =====
async function enviarMensagem(numero, mensagem) {
    try {
        await axios.post(
            `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`,
            {
                phone: numero,
                message: mensagem
            },
            {
                headers: { "Client-Token": ZAPI_CLIENT_TOKEN }
            }
        );
    } catch (e) {
        console.log("❌ ERRO ZAPI:", e.response?.data || e.message);
    }
}

// ===== CATEGORIAS =====
async function buscarCategorias(cidade) {
    try {
        const res = await axios.get(
            `${BASE_URL}/categoria?lat=-19.499&lng=-41.066`,
            { headers: headersPorCidade(cidade) }
        );
        return res.data.response;
    } catch (e) {
        console.log("❌ CATEGORIAS:", e.response?.data);
        return [];
    }
}

// ===== CRIAR CORRIDA =====
async function criarCorrida(user) {
    try {
        const numeroLimpo = user.numero.replace(/\D/g, "");
        const telefone = numeroLimpo.slice(-9);
        const ddd = numeroLimpo.slice(-11, -9);

        const cidade = identificarCidade(user.origem);

        const response = await axios.post(
            MACHINE_URL,
            {
                id_externo: Date.now().toString(),
                dados_passageiro: {
                    nome: user.nome,
                    telefone: parseInt(telefone),
                    codigo_area: parseInt(ddd),
                    codigo_pais: 55
                },
                forma_pagamento: "D",
                categoria_id: user.categoria_id,
                partida: { endereco: user.origem },
                desejado: { endereco: user.destino }
            },
            { headers: headersPorCidade(cidade) }
        );

        return response.data;

    } catch (error) {
        console.log("❌ ERRO MACHINE:", error.response?.data || error.message);
        return null;
    }
}

// ===== CANCELAR =====
async function cancelarCorrida(id, cidade) {
    try {
        await axios.post(
            `${BASE_URL}/cancelar`,
            { id_mch: id, motivo_id: "1" },
            { headers: headersPorCidade(cidade) }
        );
    } catch (e) {
        console.log("❌ ERRO CANCELAR:", e.response?.data);
    }
}

// ===== WEBHOOK =====
app.post("/webhook", async (req, res) => {
    try {
        const numero = req.body.phone;
        const mensagem = req.body.text?.message?.trim();

        if (!mensagem || req.body.fromMe || req.body.isGroup) return res.sendStatus(200);

        console.log("📨 MSG:", mensagem);

        if (!usuarios[numero]) {
            usuarios[numero] = { etapa: "origem", numero };
            await enviarMensagem(numero, "📍 Me envie seu endereço (Rua, número e cidade)");
            return res.sendStatus(200);
        }

        const user = usuarios[numero];

        if (mensagem === "0" && user.idCorrida) {
            await cancelarCorrida(user.idCorrida, user.cidade);
            usuarios[numero] = { etapa: "origem", numero };
            await enviarMensagem(numero, "❌ Corrida cancelada.\n📍 Me envie seu endereço");
            return res.sendStatus(200);
        }

        switch (user.etapa) {

            case "origem":
                user.origem = mensagem;
                user.etapa = "destino";
                await enviarMensagem(numero, "📍 Agora o destino:");
                break;

            case "destino":
                user.destino = mensagem;
                user.etapa = "nome";
                await enviarMensagem(numero, "👤 Qual seu nome?");
                break;

            case "nome":
                user.nome = mensagem;

                const cidade = identificarCidade(user.origem);
                user.cidade = cidade;

                const categorias = await buscarCategorias(cidade);
                user.categorias = categorias;

                let texto = "🚗 Escolha a categoria:\n\n";
                categorias.forEach((c, i) => {
                    texto += `${i + 1} - ${c.nome}\n`;
                });

                user.etapa = "categoria";
                await enviarMensagem(numero, texto);
                break;

            case "categoria":
                const index = parseInt(mensagem) - 1;

                if (!user.categorias[index]) {
                    await enviarMensagem(numero, "❌ Opção inválida");
                    return res.sendStatus(200);
                }

                user.categoria_id = user.categorias[index].id;

                await enviarMensagem(numero, "🔎 Buscando motorista...");

                const corrida = await criarCorrida(user);

                if (!corrida || !corrida.success) {
                    usuarios[numero] = { etapa: "origem", numero };
                    await enviarMensagem(numero, "❌ Erro ao solicitar corrida.");
                    return res.sendStatus(200);
                }

                user.idCorrida = corrida.response.id_mch;

                await enviarMensagem(numero, "🚘 Corrida solicitada com sucesso!");
                break;
        }

        res.sendStatus(200);

    } catch (err) {
        console.log("❌ ERRO:", err.message);
        res.sendStatus(200);
    }
});

// ===== START =====
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
