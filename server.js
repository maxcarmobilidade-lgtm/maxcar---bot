const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

console.log("🚀 Rodando");

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
    { nome: "Aimorés", estado: "MG" },
    { nome: "Baixo Guandu", estado: "ES" },
    { nome: "Colatina", estado: "ES" },
    { nome: "Barra de São Francisco", estado: "ES" },
    { nome: "Resplendor", estado: "MG" },
    { nome: "Itueta", estado: "MG" },
    { nome: "Ipanema", estado: "MG" },
    { nome: "Conselheiro Pena", estado: "MG" },
    { nome: "Mantena", estado: "MG" }
];

function identificarCidade(endereco) {
    endereco = endereco.toLowerCase();
    for (let cidade of cidadesAtendidas) {
        if (endereco.includes(cidade.nome.toLowerCase())) {
            return cidade;
        }
    }
    return { nome: "Aimorés", estado: "MG" };
}

function getConfigCidade(cidade) {
    if (cidade === "Colatina") {
        return { conta: CONTAS.COLATINA, apiKey: API_KEYS.COLATINA };
    }
    return { conta: CONTAS.PADRAO, apiKey: API_KEYS.PADRAO };
}

function headersPorCidade(cidade) {
    const { conta, apiKey } = getConfigCidade(cidade);
    return {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${conta.login}:${conta.senha}`).toString("base64"),
        "api-key": apiKey
    };
}

// ===== WHATSAPP =====
async function enviarMensagem(numero, mensagem) {
    try {
        const numeroFormatado = numero.replace("@c.us", "");

        await axios.post(
            `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`,
            {
                phone: numeroFormatado,
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

        const cidadeOrigem = identificarCidade(user.origem);
        const cidadeDestino = identificarCidade(user.destino);

        user.cidade = cidadeOrigem.nome;

        const response = await axios.post(
            MACHINE_URL,
            {
                id_externo: Date.now().toString(),
                dados_cadastro: { codigo_pais: 55, codigo_area: parseInt(ddd), telefone: parseInt(telefone) },
                dados_passageiro: { codigo_pais: 55, codigo_area: parseInt(ddd), telefone: parseInt(telefone), nome: user.nome },
                forma_pagamento: "D",
                categoria_id: user.categoria_id,
                categoria_nome: user.categoria_nome,
                partida: { endereco: user.origem, bairro: "Centro", cidade: cidadeOrigem.nome, estado: cidadeOrigem.estado },
                desejado: { endereco: user.destino, bairro: "Centro", cidade: cidadeDestino.nome, estado: cidadeDestino.estado }
            },
            { headers: headersPorCidade(cidadeOrigem.nome) }
        );

        return response.data;

    } catch (error) {
        console.log("❌ ERRO MACHINE:", error.response?.data || error.message);
        return null;
    }
}

// ===== STATUS =====
async function consultarStatus(id, cidade) {
    try {
        const response = await axios.get(
            `${BASE_URL}/solicitacaoStatus?id_mch=${id}`,
            { headers: headersPorCidade(cidade) }
        );
        return response.data.response.status;
    } catch (error) {
        console.log("❌ ERRO STATUS:", error.response?.data);
        return null;
    }
}

// ===== DETALHES =====
async function buscarDetalhesCorrida(id, cidade) {
    try {
        const response = await axios.get(
            `https://api.taximachine.com.br/api/v1/request/${id}`,
            { headers: headersPorCidade(cidade) }
        );
        return response.data;
    } catch (error) {
        console.log("❌ ERRO DETALHES:", error.response?.data);
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

// ===== ACOMPANHAR =====
function acompanharCorrida(numero, user) {
    let tentativas = 0;

    const intervalo = setInterval(async () => {

        tentativas++;

        if (tentativas > 10) {
            clearInterval(intervalo);
            await enviarMensagem(numero, "⏳ Perfeito,já estou buscando um veículo para você,aguarde...😊");
            return;
        }

        const status = await consultarStatus(user.idCorrida, user.cidade);
        if (!status) return;

        if (status === "A") {
            const detalhes = await buscarDetalhesCorrida(user.idCorrida, user.cidade);

            if (detalhes?.driver?.name) {
                const d = detalhes.driver;

                await enviarMensagem(numero,
`🚘 Motorista a caminho!

👤 ${d.name}
🚗 ${d.vehicle_model}
🔢 ${d.vehicle_plate}`);
            }

            clearInterval(intervalo);
        }

        if (status === "C") {
            usuarios[numero] = { etapa: "origem", numero };
            await enviarMensagem(numero, "❌ Corrida finalizada.\n📍 Me envie seu endereço");
            clearInterval(intervalo);
        }

    }, 30000);
}

// ===== WEBHOOK =====
app.post("/webhook", async (req, res) => {

    try {
        const numero = req.body.phone?.replace("@c.us", "");
        const mensagem = req.body.text?.message?.trim();

        if (!mensagem) return res.sendStatus(200);
        if (req.body.fromMe) return res.sendStatus(200);
        if (req.body.isGroup) return res.sendStatus(200);

        console.log("📨 MSG:", mensagem);

        if (!usuarios[numero]) {
            usuarios[numero] = { etapa: "origem", numero, ultimaInteracao: Date.now() };
            await enviarMensagem(numero, "📍 Olá,meu nome e Max,assistente virtual😊!\n  Vamos pedir um veículo para você!\n Digite seu endereço: RUA, NÚMERO E CIDADE.");
            return res.sendStatus(200);
        }

        const user = usuarios[numero];

        // 🔥 TIMEOUT INTELIGENTE
        if (user.ultimaInteracao && (Date.now() - user.ultimaInteracao > TEMPO_EXPIRACAO)) {

            usuarios[numero] = {
                etapa: "destino",
                numero,
                origem: mensagem,
                ultimaInteracao: Date.now()
            };


            await enviarMensagem(numero, "📍 Olá, meu nome é Max, assistente virtual.😊\nVamos pedir um veículo para você!\n Digite seu endereço: *RUA, NÚMERO E CIDADE*");
            return res.sendStatus(200);
        }

        user.ultimaInteracao = Date.now();

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
                await enviarMensagem(numero, "📍 Achei seu endereço!😁\n  Agora me informe seu destino:");
                return res.sendStatus(200);

            case "destino":
                user.destino = mensagem;
                user.etapa = "nome";
                await enviarMensagem(numero, "👤 Qual seu nome?");
                return res.sendStatus(200);

            case "nome":
                user.nome = mensagem;

                const cidade = identificarCidade(user.origem).nome;
                const categorias = await buscarCategorias(cidade);
                user.categorias = categorias;

                let texto = "🚗 Escolha a categoria:\n\n";
                categorias.forEach((c, i) => {
                    texto += `${i + 1} - ${c.nome}\n`;
                });

                user.etapa = "categoria";
                await enviarMensagem(numero, texto);
                return res.sendStatus(200);

            case "categoria":
                const index = parseInt(mensagem) - 1;

                if (!user.categorias[index]) {
                    await enviarMensagem(numero, "❌ Opção inválida");
                    return res.sendStatus(200);
                }

                user.categoria_id = user.categorias[index].id;
                user.categoria_nome = user.categorias[index].nome;

                user.etapa = "buscando";

                await enviarMensagem(numero, "🔎 Certinho, já estou buscando um veículo mais próximo para você. Aguarde...⏳\nCaso ocorra algum problema e você precise cancelar, *digite 0*");

                const corrida = await criarCorrida(user);

                if (!corrida || !corrida.success) {
                    usuarios[numero] = { etapa: "origem", numero };
                    await enviarMensagem(numero, "❌ Erro ao solicitar corrida.\n📍 Me envie seu endereço");
                    return res.sendStatus(200);
                }

                user.idCorrida = corrida.response.id_mch;

                acompanharCorrida(numero, user);

                return res.sendStatus(200);

            case "buscando":
                return res.sendStatus(200);
        }

    } catch (err) {
        console.log("❌ ERRO:", err.message);
        res.sendStatus(200);
    }
});

app.listen(3000, () => console.log("🚀 Servidor rodando na porta 3000"));