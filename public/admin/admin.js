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
const duplicateStatus = $('duplicateStatus');
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


const POKEMON_NATURES_PT = [
  'Dócil','Quieta','Envergonhada','Ousada','Calma','Maliciosa','Cuidadosa',
  'Apressada','Mansa','Relaxada','Tímida','Alegre','Modesta','Firme',
  'Ingênua','Travessa','Séria','Gentil','Distraída','Valente','Solitária',
  'Suave','Atrevida','Peculiar','Resistente'
];

function stripAccents(value){
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z]/g,'');
}

function levenshtein(a,b){
  a = stripAccents(a);
  b = stripAccents(b);
  const dp = Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
  for(let i=0;i<=a.length;i++) dp[i][0]=i;
  for(let j=0;j<=b.length;j++) dp[0][j]=j;
  for(let i=1;i<=a.length;i++){
    for(let j=1;j<=b.length;j++){
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

function bestNatureMatch(raw){
  const cleaned = stripAccents(raw);
  if(cleaned.length < 3) return '';
  let best = '';
  let bestScore = Infinity;
  for(const nature of POKEMON_NATURES_PT){
    const n = stripAccents(nature);
    if(cleaned.includes(n) || n.includes(cleaned)) return nature;
    const score = levenshtein(cleaned, n) / Math.max(cleaned.length, n.length);
    if(score < bestScore){
      bestScore = score;
      best = nature;
    }
  }
  return bestScore <= 0.38 ? best : '';
}

function parseSignature(text){
  const t = normalizeOCR(text);
  const m = t.match(/ASSINATURA\s*[:\-]?\s*([0-9A-Za-z@#£]{8,}(?:-[0-9A-Za-z@#£]{3,}){3,})/i);
  if(!m) return '';
  return m[1]
    .replace(/@/g,'a')
    .replace(/£/g,'f')
    .replace(/#/g,'f')
    .trim()
    .toLowerCase();
}

function parseCaptureAt(text){
  const t = normalizeOCR(text)
    .replace(/[Oo](?=\d)/g,'0')
    .replace(/(\d{2})-(\d{2})(?=\s|$)/g,'$1:$2');
  const m = t.match(/(\d{2})\/(\d{2})\/(\d{4})\s*,?\s*(\d{2})[:\-](\d{2})/);
  if(!m) return '';
  return `${m[1]}/${m[2]}/${m[3]} ${m[4]}:${m[5]}`;
}

function speciesFromFormName(){
  return String($('newName')?.value || '')
    .replace(/\s+#\d+\s*$/,'')
    .trim();
}

function currentTechnicalPayload(){
  const num = id => {
    const raw = $(id)?.value;
    if(raw === '' || raw === undefined || raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  return {
    quality:num('quality'),
    ivTotal:num('ivTotal'),
    hpIv:num('hpIv'),
    atkIv:num('atkIv'),
    defIv:num('defIv'),
    spatkIv:num('spatkIv'),
    spdefIv:num('spdefIv'),
    speedIv:num('speedIv')
  };
}

let duplicateCheckToken = 0;
let duplicateBlocked = false;

function setDuplicateStatus(kind, message){
  if(!duplicateStatus) return;
  duplicateStatus.className = `duplicate-status ${kind}`;
  duplicateStatus.textContent = message;
}

async function checkDuplicateIdentity(){
  const species = speciesFromFormName();
  const signature = String($('signature')?.value || '').trim();
  const captureAt = String($('captureAt')?.value || '').trim();
  const technical = currentTechnicalPayload();

  $('species').value = species;
  const token = ++duplicateCheckToken;
  duplicateBlocked = false;

  if(!species){
    setDuplicateStatus('waiting','⏳ INFORME O NOME PARA VERIFICAR DUPLICIDADE');
    return {duplicate:false,identityReady:false};
  }

  const hasCaptureIdentity = captureAt && Number.isFinite(technical.quality) && Number.isFinite(technical.ivTotal);
  const hasStatsIdentity = [technical.hpIv,technical.atkIv,technical.defIv,technical.spatkIv,technical.spdefIv,technical.speedIv]
    .every(Number.isFinite);

  if(!signature && !hasCaptureIdentity && !hasStatsIdentity){
    setDuplicateStatus('warn','⚠ AINDA FALTAM DADOS PARA A VERIFICAÇÃO ANTIDUPLICAÇÃO');
    return {duplicate:false,identityReady:false};
  }

  setDuplicateStatus('checking','⌛ CONFERINDO IDENTIDADE NO CATÁLOGO...');

  try{
    const response = await adminFetch('/admin/api/duplicate-check',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        name:$('newName').value,
        species,
        signature,
        captureAt,
        technical
      })
    });
    const res = await response.json();
    if(token !== duplicateCheckToken) return res;

    if(res.duplicate){
      duplicateBlocked = true;
      const method = res.method === 'signature'
        ? 'ASSINATURA'
        : res.method === 'captura'
          ? 'DADOS DE CAPTURA'
          : 'IVS';
      setDuplicateStatus(
        'blocked',
        `⛔ JÁ CADASTRADO: ${res.item.name.toUpperCase()} • CONFIRMADO POR ${method}`
      );
    }else if(res.identityReady){
      duplicateBlocked = false;
      if(res.methodsAvailable?.signature){
        setDuplicateStatus('ok','✅ ASSINATURA ÚNICA • POKÉMON NÃO ENCONTRADO NO CATÁLOGO');
      }else if(res.methodsAvailable?.capture){
        setDuplicateStatus('ok','✅ IDENTIDADE LIVRE • VERIFICADO POR CAPTURA + IV + QUALIDADE');
      }else{
        setDuplicateStatus('ok','✅ IDENTIDADE LIVRE • VERIFICADO PELOS IVS');
      }
    }else{
      setDuplicateStatus('warn','⚠ NÃO FOI POSSÍVEL FORMAR UMA IDENTIDADE CONFIÁVEL');
    }
    return res;
  }catch(e){
    if(token === duplicateCheckToken){
      setDuplicateStatus('warn','⚠ NÃO FOI POSSÍVEL CONSULTAR O CATÁLOGO AGORA');
    }
    return {duplicate:false,identityReady:false};
  }
}

let duplicateTimer = null;
function scheduleDuplicateCheck(){
  clearTimeout(duplicateTimer);
  duplicateTimer = setTimeout(()=>checkDuplicateIdentity(),450);
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
    gender: parseGender(text),
    signature: parseSignature(text),
    captureAt: parseCaptureAt(text)
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
  duplicateBlocked = false;
  setDuplicateStatus('waiting','⏳ ANALISE O PRINT PARA VERIFICAR SE JÁ ESTÁ CADASTRADO');
});


let lastAutoPrice = null;
const DIAMOND_BRL = 0.40;
function diamondsForPrice(value){
  const n = Number(value);
  if(!Number.isFinite(n) || n <= 0) return 0;
  return Math.max(1, Math.round(n / DIAMOND_BRL));
}
function updateDiamondPricePreview(){
  const el = $('diamondPricePreview');
  if(!el) return;
  const d = diamondsForPrice($('newPrice')?.value);
  el.textContent = d ? `💎 ${d} diamantes (1 💎 = R$ 0,40)` : '💎 --';
}

function currentIvState(){
  const ids = ['hpIv','atkIv','defIv','spatkIv','spdefIv','speedIv'];
  const values = ids.map(id => {
    const raw = $(id)?.value;
    if(raw === '' || raw === null || raw === undefined) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 && n <= 31 ? n : null;
  });
  const totalRaw = $('ivTotal')?.value;
  const total = totalRaw === '' ? null : Number(totalRaw);
  const complete = values.every(Number.isFinite);
  const sum = complete ? values.reduce((a,b)=>a+b,0) : null;
  const valid = complete && Number.isFinite(total) && sum === total;
  return {ids,values,total,complete,sum,valid};
}

function updateIvValidationUI(){
  const box = $('ivValidation');
  if(!box) return currentIvState();
  const s = currentIvState();
  box.className = 'iv-validation';
  if(!Number.isFinite(s.total)){
    box.classList.add('waiting');
    box.textContent = '⏳ AGUARDANDO IV TOTAL /186.';
  }else if(!s.complete){
    const missing = s.ids.filter((id,i)=>!Number.isFinite(s.values[i])).map(id=>id.replace('Iv','').toUpperCase());
    box.classList.add('warn');
    box.textContent = `⚠ FALTAM IVs: ${missing.join(', ')}. O preço automático continua bloqueado.`;
  }else if(s.valid){
    box.classList.add('ok');
    box.textContent = `✓ IVs CONFIRMADOS: ${s.values.join(' + ')} = ${s.sum}/${s.total}. Preço automático liberado.`;
  }else{
    box.classList.add('bad');
    box.textContent = `⛔ DIVERGÊNCIA: os 6 IVs somam ${s.sum}, mas o IV Total é ${s.total}. O preço automático foi bloqueado.`;
  }
  return s;
}

function clearAutoPriceIfNeeded(){
  const price = $('newPrice');
  if(price && price.dataset.autoSuggested === '1'){
    price.value = '';
    price.dataset.autoSuggested = '0';
    lastAutoPrice = null;
  }
}

function suggestEpicPrice(){
  const rarity = String($('newRarity')?.value || '').toUpperCase();
  const price = $('newPrice');
  const state = updateIvValidationUI();

  if(rarity !== 'ÉPICO' && rarity !== 'RARO'){
    clearAutoPriceIfNeeded();
    return;
  }

  const iv = Number($('ivTotal')?.value);
  const q = Number($('quality')?.value);

  if(!state.valid || !Number.isFinite(iv) || !Number.isFinite(q)){
    clearAutoPriceIfNeeded();
    return;
  }

  const species = speciesFromFormName();
  let suggested = null;

  if(rarity === 'ÉPICO'){
    if(q < 1.40 || q > 1.54){
      clearAutoPriceIfNeeded();
      return;
    }

    const ivScore = Math.max(0, Math.min(100, (iv - 90) / 60 * 100));
    const qScore = Math.max(0, Math.min(100, (q - 1.40) / (1.54 - 1.40) * 100));
    const score = ivScore * 0.65 + qScore * 0.35;

    suggested = 7;
    if(score >= 82) suggested = 12;
    else if(score >= 72) suggested = 11;
    else if(score >= 60) suggested = 10;
    else if(score >= 45) suggested = 9;
    else if(score >= 30) suggested = 8;

    const demandBonus = {Tyranitar:2,Gyarados:1,Gengar:1,Charmeleon:1}[species] || 0;
    suggested = Math.min(12, suggested + demandBonus);
  }

  if(rarity === 'RARO'){
    if(q < 1.25 || q > 1.39){
      clearAutoPriceIfNeeded();
      return;
    }

    const ivScore = Math.max(0, Math.min(100, (iv - 75) / 50 * 100));
    const qScore = Math.max(0, Math.min(100, (q - 1.25) / (1.39 - 1.25) * 100));
    const score = ivScore * 0.68 + qScore * 0.32;

    suggested = 4;
    if(score >= 75) suggested = 7;
    else if(score >= 55) suggested = 6;
    else if(score >= 35) suggested = 5;

    const demandBonus = {
      Arcanine:1,Gyarados:1,Snorlax:1,Ninetales:1,Electabuzz:1,
      Kadabra:1,Togetic:1,Charmander:1,Ivysaur:1
    }[species] || 0;
    suggested = Math.min(7, suggested + demandBonus);
  }

  price.value = suggested;
  price.dataset.autoSuggested = '1';
  lastAutoPrice = suggested;
  updateDiamondPricePreview();
}

$('newPrice')?.addEventListener('input',()=>{
  if(Number($('newPrice').value) !== lastAutoPrice) $('newPrice').dataset.autoSuggested = '0';
  updateDiamondPricePreview();
});
$('newRarity')?.addEventListener('change', suggestEpicPrice);
['ivTotal','quality','hpIv','atkIv','defIv','spatkIv','spdefIv','speedIv'].forEach(id=>{
  $(id)?.addEventListener('input',()=>{
    recomputeAutoScore();
    suggestEpicPrice();
  });
});


['newName','signature','captureAt','quality','ivTotal','hpIv','atkIv','defIv','spatkIv','spdefIv','speedIv']
  .forEach(id => $(id)?.addEventListener('input', scheduleDuplicateCheck));

$('newRarity')?.addEventListener('change', scheduleDuplicateCheck);


async function fileToBitmap(file){
  return await createImageBitmap(file);
}

function makeRegionCanvas(bitmap, rect, {
  scale=5,
  threshold=null,
  invertToBlackOnWhite=true,
  padding=8
}={}){
  const sx = Math.max(0, Math.round(bitmap.width * rect.x));
  const sy = Math.max(0, Math.round(bitmap.height * rect.y));
  const sw = Math.max(1, Math.round(bitmap.width * rect.w));
  const sh = Math.max(1, Math.round(bitmap.height * rect.h));

  const canvas = document.createElement('canvas');
  canvas.width = sw * scale + padding*2;
  canvas.height = sh * scale + padding*2;
  const ctx = canvas.getContext('2d',{willReadFrequently:true});

  ctx.fillStyle = '#fff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bitmap, sx, sy, sw, sh, padding, padding, sw*scale, sh*scale);

  if(threshold !== null){
    const image = ctx.getImageData(0,0,canvas.width,canvas.height);
    const d = image.data;
    for(let i=0;i<d.length;i+=4){
      const gray = d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114;
      const isText = gray >= threshold;
      const out = invertToBlackOnWhite ? (isText ? 0 : 255) : (isText ? 255 : 0);
      d[i]=d[i+1]=d[i+2]=out;
      d[i+3]=255;
    }
    ctx.putImageData(image,0,0);
  }
  return canvas;
}

function makeGoldIvPanel(bitmap, side='left', variant=0){
  const rect = side === 'left'
    ? {x:.275,y:.532,w:.235,h:.108}
    : {x:.755,y:.532,w:.235,h:.108};
  const configs = [
    {r:135,g:95,b:175,gd:12,rd:25},
    {r:110,g:75,b:190,gd:5,rd:15},
    {r:150,g:110,b:165,gd:18,rd:30}
  ];
  const cfg = configs[variant] || configs[0];
  const sx = Math.max(0,Math.round(bitmap.width*rect.x));
  const sy = Math.max(0,Math.round(bitmap.height*rect.y));
  const sw = Math.max(1,Math.round(bitmap.width*rect.w));
  const sh = Math.max(1,Math.round(bitmap.height*rect.h));
  const scale = 4;
  const canvas = document.createElement('canvas');
  canvas.width = sw*scale;
  canvas.height = sh*scale;
  const ctx = canvas.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#fff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
  const image = ctx.getImageData(0,0,canvas.width,canvas.height);
  const d = image.data;
  for(let i=0;i<d.length;i+=4){
    const r=d[i], g=d[i+1], b=d[i+2];
    const isGold = r>cfg.r && g>cfg.g && b<cfg.b && (g-b)>cfg.gd && (r-b)>cfg.rd;
    const out = isGold ? 0 : 255;
    d[i]=d[i+1]=d[i+2]=out;
    d[i+3]=255;
  }
  ctx.putImageData(image,0,0);
  return canvas;
}

function parseIvColumn(text){
  const normalized = String(text || '')
    .replace(/[|Iil]/g,'1')
    .replace(/[Oo]/g,'0')
    .replace(/\\/g,'/')
    .replace(/\r/g,'');
  const lines = normalized.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const values=[];
  for(const line of lines){
    const m = line.match(/(\d{1,2})\s*\/\s*(\d{2})/);
    if(!m) continue;
    const numerator = Number(m[1]);
    const denominator = Number(m[2]);
    values.push(numerator>=0 && numerator<=31 && denominator>=30 && denominator<=32 ? numerator : null);
    if(values.length===3) break;
  }
  while(values.length<3) values.push(null);
  return values.slice(0,3);
}

function resolveIvCandidates(candidatePasses, ivTotal){
  const positions = Array.from({length:6},(_,i)=>{
    const set = new Set();
    for(const pass of candidatePasses){
      const v=pass[i];
      if(Number.isFinite(v) && v>=0 && v<=31) set.add(v);
    }
    return [...set];
  });
  if(Number.isFinite(ivTotal)){
    let solution=null;
    function walk(i,arr,sum){
      if(solution) return;
      if(i===6){ if(sum===ivTotal) solution=[...arr]; return; }
      const opts=positions[i];
      if(!opts.length) return;
      for(const v of opts){
        if(sum+v>ivTotal) continue;
        arr.push(v); walk(i+1,arr,sum+v); arr.pop();
      }
    }
    if(positions.every(a=>a.length)) walk(0,[],0);
    if(solution && solution.every(Number.isFinite)) return solution;
    const fixed=positions.map(a=>a.length===1?a[0]:null);
    const missing=fixed.map((v,i)=>Number.isFinite(v)?-1:i).filter(i=>i>=0);
    if(missing.length===1){
      const sum=fixed.reduce((s,v)=>s+(Number.isFinite(v)?v:0),0);
      const inferred=ivTotal-sum;
      if(inferred>=0 && inferred<=31){ fixed[missing[0]]=inferred; return fixed; }
    }
  }
  return positions.map(a=>a.length===1?a[0]:null);
}

async function readBattleIvs(worker, bitmap, ivTotal){
  const passes=[];
  for(let variant=0;variant<3;variant++){
    const params={tessedit_char_whitelist:'0123456789/',tessedit_pageseg_mode:'6'};
    const leftText=await recognizeWithWorker(worker,makeGoldIvPanel(bitmap,'left',variant),params);
    const rightText=await recognizeWithWorker(worker,makeGoldIvPanel(bitmap,'right',variant),params);
    const left=parseIvColumn(leftText);
    const right=parseIvColumn(rightText);
    passes.push([left[0],left[1],left[2],right[0],right[1],right[2]]);
    const resolved=resolveIvCandidates(passes,ivTotal);
    if(resolved.every(Number.isFinite) && (!Number.isFinite(ivTotal) || resolved.reduce((a,b)=>a+b,0)===ivTotal)) return resolved;
  }
  return resolveIvCandidates(passes,ivTotal);
}


function makeGoldIvCell(bitmap, index, variant=0){
  const rects = [
    {x:.315,y:.538,w:.180,h:.034}, // HP
    {x:.315,y:.568,w:.180,h:.034}, // ATK
    {x:.315,y:.598,w:.180,h:.034}, // ATK SP
    {x:.805,y:.538,w:.180,h:.034}, // DEF
    {x:.805,y:.568,w:.180,h:.034}, // DEF SP
    {x:.805,y:.598,w:.180,h:.034}, // VEL
  ];
  const cfgs = [
    {r:120,g:82,b:185,gd:7,rd:18},
    {r:105,g:70,b:195,gd:3,rd:12},
    {r:145,g:100,b:175,gd:12,rd:24}
  ];
  const rect = rects[index];
  const cfg = cfgs[variant] || cfgs[0];

  const sx=Math.round(bitmap.width*rect.x);
  const sy=Math.round(bitmap.height*rect.y);
  const sw=Math.max(1,Math.round(bitmap.width*rect.w));
  const sh=Math.max(1,Math.round(bitmap.height*rect.h));
  const scale=7;

  const canvas=document.createElement('canvas');
  canvas.width=sw*scale;
  canvas.height=sh*scale;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#fff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.drawImage(bitmap,sx,sy,sw,sh,0,0,canvas.width,canvas.height);

  const image=ctx.getImageData(0,0,canvas.width,canvas.height);
  const d=image.data;
  for(let i=0;i<d.length;i+=4){
    const r=d[i],g=d[i+1],b=d[i+2];
    const isGold=r>cfg.r && g>cfg.g && b<cfg.b && (g-b)>cfg.gd && (r-b)>cfg.rd;
    const out=isGold?0:255;
    d[i]=d[i+1]=d[i+2]=out;
    d[i+3]=255;
  }
  ctx.putImageData(image,0,0);
  return canvas;
}

function parseSingleIv(text){
  const t=String(text||'')
    .replace(/[|Iil]/g,'1')
    .replace(/[Oo]/g,'0')
    .replace(/\\/g,'/');
  const m=t.match(/(\d{1,2})\s*\/?\s*(?:31)?/);
  if(!m) return null;
  const n=Number(m[1]);
  return Number.isFinite(n) && n>=0 && n<=31 ? n : null;
}

async function readBattleIvsCellFallback(worker, bitmap, ivTotal){
  const passes=[];
  for(let variant=0;variant<3;variant++){
    const values=[];
    for(let i=0;i<6;i++){
      const text=await recognizeWithWorker(
        worker,
        makeGoldIvCell(bitmap,i,variant),
        {tessedit_char_whitelist:'0123456789/',tessedit_pageseg_mode:'7'}
      );
      values.push(parseSingleIv(text));
    }
    passes.push(values);

    if(values.every(Number.isFinite)){
      const sum=values.reduce((a,b)=>a+b,0);
      if(!Number.isFinite(ivTotal) || sum===ivTotal) return values;
    }

    const resolved=resolveIvCandidates(passes,ivTotal);
    if(resolved.every(Number.isFinite)){
      const sum=resolved.reduce((a,b)=>a+b,0);
      if(!Number.isFinite(ivTotal) || sum===ivTotal) return resolved;
    }
  }
  return resolveIvCandidates(passes,ivTotal);
}

function parseQualityPrecise(text){
  const t = String(text || '')
    .replace(/[Oo]/g,'0')
    .replace(/[Il|]/g,'1')
    .replace(/,/g,'.');
  const matches=[...t.matchAll(/1\.(\d{2})/g)].map(m=>Number(`1.${m[1]}`));
  const q=matches.find(n=>Number.isFinite(n) && n>=1.20 && n<=1.99);
  return Number.isFinite(q) ? q : null;
}

function rarityFromQuality(q){
  const n=Number(q);
  if(n>=1.40 && n<=1.54) return 'ÉPICO';
  if(n>=1.25 && n<=1.39) return 'RARO';
  return null;
}

function parseIvTotalPrecise(text){
  const t = String(text || '')
    .replace(/[Oo]/g,'0')
    .replace(/[Il|]/g,'1');
  const m = t.match(/(\d{2,3})\s*\/\s*186/);
  if(!m) return null;
  const n = Number(m[1]);
  return n>=0 && n<=186 ? n : null;
}

function chooseIvsByTotal(primary, secondary, ivTotal){
  if(primary.length !== 6) return secondary.length === 6 ? secondary : primary;

  const sum1 = primary.reduce((a,b)=>a+b,0);
  if(!Number.isFinite(ivTotal) || sum1 === ivTotal) return primary;
  if(secondary.length !== 6) return primary;

  const candidates = primary.map((v,i)=>[...new Set([v,secondary[i]])]);
  let answer = null;

  function walk(i,current,sum){
    if(answer) return;
    if(i===6){
      if(sum===ivTotal) answer=[...current];
      return;
    }
    for(const v of candidates[i]){
      if(sum+v > ivTotal) continue;
      current.push(v);
      walk(i+1,current,sum+v);
      current.pop();
    }
  }
  walk(0,[],0);
  return answer || primary;
}

async function recognizeWithWorker(worker, canvas, params={}){
  await worker.setParameters(params);
  const result = await worker.recognize(canvas);
  return result?.data?.text || '';
}

async function analyzePokepixelCard(file){
  const bitmap = await fileToBitmap(file);
  let worker = null;
  const progress = pct => { ocrProgress.textContent = `Analisando as áreas exatas do card Pokepixel... ${Math.max(1,Math.min(99,Math.round(pct)))}%`; };
  try{
    progress(4);
    worker = await Tesseract.createWorker('eng',1,{logger:()=>{}});
    const qualityCanvas = makeRegionCanvas(bitmap,{x:.45,y:.34,w:.53,h:.13},{scale:4,threshold:null,padding:8});
    const qualityText = await recognizeWithWorker(worker,qualityCanvas,{tessedit_char_whitelist:'xX0123456789,./',tessedit_pageseg_mode:'6'});
    let quality = parseQualityPrecise(qualityText);
    progress(18);
    const totalCanvas = makeRegionCanvas(bitmap,{x:.48,y:.265,w:.49,h:.10},{scale:4,threshold:null,padding:8});
    const totalText = await recognizeWithWorker(worker,totalCanvas,{tessedit_char_whitelist:'0123456789/',tessedit_pageseg_mode:'6'});
    let ivTotal = parseIvTotalPrecise(totalText);
    progress(30);
    let ivs = await readBattleIvs(worker,bitmap,ivTotal);
    if(!ivs?.every(Number.isFinite) || (Number.isFinite(ivTotal) && ivs.reduce((a,b)=>a+b,0)!==ivTotal)){
      ivs = await readBattleIvsCellFallback(worker,bitmap,ivTotal);
    }
    progress(62);
    const geneticsCanvas = makeRegionCanvas(bitmap,{x:.035,y:.646,w:.935,h:.120},{scale:4,threshold:95,padding:10});
    const geneticsText = await recognizeWithWorker(worker,geneticsCanvas,{tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç♀♂ ',tessedit_pageseg_mode:'6'});
    let nature = bestNatureMatch(geneticsText);
    let gender = parseGender(geneticsText);
    progress(74);
    const signatureCanvas = makeRegionCanvas(bitmap,{x:.025,y:.817,w:.950,h:.060},{scale:5,threshold:105,padding:10});
    const signatureText = await recognizeWithWorker(worker,signatureCanvas,{tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-',tessedit_pageseg_mode:'6'});
    let signature = parseSignature(`Assinatura ${signatureText}`);
    progress(82);
    const captureCanvas = makeRegionCanvas(bitmap,{x:.025,y:.775,w:.950,h:.090},{scale:4,threshold:90,padding:10});
    const captureText = await recognizeWithWorker(worker,captureCanvas,{tessedit_char_whitelist:'',tessedit_pageseg_mode:'6'});
    let captureAt = parseCaptureAt(captureText);
    progress(88);
    const needFallback = !quality || !ivTotal || !nature || !gender || (!signature && !captureAt);
    if(needFallback){
      const whole=makeRegionCanvas(bitmap,{x:0,y:0,w:1,h:1},{scale:2,threshold:null,padding:0});
      const fallbackText=await recognizeWithWorker(worker,whole,{tessedit_char_whitelist:''});
      const fallback=parseTechnical(fallbackText);
      if(!quality) quality=fallback.quality;
      if(!ivTotal) ivTotal=fallback.ivTotal;
      if(!nature) nature=fallback.nature;
      if(!gender) gender=fallback.gender;
      if(!signature) signature=fallback.signature;
      if(!captureAt) captureAt=fallback.captureAt || parseCaptureAt(fallbackText);
    }
    if(Number.isFinite(ivTotal) && (!ivs || !ivs.every(Number.isFinite) || ivs.reduce((a,b)=>a+b,0)!==ivTotal)){
      ivs = await readBattleIvs(worker,bitmap,ivTotal);
      if(!ivs?.every(Number.isFinite) || ivs.reduce((a,b)=>a+b,0)!==ivTotal){
        ivs = await readBattleIvsCellFallback(worker,bitmap,ivTotal);
      }
    }
    progress(96);
    const parsed={quality,ivTotal,hpIv:ivs?.[0] ?? null,atkIv:ivs?.[1] ?? null,spatkIv:ivs?.[2] ?? null,defIv:ivs?.[3] ?? null,spdefIv:ivs?.[4] ?? null,speedIv:ivs?.[5] ?? null,nature,gender,signature,captureAt,detectedRarity:rarityFromQuality(quality)};
    return validateAndInferIvs(parsed);
  }finally{
    if(worker) await worker.terminate();
    bitmap.close?.();
  }
}

analyzeBtn.addEventListener('click', async () => {
  const file = newImage.files?.[0];
  if(!file){
    addProductError.textContent = 'Selecione primeiro o print do Pokémon.';
    return;
  }

  analyzeBtn.disabled = true;
  addProductError.textContent = '';
  ocrProgress.textContent = 'Preparando análise precisa do card...';

  try{
    const parsed = await analyzePokepixelCard(file);

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
    setIf('signature', parsed.signature);
    setIf('captureAt', parsed.captureAt);
    if(parsed.detectedRarity && $('newRarity')) $('newRarity').value = parsed.detectedRarity;

    $('species').value = speciesFromFormName();
    recomputeAutoScore();
    updateIvValidationUI();
    suggestEpicPrice();
    await checkDuplicateIdentity();

    const fields = [
      parsed.quality,parsed.ivTotal,
      parsed.hpIv,parsed.atkIv,parsed.defIv,
      parsed.spatkIv,parsed.spdefIv,parsed.speedIv,
      parsed.nature,parsed.gender,parsed.signature,parsed.captureAt
    ];
    const found = fields.filter(v=>v!==null && v!==undefined && v!=='').length;

    if(parsed.ivValidated){
      ocrProgress.textContent =
        `✓ LEITURA CRÍTICA CONFIRMADA: Q x${Number(parsed.quality||0).toFixed(2)} • IV ${parsed.ivTotal}/186 • HP ${parsed.hpIv} • ATK ${parsed.atkIv} • DEF ${parsed.defIv} • SP.ATK ${parsed.spatkIv} • SP.DEF ${parsed.spdefIv} • VEL ${parsed.speedIv}. Soma validada (${parsed.ivSum}/${parsed.ivTotal}).`;
    }else if(Number.isFinite(parsed.ivTotal) && Number.isFinite(parsed.ivSum)){
      ocrProgress.textContent =
        `⚠ Os IVs lidos somam ${parsed.ivSum}, mas o IV Total é ${parsed.ivTotal}. Não publique sem conferir os IVs destacados.`;
    }else{
      ocrProgress.textContent =
        `Análise concluída: ${found}/12 campos. Os campos vazios precisam ser conferidos manualmente.`;
    }
  }catch(e){
    console.error(e);
    ocrProgress.textContent = 'Não consegui concluir a análise precisa deste print.';
    addProductError.textContent =
      'O analisador não publicou nada. Confira a imagem e preencha manualmente somente se necessário.';
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
  addProductBtn.textContent = 'VERIFICANDO...';
  addProductError.textContent = '';

  try{
    const duplicateResult = await checkDuplicateIdentity();
    if(duplicateResult?.duplicate || duplicateBlocked){
      throw new Error('Este Pokémon já está cadastrado. A publicação foi bloqueada.');
    }
    if(!duplicateResult?.identityReady){
      throw new Error('Faltam dados confiáveis para verificar duplicidade. Confira Assinatura ou data/hora de captura + IV Total + qualidade.');
    }

    addProductBtn.textContent = 'PUBLICANDO...';
    $('species').value = speciesFromFormName();

    const form = new FormData(addProductForm);
    form.set('action','create');

    await adminFetch('/admin/api/catalog',{method:'POST',body:form});

    addProductForm.reset();
    $('newPrice').value = '7';
    updateDiamondPricePreview();
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
    duplicateBlocked = false;
    setDuplicateStatus('waiting','⏳ ANALISE O PRINT PARA VERIFICAR SE JÁ ESTÁ CADASTRADO');
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