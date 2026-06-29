const API = 'http://localhost:3000';
const FARMACIA = { company_id: 1, nome: 'Farmácia Saúde Total', lat: -19.9227, lng: -43.9451, endereco: 'Av. Afonso Pena, 1500 - Centro, BH/MG', tel: '(31) 3333-4444' };

// Abre a tela de produtos da farmácia selecionada
function verProdutosFarmacia(companyId = FARMACIA.company_id) {
  window.location.href = `/modulos/Samuel/SPRINT_2/produtos.html?company_id=${companyId}`;
}

let map, farmaciaMarker;
let enderecoMarkers = [];
let products = [], batches = [], categories = [], brands = [], manufacturers = [], enderecos = [];
let ordem = { campo: 'name', asc: true };

window.onload = async function () {
  initMap();
  try { products = await fetch(`${API}/products`).then(r => r.ok ? r.json() : []); } catch(e) { console.error("Erro produtos:", e); }
  try { batches = await fetch(`${API}/batches`).then(r => r.ok ? r.json() : []); } catch(e) { console.error("Erro lotes:", e); }
  try { categories = await fetch(`${API}/categories`).then(r => r.ok ? r.json() : []); } catch(e) { console.error("Erro categorias:", e); }
  try { brands = await fetch(`${API}/brands`).then(r => r.ok ? r.json() : []); } catch(e) { console.error("Erro marcas:", e); }
  try { manufacturers = await fetch(`${API}/manufacturers`).then(r => r.ok ? r.json() : []); } catch(e) { console.error("Erro fabricantes:", e); }
  await carregarEnderecos();
  popularSelects();
  renderEnderecos();
  atualizarMarcadoresEndereco();
};

function initMap() {
  map = L.map('map').setView([FARMACIA.lat, FARMACIA.lng], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
  farmaciaMarker = L.marker([FARMACIA.lat, FARMACIA.lng], {
    icon: L.divIcon({ className: '', html: '<div style="font-size:28px">🏥</div>', iconSize: [32, 32] })
  }).addTo(map).bindPopup(`<b>${FARMACIA.nome}</b><br>${FARMACIA.endereco}<br>${FARMACIA.tel}<br><a href="#" onclick="verProdutosFarmacia();return false;" style="display:inline-block;margin-top:6px;color:#74C2C9;font-weight:600">Ver produtos &rarr;</a>`);
}

function atualizarMarcadoresEndereco() {
  enderecoMarkers.forEach(m => map.removeLayer(m));
  enderecoMarkers = [];
  enderecos.forEach(e => {
    if (!e.lat || !e.lng) return;
    const m = L.marker([e.lat, e.lng], {
      icon: L.divIcon({ className: '', html: '<div style="font-size:24px">📍</div>', iconSize: [28, 28] })
    }).addTo(map).bindPopup(`<b>${e.nome}</b><br>${e.rua}, ${e.numero} - ${e.bairro}<br>${e.cidade}/${e.estado}`);
    enderecoMarkers.push(m);
  });
  if (enderecoMarkers.length > 0) {
    const pontos = [[FARMACIA.lat, FARMACIA.lng], ...enderecos.filter(e => e.lat).map(e => [e.lat, e.lng])];
    map.fitBounds(pontos, { padding: [40, 40] });
  }
  atualizarDistancias();
}

function atualizarDistancias() {
  const div = document.getElementById('info-distancia');
  const comCoords = enderecos.filter(e => e.lat && e.lng);
  if (comCoords.length === 0) { div.innerHTML = ''; return; }
  div.innerHTML = `<strong class="text-sm text-[#364E72] font-semibold block mb-1">Distâncias até a farmácia:</strong><ul class="ml-4 list-none">` +
    comCoords.map(e => {
      const d = calcDist(e.lat, e.lng, FARMACIA.lat, FARMACIA.lng).toFixed(2);
      return `<li class="mb-1 text-sm text-[#364E72]">📍 <b>${e.nome}</b> (${e.rua}, ${e.numero}) — <b class="text-[#0AD196]">${d} km</b></li>`;
    }).join('') + '</ul>';
}

function calcDist(lat1, lng1, lat2, lng2) {
  const R = 6371, dL = (lat2 - lat1) * Math.PI / 180, dG = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dL / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodificar(rua, numero, bairro, cidade, estado) {
  const q = encodeURIComponent(`${rua} ${numero}, ${bairro}, ${cidade}, ${estado}, Brasil`);
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`);
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (e) { console.error("Erro geocodificação:", e); }
  return null;
}

async function carregarEnderecos() {
  enderecos = await fetch(`${API}/enderecos_cliente`).then(r => r.json()).catch(() => []);
}

function renderEnderecos() {
  const div = document.getElementById('lista-enderecos');
  if (enderecos.length === 0) {
    div.innerHTML = '<p class="text-sm text-[#7AB1C9] mt-2">Nenhum endereço cadastrado ainda.</p>';
    return;
  }
  div.innerHTML = enderecos.map(e => `
    <div class="flex justify-between items-center border border-gray-200 rounded p-3">
      <div class="text-sm leading-relaxed">
        <strong>${e.nome}</strong><br>
        ${e.rua}, ${e.numero} — ${e.bairro}, ${e.cidade}/${e.estado}
        ${e.lat ? `<br><span class="text-[#0AD196] font-bold">📏 ${calcDist(e.lat, e.lng, FARMACIA.lat, FARMACIA.lng).toFixed(2)} km da farmácia</span>` : '<br><span class="text-xs text-gray-400">⚠️ Endereço não localizado no mapa</span>'}
      </div>
      <div class="flex gap-1.5 shrink-0 ml-3">
        <button onclick="editarEndereco('${e.id}')" class="px-2.5 py-1 bg-[#74C2C9] text-white text-xs rounded cursor-pointer hover:bg-[#5BADB4]">Editar</button>
        <button onclick="excluirEndereco('${e.id}')" class="px-2.5 py-1 bg-[#FF422D] text-white text-xs rounded cursor-pointer hover:bg-[#cc3424]">Remover</button>
      </div>
    </div>
  `).join('');
}

function abrirModalEndereco(e = null) {
  document.getElementById('modal-end-titulo').textContent = e ? 'Editar Endereço' : 'Novo Endereço';
  document.getElementById('end-id').value = e ? e.id : '';
  document.getElementById('end-nome').value = e ? e.nome : '';
  document.getElementById('end-rua').value = e ? e.rua : '';
  document.getElementById('end-numero').value = e ? e.numero : '';
  document.getElementById('end-bairro').value = e ? e.bairro : '';
  document.getElementById('end-cidade').value = e ? e.cidade : 'Belo Horizonte';
  document.getElementById('end-estado').value = e ? e.estado : 'MG';
  document.getElementById('modal-endereco').style.display = 'flex';
}
function fecharModalEndereco() { document.getElementById('modal-endereco').style.display = 'none'; }

async function salvarEndereco(ev) {
  ev.preventDefault();
  const id = document.getElementById('end-id').value;
  const rua = document.getElementById('end-rua').value;
  const numero = document.getElementById('end-numero').value;
  const bairro = document.getElementById('end-bairro').value;
  const cidade = document.getElementById('end-cidade').value;
  const estado = document.getElementById('end-estado').value;
  const coords = await geocodificar(rua, numero, bairro, cidade, estado);
  const dados = {
    nome: document.getElementById('end-nome').value,
    rua, numero, bairro, cidade, estado,
    lat: coords ? coords.lat : FARMACIA.lat,
    lng: coords ? coords.lng : FARMACIA.lng,
  };
  if (id) {
    await fetch(`${API}/enderecos_cliente/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...dados }) });
  } else {
    await fetch(`${API}/enderecos_cliente`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
  }
  fecharModalEndereco();
  await carregarEnderecos();
  renderEnderecos();
  atualizarMarcadoresEndereco();
}

function editarEndereco(id) { abrirModalEndereco(enderecos.find(e => e.id == id)); }

async function excluirEndereco(id) {
  if (!confirm('Remover este endereço?')) return;
  await fetch(`${API}/enderecos_cliente/${id}`, { method: 'DELETE' });
  await carregarEnderecos();
  renderEnderecos();
  atualizarMarcadoresEndereco();
}

function getNomeCategoria(id) {
  if (!id) return '-';
  return (categories.find(c => c.id.toString() === id.toString()) || {}).name || '-';
}
function estoqueTotal(productId) {
  if (!productId) return 0;
  return batches.filter(b => b.product_id.toString() === productId.toString())
    .reduce((s, b) => s + (parseInt(b.quantity) || 0), 0);
}

function popularSelects() {
  const selCat = document.getElementById('select-categoria');
  if (selCat) {
    while (selCat.options.length > 1) selCat.remove(1);
    categories.forEach(c => selCat.add(new Option(c.name, c.id)));
  }
  const sp = document.getElementById('select-produto');
  if (sp) {
    while (sp.options.length > 1) sp.remove(1);
    products.forEach(p => sp.add(new Option(p.name, p.id)));
  }
}

function aoMudarCategoria() {
  document.getElementById('input-pesquisa').value = '';
  const catId = document.getElementById('select-categoria').value;
  const sp = document.getElementById('select-produto');
  const div = document.getElementById('resultado-busca');
  while (sp.options.length > 1) sp.remove(1);
  div.innerHTML = '';
  let filtrados = catId ? products.filter(p => p.category_id && p.category_id.toString() === catId.toString()) : products;
  filtrados.forEach(p => sp.add(new Option(p.name, p.id)));
  if (filtrados.length > 0) {
    div.innerHTML = '<p class="text-xs text-gray-500 mt-2 mb-1">Produtos desta categoria:</p>' +
      filtrados.map(p => {
        const total = estoqueTotal(p.id);
        return `<div class="flex justify-between items-center py-2 border-b border-[#7AB1C9]/30 text-sm text-[#364E72]">
          <div>
            <strong>${p.name}</strong><br>
            <span class="text-xs font-bold" style="color:${total > 0 ? '#0AD196' : '#FF422D'}">
              ${total > 0 ? `✔ Em estoque (${total} un)` : '✘ Esgotado'}
            </span>
          </div>
          <span class="font-bold text-[#364E72]">R$ ${parseFloat(p.price || 0).toFixed(2)}</span>
        </div>`;
      }).join('');
  } else {
    div.innerHTML = '<p class="text-sm text-[#7AB1C9] mt-2">Nenhum produto nesta categoria.</p>';
  }
}

function filtrarProdutosPorTexto() {
  const catId = document.getElementById('select-categoria').value;
  const termo = document.getElementById('input-pesquisa').value.toLowerCase();
  const sp = document.getElementById('select-produto');
  while (sp.options.length > 1) sp.remove(1);
  let filtrados = products;
  if (catId) filtrados = filtrados.filter(p => p.category_id && p.category_id.toString() === catId.toString());
  if (termo) filtrados = filtrados.filter(p => (p.name || '').toLowerCase().includes(termo));
  filtrados.forEach(p => sp.add(new Option(p.name, p.id)));
  if (filtrados.length > 0) sp.selectedIndex = 1;
}

function buscarProduto() {
  let prodId = document.getElementById('select-produto').value;
  const termo = document.getElementById('input-pesquisa').value.toLowerCase();
  const div = document.getElementById('resultado-busca');
  if (!prodId && !termo) { div.innerHTML = ''; return; }
  if (!prodId && termo) {
    const found = products.find(p => (p.name || '').toLowerCase().includes(termo));
    if (found) prodId = found.id;
  }
  if (!prodId && termo) {
    div.innerHTML = `<div class="mt-3 p-4 rounded text-sm bg-[#F0FFFD]" style="border-left:5px solid #FFDA55">
      <span class="font-bold text-[#364E72]">🔍 Produto não encontrado no catálogo.</span><br>
      <small class="text-[#364E72]/60">Este item não consta em nenhuma listagem.</small>
    </div>`;
    return;
  }
  if (!prodId) { alert('Por favor, selecione ou digite o nome de um produto.'); return; }
  const prod = products.find(p => p.id.toString() === prodId.toString());
  const total = estoqueTotal(prod.id);
  const cor = total > 0 ? '#0AD196' : '#FF422D';
  div.innerHTML = `
    <div class="mt-3 p-4 rounded text-sm bg-[#F0FFFD]" style="border-left: 5px solid ${cor}">
      <h3 class="text-base font-semibold text-[#364E72] mb-1">🏥 ${FARMACIA.nome}</h3>
      <p class="text-[#364E72]/60 text-xs mb-2">📍 ${FARMACIA.endereco}</p>
      <hr class="border-[#7AB1C9]/40 mb-2">
      <div class="text-[#364E72]"><strong>Produto:</strong> ${prod.name} — ${getNomeCategoria(prod.category_id)}</div>
      <div class="text-[#364E72]"><strong>Preço:</strong> R$ ${parseFloat(prod.price || 0).toFixed(2)}</div>
      <div class="mt-2 font-bold" style="color:${cor}">
        ${total > 0 ? `✔ Disponível — ${total} unidades` : '✘ Indisponível nesta unidade'}
      </div>
      ${total > 0 && prod.location ? `<div class="text-xs text-[#364E72]/60 mt-1">📦 ${prod.location}</div>` : ''}
      <button onclick="verProdutosFarmacia()" class="mt-3 w-full px-3.5 py-1.5 bg-[#74C2C9] text-white rounded cursor-pointer text-[13px] font-semibold hover:bg-[#5BADB4]">
        Ver produtos desta farmácia →
      </button>
    </div>`;
  map.setView([FARMACIA.lat, FARMACIA.lng], 16);
}