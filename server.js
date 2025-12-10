// --------------------------------------------------
// IMPORTAÇÕES
// --------------------------------------------------
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config(); // Carrega variáveis do .env

console.log("DEBUG: MONGO_URL carregado:", process.env.MONGO_URL);

// --------------------------------------------------
// APP
// --------------------------------------------------
const app = express();
app.use(express.json());
app.use(cors());
app.use("/", express.static(__dirname + "/public")); // Rota do front-end

// --------------------------------------------------
// CONEXÃO COM MONGODB
// --------------------------------------------------
const mongoURL = process.env.MONGO_URL;

if (!mongoURL) {
    console.error("❌ ERRO: MONGO_URL não encontrada no .env");
    process.exit(1);
}

mongoose
    .connect(mongoURL)
    .then(() => console.log("🌎 MongoDB conectado com sucesso!"))
    .catch((err) => console.error("❌ Erro ao conectar no Mongo:", err));

// --------------------------------------------------
// SCHEMAS
// --------------------------------------------------
const QuadroSchema = new mongoose.Schema({
    nome: { type: String, required: true, unique: true }
});

const TarefaSchema = new mongoose.Schema({
    quadro: { type: String, required: true },
    nome: String,
    tipo: String,
    inicio: String,
    ultAtualizacao: String,
    prazo: String,
    status: String,
    participantes: [String],
    observacoes: String
});

const Quadro = mongoose.model("Quadro", QuadroSchema);
const Tarefa = mongoose.model("Tarefa", TarefaSchema);

// --------------------------------------------------
// ROTAS
// --------------------------------------------------

// LISTAR quadros + tarefas
app.get("/quadros", async (req, res) => {
    try {
        const quadros = await Quadro.find();
        const tarefas = await Tarefa.find();

        const resposta = {};

        quadros.forEach((q) => {
            resposta[q.nome] = tarefas.filter((t) => t.quadro === q.nome);
        });

        res.send(resposta);
    } catch (err) {
        res.status(500).send({ erro: "Erro ao listar quadros" });
    }
});

// CRIAR quadro
app.post("/quadros", async (req, res) => {
    try {
        await Quadro.create(req.body);
        res.send({ ok: true });
    } catch (err) {
        res.status(500).send({ erro: "Erro ao criar quadro" });
    }
});

// RENOMEAR quadro
app.put("/quadros/renomear", async (req, res) => {
    try {
        const { antigo, novo } = req.body;

        await Quadro.updateOne({ nome: antigo }, { nome: novo });
        await Tarefa.updateMany({ quadro: antigo }, { quadro: novo });

        res.send({ ok: true });
    } catch (err) {
        res.status(500).send({ erro: "Erro ao renomear quadro" });
    }
});

// EXCLUIR quadro
app.delete("/quadros/:nome", async (req, res) => {
    try {
        const nome = req.params.nome;
        await Quadro.deleteOne({ nome });
        await Tarefa.deleteMany({ quadro: nome });

        res.send({ ok: true });
    } catch (err) {
        res.status(500).send({ erro: "Erro ao excluir quadro" });
    }
});

// CRIAR tarefa
app.post("/tarefas", async (req, res) => {
    try {
        await Tarefa.create(req.body);
        res.send({ ok: true });
    } catch (err) {
        res.status(500).send({ erro: "Erro ao criar tarefa" });
    }
});

// EDITAR tarefa
app.put("/tarefas/:id", async (req, res) => {
    try {
        await Tarefa.updateOne({ _id: req.params.id }, req.body);
        res.send({ ok: true });
    } catch (err) {
        res.status(500).send({ erro: "Erro ao editar tarefa" });
    }
});

// EXCLUIR tarefa
app.delete("/tarefas/:id", async (req, res) => {
    try {
        await Tarefa.deleteOne({ _id: req.params.id });
        res.send({ ok: true });
    } catch (err) {
        res.status(500).send({ erro: "Erro ao excluir tarefa" });
    }
});

// --------------------------------------------------
// INICIANDO SERVIDOR
// --------------------------------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
});
