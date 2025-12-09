const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use("/", express.static(__dirname + "/public"));
app.use(cors());

const DB = "quadros.json";

// Criar arquivo inicial
if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, JSON.stringify({ "Quadro 1": [] }, null, 2));
}

function lerBD() {
    return JSON.parse(fs.readFileSync(DB));
}

function salvarBD(db) {
    fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}

// --------------------------------------------------
// LISTAR QUADROS
app.get("/quadros", (req, res) => res.send(lerBD()));

// CRIAR QUADRO
app.post("/quadros", (req, res) => {
    const { nome } = req.body;
    const db = lerBD();
    db[nome] = [];
    salvarBD(db);
    res.send({ ok: true });
});

// RENOMEAR QUADRO
app.put("/quadros/renomear", (req, res) => {
    const { antigo, novo } = req.body;
    const db = lerBD();
    db[novo] = db[antigo];
    delete db[antigo];
    salvarBD(db);
    res.send({ ok: true });
});

// EXCLUIR QUADRO
app.delete("/quadros/:nome", (req, res) => {
    const nome = req.params.nome;
    const db = lerBD();
    delete db[nome];
    salvarBD(db);
    res.send({ ok: true });
});

// CRIAR TAREFA
app.post("/tarefas", (req, res) => {
    const { quadro, nome, inicio, prazo, status, participantes, observacoes } = req.body;
    const db = lerBD();

    db[quadro].push({
        id: Date.now(),
        nome,
        inicio,
        prazo,
        status,
        participantes,
        observacoes
    });

    salvarBD(db);
    res.send({ ok: true });
});

// EDITAR TAREFA
app.put("/tarefas/:quadro/:id", (req, res) => {
    const { quadro, id } = req.params;
    const nova = req.body;
    const db = lerBD();

    db[quadro] = db[quadro].map(t => t.id == id ? { ...t, ...nova } : t);

    salvarBD(db);
    res.send({ ok: true });
});

// EXCLUIR TAREFA
app.delete("/tarefas/:quadro/:id", (req, res) => {
    const { quadro, id } = req.params;
    const db = lerBD();
    db[quadro] = db[quadro].filter(t => t.id != id);
    salvarBD(db);
    res.send({ ok: true });
});

// --------------------------------------------------

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
    console.log("Servidor rodando na porta " + PORT)
);
