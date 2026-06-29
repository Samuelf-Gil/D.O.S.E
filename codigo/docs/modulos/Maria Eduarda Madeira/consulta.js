// ======================== CONFIGURAÇÃO ========================
const API_URL = 'http://localhost:3000';
const PRODUCTS_URL = `${API_URL}/products`;
const BATCHES_URL = `${API_URL}/batches`;
const BRANDS_URL = `${API_URL}/brands`;
const CATEGORIES_URL = `${API_URL}/categories`;

let produtoEditandoId = null; // será um número (ou null)
let todosProdutos = [];
let todosLotes = [];
let todasMarcas = [];
let todasCategorias = [];

// ======================== INICIALIZAÇÃO ========================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sistema de consulta (produtos) iniciado');
    carregarDadosAuxiliares();
    carregarProdutos();
    configurarEventos();
});

// ======================== CARREGAR DADOS AUXILIARES ========================
async function carregarDadosAuxiliares() {
    try {
        const [marcasRes, categoriasRes, lotesRes] = await Promise.all([
            fetch(BRANDS_URL),
            fetch(CATEGORIES_URL),
            fetch(BATCHES_URL)
        ]);

        if (!marcasRes.ok || !categoriasRes.ok || !lotesRes.ok) {
            throw new Error('Falha ao carregar dados auxiliares');
        }

        todasMarcas = await marcasRes.json();
        todasCategorias = await categoriasRes.json();
        todosLotes = await lotesRes.json();

        console.log('Dados auxiliares carregados:', {
            marcas: todasMarcas.length,
            categorias: todasCategorias.length,
            lotes: todosLotes.length
        });
    } catch (error) {
        console.error('Erro ao carregar dados auxiliares:', error);
        mostrarMensagem('mensagemLista', 'Erro ao carregar dados auxiliares!', 'error');
    }
}

// ======================== EVENTOS ========================
function configurarEventos() {
    const campoBusca = document.getElementById('campoBuscaLista');
    if (campoBusca) campoBusca.addEventListener('input', filtrarProdutos);

    const btnLimpar = document.getElementById('btnLimparLista');
    if (btnLimpar) btnLimpar.addEventListener('click', limparBusca);

    const form = document.getElementById('formProduto');
    if (form) form.addEventListener('submit', salvarProduto);
}

// ======================== NAVEGAÇÃO ========================
function mostrarTela(telaId) {
    document.querySelectorAll('.tela').forEach(t => t.classList.add('hidden'));
    const alvo = document.getElementById(telaId);
    if (alvo) alvo.classList.remove('hidden');

    if (telaId === 'telaLista') {
        carregarProdutos();
        limparBusca();
    }
}

function mostrarMensagem(elementId, msg, tipo) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = msg;
    el.className = `alert-message alert-${tipo} mb-3`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

// ======================== BUSCA E FILTRO ========================
function filtrarProdutos() {
    const termo = document.getElementById('campoBuscaLista').value.toLowerCase().trim();
    if (!termo) {
        renderizarTabela(todosProdutos);
        ocultarContador();
        return;
    }
    const filtrados = todosProdutos.filter(p => {
        const nome = (p.name || '').toLowerCase();
        const sku = (p.sku || '').toLowerCase();
        const upc = (p.upc || '').toLowerCase();
        const id = String(p.id); // converte para string para busca parcial
        return nome.includes(termo) || sku.includes(termo) || upc.includes(termo) || id.includes(termo);
    });
    renderizarTabela(filtrados);
    mostrarContador(filtrados.length, todosProdutos.length, termo);
}

function limparBusca() {
    const campo = document.getElementById('campoBuscaLista');
    if (campo) campo.value = '';
    renderizarTabela(todosProdutos);
    ocultarContador();
}

function mostrarContador(encontrados, total, termo) {
    const cont = document.getElementById('contadorResultados');
    const texto = document.getElementById('textoContador');
    if (!cont || !texto) return;
    if (encontrados === 0) {
        texto.innerHTML = `Nenhum resultado para "<strong>${termo}</strong>"`;
        cont.classList.remove('hidden');
    } else if (encontrados === total) {
        cont.classList.add('hidden');
    } else {
        texto.innerHTML = `Mostrando <strong>${encontrados}</strong> de <strong>${total}</strong>`;
        cont.classList.remove('hidden');
    }
}

function ocultarContador() {
    const cont = document.getElementById('contadorResultados');
    if (cont) cont.classList.add('hidden');
}

// ======================== CARREGAR PRODUTOS ========================
async function carregarProdutos() {
    const tabela = document.getElementById('tabelaProdutos');
    if (!tabela) return;
    tabela.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-gray-500"><i class="bi bi-arrow-clockwise"></i> Carregando...</td></tr>`;

    try {
        const res = await fetch(PRODUCTS_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        todosProdutos = await res.json();
        renderizarTabela(todosProdutos);
    } catch (error) {
        console.error('Erro ao carregar:', error);
        tabela.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-red-500"><i class="bi bi-exclamation-triangle-fill"></i> Erro ao conectar!<br><small>Verifique o JSON Server na porta 3000</small></td></tr>`;
        mostrarMensagem('mensagemLista', 'Erro ao conectar com servidor!', 'error');
    }
}

// ======================== FUNÇÕES AUXILIARES (IDs como números) ========================
function obterQuantidadeTotal(productId) {
    if (!todosLotes || !todosLotes.length) return 0;
    // productId é número, product_id no lote também é número
    return todosLotes
        .filter(b => b.product_id === productId)
        .reduce((sum, b) => sum + (b.quantity || 0), 0);
}

function obterNomeMarca(id) {
    if (!id) return 'N/A';
    const marca = todasMarcas.find(m => m.id === id);
    return marca ? marca.name : 'N/A';
}

function obterNomeCategoria(id) {
    if (!id) return 'N/A';
    const cat = todasCategorias.find(c => c.id === id);
    return cat ? cat.name : 'N/A';
}

// ======================== RENDERIZAR TABELA ========================
function renderizarTabela(produtos) {
    const tabela = document.getElementById('tabelaProdutos');
    if (!tabela) return;
    if (!produtos || produtos.length === 0) {
        tabela.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-gray-500"><i class="bi bi-inbox"></i> Nenhum produto encontrado</td></tr>`;
        return;
    }

    tabela.innerHTML = produtos.map(p => {
        const id = p.id; // número
        const nome = p.name || 'Sem nome';
        const qtd = obterQuantidadeTotal(id);
        const preco = p.price !== undefined ? `R$ ${p.price.toFixed(2)}` : 'R$ 0,00';
        const local = p.location || 'Não informado';
        const nomeSeguro = String(nome).replace(/'/g, "\\'");

        let qtdBadge = '';
        if (qtd === 0) {
            qtdBadge = `<span class="badge-estoque badge-esgotado">${qtd} - ESGOTADO</span>`;
        } else if (qtd <= 10) {
            qtdBadge = `<span class="badge-estoque badge-baixo">${qtd} - BAIXO</span>`;
        } else if (qtd <= 50) {
            qtdBadge = `<span class="badge-estoque badge-medio">${qtd}</span>`;
        } else {
            qtdBadge = `<span class="badge-estoque badge-alto">${qtd}</span>`;
        }

        return `
            <tr class="hover:bg-gray-50">
                <td class="p-2 border border-gray-300">${id}</td>
                <td class="p-2 border border-gray-300 font-medium">${nome}</td>
                <td class="p-2 border border-gray-300">${qtdBadge}</td>
                <td class="p-2 border border-gray-300 font-semibold text-green-700">${preco}</td>
                <td class="p-2 border border-gray-300">${local}</td>
                <td class="p-2 border border-gray-300 text-center">
                    <button class="btn-view" onclick="visualizarProduto(${id})">
                        <i class="bi bi-eye"></i> Visualizar
                    </button>
                    <button class="btn-edit" onclick="editarProduto(${id})">
                        <i class="bi bi-pencil-square"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="confirmarExclusao(${id}, '${nomeSeguro}')">
                        <i class="bi bi-trash"></i> Excluir
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ======================== VISUALIZAR PRODUTO ========================
async function visualizarProduto(id) {
    try {
        const res = await fetch(`${PRODUCTS_URL}/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const prod = await res.json();

        document.getElementById('outProduto').textContent = prod.name || '-';
        document.getElementById('outDescricao').textContent = prod.description || '-';
        const qtdTotal = obterQuantidadeTotal(id);
        document.getElementById('outQtd').textContent = `${qtdTotal} UNIDADES`;
        document.getElementById('outPreco').textContent = prod.price !== undefined ? `R$ ${prod.price.toFixed(2)}` : '-';
        document.getElementById('outCusto').textContent = prod.cost !== undefined ? `R$ ${prod.cost.toFixed(2)}` : '-';
        document.getElementById('outLocal').textContent = prod.location || '-';
        document.getElementById('outSku').textContent = prod.sku || '-';
        document.getElementById('outUpc').textContent = prod.upc || '-';
        document.getElementById('outMarca').textContent = prod.brand_id ? obterNomeMarca(prod.brand_id) : '-';
        document.getElementById('outCategoria').textContent = prod.category_id ? obterNomeCategoria(prod.category_id) : '-';

        const img = document.getElementById('outImagem');
        const semImg = document.getElementById('semImagem');
        if (prod.image_url && prod.image_url.trim() !== '') {
            img.src = prod.image_url;
            img.classList.remove('hidden');
            semImg.classList.add('hidden');
        } else {
            img.classList.add('hidden');
            semImg.classList.remove('hidden');
        }

        mostrarTela('telaConsulta');
    } catch (error) {
        console.error('Erro ao visualizar:', error);
        alert('Não foi possível carregar os detalhes do produto.');
    }
}

// ======================== FORMULÁRIO ========================
function mostrarFormulario(id = null) {
    produtoEditandoId = id; // número ou null
    const titulo = document.getElementById('tituloForm');
    const form = document.getElementById('formProduto');
    const msg = document.getElementById('mensagemForm');
    if (msg) msg.classList.add('hidden');

    if (id) {
        titulo.textContent = 'EDITAR PRODUTO';
        carregarDadosFormulario(id);
    } else {
        titulo.textContent = 'NOVO PRODUTO';
        form.reset();
        produtoEditandoId = null;
    }
    mostrarTela('telaFormulario');
}

function editarProduto(id) {
    mostrarFormulario(id);
}

async function carregarDadosFormulario(id) {
    try {
        const res = await fetch(`${PRODUCTS_URL}/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const prod = await res.json();

        document.getElementById('inputNome').value = prod.name || '';
        document.getElementById('inputDescricao').value = prod.description || '';
        document.getElementById('inputCusto').value = prod.cost || '';
        document.getElementById('inputPreco').value = prod.price || '';
        document.getElementById('inputSku').value = prod.sku || '';
        document.getElementById('inputUpc').value = prod.upc || '';
        document.getElementById('inputLocal').value = prod.location || '';
        document.getElementById('inputImagem').value = prod.image_url || '';
        document.getElementById('inputCategoriaId').value = prod.category_id || '';
        document.getElementById('inputMarcaId').value = prod.brand_id || '';
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarMensagem('mensagemForm', 'Erro ao carregar dados do produto!', 'error');
    }
}

// ======================== SALVAR (CRIAR/ATUALIZAR) – IDs como NÚMEROS ========================
async function salvarProduto(e) {
    e.preventDefault();

    // Converter IDs para números (ou null se vazio)
    const categoriaId = document.getElementById('inputCategoriaId').value.trim();
    const marcaId = document.getElementById('inputMarcaId').value.trim();

    const produto = {
        name: document.getElementById('inputNome').value.trim(),
        description: document.getElementById('inputDescricao').value.trim(),
        cost: parseFloat(document.getElementById('inputCusto').value) || 0,
        price: parseFloat(document.getElementById('inputPreco').value) || 0,
        sku: document.getElementById('inputSku').value.trim(),
        upc: document.getElementById('inputUpc').value.trim(),
        location: document.getElementById('inputLocal').value.trim(),
        image_url: document.getElementById('inputImagem').value.trim(),
        category_id: categoriaId ? parseInt(categoriaId) : null,
        brand_id: marcaId ? parseInt(marcaId) : null,
        company_id: 1, // número fixo
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
    };

    if (!produto.name) {
        mostrarMensagem('mensagemForm', 'O campo NOME é obrigatório!', 'error');
        return;
    }

    try {
        if (produtoEditandoId) {
            await atualizarProduto(produtoEditandoId, produto);
        } else {
            await criarProduto(produto);
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
        mostrarMensagem('mensagemForm', 'Erro ao salvar produto!', 'error');
    }
}

async function criarProduto(produto) {
    const res = await fetch(PRODUCTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(produto)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    mostrarMensagem('mensagemForm', 'Produto criado com sucesso!', 'success');
    setTimeout(() => mostrarTela('telaLista'), 1500);
}

async function atualizarProduto(id, produto) {
    const res = await fetch(`${PRODUCTS_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(produto)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    mostrarMensagem('mensagemForm', 'Produto atualizado com sucesso!', 'success');
    setTimeout(() => mostrarTela('telaLista'), 1500);
}

// ======================== EXCLUIR ========================
function confirmarExclusao(id, nome) {
    if (confirm(`Tem certeza que deseja excluir o produto "${nome}"?`)) {
        excluirProduto(id);
    }
}

async function excluirProduto(id) {
    try {
        const res = await fetch(`${PRODUCTS_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        mostrarMensagem('mensagemLista', 'Produto excluído com sucesso!', 'success');
        carregarProdutos();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        mostrarMensagem('mensagemLista', 'Erro ao excluir produto!', 'error');
    }
}
