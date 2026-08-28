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
const openPreviewBtn = $('openPreviewBtn');
const imageZoomModal = $('imageZoomModal');
const imageZoomTarget = $('imageZoomTarget');
const imageZoomViewport = $('imageZoomViewport');
const zoomLevel = $('zoomLevel');
const zoomInBtn = $('zoomInBtn');
const zoomOutBtn = $('zoomOutBtn');
const zoomResetBtn = $('zoomResetBtn');
const closeZoomBtn = $('closeZoomBtn');
let previewObjectUrl = null;
let zoomScale = 1;
const loginPanel = $('loginPanel');
const dashboard = $('dashboard');
const loginForm = $('loginForm');
const loginError = $('loginError');
const adminPassword = $('adminPassword');
const logoutBtn = $('logoutBtn');

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
    .replace(/,/g,'.')
    .replace(/[│|]/g,'I')
    .replace(/[“”]/g,'"')
    .replace(/[–—]/g,'-');
}

function compactLine(line){
  return normalizeOCR(line)
    .toUpperCase()
    .replace(/\s+/g,' ')
    .trim();
}

/*
  Captura especificamente o NUMERADOR antes de /31.
  Ex.: "HP 76 • 26/31" => 26
  O analisador antigo pegava o último número da linha, que era 31.
*/
function ivBefore31(fragment){
  const s = compactLine(fragment)
    .replace(/3[I|L]/g,'31')
    .replace(/\/\s*3\s*1/g,'/31');

  const matches = [...s.matchAll(/(\d{1,2})\s*\/\s*31\b/g)];
  if(!matches.length) return null;

  const value = Number(matches[matches.length - 1][1]);
  return value >= 0 && value <= 31 ? value : null;
}

function getLines(text){
  return normalizeOCR(text)
    .split('\n')
    .map(compactLine)
    .filter(Boolean);
}

function lineWindow(lines, index){
  return [
    lines[index - 1] || '',
    lines[index] || '',
    lines[index + 1] || ''
  ].join(' ');
}

function isSpAtk(line){
  return /\b(?:ATK\s*SP|SP\.?\s*ATK|ATAQUE\s*SP)\b/.test(line);
}

function isSpDef(line){
  return /\b(?:DEF\s*SP|SP\.?\s*DEF|DEFESA\s*SP)\b/.test(line);
}

function extractLabeledIv(text, kind){
  const lines = getLines(text);

  for(let i=0;i<lines.length;i++){
    const line = lines[i];
    let match = false;

    if(kind === 'hp'){
      match = /^HP\b/.test(line) && !/HP\s*\+/.test(line);
    }else if(kind === 'atk'){
      match = /\bATK\b|\bATAQUE\b/.test(line) && !isSpAtk(line);
    }else if(kind === 'def'){
      match = /\bDEF\b|\bDEFESA\b/.test(line) && !isSpDef(line);
    }else if(kind === 'spatk'){
      match = isSpAtk(line);
    }else if(kind === 'spdef'){
      match = isSpDef(line);
    }else if(kind === 'speed'){
      match = /\bVEL\b|\bSPEED\b|\bSPE\b/.test(line);
    }

    if(!match) continue;

    const value = ivBefore31(lineWindow(lines, i));
    if(value !== null) return value;
  }

  return null;
}

function parseQuality(text){
  const t = normalizeOCR(text);
  const patterns = [
    /(?:ÉPICA|EPICA|RARIDADE)?[^\n]{0,20}[xX]\s*(1[.,]\d{2})/i,
    /[xX]\s*(1[.,]\d{2})/i
  ];

  for(const p of patterns){
    const m = t.match(p);
    if(m) return Number(m[1].replace(',','.'));
  }
  return null;
}

function parseIvTotal(text){
  const t = normalizeOCR(text);
  const patterns = [
    /IV(?:\s*TOTAL)?[^\d]{0,20}(\d{2,3})\s*\/\s*186/i,
    /(\d{2,3})\s*\/\s*186/i
  ];

  for(const p of patterns){
    const m = t.match(p);
    if(m){
      const value = Number(m[1]);
      if(value >= 0 && value <= 186) return value;
    }
  }
  return null;
}

function parseNature(text){
  const lines = getLines(text);
  for(let i=0;i<lines.length;i++){
    if(!/\bNATUREZA\b|\bNATURE\b/.test(lines[i])) continue;

    const raw = normalizeOCR(
      `${lines[i]} ${lines[i+1] || ''}`
    );

    const m = raw.match(/(?:NATUREZA|NATURE)\s*[:\-]?\s*([A-Za-zÀ-ÿ]+)/i);
    if(m && !/^NATUREZA$/i.test(m[1])) return m[1];
  }
  return '';
}

function parseGender(text){
  const t = normalizeOCR(text);
  if(/[♀]/.test(t) || /\bF[EÊ]MEA\b/i.test(t)) return 'Fêmea';
  if(/[♂]/.test(t) || /\bMACHO\b/i.test(t)) return 'Macho';
  return '';
}

/*
  Usa a soma dos 6 IVs como validação:
  - se todos foram lidos e a soma bate com IV TOTAL, alta confiança;
  - se só 1 IV ficou faltando, ele pode ser inferido pelo IV TOTAL.
*/
function validateAndInferIvs(parsed){
  const keys = ['hpIv','atkIv','defIv','spatkIv','spdefIv','speedIv'];
  const known = keys.filter(k => Number.isFinite(parsed[k]));
  const missing = keys.filter(k => !Number.isFinite(parsed[k]));

  if(Number.isFinite(parsed.ivTotal)){
    const knownSum = known.reduce((sum,k)=>sum + parsed[k],0);

    if(missing.length === 1){
      const inferred = parsed.ivTotal - knownSum;
      if(inferred >= 0 && inferred <= 31){
        parsed[missing[0]] = inferred;
        parsed.inferredField = missing[0];
      }
    }

    const finalValues = keys.map(k=>parsed[k]);
    if(finalValues.every(Number.isFinite)){
      parsed.ivSum = finalValues.reduce((a,b)=>a+b,0);
      parsed.ivValidated = parsed.ivSum === parsed.ivTotal;
    }else{
      parsed.ivValidated = false;
    }
  }

  return parsed;
}

function parseTechnical(text){
  const parsed = {
    quality: parseQuality(text),
    ivTotal: parseIvTotal(text),
    hpIv: extractLabeledIv(text,'hp'),
    atkIv: extractLabeledIv(text,'atk'),
    defIv: extractLabeledIv(text,'def'),
    spatkIv: extractLabeledIv(text,'spatk'),
    spdefIv: extractLabeledIv(text,'spdef'),
    speedIv: extractLabeledIv(text,'speed'),
    nature: parseNature(text),
    gender: parseGender(text)
  };

  return validateAndInferIvs(parsed);
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

  if(previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = URL.createObjectURL(file);
  uploadPreview.src = previewObjectUrl;
  uploadPreview.hidden = false;
  uploadPlaceholder.hidden = true;
  openPreviewBtn.hidden = false;

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

    const mainFields = ['quality','ivTotal','hpIv','atkIv','defIv','spatkIv','spdefIv','speedIv','nature','gender'];
    const found = mainFields.filter(k => parsed[k] !== null && parsed[k] !== undefined && parsed[k] !== '').length;

    if(parsed.ivValidated){
      const inferredNote = parsed.inferredField ? ' 1 IV foi inferido pela soma do IV total.' : '';
      ocrProgress.textContent = `Análise concluída: ${found}/10 campos. IVs validados pela soma (${parsed.ivSum}/${parsed.ivTotal}).${inferredNote} Confira antes de publicar.`;
    }else if(Number.isFinite(parsed.ivTotal) && Number.isFinite(parsed.ivSum)){
      ocrProgress.textContent = `ATENÇÃO: os IVs lidos somam ${parsed.ivSum}, mas o IV Total é ${parsed.ivTotal}. Confira os IVs antes de publicar.`;
    }else{
      ocrProgress.textContent = `Análise concluída: ${found}/10 campos. Confira os campos não identificados antes de publicar.`;
    }
  }catch(e){
    console.error(e);
    ocrProgress.textContent = 'Não consegui analisar automaticamente este print.';
    addProductError.textContent = 'A análise automática falhou, mas você pode preencher/corrigir os campos manualmente.';
  }finally{
    analyzeBtn.disabled = false;
  }
});


function applyZoom(){
  if(!imageZoomTarget) return;
  imageZoomTarget.style.width = `${Math.round(zoomScale * 100)}%`;
  imageZoomTarget.style.maxWidth = 'none';
  zoomLevel.textContent = `${Math.round(zoomScale * 100)}%`;
}

function openImageZoom(){
  if(!previewObjectUrl) return;
  imageZoomTarget.src = previewObjectUrl;
  zoomScale = 1;
  applyZoom();
  imageZoomModal.classList.add('on');
  imageZoomModal.setAttribute('aria-hidden','false');
  document.body.classList.add('zoom-open');
}

function closeImageZoom(){
  imageZoomModal.classList.remove('on');
  imageZoomModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('zoom-open');
}

openPreviewBtn?.addEventListener('click', openImageZoom);
uploadPreview?.addEventListener('click', openImageZoom);
closeZoomBtn?.addEventListener('click', closeImageZoom);

zoomInBtn?.addEventListener('click', () => {
  zoomScale = Math.min(4, zoomScale + 0.25);
  applyZoom();
});

zoomOutBtn?.addEventListener('click', () => {
  zoomScale = Math.max(0.5, zoomScale - 0.25);
  applyZoom();
});

zoomResetBtn?.addEventListener('click', () => {
  zoomScale = 1;
  applyZoom();
  imageZoomViewport.scrollTo({top:0,left:0,behavior:'smooth'});
});

imageZoomModal?.addEventListener('click', e => {
  if(e.target === imageZoomModal) closeImageZoom();
});

document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && imageZoomModal?.classList.contains('on')) closeImageZoom();
  if(imageZoomModal?.classList.contains('on') && (e.key === '+' || e.key === '=')){
    zoomScale = Math.min(4, zoomScale + 0.25);
    applyZoom();
  }
  if(imageZoomModal?.classList.contains('on') && e.key === '-'){
    zoomScale = Math.max(0.5, zoomScale - 0.25);
    applyZoom();
  }
});

async function adminFetch(url, options={}){
  const res = await fetch(url, {...options, cache:'no-store'});
  if(res.status === 403) throw new Error('Sua sessão administrativa expirou. Entre novamente.');
  if(!res.ok) throw new Error(await res.text() || 'Erro na operação.');
  return res;
}


async function checkSession(){
  const res = await fetch('/admin/api/session',{cache:'no-store'});
  const data = await res.json();
  return !!data.authenticated;
}

async function showAdmin(){
  loginPanel.hidden = true;
  dashboard.hidden = false;
  await render();
}

async function showLogin(){
  dashboard.hidden = true;
  loginPanel.hidden = false;
}

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginError.textContent = '';

  try{
    const res = await fetch('/admin/api/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({password:adminPassword.value}),
      cache:'no-store'
    });

    if(!res.ok){
      loginError.textContent = await res.text() || 'Não foi possível entrar.';
      return;
    }

    adminPassword.value = '';
    await showAdmin();
  }catch(e){
    loginError.textContent = 'Não foi possível entrar agora.';
  }
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/admin/api/logout',{method:'POST',cache:'no-store'});
  location.reload();
});

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
    openPreviewBtn.hidden = true;
    if(previewObjectUrl){
      URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = null;
    }
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

(async function init(){
  try{
    if(await checkSession()) await showAdmin();
    else await showLogin();
  }catch(e){
    console.error(e);
    await showLogin();
  }
})();