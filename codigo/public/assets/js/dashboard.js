/**
 * Dashboard inicial (funcionário) da D.O.S.E.
 * Monta os gráficos "Mais Vendidos" (produtos por quantidade) e
 * "Valor Total por Categoria" (receita por categoria) a partir do db.json.
 */

const PALETTE = ["#364E72", "#74C2C9", "#7AB1C9", "#5aaeb5", "#A7C957", "#E76F51", "#F4A261", "#9B5DE5"];

const formatadorBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function preencherData() {
    const el = document.getElementById("rodapeData");
    if (el) el.textContent = new Date().toLocaleDateString("pt-BR");
}

async function fetchJSON(route) {
    const response = await fetch(route);
    if (!response.ok && response.status !== 304) {
        throw new Error(`Falha ao buscar ${route} (${response.status})`);
    }
    return response.json();
}

function topProdutosPorQuantidade(saleItems, batches, products, limite = 5) {
    const qtdPorProduto = saleItems.reduce((acc, item) => {
        const batch = batches.find((b) => b.id === item.batch_id);
        if (!batch) return acc;
        acc[batch.product_id] = (acc[batch.product_id] || 0) + item.quantity;
        return acc;
    }, {});

    return Object.entries(qtdPorProduto)
        .map(([productId, quantidade]) => {
            const product = products.find((p) => p.id === Number(productId));
            return { nome: product ? product.name : `#${productId}`, quantidade };
        })
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, limite);
}

function valorPorCategoria(saleItems, batches, products, categories) {
    const nomeCategoria = categories.reduce((acc, c) => {
        acc[c.id] = c.name || c.nome || `Categoria ${c.id}`;
        return acc;
    }, {});

    const valorPorCat = saleItems.reduce((acc, item) => {
        const batch = batches.find((b) => b.id === item.batch_id);
        if (!batch) return acc;
        const product = products.find((p) => p.id === batch.product_id);
        if (!product) return acc;
        const valor = typeof item.total === "number" ? item.total : item.unit_price * item.quantity;
        acc[product.category_id] = (acc[product.category_id] || 0) + valor;
        return acc;
    }, {});

    return Object.entries(valorPorCat)
        .map(([catId, valor]) => ({ nome: nomeCategoria[catId] || `Categoria ${catId}`, valor }))
        .sort((a, b) => b.valor - a.valor);
}

function renderDoughnut(canvasId, labels, data, labelDataset) {
    return new Chart(document.getElementById(canvasId), {
        type: "doughnut",
        data: {
            labels,
            datasets: [{ label: labelDataset, data, backgroundColor: PALETTE, borderWidth: 0, hoverOffset: 6 }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "55%",
            plugins: { legend: { position: "bottom", labels: { color: "#364E72", boxWidth: 12, font: { size: 11 } } } },
        },
    });
}

function renderPie(canvasId, labels, data, labelDataset) {
    return new Chart(document.getElementById(canvasId), {
        type: "pie",
        data: {
            labels,
            datasets: [{ label: labelDataset, data, backgroundColor: PALETTE, borderWidth: 0, hoverOffset: 6 }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom", labels: { color: "#364E72", boxWidth: 12, font: { size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${formatadorBRL.format(ctx.parsed)}`,
                    },
                },
            },
        },
    });
}

async function initDashboard() {
    preencherData();

    try {
        const [saleItems, batches, products, categories] = await Promise.all([
            fetchJSON("/saleItems"),
            fetchJSON("/batches"),
            fetchJSON("/products"),
            fetchJSON("/categories"),
        ]);

        const topProdutos = topProdutosPorQuantidade(saleItems, batches, products);
        renderDoughnut("topProductsChart", topProdutos.map((p) => p.nome), topProdutos.map((p) => p.quantidade), "Quantidade vendida");

        const valores = valorPorCategoria(saleItems, batches, products, categories);
        renderPie("valueByCategoryChart", valores.map((v) => v.nome), valores.map((v) => v.valor), "Valor vendido");
    } catch (error) {
        console.error("Erro ao montar o dashboard:", error);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
} else {
    initDashboard();
}
