let quadros = {};
let quadroAtual = "";
let quadroSelecionado = "";
let tarefaEditando = null;

let ordemInicioAsc = true;
let ordemPrazoAsc = true;

// ------------------- INICIALIZAÇÃO -------------------

async function carregar() {
    quadros = await fetch("http://localhost:8080/quadros").then(r => r.json());

    const abas = Object.keys(quadros);
    quadroAtual = abas[0];

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

function hojeISO() {
    const hoje = new Date();
    return hoje.toISOString().split("T")[0];
}

// ------------------- ORDENAR -------------------

function ordenarPorInicio() {
    quadros[quadroAtual].sort((a, b) => {
        if (ordemInicioAsc) return (a.inicio || "") > (b.inicio || "") ? 1 : -1;
        return (a.inicio || "") < (b.inicio || "") ? 1 : -1;
    });
    ordemInicioAsc = !ordemInicioAsc;
    desenharTabela();
}

function ordenarPorPrazo() {
    quadros[quadroAtual].sort((a, b) => {
        if (ordemPrazoAsc) return (a.prazo || "") > (b.prazo || "") ? 1 : -1;
        return (a.prazo || "") < (b.prazo || "") ? 1 : -1;
    });
    ordemPrazoAsc = !ordemPrazoAsc;
    desenharTabela();
}

// ------------------- TABELA -------------------

function desenharTabela() {
    const tabela = document.getElementById("tabela");

    if (!quadros[quadroAtual]) return;

    let html = `
        <tr>
            <th>Tipo</th>
            <th>Tarefa</th>
            <th onclick="ordenarPorInicio()" style="cursor:pointer">Início ⬍</th>
            <th>Ult. Atualização</th>
            <th onclick="ordenarPorPrazo()" style="cursor:pointer">Prazo ⬍</th>
            <th>Status</th>
            <th>Participantes</th>
            <th>Obs</th>
            <th>Ações</th>
        </tr>
    `;

    const hoje = hojeISO();

    quadros[quadroAtual].forEach(t => {
        const prazoVencido = t.prazo && t.prazo < hoje ? "prazo-vencido" : "";

        html += `
            <tr>
                <td>${t.tipo || ""}</td>
                <td>${t.nome}</td>
                <td>${formatarDataBR(t.inicio)}</td>
                <td>${formatarDataBR(t.ultAtualizacao)}</td>
                <td class="${prazoVencido}">${formatarDataBR(t.prazo)}</td>
                <td><span class="status ${t.status.toLowerCase()}">${t.status}</span></td>
                <td>${t.participantes.map(p => `<span class="etiqueta" style="background:${corPastel(p)}">${p}</span>`).join("")}</td>
                <td><button class="btn-acao" onclick='verObs(${JSON.stringify(t.observacoes || "")})'>Ver</button></td>
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
    document.getElementById("textoObs").innerText = texto || "Nenhuma observação.";
    document.getElementById("modalObs").style.display = "flex";
}

function fecharObs() {
    document.getElementById("modalObs").style.display = "none";
}

// ------------------- MODAL TAREFA -------------------

function abrirModalTarefa() {
    tarefaEditando = null;

    inpNome.value = "";
    inpTipo.value = "";
    inpInicio.value = "";
    inpUltAtual.value = "";
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
        nome: inpNome.value,
        tipo: inpTipo.value,
        inicio: inpInicio.value,
        ultAtualizacao: inpUltAtual.value,
        prazo: inpPrazo.value,
        status: inpStatus.value,
        participantes: inpParticipantes.value.split(",").map(s => s.trim()).filter(x => x),
        observacoes: inpObs.value
    };

    // EDITAR
    if (tarefaEditando) {
        fetch(`http://localhost:8080/tarefas/${quadroAtual}/${tarefaEditando}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        }).then(() => {
            quadros[quadroAtual] = quadros[quadroAtual].map(t =>
                t.id == tarefaEditando ? { ...t, ...dados } : t
            );
            desenharTabela();
            fecharModalTarefa();
            tarefaEditando = null;
        });

        return;
    }

    // NOVA TAREFA
    fetch("http://localhost:8080/tarefas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quadro: quadroAtual, ...dados })
    })
        .then(() => fetch("http://localhost:8080/quadros"))
        .then(r => r.json())
        .then(db => {
            quadros = db;
            desenharTabela();
            fecharModalTarefa();
        });
}

// ------------------- EDITAR -------------------

function editar(id) {
    const tarefa = quadros[quadroAtual].find(t => t.id == id);
    if (!tarefa) return;

    tarefaEditando = id;

    inpNome.value = tarefa.nome;
    inpTipo.value = tarefa.tipo || "";
    inpInicio.value = tarefa.inicio;
    inpUltAtual.value = tarefa.ultAtualizacao || "";
    inpPrazo.value = tarefa.prazo;
    inpStatus.value = tarefa.status;
    inpParticipantes.value = tarefa.participantes.join(", ");
    inpObs.value = tarefa.observacoes;

    tituloModalTarefa.innerText = "Editar tarefa";
    btnSalvar.innerText = "Salvar alterações";

    modalTarefa.style.display = "flex";
}

// ------------------- EXCLUIR TAREFA -------------------

function excluirTarefa(id) {
    fetch(`http://localhost:8080/tarefas/${quadroAtual}/${id}`, {
        method: "DELETE"
    }).then(() => {
        quadros[quadroAtual] = quadros[quadroAtual].filter(t => t.id != id);
        desenharTabela();
    });
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

function confirmarRenomear() {
    const novo = inpRenomear.value;

    fetch("http://localhost:8080/quadros/renomear", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ antigo: quadroSelecionado, novo })
    }).then(() => {
        carregar();
        fecharRenomear();
    });
}

function confirmarExcluir() {
    fetch(`http://localhost:8080/quadros/${quadroSelecionado}`, {
        method: "DELETE"
    }).then(() => {
        carregar();
        fecharExcluir();
    });
}

// ------------------- MODAL QUADRO -------------------

function abrirModalQuadro() {
    modalQuadro.style.display = "flex";
}

function fecharModalQuadro() {
    modalQuadro.style.display = "none";
}

function criarQuadro() {
    const nome = inpNovoQuadro.value;

    fetch("http://localhost:8080/quadros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome })
    }).then(() => carregar());

    modalQuadro.style.display = "none";
}
