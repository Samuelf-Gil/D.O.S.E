const API = "http://localhost:3000";

let descarteEditando = null;

async function carregarProdutos() {

    const resposta = await fetch(`${API}/products`);

    const produtos = await resposta.json();

    const listaProdutos = document.getElementById("listaProdutos");

    produtos.forEach(function(produto){

    const option = document.createElement("option");

    option.value = produto.name;

    listaProdutos.appendChild(option);

    });

}

async function carregarFabricantes() {

    const resposta = await fetch(`${API}/manufacturers`);

    const fabricantes = await resposta.json();

    const listaFabricantes = document.getElementById("listaFabricantes");

    fabricantes.forEach(function(fabricante){

        const option = document.createElement("option");

        option.value = fabricante.name;

        listaFabricantes.appendChild(option);

    });

}

async function carregarLotes() {

    const nomeProduto = document.getElementById("produto").value;

    const respostaProdutos = await fetch(`${API}/products`);

    const produtos = await respostaProdutos.json();

    const produtoSelecionado = produtos.find(function(produto){
        return produto.name === nomeProduto;
    });

    if (!produtoSelecionado) {

        return;
    }

    const respostaLotes = await fetch(`${API}/batches`);

    const lotes = await respostaLotes.json();

    const lotesFiltrados = lotes.filter(function(lote) {

    return lote.product_id === produtoSelecionado.id;

});

    const listaLotes = document.getElementById("listaLotes");

    listaLotes.innerHTML = "";

    lotesFiltrados.forEach(function(lote){

        const option = document.createElement("option");

        option.value = lote.batch_identifier;

        listaLotes.appendChild(option);

    });

}

async function carregarDescartes() {

    const descartes = await (await fetch(`${API}/discarts`)).json();

    const lotes = await (await fetch(`${API}/batches`)).json();

    const produtos = await (await fetch(`${API}/products`)).json();

    const tabela = document.getElementById("tabelaDescartes");

    tabela.innerHTML = "";

    descartes.forEach(function(descarte){

        const lote = lotes.find(function(l){
            return l.id === descarte.batch_id;
        });

        const produto = lote
            ? produtos.find(function(p){ return p.id === lote.product_id; })
            : null;

        const nomeProduto = produto ? produto.name : "Produto não encontrado";

        const identificadorLote = lote ? lote.batch_identifier : "—";

        const linha = document.createElement("tr");

        linha.classList.add("border-b");

        linha.innerHTML = `

    <td class="p-3">
        #${descarte.id} - ${nomeProduto}
    </td>

    <td class="p-3">
        ${identificadorLote}
    </td>

    <td class="p-3">
        ${descarte.quantity}
    </td>

    <td class="p-3">
        ${descarte.reason}
    </td>

    <td class="p-3 flex gap-2">

        <button
            class="bg-green-400 text-white px-3 rounded"
            onclick="editarDescarte(${descarte.id})"
        >
            Editar
        </button>

        <button
            class="bg-red-400 text-white px-3 rounded"
            onclick="excluirDescarte(${descarte.id})"
        >
            Excluir
        </button>

    </td>

`;

        tabela.appendChild(linha);
    });

}

const form = document.getElementById("formDescarte");

form.addEventListener("submit", async function(event) {

    event.preventDefault();

    const nomeProduto = document.getElementById("produto").value;

    const motivo = document.getElementById("motivo").value;

    const identificadorLote = document.getElementById("lote").value;

    const quantidade = Number(document.getElementById("quantidade").value);

    const responsavel = document.getElementById("responsavel").value;

    const nomeFabricante = document.getElementById("destino").value;

    if (
        !nomeProduto ||
        !motivo ||
        !identificadorLote ||
        !quantidade ||
        quantidade <= 0 ||
        !responsavel ||
        !nomeFabricante
    ) {

        alert("Preencha todos os campos!");

        return;
    }

    const produtos = await (await fetch(`${API}/products`)).json();

    const produtoSelecionado = produtos.find(function(p){
        return p.name === nomeProduto;
    });

    if (!produtoSelecionado) {

        alert("Produto não encontrado.");

        return;
    }

    const lotes = await (await fetch(`${API}/batches`)).json();

    const loteSelecionado = lotes.find(function(l){
        return l.batch_identifier === identificadorLote
            && l.product_id === produtoSelecionado.id;
    });

    if (!loteSelecionado) {

        alert("Lote não encontrado para o produto selecionado.");

        return;
    }

    const fabricantes = await (await fetch(`${API}/manufacturers`)).json();

    const fabricanteSelecionado = fabricantes.find(function(f){
        return f.name.toLowerCase() === nomeFabricante.trim().toLowerCase();
    });

    if (!fabricanteSelecionado) {

        alert("Fabricante (destino) não encontrado.");

        return;
    }

    const usuarios = await (await fetch(`${API}/usuarios`)).json();

    const usuario = usuarios.find(function(u){
        return u.nome.toLowerCase() === responsavel.trim().toLowerCase();
    });

    const agora = new Date().toISOString();

    const custoUnitario = produtoSelecionado.cost;

    const descarte = {

        company_id: produtoSelecionado.company_id,
        user_id: usuario ? usuario.id : 1,
        batch_id: loteSelecionado.id,
        manufacturer_id: fabricanteSelecionado.id,
        reason: motivo,
        quantity: quantidade,
        unit_cost: custoUnitario,
        total_loss: custoUnitario * quantidade,
        completed_at: agora,
        created_at: descarteEditando ? descarteEditando.created_at : agora

    };

    const url = descarteEditando
        ? `${API}/discarts/${descarteEditando.id}`
        : `${API}/discarts`;

    const metodo = descarteEditando
        ? "PUT"
        : "POST";

    await fetch(url, {

        method: metodo,

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(descarte)

    });

    alert("Descarte realizado com sucesso!");

    carregarDescartes();

    form.reset();

    descarteEditando = null;

});

const btnHome = document.getElementById("btnHome");

btnHome.addEventListener("click", function() {

    alert(
        "A página inicial está em manutenção e ainda não foi integrada ao sistema."
    );

});

carregarProdutos();

carregarFabricantes();

document.getElementById("produto")
.addEventListener("change", carregarLotes);

carregarDescartes();

async function excluirDescarte(id) {

    const confirmar = confirm("Deseja realmente excluir este descarte?");

    if (!confirmar) {

        return;

    }

    await fetch(`${API}/discarts/${id}`, {

        method: "DELETE"

    });

    carregarDescartes();

}

async function editarDescarte(id) {

    const descarte = await (await fetch(`${API}/discarts/${id}`)).json();

    const lote = await (await fetch(`${API}/batches/${descarte.batch_id}`)).json();

    const produto = await (await fetch(`${API}/products/${lote.product_id}`)).json();

    const usuario = await (await fetch(`${API}/usuarios/${descarte.user_id}`)).json();

    document.getElementById("produto").value = produto.name;

    document.getElementById("motivo").value = descarte.reason;

    document.getElementById("lote").value = lote.batch_identifier;

    document.getElementById("quantidade").value = descarte.quantity;

    document.getElementById("responsavel").value = usuario.nome;

    if (descarte.manufacturer_id) {

        const fabricante = await (await fetch(`${API}/manufacturers/${descarte.manufacturer_id}`)).json();

        document.getElementById("destino").value = fabricante.name;

    }

    await carregarLotes();

    descarteEditando = descarte;

}
