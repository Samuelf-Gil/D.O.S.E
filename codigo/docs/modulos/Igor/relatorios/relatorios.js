import { toast } from "../utils/index.js";

const dateStartInput = document.getElementById("date_start");
const dateEndInput = document.getElementById("date_end");

function toInputDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function setDefaultDates() {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    dateStartInput.value = toInputDate(oneYearAgo);
    dateEndInput.value = toInputDate(today);
}

const formatadorBRL = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

let salesTotals = "0";
    
const mostSelledProductsCanvas = document.getElementById("mostSelledProductsChart");
const mostSelledProductsChartData = {
    type: "pie",
    data: {
        labels: [],
        datasets: [{
            label: "Quantidade comprada",
            data: [],
            backgroundColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 205, 86)',
            'rgb(107, 85, 34)',
            'rgb(182, 6, 0)'
            ],
            hoverOffset: 4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: () => window.innerWidth > 600 ? "left" : "top"
            },
            title: {
                display: true,
                text: "Maiores giro de estoque"
            }
        }
    }
}

const mostSelledProductsChart = new Chart(mostSelledProductsCanvas, mostSelledProductsChartData)

const mostSelledBrandsCanvas = document.getElementById("mostSelledBrandsChart");
const mostSelledBrandsChartData = {
    type: "pie",
    data: {
        labels: [],
        datasets: [{
            label: "Quantidade comprada",
            data: [],
            backgroundColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 205, 86)',
            ],
            hoverOffset: 4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "left"
            },
            title: {
                display: true,
                text: "Marcas mais vendidas"
            }
        }
    }
}

const mostSelledBrandsChart = new Chart(mostSelledBrandsCanvas, mostSelledBrandsChartData)

const lessSelledBrandsCanvas = document.getElementById("lessSelledBrandsChart");
const lessSelledBrandsChartData = {
    type: "pie",
    data: {
        labels: [],
        datasets: [{
            label: "Quantidade comprada",
            data: [],
            backgroundColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 205, 86)',
            ],
            hoverOffset: 4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "right"
            },
            title: {
                display: true,
                text: "Marcas menos vendidas"
            }
        }
    }
}

const lessSelledBrandsChart = new Chart(lessSelledBrandsCanvas, lessSelledBrandsChartData)

function buildDateRangeUrl({ startDate, endDate, route, query = "created_at" }) {
    const startISO = `${startDate}T00:00:00Z`;
    const endISO = `${endDate}T23:59:59Z`;

    return `/${route}?${query}_gte=${encodeURIComponent(startISO)}&${query}_lte=${encodeURIComponent(endISO)}`;
} 

async function fetchSalesByDateRange(startDate, endDate) {
    const route = "sales"
    const url = buildDateRangeUrl({ startDate, endDate, route })

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Falha ao buscar vendas (${response.status})`);
    }

    return await response.json();
}

async function fetchDiscartsByDateRange(startDate, endDate) {
    const route = "discarts"
    const query = "completed_at"
    const url = buildDateRangeUrl({ startDate, endDate, route, query })

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Falha ao buscar vendas (${response.status})`);
    }

    return await response.json();
}

function calculateDiscartsTotals(discarts) {
    const total = discarts.reduce((sum, discart) => sum + discart.quantity, 0);
    document.getElementById("discarts_total").innerHTML = total
}

function calculateSalesTotals(sales) {
    const total = sales.reduce((soma, venda) => soma + venda.total, 0);
    salesTotals = formatadorBRL.format(total);
    document.getElementById("sales_total").innerHTML = salesTotals
}

async function fetchAnalyticsData() {
    const [batches, products, brands] = await Promise.all([
        fetch(`/batches`).then((r) => r.json()),
        fetch(`/products`).then((r) => r.json()),
        fetch(`/brands`).then((r) => r.json()),
    ]);
    return { batches, products, brands };
}

function calculateSalesAnalytics(saleItems, batches, products) {
    const quantityByProduct = saleItems.reduce((acc, saleItem) => {
        const batch = batches.find((b) => b.id === saleItem.batch_id);
        const productId = batch.product_id;
        acc[productId] = (acc[productId] || 0) + saleItem.quantity;
        return acc;
    }, {});

    return Object.entries(quantityByProduct)
        .map(([productId, quantity]) => {
            const product = products.find((p) => p.id === Number(productId));
            return { name: product.name, quantity };
        })
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
}

function calculateBrandsAnalytics(saleItems, batches, products, brands) {
    const quantityByBrand = saleItems.reduce((acc, saleItem) => {
        const batch = batches.find((b) => b.id === saleItem.batch_id);
        const product = products.find((p) => p.id === batch.product_id);
        const brandId = product.brand_id;
        acc[brandId] = (acc[brandId] || 0) + saleItem.quantity;
        return acc;
    }, {});

    const sorted = Object.entries(quantityByBrand)
        .map(([brandId, quantity]) => {
            const brand = brands.find((b) => b.id === Number(brandId));
            return { name: brand.name, quantity };
        })
        .sort((a, b) => b.quantity - a.quantity);

    return {
        topSelled: sorted.slice(0, 3),
        lessSelled: sorted.slice(-3).reverse(),
    };
}

async function handleDateRangeChange() {
    const startDate = dateStartInput.value;
    const endDate = dateEndInput.value;

    if (!startDate || !endDate) return;

    if (startDate > endDate) {
        toast({ title: "Erro", description: "A data inicial não pode ser maior que a data final.", category: "error" })
        return;
    }

    try {
        const [sales, discarts, allSaleItems] = await Promise.all([
            fetchSalesByDateRange(startDate, endDate),
            fetchDiscartsByDateRange(startDate, endDate),
            fetch(`/saleItems`).then(r => r.json())
        ]);

        const salesIds = sales.map((sale) => sale.id);
        const filteredSalesItems = allSaleItems.filter((saleItem) => salesIds.includes(saleItem.sale_id))

        const { batches, products, brands } = await fetchAnalyticsData();
        const topSelledProducts = calculateSalesAnalytics(filteredSalesItems, batches, products);
        const { topSelled: topSelledBrands, lessSelled: lessSelledBrands } = calculateBrandsAnalytics(filteredSalesItems, batches, products, brands);

        mostSelledProductsChart.data.labels = topSelledProducts.map((p) => p.name);
        mostSelledProductsChart.data.datasets[0].data = topSelledProducts.map((p) => p.quantity);
        mostSelledProductsChart.update();

        mostSelledBrandsChart.data.labels = topSelledBrands.map((b) => b.name);
        mostSelledBrandsChart.data.datasets[0].data = topSelledBrands.map((b) => b.quantity);
        mostSelledBrandsChart.update();

        lessSelledBrandsChart.data.labels = lessSelledBrands.map((b) => b.name);
        lessSelledBrandsChart.data.datasets[0].data = lessSelledBrands.map((b) => b.quantity);
        lessSelledBrandsChart.update();

        calculateDiscartsTotals(discarts)
        calculateSalesTotals(sales)
    } catch (error) {
        console.error(error);
    }
}

function exportCSV(filename, rows) {
    const csv = rows
        .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(";"))
        .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function chartToRows(chart) {
    const labels = chart.data.labels;
    const values = chart.data.datasets[0].data;
    return labels.map((label, i) => [label, values[i]]);
}

function handleExportExcel() {
    const startDate = dateStartInput.value;
    const endDate = dateEndInput.value;

    if (!startDate || !endDate) {
        toast({ title: "Erro", description: "Selecione um intervalo de datas antes de exportar.", category: "error" });
        return;
    }

    const periodDays = Math.round((new Date(endDate) - new Date(startDate)) / 86400000);
    const discartsTotal = document.getElementById("discarts_total").innerHTML;

    const rows = [
        ["Data inicial", startDate],
        ["Data final", endDate],
        ["Período (dias)", periodDays],
        ["Valor total vendido no período", salesTotals],
        ["Total de produtos descartados", discartsTotal],
        [],
        ["Maiores giro de estoque"],
        ["Produto", "Quantidade"],
        ...chartToRows(mostSelledProductsChart),
        [],
        ["Marcas mais vendidas"],
        ["Marca", "Quantidade"],
        ...chartToRows(mostSelledBrandsChart),
        [],
        ["Marcas menos vendidas"],
        ["Marca", "Quantidade"],
        ...chartToRows(lessSelledBrandsChart),
    ];

    exportCSV(`relatorio_${startDate}_a_${endDate}.csv`, rows);
}

dateStartInput.addEventListener("change", handleDateRangeChange);
dateEndInput.addEventListener("change", handleDateRangeChange);
document.getElementById("excelButton").addEventListener("click", handleExportExcel);

setDefaultDates()
handleDateRangeChange()