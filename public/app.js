function escapeHTML(value){
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[ch]);
}

function safeImageUrl(value){
  const url = String(value || '').trim();
  if(/^\/assets\/[a-z0-9._/-]+$/i.test(url)) return url;
  if(/^\/api\/image\/[a-z0-9-]+$/i.test(url)) return url;
  return '';
}

async function revealAdminShortcutIfAuthenticated(){
  const shortcut = document.getElementById('adminShortcut');
  if(!shortcut) return;
  try{
    const res = await fetch('/admin/api/session',{cache:'no-store',credentials:'same-origin'});
    if(!res.ok) return;
    const data = await res.json();
    shortcut.hidden = !data.authenticated;
  }catch{
    shortcut.hidden = true;
  }
}

const WHATSAPP = "5531987555415";
const PIX = "fb154152-891c-4bee-96bf-9cce909bc1ac";
const DIAMOND_BRL = 0.40;
let catalog = {};
let cart = JSON.parse(localStorage.getItem('pp_cart_v3') || '[]');
let cartPayments = JSON.parse(localStorage.getItem('pp_cart_payments_v45') || '{}');
let checkoutPayments = {};
let checkoutItems = [];

const $ = id => document.getElementById(id);
const moneyBR = v => `R$ ${Number(v || 0).toFixed(2).replace('.',',')}`;
const diamondsForPrice = v => Math.max(0, Math.round(Number(v || 0) / DIAMOND_BRL));
const diamondsForItems = items => items.reduce((sum,item)=>sum + diamondsForPrice(item.price),0);
const diamondsLabel = v => `💎 ${Number(v || 0)} ${Number(v || 0) === 1 ? 'diamante' : 'diamantes'}`;
const normalizeText = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

function saveCart(){
  localStorage.setItem('pp_cart_v3', JSON.stringify(cart));
  localStorage.setItem('pp_cart_payments_v45', JSON.stringify(cartPayments));
  renderCart();
  renderCards();
}

function cleanCartAgainstCatalog(){
  cart = cart.filter(id => catalog[id] && !catalog[id].sold);
  const keep = new Set(cart);
  for(const id of Object.keys(cartPayments)){
    if(!keep.has(id)) delete cartPayments[id];
  }
  saveCart();
}

function openViewer(item){
  $('viewerName').textContent = item.name;
  $('viewerImg').src = safeImageUrl(item.imageUrl);
  $('viewerImg').alt = item.name;
  $('viewer').classList.add('on');
}

function closeModal(id){
  const targetId = id === 'buy' ? 'buyModal' : id;
  $(targetId)?.classList.remove('on');
}

function toggleCart(id){
  const item = catalog[id];
  if(!item || item.sold) return;

  if(cart.includes(id)){
    cart = cart.filter(x => x !== id);
    delete cartPayments[id];
  }else{
    cart.push(id);
    if(!cartPayments[id]) cartPayments[id] = null;
  }
  saveCart();
}

function setCartPayment(id, method){
  if(!cart.includes(id)) return;
  cartPayments[id] = method === 'diamonds' ? 'diamonds' : 'pix';
  saveCart();
}

function renderCards(){
  const container = $('cards');
  if(!container) return;

  const query = normalizeText($('pokemonSearch')?.value);
  const rarity = $('rarityFilter')?.value || 'all';
  const minIv = Number($('ivFilter')?.value || 0);
  const minQuality = Number($('qualityFilter')?.value || 0);
  const status = $('statusFilter')?.value || 'available';
  const sort = $('sortFilter')?.value || 'recent';

  let items = Object.values(catalog).filter(item => {
    const tech = item.technical || {};
    const q = !query || normalizeText(item.name).includes(query) || normalizeText(item.species).includes(query);
    const r = rarity === 'all' || String(item.rarity).toUpperCase() === rarity.toUpperCase();
    const ivOk = !minIv || Number(tech.ivTotal || 0) >= minIv;
    const qualityOk = !minQuality || Number(tech.quality || 0) >= minQuality;
    const s = status === 'all' || (status === 'available' && !item.sold) || (status === 'sold' && item.sold);
    return q && r && ivOk && qualityOk && s;
  });

  const recencyValue = item => item.createdAt
    ? 1000000000000000 + (Date.parse(item.createdAt) || 0)
    : Number(item.addedOrder || 0);

  if(sort === 'recent') items.sort((a,b)=>recencyValue(b)-recencyValue(a));
  if(sort === 'iv-desc') items.sort((a,b)=>Number(b.technical?.ivTotal||0)-Number(a.technical?.ivTotal||0));
  if(sort === 'quality-desc') items.sort((a,b)=>Number(b.technical?.quality||0)-Number(a.technical?.quality||0));
  if(sort === 'name-asc') items.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR',{sensitivity:'base'}));
  if(sort === 'price-asc') items.sort((a,b)=>Number(a.price)-Number(b.price) || a.name.localeCompare(b.name,'pt-BR'));
  if(sort === 'price-desc') items.sort((a,b)=>Number(b.price)-Number(a.price) || a.name.localeCompare(b.name,'pt-BR'));

  container.innerHTML = '';
  for(const item of items){
    const inCart = cart.includes(item.id);
    const tech = item.technical || {};
    const card = document.createElement('article');
    const rarityKey = normalizeText(item.rarity).replace(/[^a-z]/g,'');
    card.className = 'poke-card rarity-' + rarityKey + (item.sold ? ' is-sold' : '') + (inCart ? ' in-cart' : '');

    card.innerHTML = `
      <div class="card-head">
        <div>
          <strong class="pokemon-card-name"></strong>
          <span class="rarity-badge"></span>
        </div>
        <div class="quick-stats">
          <span>IV <b>${tech.ivTotal ?? '--'}/186</b></span>
          <span>Q <b>${tech.quality ? 'x'+Number(tech.quality).toFixed(2).replace('.',',') : '--'}</b></span>
        </div>
      </div>

      <button class="screen-btn" type="button">
        <img loading="lazy" alt="">
        <span>🔍 AMPLIAR PRINT</span>
      </button>

      <div class="card-bottom">
        <div class="card-payment-options" aria-label="Formas de pagamento">
          <div class="card-pay-option pix-option">
            <span>PIX</span>
            <strong>${moneyBR(item.price)}</strong>
          </div>
          <div class="card-pay-or">OU</div>
          <div class="card-pay-option diamond-option">
            <span>DIAMANTES</span>
            <strong>💎 ${diamondsForPrice(item.price)}</strong>
          </div>
        </div>

        <div class="card-status ${item.sold ? 'sold' : 'available'}">
          ${item.sold ? '● VENDIDO' : '● DISPONÍVEL'}
        </div>

        <div class="card-actions">
          <button class="buy-now" type="button" ${item.sold ? 'disabled' : ''}>
            ${item.sold ? 'VENDIDO' : 'COMPRAR AGORA'}
          </button>
          <button class="cart-add" type="button" ${item.sold ? 'disabled' : ''}>
            ${item.sold ? 'VENDIDO' : (inCart ? '✓ NO CARRINHO' : '+ CARRINHO')}
          </button>
        </div>

        <small class="card-payment-note">Escolha PIX ou Diamantes no checkout</small>
      </div>
    `;

    card.querySelector('.card-head strong').textContent = item.name.toUpperCase();
    const rarityBadge = card.querySelector('.rarity-badge');
    rarityBadge.textContent = item.rarity || 'ÉPICO';
    rarityBadge.classList.add('rarity-' + normalizeText(item.rarity || 'ÉPICO').replace(/[^a-z]/g,''));
    const img = card.querySelector('img');
    img.src = safeImageUrl(item.imageUrl);
    img.alt = `Print de ${item.name}`;
    card.querySelector('.screen-btn').onclick = () => openViewer(item);
    card.querySelector('.buy-now').onclick = () => buyNow(item.id);
    card.querySelector('.cart-add').onclick = () => toggleCart(item.id);
    container.appendChild(card);
  }

  $('visibleCount').textContent = `${items.length} ${items.length === 1 ? 'Pokémon exibido' : 'Pokémon exibidos'}`;
}

function renderCart(){
  const box = $('cartItems');
  const valid = cart.map(id=>catalog[id]).filter(Boolean);
  $('cartCount').textContent = valid.length;

  const mobileFloat = $('mobileCheckoutFloat');
  const mobileFloatCount = $('mobileCheckoutCount');
  if(mobileFloat){
    mobileFloat.hidden = valid.length === 0;
    mobileFloat.classList.toggle('has-items', valid.length > 0);
  }
  if(mobileFloatCount) mobileFloatCount.textContent = valid.length;

  if(!valid.length){
    box.innerHTML = '<div class="cart-empty">Seu carrinho está vazio.</div>';
  }else{
    box.innerHTML = '';

    valid.forEach(item => {
      const method = cartPayments[item.id] || null;
      const row = document.createElement('div');
      row.className = 'cart-item cart-item-v45';
      row.innerHTML = `
        <img alt="">
        <div class="cart-item-info">
          <strong></strong>
          <span>${escapeHTML(item.rarity)}</span>
          <div class="cart-item-values">
            <b>${moneyBR(item.price)}</b>
            <em>💎 ${diamondsForPrice(item.price)}</em>
          </div>
        </div>
        <button class="cart-remove" title="Remover">×</button>

        <div class="cart-payment-block">
          <div class="cart-item-payment-title">COMO PAGAR ESTE POKÉMON?</div>
          <div class="cart-item-payment-buttons">
            <button type="button" class="cart-pay-pix ${method === 'pix' ? 'active' : ''}">⚡ PIX</button>
            <button type="button" class="cart-pay-diamond ${method === 'diamonds' ? 'active' : ''}">💎 DIAMANTES</button>
          </div>
        </div>
      `;

      row.querySelector('img').src = safeImageUrl(item.imageUrl);
      row.querySelector('img').alt = item.name;
      row.querySelector('.cart-item-info > strong').textContent = item.name;
      row.querySelector('.cart-pay-pix').onclick = () => setCartPayment(item.id,'pix');
      row.querySelector('.cart-pay-diamond').onclick = () => setCartPayment(item.id,'diamonds');
      row.querySelector('.cart-remove').onclick = () => toggleCart(item.id);
      box.appendChild(row);
    });
  }

  const pixItems = valid.filter(item => cartPayments[item.id] === 'pix');
  const diamondItems = valid.filter(item => cartPayments[item.id] === 'diamonds');
  const unassigned = valid.filter(item => !cartPayments[item.id]);

  const pixTotal = pixItems.reduce((s,item)=>s+Number(item.price||0),0);
  const diamondTotal = diamondsForItems(diamondItems);

  $('cartTotal').textContent = `PIX ${moneyBR(pixTotal)}`;
  $('cartDiamondTotal').textContent = `💎 ${diamondTotal}`;

  if(!valid.length){
    $('cartPaymentStatus').textContent = 'Escolha PIX ou 💎 em cada Pokémon.';
  }else if(unassigned.length){
    $('cartPaymentStatus').innerHTML = `⚠ Escolha a forma de pagamento de <b>${unassigned.length}</b> ${unassigned.length === 1 ? 'Pokémon' : 'Pokémon'}.`;
  }else if(pixItems.length && diamondItems.length){
    $('cartPaymentStatus').textContent = `✓ Pagamento misto: ${pixItems.length} via PIX + ${diamondItems.length} via Diamantes.`;
  }else if(pixItems.length){
    $('cartPaymentStatus').textContent = `✓ Todos os ${pixItems.length} Pokémon serão pagos via PIX.`;
  }else{
    $('cartPaymentStatus').textContent = `✓ Todos os ${diamondItems.length} Pokémon serão pagos via Diamantes.`;
  }

  $('checkoutBtn').disabled = !valid.length || unassigned.length > 0;
  $('checkoutBtn').textContent = unassigned.length
    ? 'ESCOLHA O PAGAMENTO DOS ITENS'
    : 'FINALIZAR COMPRA';
  $('clearCartBtn').disabled = !valid.length;
}

function checkoutStats(){
  const pixItems = checkoutItems.filter(item => checkoutPayments[item.id] === 'pix');
  const diamondItems = checkoutItems.filter(item => checkoutPayments[item.id] === 'diamonds');
  const unassigned = checkoutItems.filter(item => !checkoutPayments[item.id]);

  return {
    pixItems,
    diamondItems,
    unassigned,
    pixTotal: pixItems.reduce((s,item)=>s+Number(item.price||0),0),
    diamondTotal: diamondsForItems(diamondItems)
  };
}

function setCheckoutPayment(id, method){
  checkoutPayments[id] = method === 'diamonds' ? 'diamonds' : 'pix';

  // Se veio do carrinho, salva também a escolha nele.
  if(cart.includes(id)){
    cartPayments[id] = checkoutPayments[id];
    localStorage.setItem('pp_cart_payments_v45', JSON.stringify(cartPayments));
  }

  renderCheckout();
  renderCart();
}

function renderCheckout(){
  const {pixItems,diamondItems,unassigned,pixTotal,diamondTotal} = checkoutStats();

  $('buyName').textContent = checkoutItems.length === 1
    ? checkoutItems[0].name
    : `${checkoutItems.length} Pokémon no pedido`;

  $('buyPrice').textContent = moneyBR(pixTotal);
  $('buyDiamondPrice').textContent = `💎 ${diamondTotal}`;
  $('pixPanelTotal').textContent = moneyBR(pixTotal);
  $('diamondPanelTotal').textContent = `💎 ${diamondTotal}`;

  $('checkoutList').innerHTML = checkoutItems.map(item => {
    const method = checkoutPayments[item.id] || null;
    const d = diamondsForPrice(item.price);

    return `
      <div class="checkout-product-mixed">
        <div class="checkout-product-main">
          <span>${escapeHTML(item.name)}</span>
          <div class="checkout-product-prices">
            <b>${moneyBR(item.price)}</b>
            <em>💎 ${d}</em>
          </div>
        </div>
        <div class="checkout-item-payment-buttons">
          <button type="button" data-pay-id="${escapeHTML(item.id)}" data-pay-method="pix" class="${method === 'pix' ? 'active pix' : ''}">⚡ PIX</button>
          <button type="button" data-pay-id="${escapeHTML(item.id)}" data-pay-method="diamonds" class="${method === 'diamonds' ? 'active diamonds' : ''}">💎 DIAMANTES</button>
        </div>
      </div>
    `;
  }).join('');

  $('checkoutList').querySelectorAll('[data-pay-id]').forEach(btn => {
    btn.onclick = () => setCheckoutPayment(btn.dataset.payId, btn.dataset.payMethod);
  });

  // Mostra os painéis somente quando aquela forma é usada.
  $('pixPaymentPanel').classList.toggle('active', pixItems.length > 0);
  $('diamondPaymentPanel').classList.toggle('active', diamondItems.length > 0);

  const confirmBtn = $('buyWhatsapp');

  if(unassigned.length){
    $('checkoutPaymentStatus').innerHTML = `⚠ Falta escolher o pagamento de <b>${unassigned.length}</b> ${unassigned.length === 1 ? 'Pokémon' : 'Pokémon'}.`;
    $('paymentHelpText').textContent = 'Escolha PIX ou Diamantes em cada Pokémon acima.';
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'ESCOLHA O PAGAMENTO DOS ITENS';
    confirmBtn.onclick = null;
    return;
  }

  confirmBtn.disabled = false;

  if(pixItems.length && diamondItems.length){
    $('checkoutPaymentStatus').textContent = `✓ PEDIDO MISTO • PIX ${moneyBR(pixTotal)} + 💎 ${diamondTotal}`;
    $('paymentHelpText').textContent = 'Envie o comprovante da parte em PIX. A parte em Diamantes será combinada dentro do jogo.';
    confirmBtn.textContent = 'CONFIRMAR PEDIDO MISTO PELO WHATSAPP';
  }else if(pixItems.length){
    $('checkoutPaymentStatus').textContent = `✓ PAGAMENTO VIA PIX • ${moneyBR(pixTotal)}`;
    $('paymentHelpText').textContent = 'Depois do Pix, envie o comprovante pelo WhatsApp.';
    confirmBtn.textContent = 'JÁ PAGUEI VIA PIX • ENVIAR COMPROVANTE';
  }else{
    $('checkoutPaymentStatus').textContent = `✓ PAGAMENTO VIA DIAMANTES • 💎 ${diamondTotal}`;
    $('paymentHelpText').textContent = 'Confirme pelo WhatsApp para combinar a transferência dos Diamantes dentro do jogo.';
    confirmBtn.textContent = '💎 COMPREI VIA DIAMANTES • CONFIRMAR';
  }

  confirmBtn.onclick = () => {
    const pixLines = pixItems.map(item =>
      `• ${item.name} — ${moneyBR(item.price)}`
    ).join('\n');

    const diamondLines = diamondItems.map(item =>
      `• ${item.name} — 💎 ${diamondsForPrice(item.price)} diamantes`
    ).join('\n');

    let msg = '';

    if(pixItems.length && diamondItems.length){
      msg =
`🔀 COMPRA MISTA — POKEPIXEL MARKET

⚡ VIA PIX:
${pixLines}
SUBTOTAL PIX: ${moneyBR(pixTotal)}

💎 VIA DIAMANTES:
${diamondLines}
SUBTOTAL DIAMANTES: 💎 ${diamondTotal} diamantes


Estou enviando o comprovante da parte em PIX.
A parte em Diamantes combinamos para transferência dentro do jogo.`;
    }else if(pixItems.length){
      msg =
`⚡ COMPRA VIA PIX — POKEPIXEL MARKET

Pokémon:
${pixLines}

TOTAL VIA PIX: ${moneyBR(pixTotal)}

Já realizei o pagamento via Pix e estou enviando o comprovante.`;
    }else{
      msg =
`💎 COMPRA VIA DIAMANTES — POKEPIXEL MARKET

Pokémon:
${diamondLines}

TOTAL VIA DIAMANTES: 💎 ${diamondTotal} diamantes

Comprei via Diamantes. Quero concluir a troca dentro do jogo.`;
    }

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  };
}

function openCheckoutWithItems(items, initialPayments={}){
  checkoutItems = (items || []).filter(item=>item && !item.sold);
  if(!checkoutItems.length) return;

  checkoutPayments = {};
  for(const item of checkoutItems){
    checkoutPayments[item.id] = initialPayments[item.id] || null;
  }

  renderCheckout();
  $('buyModal').classList.add('on');
}

function openCheckout(){
  const items = cart.map(id=>catalog[id]).filter(item=>item && !item.sold);
  if(!items.length) return;

  const unassigned = items.filter(item => !cartPayments[item.id]);
  if(unassigned.length){
    document.body.classList.add('cart-mobile-open');
    $('cartPaymentStatus').scrollIntoView({behavior:'smooth',block:'nearest'});
    return;
  }

  openCheckoutWithItems(items, cartPayments);
}

function buyNow(id){
  const item = catalog[id];
  if(!item || item.sold) return;
  // Comprar Agora abre apenas o Pokémon escolhido e pede a forma de pagamento.
  openCheckoutWithItems([item], {});
}

async function copyPix(){
  try{
    await navigator.clipboard.writeText(PIX);
    $('toast').classList.add('show');
    setTimeout(()=>$('toast').classList.remove('show'),1500);
  }catch{
    window.prompt('Copie sua chave PIX:',PIX);
  }
}


function publicIdentityKeys(item){
  const identity = item?.identity || {};
  const keys = [];
  if(identity.signature || item?.signature) keys.push(`sig:${String(identity.signature || item.signature).toLowerCase()}`);
  if(identity.legacyKey) keys.push(`cap:${String(identity.legacyKey).toLowerCase()}`);
  if(identity.statsKey) keys.push(`stats:${String(identity.statsKey).toLowerCase()}`);
  if(item?.name) keys.push(`name:${normalizeText(item.name)}`);
  return keys;
}

function publicIntegrityScore(item){
  let score = item?.builtin === true ? 100 : 0;
  const identity = item?.identity || {};
  const t = item?.technical || {};
  if(identity.signature || item?.signature) score += 40;
  if(identity.legacyKey) score += 25;
  if(identity.statsKey) score += 30;
  if(Number.isFinite(Number(t.quality))) score += 8;
  if(Number.isFinite(Number(t.ivTotal))) score += 8;
  return score;
}

function sanitizePublicCatalog(raw){
  const source = Object.values(raw || {});
  const kept = [];
  const keyToIndex = new Map();

  for(const item of source){
    if(!item || !item.id) continue;

    const keys = publicIdentityKeys(item);
    let duplicateIndex = -1;

    for(const key of keys){
      if(keyToIndex.has(key)){
        duplicateIndex = keyToIndex.get(key);
        break;
      }
    }

    if(duplicateIndex === -1){
      const idx = kept.length;
      kept.push(item);
      for(const key of keys) keyToIndex.set(key,idx);
      continue;
    }

    const current = kept[duplicateIndex];
    if(publicIntegrityScore(item) > publicIntegrityScore(current)){
      kept[duplicateIndex] = item;
      for(const [key,idx] of keyToIndex.entries()){
        if(idx === duplicateIndex) keyToIndex.delete(key);
      }
      for(const key of keys) keyToIndex.set(key,duplicateIndex);
    }
  }

  return Object.fromEntries(kept.map(item=>[item.id,item]));
}

async function loadCatalog(){
  const res = await fetch('/api/catalog',{cache:'no-store'});
  if(!res.ok) throw new Error('Catálogo indisponível');
  catalog = sanitizePublicCatalog(await res.json());
  cleanCartAgainstCatalog();
  renderCards();
  renderCart();
  $('catalogCount').textContent = `${Object.keys(catalog).length} Pokémon no catálogo`;
}

$('pokemonSearch').addEventListener('input',renderCards);
$('rarityFilter').addEventListener('change',renderCards);
$('ivFilter').addEventListener('change',renderCards);
$('qualityFilter').addEventListener('change',renderCards);
$('statusFilter').addEventListener('change',renderCards);
$('sortFilter').addEventListener('change',renderCards);
$('clearFilters').addEventListener('click',()=>{
  $('pokemonSearch').value='';
  $('rarityFilter').value='all';
  $('ivFilter').value='0';
  $('qualityFilter').value='0';
  $('statusFilter').value='available';
  $('sortFilter').value='recent';
  renderCards();
});
$('checkoutBtn').addEventListener('click',openCheckout);
$('clearCartBtn').addEventListener('click',()=>{
  cart=[];
  cartPayments={};
  saveCart();
});
$('copyPixBtn').addEventListener('click',copyPix);
$('cartTop').addEventListener('click',()=>document.body.classList.add('cart-mobile-open'));
$('mobileCheckoutFloat')?.addEventListener('click',()=>{
  document.body.classList.add('cart-mobile-open');
  setTimeout(()=>{
    $('cartPanel')?.scrollIntoView({behavior:'smooth',block:'start'});
  },50);
});
$('closeCartMobile').addEventListener('click',()=>document.body.classList.remove('cart-mobile-open'));

document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>closeModal(el.dataset.close)));
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    closeModal('viewer'); closeModal('buyModal');
    document.body.classList.remove('cart-mobile-open');
  }
});

revealAdminShortcutIfAuthenticated();

loadCatalog().catch(err=>{
  console.error(err);
  $('catalogCount').textContent='Não foi possível carregar o catálogo.';
});
