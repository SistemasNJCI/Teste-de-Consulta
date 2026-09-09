const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const ERP_URL = process.env.ERP_URL;
const ERP_ACCESS_TOKEN = process.env.ERP_ACCESS_TOKEN;

// ==========================================
// CONFIGURAÇÃO
// ==========================================

if (!ERP_URL) {
    console.error("ERRO: ERP_URL não configurado.");
    process.exit(1);
}

if (!ERP_ACCESS_TOKEN) {
    console.error("ERRO: ERP_ACCESS_TOKEN não configurado.");
    process.exit(1);
}

// ==========================================
// FRONTEND
// ==========================================

app.use(express.static(path.join(__dirname, "../frontend")));

// ==========================================
// NORMALIZA CPF/CNPJ
// ==========================================

function normalizarDocumento(valor) {
    return String(valor || "").replace(/\D/g, "");
}

// ==========================================
// CONSULTA CLIENTE
// ==========================================

app.get("/api/cliente", async (req, res) => {

    try {

        const txId = normalizarDocumento(req.query.txId);

        // CPF = 11 dígitos
        // CNPJ = 14 dígitos
        if (![11, 14].includes(txId.length)) {

            return res.status(400).json({
                success: false,
                message: "Informe um CPF ou CNPJ válido."
            });

        }

        const url =
            `${ERP_URL}/external/integrations/thirdparty/people/txid/${encodeURIComponent(txId)}`;

        const resposta = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${ERP_ACCESS_TOKEN}`,
                "Accept": "application/json"
            }
        });

        let dados;

        try {
            dados = await resposta.json();
        } catch {
            dados = null;
        }

        if (!resposta.ok) {

            console.error(
                `Erro ERP: HTTP ${resposta.status}`
            );

            return res.status(resposta.status === 404 ? 404 : 502).json({
                success: false,
                message: "Não foi possível consultar o cliente."
            });
        }

        return res.json(dados);

    } catch (erro) {

        console.error("Erro na consulta:", erro.message);

        return res.status(500).json({
            success: false,
            message: "Erro interno ao realizar a consulta."
        });
    }
});

// ==========================================
// INICIALIZA SERVIDOR
// ==========================================

app.listen(PORT, () => {

    console.log(`
==========================================
 Consulta de Cliente
==========================================

Servidor: http://localhost:${PORT}

API:
GET /api/cliente?txId=CPF_OU_CNPJ

==========================================
`);
});
