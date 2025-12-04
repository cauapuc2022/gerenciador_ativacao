// ------------------- BANCO DE DADOS LOCAL -------------------

function salvarDB() {
    localStorage.setItem("ativacao_quadros", JSON.stringify(quadros));
}

function carregarDB() {
    const dados = localStorage.getItem("ativacao_quadros");

    if (dados) {
        quadros = JSON.parse(dados);
    } else {
        // cria um quadro inicial
        quadros = { "Quadro 1": [] };
        salvarDB();
    }

    quadroAtual = Object.keys(quadros)[0];
}

// ------------------- VARIÁVEIS GLOBAIS -------------------

let quadros = {};
let quadroAtual = "";
let quadroSelecionado = "";
let tarefaEditando = null;

// ------------------- INICIALIZAÇÃO -------------------

function carregar() {
    carregarDB();

    document.getElementById("tituloQuadro").innerText = quadroAtual;

    desenharAbas();
    desenharTabela();
}
carregar();

// ------------------- UTIL -------------------

function formatarDataBR(data) {
    if (!data) return "";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
}

function corPastel(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++)
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${hash % 360}, 70%, 85%)`;
}

// ------------------- TABELA -------------------

function desenharTabela() {
    const tabela = document.getElementById("tabela");

    if (!quadros[quadroAtual]) return;

    let html = `
        <tr>
            <th>Tarefa</th>
            <th>Início</th>
            <th>Prazo</th>
            <th>Status</th>
            <th>Participantes</th>
            <th>Obs</th>
            <th>Ações</th>
        </tr>
    `;

    quadros[quadroAtual].forEach(t => {
        html += `
            <tr>
                <td>${t.nome}</td>
                <td>${formatarDataBR(t.inicio)}</td>
                <td>${formatarDataBR(t.prazo)}</td>
                <td><span class="status ${t.status.toLowerCase()}">${t.status}</span></td>
                <td>${t.participantes.map(p => `<span class="etiqueta" style="background:${corPastel(p)}">${p}</span>`).join("")}</td>
                <td><button class="btn-acao" onclick="verObs('${t.observacoes || ""}')">Ver</button></td>
                <td>
                    <button class="btn-acao" onclick="editar(${t.id})">Editar</button>
                    <button class="btn-acao excluir" onclick="excluirTarefa(${t.id})">Excluir</button>
                </td>
            </tr>
        `;
    });

    tabela.innerHTML = html;
}

// ------------------- OBSERVAÇÕES -------------------

function verObs(texto) {
    alert("Observação:\n\n" + texto);
}

// ------------------- MODAL TAREFA -------------------

function abrirModalTarefa() {
    tarefaEditando = null;

    inpNome.value = "";
    inpInicio.value = "";
    inpPrazo.value = "";
    inpStatus.value = "Em andamento";
    inpParticipantes.value = "";
    inpObs.value = "";

    tituloModalTarefa.innerText = "Criar nova tarefa";
    btnSalvar.innerText = "Salvar";

    modalTarefa.style.display = "flex";
}

function fecharModalTarefa() {
    modalTarefa.style.display = "none";
}

// ------------------- SALVAR / EDITAR -------------------

function salvarTarefa() {
    const dados = {
        id: tarefaEditando ?? Date.now(), // ID único
        nome: inpNome.value,
        inicio: inpInicio.value,
        prazo: inpPrazo.value,
        status: inpStatus.value,
        participantes: inpParticipantes.value.split(",").map(s => s.trim()).filter(x => x),
        observacoes: inpObs.value
    };

    // EDITAR
    if (tarefaEditando) {
        quadros[quadroAtual] = quadros[quadroAtual].map(t =>
            t.id == tarefaEditando ? { ...dados } : t
        );
        salvarDB();
        desenharTabela();
        fecharModalTarefa();
        tarefaEditando = null;
        return;
    }

    // NOVA TAREFA
    quadros[quadroAtual].push(dados);
    salvarDB();
    desenharTabela();
    fecharModalTarefa();
}

// ------------------- EDITAR -------------------

function editar(id) {
    const tarefa = quadros[quadroAtual].find(t => t.id == id);
    if (!tarefa) return;

    tarefaEditando = id;

    inpNome.value = tarefa.nome;
    inpInicio.value = tarefa.inicio;
    inpPrazo.value = tarefa.prazo;
    inpStatus.value = tarefa.status;
    inpParticipantes.value = tarefa.participantes.join(", ");
    inpObs.value = tarefa.observacoes;

    tituloModalTarefa.innerText = "Editar tarefa";
    btnSalvar.innerText = "Salvar alterações";

    modalTarefa.style.display = "flex";
}

// ------------------- EXCLUIR -------------------

function excluirTarefa(id) {
    quadros[quadroAtual] = quadros[quadroAtual].filter(t => t.id != id);
    salvarDB();
    desenharTabela();
}

// ------------------- ABAS -------------------

function desenharAbas() {
    const abas = document.getElementById("abasContainer");
    abas.innerHTML = "";

    Object.keys(quadros).forEach(q => {
        const div = document.createElement("div");
        div.className = "aba " + (q === quadroAtual ? "ativa" : "");
        div.innerText = q;

        div.onclick = () => {
            quadroAtual = q;
            document.getElementById("tituloQuadro").innerText = q;
            desenharAbas();
            desenharTabela();
        };

        div.oncontextmenu = (e) => {
            e.preventDefault();
            quadroSelecionado = q;

            const menu = document.getElementById("menuContexto");
            menu.style.display = "block";
            menu.style.left = e.pageX + "px";
            menu.style.top = e.pageY + "px";
        };

        abas.appendChild(div);
    });

    const mais = document.createElement("div");
    mais.className = "aba";
    mais.innerText = "+";
    mais.onclick = abrirModalQuadro;

    abas.appendChild(mais);
}

// ------------------- MENU CONTEXTO -------------------

document.addEventListener("click", () => {
    document.getElementById("menuContexto").style.display = "none";
});

function acaoRenomear() {
    modalRenomear.style.display = "flex";
    inpRenomear.value = quadroSelecionado;
}

function acaoExcluir() {
    modalExcluir.style.display = "flex";
}

function fecharRenomear() {
    modalRenomear.style.display = "none";
}

function fecharExcluir() {
    modalExcluir.style.display = "none";
}

// CONFIRMAR RENOMEAR QUADRO
function confirmarRenomear() {
    const novo = inpRenomear.value;

    if (!novo.trim()) return;

    quadros[novo] = quadros[quadroSelecionado];
    delete quadros[quadroSelecionado];

    quadroAtual = novo;

    salvarDB();
    fecharRenomear();
    carregar();
}

// CONFIRMAR EXCLUIR QUADRO
function confirmarExcluir() {
    delete quadros[quadroSelecionado];

    if (Object.keys(quadros).length === 0) {
        quadros = { "Quadro 1": [] };
    }

    quadroAtual = Object.keys(quadros)[0];

    salvarDB();
    fecharExcluir();
    carregar();
}

// ------------------- MODAL QUADRO -------------------

function abrirModalQuadro() {
    modalQuadro.style.display = "flex";
}

function fecharModalQuadro() {
    modalQuadro.style.display = "none";
}

function criarQuadro() {
    const nome = inpNovoQuadro.value.trim();
    if (!nome) return;

    quadros[nome] = [];
    salvarDB();

    inpNovoQuadro.value = "";
    fecharModalQuadro();
    carregar();
}
