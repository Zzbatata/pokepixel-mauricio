const $ = id => document.getElementById(id);

const addProductForm = $('addProductForm');
const addProductBtn = $('addProductBtn');
const addProductError = $('addProductError');
const newImage = $('newImage');
const uploadPreview = $('uploadPreview');
const uploadPlaceholder = $('uploadPlaceholder');
const analyzeBtn = $('analyzeBtn');
const ocrProgress = $('ocrProgress');
const adminProducts = $('adminProducts');
const toastAdmin = $('toastAdmin');

function flash(msg){
  toastAdmin.textContent = msg;
  toastAdmin.classList.add('show');
  setTimeout(()=>toastAdmin.classList.remove('show'),1800);
}

function guessNameFromFilename(filename){
  const base = String(filename || '')
    .replace(/\.[^.]+$/,'')
    .replace(/[_-]+/g,' ')
    .trim();

  const m = base.match(/^([A-Za-zÀ-ÿ.']+)\s*0*(\d+)$/);
  if(m) return `${m[1]} #${String(Number(m[2])).padStart(2,'0')}`;

  return base.replace(/\b\w/g, c => c.toUpperCase());
}

function normalizeOCR(text){
  return String(text || '')
    .replace(/\r/g,'')
    .replace(/[|]/g,'I')
    .replace(/,/g,'.');
}

function firstNumberNear(text, labels, max=31){
  const lines = normalizeOCR(text).split('\n').map(x=>x.trim()).filter(Boolean);
  for(let i=0;i<lines.length;i++){
    const upper = lines[i].toUpperCase();
    if(labels.some(label=>upper.includes(label))){
      const joined = `${lines[i]} ${lines[i+1] || ''}`;
      const nums = [...joined.matchAll(/\b(\d{1,3})\b/g)]
        .map(m=>Number(m[1]))
        .filter(n=>n>=0 && n<=max);
      if(nums.length) return nums[nums.length-1];
    }
  }
  return null;
}

function parseTechnical(text){
  const t = normalizeOCR(text);

  let quality = null;
  const q = t.match(/[xX]\s*(1(?:\.\d{2}))/);
  if(q) quality = Number(q[1]);

  let ivTotal = null;
  for(const p of [/IV(?:\s*TOTAL)?[^\d]{0,12}(\d{2,3})\s*\/\s*186/i,/(\d{2,3})\s*\/\s*186/i]){
    const m = t.match(p);
    if(m){ ivTotal = Number(m[1]); break; }
  }

  const hpIv = firstNumberNear(t, ['HP'], 31);
  const atkIv = firstNumberNear(t, ['ATK','ATAQUE'], 31);
  const defIv = firstNumberNear(t, ['DEF'], 31);
  const spatkIv = firstNumberNear(t, ['SP.ATK','SP ATK','ATK SP','ATAQUE SP'], 31);
  const spdefIv = firstNumberNear(t, ['SP.DEF','SP DEF','DEF SP'], 31);
  const speedIv = firstNumberNear(t, ['VEL','SPEED','SPE'], 31);

  let nature = '';
  const natureMatch = t.match(/NATURE(?:ZA)?\s*[:\-]?\s*([A-Za-zÀ-ÿ]+)/i);
  if(natureMatch) nature = natureMatch[1];

  let gender = '';
  if(/[♂]/.test(t) || /\bMACHO\b/i.test(t)) gender = 'Macho';
  if(/[♀]/.test(t) || /\bF[EÊ]MEA\b/i.test(t)) gender = 'Fêmea';

  return {quality,ivTotal,hpIv,atkIv,defIv,spatkIv,spdefIv,speedIv,nature,gender};
}

function setIf(id, value){
  if(value === null || value === undefined || value === '') return;
  const el = $(id);
  if(el) el.value = value;
}

function recomputeAutoScore(){
  const ivTotal = Number($('ivTotal').value);
  const quality = Number($('quality').value);

  const ivPct = Number.isFinite(ivTotal) && ivTotal >= 0 ? Math.min(100, ivTotal/186*100) : null;
  const qPct = Number.isFinite(quality) && quality > 0
    ? Math.max(0, Math.min(100, (quality-1.40)/(1.54-1.40)*100))
    : null;

  let score = null;
  if(ivPct !== null && qPct !== null) score = Math.round(ivPct*0.65 + qPct*0.35);
  else if(ivPct !== null) score = Math.round(ivPct);
  else if(qPct !== null) score = Math.round(qPct);

  $('autoScore').value = score ?? '';
  $('autoScoreText').textContent = score === null ? '--' : `${score}/100`;
}

['ivTotal','quality'].forEach(id => $(id).addEventListener('input', recomputeAutoScore));

newImage.addEventListener('change', () => {
  const file = newImage.files?.[0];
  if(!file){
    uploadPreview.hidden = true;
    uploadPlaceholder.hidden = false;
    return;
  }

  addProductError.textContent = '';
  if(file.size > 8*1024*1024){
    addProductError.textContent = 'A imagem deve ter no máximo 8 MB.';
    newImage.value = '';
    return;
  }

  uploadPreview.src = URL.createObjectURL(file);
  uploadPreview.hidden = false;
  uploadPlaceholder.hidden = true;

  if(!$('newName').value.trim()){
    $('newName').value = guessNameFromFilename(file.name);
  }

  ocrProgress.textContent = 'Imagem pronta para análise.';
});

async function preprocessImage(file){
  const bitmap = await createImageBitmap(file);
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;
  const ctx = canvas.getContext('2d', {willReadFrequently:true});
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const image = ctx.getImageData(0,0,canvas.width,canvas.height);
  const d = image.data;
  for(let i=0;i<d.length;i+=4){
    const gray = Math.round(d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114);
    const c = Math.max(0, Math.min(255, (gray - 128)*1.45 + 128));
    d[i]=d[i+1]=d[i+2]=c;
  }
  ctx.putImageData(image,0,0);
  return canvas;
}

analyzeBtn.addEventListener('click', async () => {
  const file = newImage.files?.[0];
  if(!file){
    addProductError.textContent = 'Selecione primeiro o print do Pokémon.';
    return;
  }

  analyzeBtn.disabled = true;
  addProductError.textContent = '';
  ocrProgress.textContent = 'Preparando imagem...';

  try{
    const canvas = await preprocessImage(file);
    ocrProgress.textContent = 'Lendo o print...';

    const result = await Tesseract.recognize(canvas, 'eng', {
      logger: m => {
        if(m.status === 'recognizing text'){
          ocrProgress.textContent = `Lendo o print... ${Math.round((m.progress || 0)*100)}%`;
        }
      }
    });

    const parsed = parseTechnical(result.data.text || '');
    setIf('quality', parsed.quality);
    setIf('ivTotal', parsed.ivTotal);
    setIf('hpIv', parsed.hpIv);
    setIf('atkIv', parsed.atkIv);
    setIf('defIv', parsed.defIv);
    setIf('spatkIv', parsed.spatkIv);
    setIf('spdefIv', parsed.spdefIv);
    setIf('speedIv', parsed.speedIv);
    setIf('nature', parsed.nature);
    setIf('gender', parsed.gender);
    recomputeAutoScore();

    const found = Object.values(parsed).filter(v=>v!==null && v!==undefined && v!=='').length;
    ocrProgress.textContent = `Análise concluída: ${found} campos identificados. Confira antes de publicar.`;
  }catch(e){
    console.error(e);
    ocrProgress.textContent = 'Não consegui analisar automaticamente este print.';
    addProductError.textContent = 'A análise automática falhou, mas você pode preencher/corrigir os campos manualmente.';
  }finally{
    analyzeBtn.disabled = false;
  }
});

async function adminFetch(url, options={}){
  const res = await fetch(url, {...options, cache:'no-store'});
  if(res.status === 403) throw new Error('Acesso administrativo não reconhecido. Confira o Cloudflare Access.');
  if(!res.ok) throw new Error(await res.text() || 'Erro na operação.');
  return res;
}

async function render(){
  const res = await adminFetch('/admin/api/catalog');
  const state = await res.json();
  adminProducts.innerHTML = '';

  for(const [id,item] of Object.entries(state)){
    const sold = !!item.sold;
    const card = document.createElement('article');
    card.className = 'admin-card' + (sold ? ' sold-card' : '');

    const thumb = item.imageUrl ? `<img class="admin-thumb" src="${item.imageUrl}" alt="">` : '';
    card.innerHTML = `
      ${thumb}
      <div class="admin-card-content">
        <div class="admin-card-heading">
          <div><h2></h2><span class="admin-rarity"></span></div>
          <div class="admin-state ${sold?'sold':'available'}">${sold?'● VENDIDO':'● DISPONÍVEL'}</div>
        </div>
        <div class="tech-mini"></div>
        <div class="admin-row">
          <label>Preço (R$)<input data-price type="number" min="1" max="999" step="1" value="${Number(item.price || 4)}"></label>
          <button data-save>SALVAR</button>
        </div>
        <div class="admin-actions">
          <button class="${sold?'available-btn':'sell'}" data-toggle>${sold?'VOLTAR PARA DISPONÍVEL':'MARCAR COMO VENDIDO'}</button>
          ${item.builtin ? '' : '<button class="delete-btn" data-delete>EXCLUIR</button>'}
        </div>
      </div>
    `;

    card.querySelector('h2').textContent = item.name || id;
    card.querySelector('.admin-rarity').textContent = item.rarity || '';
    const tech = item.technical || {};
    const bits = [];
    if(tech.ivTotal != null) bits.push(`IV ${tech.ivTotal}/186`);
    if(tech.quality != null) bits.push(`x${Number(tech.quality).toFixed(2)}`);
    if(tech.autoScore != null) bits.push(`Pré-nota ${tech.autoScore}/100`);
    card.querySelector('.tech-mini').textContent = bits.join(' • ');

    card.querySelector('[data-save]').onclick = async () => {
      try{
        await adminFetch('/admin/api/catalog',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({id,price:Number(card.querySelector('[data-price]').value)})
        });
        flash('Preço atualizado.');
        await render();
      }catch(e){ alert(e.message); }
    };

    card.querySelector('[data-toggle]').onclick = async () => {
      try{
        await adminFetch('/admin/api/catalog',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({id,sold:!sold})
        });
        flash(sold ? 'Disponível novamente.' : 'Marcado como vendido.');
        await render();
      }catch(e){ alert(e.message); }
    };

    const del = card.querySelector('[data-delete]');
    if(del) del.onclick = async () => {
      if(!confirm(`Excluir ${item.name}?`)) return;
      try{
        await adminFetch('/admin/api/catalog',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'delete',id})
        });
        flash('Pokémon excluído.');
        await render();
      }catch(e){ alert(e.message); }
    };

    adminProducts.appendChild(card);
  }
}

addProductForm.addEventListener('submit', async e => {
  e.preventDefault();
  const file = newImage.files?.[0];
  if(!file){
    addProductError.textContent = 'Selecione o print.';
    return;
  }

  addProductBtn.disabled = true;
  addProductBtn.textContent = 'PUBLICANDO...';
  addProductError.textContent = '';

  try{
    const form = new FormData(addProductForm);
    form.set('action','create');

    await adminFetch('/admin/api/catalog',{method:'POST',body:form});

    addProductForm.reset();
    $('newPrice').value = '4';
    uploadPreview.hidden = true;
    uploadPreview.removeAttribute('src');
    uploadPlaceholder.hidden = false;
    $('autoScoreText').textContent = '--';
    ocrProgress.textContent = 'Aguardando imagem.';
    flash('Pokémon publicado.');
    await render();
  }catch(e){
    addProductError.textContent = e.message;
  }finally{
    addProductBtn.disabled = false;
    addProductBtn.textContent = 'CONFIRMAR E PUBLICAR';
  }
});

render().catch(e => {
  addProductError.textContent = e.message;
  console.error(e);
});