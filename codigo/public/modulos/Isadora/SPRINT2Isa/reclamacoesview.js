const API_URL = 'http://localhost:3000';

let localComplaints = [];
let localProducts = [];

let selectedStatuses = [];
let selectedReasons = [];

const complaintsList = document.getElementById('complaintsList');
const totalComplaints = document.getElementById('totalComplaints');
const searchBar = document.getElementById('searchBar');
const sortField = document.getElementById('sortField');
const sortOrder = document.getElementById('sortOrder');

const detailsCard = document.getElementById('detailsCard');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');
const detailTitle = document.getElementById('detailTitle');
const detailDescription = document.getElementById('detailDescription');
const detailProductName = document.getElementById('detailProductName');
const detailBatch = document.getElementById('detailBatch');
const detailQuantity = document.getElementById('detailQuantity');
const detailUser = document.getElementById('detailUser');
const detailDate = document.getElementById('detailDate');
const detailStatus = document.getElementById('detailStatus');
const detailKeyReason = document.getElementById('detailKeyReason');
const detailProductImage = document.getElementById('detailProductImage');
const imgPlaceholder = document.getElementById('imgPlaceholder');

async function carregarDadosDoBanco() {
    try {
        const respostaComplaints = await fetch(`${API_URL}/complaints`);
        const respostaProducts = await fetch(`${API_URL}/products`);
        
        localComplaints = await respostaComplaints.json();
        localProducts = await respostaProducts.json();

        desenharListaNaTela(localComplaints);
        inicializarEventosDosBotoes();

    } catch (erro) {
        console.error("Erro ao conectar:", erro);
        complaintsList.innerHTML = `<p class="text-red-500 text-xs">Erro ao conectar ao JSONServer.</p>`;
    }
}

function desenharListaNaTela(listaDeReclamacoes) {
    complaintsList.innerHTML = '';
    totalComplaints.textContent = listaDeReclamacoes.length;

    if (listaDeReclamacoes.length === 0) {
        complaintsList.innerHTML = `<p class="text-gray-500 text-xs text-center font-medium py-6 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">Nenhuma reclamação corresponde a essa filtragem</p>`;
        return;
    }

    listaDeReclamacoes.forEach(reclamacao => {
        const card = document.createElement('div');
        card.className = "border border-gray-200 bg-gray-50 rounded p-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition shadow-sm";

        const dataFormatada = new Date(reclamacao.created_at).toLocaleDateString('pt-BR');

        card.innerHTML = `
            <div>
                <span class="text-[10px] text-gray-400 block">${dataFormatada}</span>
                <p class="font-bold text-sm text-gray-800">${reclamacao.id} - ${reclamacao.title}</p>
            </div>
            <span class="text-xs text-gray-400">➔</span>
        `;

        card.addEventListener('click', () => {
            mostrarDetalhesNoPopup(reclamacao);
        });

        complaintsList.appendChild(card);
    });
}

function mostrarDetalhesNoPopup(reclamacao) {
    const produtoCorrespondente = localProducts.find(p => p.id === reclamacao.batch_id);
    const dataFormatada = new Date(reclamacao.created_at).toLocaleDateString('pt-BR');

    detailTitle.textContent = `${reclamacao.id} - ${reclamacao.title}`;
    detailDescription.textContent = reclamacao.description;
    detailBatch.textContent = `L_00${reclamacao.batch_id}`;
    detailQuantity.textContent = `${reclamacao.affected_quantity} unidades`;
    detailUser.textContent = `ID #${reclamacao.user_id}`;
    detailDate.textContent = dataFormatada;
    detailKeyReason.textContent = reclamacao.key_reason;
    
    if (reclamacao.status === 'PENDING') {
        detailStatus.textContent = 'Pendente';
        detailStatus.className = "font-bold px-1.5 py-0.5 rounded text-[10px] bg-yellow-100 text-yellow-800";
    } else if (reclamacao.status === 'RESOLVED') {
        detailStatus.textContent = 'Resolvido';
        detailStatus.className = "font-bold px-1.5 py-0.5 rounded text-[10px] bg-green-100 text-green-800";
    } else {
        detailStatus.textContent = 'Rejeitado';
        detailStatus.className = "font-bold px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-800";
    }

    if (produtoCorrespondente) {
        detailProductName.textContent = produtoCorrespondente.name;
        
        if (produtoCorrespondente.image_url) {
            detailProductImage.src = produtoCorrespondente.image_url;
            detailProductImage.classList.remove('hidden'); 
            imgPlaceholder.classList.add('hidden');       
        } else {
            resetarImagemDoPopup();
        }
    } else {
        detailProductName.textContent = `Produto do lote ${reclamacao.batch_id}`;
        resetarImagemDoPopup();
    }

    detailsCard.classList.remove('hidden');
}

function resetarImagemDoPopup() {
    detailProductImage.classList.add('hidden');
    imgPlaceholder.classList.remove('hidden');
}

function executarFiltroEPesquisa() {
    const textoBuscado = searchBar.value.toLowerCase().trim(); 

    let listaFiltrada = localComplaints.filter(reclamacao => {
        const bateComPesquisa = reclamacao.title.toLowerCase().includes(textoBuscado) || 
                               reclamacao.description.toLowerCase().includes(textoBuscado);
                               
        const bateComStatus = selectedStatuses.length === 0 || selectedStatuses.includes(reclamacao.status);

        const bateComReason = selectedReasons.length === 0 || selectedReasons.includes(reclamacao.key_reason.toLowerCase());

        return bateComPesquisa && bateComStatus && bateComReason;
    });

    const campoOrdenacao = sortField.value;
    const ordemDirecao = sortOrder.value;

    listaFiltrada.sort((a, b) => {
        let valorA, valorB;

        if (campoOrdenacao === 'id') {
            valorA = parseInt(a.id);
            valorB = parseInt(b.id);
        } else if (campoOrdenacao === 'date') {
            valorA = new Date(a.created_at).getTime();
            valorB = new Date(b.created_at).getTime();
        }

        if (ordemDirecao === 'asc') {
            return valorA - valorB;
        } else {
            return valorB - valorA;
        }
    });

    desenharListaNaTela(listaFiltrada);
}

function inicializarEventosDosBotoes() {
    const botoes = document.querySelectorAll('#statusFilterContainer button, #reasonFilterContainer button');
    
    botoes.forEach(botao => {
        botao.addEventListener('click', () => {
            const tipo = botao.getAttribute('data-type');
            const valor = botao.getAttribute('data-value');

            if (tipo === 'status') {
                if (selectedStatuses.includes(valor)) {
                    selectedStatuses = selectedStatuses.filter(v => v !== valor);
                    alternarEstiloBotao(botao, false);
                } else {
                    selectedStatuses.push(valor);
                    alternarEstiloBotao(botao, true);
                }
            } else if (tipo === 'reason') {
                if (selectedReasons.includes(valor)) {
                    selectedReasons = selectedReasons.filter(v => v !== valor);
                    alternarEstiloBotao(botao, false);
                } else {
                    selectedReasons.push(valor);
                    alternarEstiloBotao(botao, true);
                }
            }

            executarFiltroEPesquisa();
        });
    });
}

function alternarEstiloBotao(botao, ativo) {
    if (ativo) {
        botao.className = "border border-green-500 bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-lg transition-all font-bold shadow-sm";
    } else {
        botao.className = "border border-gray-200 bg-gray-50 text-gray-700 text-xs px-2.5 py-1 rounded-lg transition-all font-medium";
    }
}

searchBar.addEventListener('input', executarFiltroEPesquisa);
sortField.addEventListener('change', executarFiltroEPesquisa);
sortOrder.addEventListener('change', executarFiltroEPesquisa);

closeDetailsBtn.addEventListener('click', () => {
    detailsCard.classList.add('hidden');
});

document.addEventListener('DOMContentLoaded', carregarDadosDoBanco);