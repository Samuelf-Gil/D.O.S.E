const URL_BASE = "http://localhost:3000";

const catalogContainer = document.getElementById('catalog-container');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');

let allProducts = [];
let stockByProduct = {};

// Quando vindo da tela de farmácias, mostra só os produtos daquela farmácia
const COMPANY_ID = new URLSearchParams(location.search).get("company_id");

const categoriesMap = {
    1: "Medicamentos e Antialérgicos",
    2: "Higiene Pessoal",
    3: "Cosméticos",
    4: "Vitaminas e Suplementos",
    5: "Cuidados e Primeiros Socorros"
};

const IMAGEM_PADRAO = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f3f4f6' stroke='%23cbd5e1' stroke-width='2'/><line x1='0' y1='0' x2='100' y2='100' stroke='%2394a3b8' stroke-width='1.5'/><line x1='100' y1='0' x2='0' y2='100' stroke='%2394a3b8' stroke-width='1.5'/></svg>";

async function fetchProducts() {
    try {
        const [response, batchesResponse] = await Promise.all([
            fetch(`${URL_BASE}/products`),
            fetch(`${URL_BASE}/batches`)
        ]);

        if (!response.ok && response.status !== 304) {
            throw new Error(`Erro: Status ${response.status}`);
        }
        if (!batchesResponse.ok && batchesResponse.status !== 304) {
            throw new Error(`Erro: Status ${batchesResponse.status}`);
        }

        allProducts = await response.json();
        if (COMPANY_ID) {
            allProducts = allProducts.filter((p) => String(p.company_id) === String(COMPANY_ID));
        }

        const batches = await batchesResponse.json();
        stockByProduct = batches.reduce((acc, batch) => {
            acc[batch.product_id] = (acc[batch.product_id] || 0) + (batch.quantity || 0);
            return acc;
        }, {});

        renderCatalog(allProducts);
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        catalogContainer.innerHTML = `
            <div class="text-center py-12 text-red-500">
                <i class="fa-solid fa-triangle-exclamation text-2xl mb-2"></i>
                <p class="text-sm font-semibold">Não foi possível processar os dados do banco.</p>
            </div>
        `;
    }
}

function renderCatalog(products) {
    catalogContainer.innerHTML = '';

    if (!products || products.length === 0) {
        catalogContainer.innerHTML = `
            <div class="text-center py-12 text-[#7AB1C9]">
                <i class="fa-regular fa-face-frown text-2xl mb-2"></i>
                <p class="text-sm italic">Nenhum produto encontrado para a sua busca.</p>
            </div>
        `;
        return;
    }

    const grouped = {};
    products.forEach(product => {
        const catId = product.category_id || 1;
        if (!grouped[catId]) {
            grouped[catId] = [];
        }
        grouped[catId].push(product);
    });

    Object.keys(grouped).forEach(categoryId => {
        const categoryName = categoriesMap[categoryId] || "Outros";
        const categoryProducts = grouped[categoryId];

        const section = document.createElement('section');
        section.className = 'mb-6';

        section.innerHTML = `
            <div class="bg-white border border-[#7AB1C9]/30 px-4 py-2 mb-4 rounded-xl shadow-sm">
                <h3 class="text-xs font-bold tracking-wider text-[#364E72] uppercase">${categoryName}</h3>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                ${categoryProducts.map(prod => {
                    const estoque = stockByProduct[prod.id] || 0;

                    const precoDefinido = (typeof prod.price === 'number') ? prod.price : parseFloat(prod.price) || 0;
                        
                    return `
                    <div class="bg-white border border-[#7AB1C9]/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div class="relative pt-[100%] bg-[#F0FFFD]">
                            <img
                                src="${prod.image_url || IMAGEM_PADRAO}"
                                alt="${prod.name || 'Produto'}"
                                class="absolute inset-0 w-full h-full object-cover"
                                onerror="this.onerror=null; this.src='${IMAGEM_PADRAO}';"
                            >
                        </div>
                        <div class="p-3 flex-grow flex flex-col justify-between">
                            <div>
                                <h4 class="text-xs font-bold text-[#364E72] uppercase line-clamp-2 min-h-[2rem]">${prod.name || 'Sem nome'}</h4>
                                <p class="text-[10px] text-[#364E72]/60 mt-1 line-clamp-1">${prod.description || 'Sem descrição disponível'}</p>
                            </div>
                            <div class="mt-2 pt-2 border-t border-[#7AB1C9]/20 flex items-center justify-between">
                                <span class="text-[#364E72] text-[9px] bg-[#7AB1C9]/15 px-1.5 py-0.5 rounded uppercase">
                                    Estoque: ${estoque}
                                </span>
                                <span class="text-sm font-bold text-[#5aaeb5]">
                                    R$ ${precoDefinido.toFixed(2).replace('.', ',')}
                                </span>
                            </div>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
        catalogContainer.appendChild(section);
    });
}

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (searchTerm !== '') {
        clearSearchBtn.classList.remove('hidden');
    } else {
        clearSearchBtn.classList.add('hidden');
    }

    const filtered = allProducts.filter(product => {
        const nome = product.name ? product.name.toLowerCase() : '';
        const descricao = product.description ? product.description.toLowerCase() : '';
        return nome.includes(searchTerm) || descricao.includes(searchTerm);
    });

    renderCatalog(filtered);
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    renderCatalog(allProducts);
    searchInput.focus();
});

async function init() {
    await fetchProducts();
}

init();