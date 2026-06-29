let estoque = [];
let imagemBase64 = '';

const URL_API = 'http://localhost:3000';

async function preencherSelect(endpoint, selectId) {
    try {
        const res = await fetch(`${URL_API}/${endpoint}`);
        if (!res.ok) throw new Error(`Falha ao buscar ${endpoint}`);
        const lista = await res.json();
        const select = document.getElementById(selectId);

        lista.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name;
            select.appendChild(option);
        });

        const opcaoNova = document.createElement('option');
        opcaoNova.value = 'nova';
        opcaoNova.textContent = '+ Cadastrar nova';
        select.appendChild(opcaoNova);

    } catch (erro) {
        console.error(`Erro ao carregar ${endpoint}:`, erro);
    }
}

preencherSelect('categories', 'categoria');
preencherSelect('carriers', 'carrier');
preencherSelect('brands', 'marca');
preencherSelect('manufacturers', 'fornecedor');

function configurarToggleNovo(selectId, inputId) {
    document.getElementById(selectId).addEventListener('change', function () {
        document.getElementById(inputId).classList.toggle('hidden', this.value !== 'nova');
    });
}

configurarToggleNovo('marca', 'marcaNova');
configurarToggleNovo('fornecedor', 'fornecedorNovo');
configurarToggleNovo('categoria', 'categoriaNova');
configurarToggleNovo('carrier', 'carrierNovo');

document.getElementById('inputImagem').addEventListener('change', function () {
    const arquivo = this.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function (e) {
        imagemBase64 = e.target.result;
        const preview = document.getElementById('previewImagem');
        preview.src = imagemBase64;
        preview.classList.remove('hidden');
        document.getElementById('textoImagem').classList.add('hidden');
    };
    leitor.readAsDataURL(arquivo);
});

async function criarRegistro(endpoint, nome, extra = {}) {
    const res = await fetch(`${URL_API}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome, status: 'ACTIVE', ...extra })
    });
    if (!res.ok) throw new Error(`Erro ao criar registro em ${endpoint}`);
    const criado = await res.json();
    return criado.id;
}

async function resolverId(selectId, inputNovoId, endpoint, extra = {}) {
    const valor = document.getElementById(selectId).value;
    if (valor === 'nova') {
        const nome = document.getElementById(inputNovoId).value;
        return await criarRegistro(endpoint, nome, extra);
    }
    return parseInt(valor, 10);
}

document.getElementById('finalizar').onclick = async function () {
    const lote = document.getElementById('lote').value;
    const produto = document.getElementById('produto').value;
    const validade = document.getElementById('validade').value;
    const quantidade = document.getElementById('quantidade').value;
    const precoCusto = parseFloat(document.getElementById('precoCusto').value.replace(',', '.'));
    const precoVenda = parseFloat(document.getElementById('precoVenda').value.replace(',', '.'));

    try {
        const brand_id = await resolverId('marca', 'marcaNova', 'brands');
        const manufacturer_id = await resolverId('fornecedor', 'fornecedorNovo', 'manufacturers');
        const category_id = await resolverId('categoria', 'categoriaNova', 'categories', { company_id: 1 });
        const carrier_id = await resolverId('carrier', 'carrierNovo', 'carriers');

        const resProduto = await fetch(`${URL_API}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                company_id: 1,
                category_id,
                brand_id,
                name: produto,
                description: '',
                cost: precoCusto,
                price: precoVenda,
                sku: '',
                upc: '',
                location: '',
                image_url: imagemBase64
            })
        });
        if (!resProduto.ok) throw new Error('Erro ao salvar produto.');
        const produtoSalvo = await resProduto.json();

        const resLote = await fetch(`${URL_API}/batches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                carrier_id,
                product_id: produtoSalvo.id,
                manufacturer_id,
                valid_until: validade,
                quantity: parseInt(quantidade, 10),
                complaint: null,
                batch_identifier: lote
            })
        });
        if (!resLote.ok) throw new Error('Erro ao salvar lote.');

        estoque.push(produtoSalvo);
        alert('Produto adicionado com sucesso!');
        limparFormulario();

    } catch (erro) {
        console.error('Erro na requisição:', erro);
        alert('Não foi possível concluir o cadastro. O JSONServer está rodando?');
    }
};

function limparFormulario() {
    document.getElementById('lote').value = '';
    document.getElementById('marca').value = '';
    document.getElementById('marcaNova').value = '';
    document.getElementById('marcaNova').classList.add('hidden');
    document.getElementById('produto').value = '';
    document.getElementById('validade').value = '';
    document.getElementById('quantidade').value = '';
    document.getElementById('fornecedor').value = '';
    document.getElementById('fornecedorNovo').value = '';
    document.getElementById('fornecedorNovo').classList.add('hidden');
    document.getElementById('categoria').value = '';
    document.getElementById('categoriaNova').value = '';
    document.getElementById('categoriaNova').classList.add('hidden');
    document.getElementById('carrier').value = '';
    document.getElementById('carrierNovo').value = '';
    document.getElementById('carrierNovo').classList.add('hidden');
    document.getElementById('precoCusto').value = '';
    document.getElementById('precoVenda').value = '';
    document.getElementById('previewImagem').classList.add('hidden');
    document.getElementById('textoImagem').classList.remove('hidden');
    imagemBase64 = '';
}