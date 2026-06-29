const URL_BASE = "http://localhost:3000";

const pedProdutoSelect = document.getElementById("pedProduto");
const pedMarcaSelect = document.getElementById("pedMarca");
const pedQtdInput = document.getElementById("pedQtd");
const pedFornecedorSelect = document.getElementById("pedFornecedor");

const recTituloInput = document.getElementById("recTitulo");
const recLoteSelect = document.getElementById("recLote");
const recFornecedorSelect = document.getElementById("recFornecedor");
const recMotivoSelect = document.getElementById("recMotivo");
const recQtdInput = document.getElementById("recQtd");
const recTextoTextarea = document.getElementById("recTexto");

const selectPedidosAtivos = document.getElementById("selectPedidosAtivos");
const timelineStatusContainer = document.getElementById("timelineStatus");

const formatadorBRL = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

async function fetchInitialData() {
    const [resProd, resMarcas, resFab] = await Promise.all([
        fetch(`${URL_BASE}/products`),
        fetch(`${URL_BASE}/brands`),
        fetch(`${URL_BASE}/manufacturers`)
    ]);

    if (!resProd.ok || !resMarcas.ok || !resFab.ok) {
        throw new Error("Falha ao carregar listas iniciais do banco.");
    }

    return {
        products: await resProd.json(),
        brands: await resMarcas.json(),
        manufacturers: await resFab.json()
    };
}

async function fetchActiveOrders() {
    const response = await fetch(`${URL_BASE}/manufacturerOrders?status_ne=COMPLETED`);
    if (!response.ok) throw new Error("Falha ao buscar pedidos ativos.");
    return await response.json();
}

async function fetchBatches() {
    const response = await fetch(`${URL_BASE}/batches`);
    if (!response.ok) throw new Error("Falha ao buscar lotes.");
    return await response.json();
}

async function populateDropdowns() {
    try {
        const { products, brands, manufacturers } = await fetchInitialData();

        pedProdutoSelect.innerHTML = products.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
        pedMarcaSelect.innerHTML = brands.map(b => `<option value="${b.id}">${b.name}</option>`).join("");

        const optionsFab = manufacturers.map(m => `<option value="${m.id}">${m.name}</option>`).join("");
        pedFornecedorSelect.innerHTML = optionsFab;
        recFornecedorSelect.innerHTML = optionsFab;

    } catch (error) {
        console.error("Erro na inicialização dos dropdowns:", error);
    }
}

async function loadActiveOrders() {
    try {
        const pedidos = await fetchActiveOrders();
        
        selectPedidosAtivos.innerHTML = '<option value="">Selecione um pedido para rastrear...</option>' + 
            pedidos.map(p => `<option value="${p.id}">PEDIDO #${p.id} - ${formatadorBRL.format(p.total)}</option>`).join("");
            
    } catch (error) {
        console.error("Erro ao carregar pedidos ativos:", error);
    }
}

async function loadBatches() {
    try {
        const lotes = await fetchBatches();
        
        recLoteSelect.innerHTML = '<option value="">Escolha o lote com avaria...</option>' +
            lotes.map(l => `<option value="${l.id}">Lote: ${l.batch_identifier} (${l.quantity} un)</option>`).join("");
            
    } catch (error) {
        console.error("Erro ao carregar lotes:", error);
    }
}

function criarEtapaTimeline(numero, titulo, descricao, statusBadge = null, pulse = false, opaco = false) {
    const stepDiv = document.createElement("div");
    stepDiv.className = `relative pl-10 ${opaco ? "opacity-40" : ""}`;

    const indicador = document.createElement("span");
    indicador.className = `absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-4 ring-white ${pulse ? "bg-[#364E72] animate-pulse" : (opaco ? "bg-[#7AB1C9]/40" : "bg-[#74C2C9]")}`;
    indicador.textContent = numero;

    const conteudoDiv = document.createElement("div");
    
    const h4 = document.createElement("h4");
    h4.className = "text-sm font-bold text-[#364E72]";
    h4.textContent = titulo;

    const p = document.createElement("p");
    p.className = "text-xs text-[#364E72]/60";
    p.textContent = descricao;

    conteudoDiv.appendChild(h4);
    conteudoDiv.appendChild(p);

    if (statusBadge) {
        const badge = document.createElement("span");
        badge.className = `text-[10px] px-2 py-0.5 rounded mt-2 inline-block font-bold ${statusBadge === "CONCLUÍDO" ? "bg-[#74C2C9]/15 text-[#5aaeb5]" : "bg-[#364E72]/10 text-[#364E72]"}`;
        badge.textContent = statusBadge;
        conteudoDiv.appendChild(badge);
    }

    stepDiv.appendChild(indicador);
    stepDiv.appendChild(conteudoDiv);

    return stepDiv;
}

function handleOrderTrackingChange() {
    const idPedido = selectPedidosAtivos.value;

    timelineStatusContainer.innerHTML = "";

    if (!idPedido) {
        const aviso = document.createElement("p");
        aviso.className = "text-center text-[#7AB1C9] text-xs italic py-10";
        aviso.textContent = "Aguardando seleção de pedido...";
        timelineStatusContainer.appendChild(aviso);
        return;
    }

    const etapa1 = criarEtapaTimeline("1", "Pedido Recebido", `O fabricante confirmou o recebimento da ordem #${idPedido}.`, "CONCLUÍDO");
    const etapa2 = criarEtapaTimeline("2", "Em Transporte Logístico", "Carga despachada com a transportadora vinculada.", "EM ANDAMENTO", true);
    const etapa3 = criarEtapaTimeline("3", "Entregue e Conferido", "Aguardando descarregamento e checagem de integridade física.", null, false, true);

    timelineStatusContainer.appendChild(etapa1);
    timelineStatusContainer.appendChild(etapa2);
    timelineStatusContainer.appendChild(etapa3);
}

async function fazerPedido() {
    const qtd = parseInt(pedQtdInput.value);

    if (!qtd || qtd <= 0) {
        alert("Por favor, insira uma quantidade válida.");
        return;
    }

    const novoPedido = {
        company_id: 1,
        manufacturer_id: parseInt(pedFornecedorSelect.value),
        user_id: 4, 
        status: "AWAITING",
        total: qtd * 12.50, 
        created_at: new Date().toISOString()
    };

    try {
        const response = await fetch(`${URL_BASE}/manufacturerOrders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoPedido)
        });

        if (!response.ok) throw new Error("Erro ao salvar a ordem de compra.");

        alert("Pedido enviado com sucesso!");
        pedQtdInput.value = "";
        await loadActiveOrders();

    } catch (error) {
        console.error(error);
        alert("Não foi possível enviar o pedido.");
    }
}

async function fazerReclamacao() {
    const titulo = recTituloInput.value.trim();
    const loteId = recLoteSelect.value;
    const descricao = recTextoTextarea.value.trim();
    const quantidade = parseInt(recQtdInput.value);

    if (!titulo || !loteId || !descricao || !Number.isInteger(quantidade) || quantidade <= 0) {
        alert("Preencha todos os campos da reclamação (Título, Lote, Quantidade afetada e Descrição).");
        return;
    }

    const novaReclamacao = {
        company_id: 1,
        user_id: 4,
        batch_id: parseInt(loteId),
        title: titulo,
        description: descricao,
        key_reason: recMotivoSelect.value,
        affected_quantity: quantidade,
        status: "PENDING",
        created_at: new Date().toISOString(),
        updated_at: null,
        resolved_at: null
    };

    try {
        const response = await fetch(`${URL_BASE}/complaints`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaReclamacao)
        });

        if (!response.ok) throw new Error("Erro ao salvar a reclamação.");

        alert("Reclamação registrada no sistema com sucesso!");
        recTituloInput.value = "";
        recTextoTextarea.value = "";
        recQtdInput.value = "";
        recLoteSelect.value = "";

    } catch (error) {
        console.error(error);
        alert("Não foi possível registrar a reclamação.");
    }
}

selectPedidosAtivos.addEventListener("change", handleOrderTrackingChange);

async function init() {
    await populateDropdowns();
    await loadActiveOrders();
    await loadBatches();
}

init();