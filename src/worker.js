const DEFAULTS = {"jumpluff01":{"id":"jumpluff01","name":"Jumpluff #01","species":"Jumpluff","price":12,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/jumpluff01-hq.png","builtin":true,"technical":{"quality":1.53,"ivTotal":136}},"jumpluff02":{"id":"jumpluff02","name":"Jumpluff #02","species":"Jumpluff","price":9,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/jumpluff02-hq.png","builtin":true,"technical":{"quality":1.5,"ivTotal":111}},"kabutops01":{"id":"kabutops01","name":"Kabutops #01","species":"Kabutops","price":9,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/kabutops01-hq.png","builtin":true,"technical":{"quality":1.43,"ivTotal":130}},"kabutops02":{"id":"kabutops02","name":"Kabutops #02","species":"Kabutops","price":12,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/kabutops02-hq.png","builtin":true,"technical":{"quality":1.5,"ivTotal":143}},"machoke01":{"id":"machoke01","name":"Machoke #01","species":"Machoke","price":10,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/machoke01-hq.png","builtin":true,"technical":{"quality":1.45,"ivTotal":137}},"machoke02":{"id":"machoke02","name":"Machoke #02","species":"Machoke","price":8,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/machoke02-hq.png","builtin":true,"technical":{"quality":1.44,"ivTotal":118}},"machoke03":{"id":"machoke03","name":"Machoke #03","species":"Machoke","price":9,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/machoke03-hq.png","builtin":true,"technical":{"quality":1.46,"ivTotal":118}},"machoke04":{"id":"machoke04","name":"Machoke #04","species":"Machoke","price":9,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/machoke04-hq.png","builtin":true,"technical":{"quality":1.48,"ivTotal":117}},"machoke05":{"id":"machoke05","name":"Machoke #05","species":"Machoke","price":10,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/machoke05-hq.png","builtin":true,"technical":{"quality":1.48,"ivTotal":127}},"magmar01":{"id":"magmar01","name":"Magmar #01","species":"Magmar","price":7,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/magmar01-hq.png","builtin":true,"technical":{"quality":1.42,"ivTotal":113}},"magnemite01":{"id":"magnemite01","name":"Magnemite #01","species":"Magnemite","price":9,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/magnemite01-hq.png","builtin":true,"technical":{"quality":1.47,"ivTotal":126}},"nidorina01":{"id":"nidorina01","name":"Nidorina #01","species":"Nidorina","price":7,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/nidorina01-hq.png","builtin":true,"technical":{"quality":1.43,"ivTotal":109}},"ninetales01":{"id":"ninetales01","name":"Ninetales #01","species":"Ninetales","price":10,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/ninetales01-hq.png","builtin":true,"technical":{"quality":1.52,"ivTotal":122}},"abra01":{"id":"abra01","name":"Abra #01","species":"Abra","price":8,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/abra01-hq.png","builtin":true,"technical":{"quality":1.49,"ivTotal":106}},"beedrill01":{"id":"beedrill01","name":"Beedrill #01","species":"Beedrill","price":10,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/beedrill01-hq.png","builtin":true,"technical":{"quality":1.49,"ivTotal":133}},"charmeleon01":{"id":"charmeleon01","name":"Charmeleon #01","species":"Charmeleon","price":10,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/charmeleon01-hq.png","builtin":true,"technical":{"quality":1.49,"ivTotal":124}},"drowzee01":{"id":"drowzee01","name":"Drowzee #01","species":"Drowzee","price":11,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/drowzee01-hq.png","builtin":true,"technical":{"quality":1.49,"ivTotal":137}},"charmeleon02":{"id":"charmeleon02","name":"Charmeleon #02","species":"Charmeleon","price":11,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/charmeleon02-hq.png","builtin":true,"technical":{"quality":1.46,"ivTotal":134}},"dugtrio01":{"id":"dugtrio01","name":"Dugtrio #01","species":"Dugtrio","price":11,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/dugtrio01-hq.png","builtin":true,"technical":{"quality":1.51,"ivTotal":138}},"electabuzz01":{"id":"electabuzz01","name":"Electabuzz #01","species":"Electabuzz","price":8,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/electabuzz01-hq.png","builtin":true,"technical":{"quality":1.49,"ivTotal":108}},"fearow01":{"id":"fearow01","name":"Fearow #01","species":"Fearow","price":7,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/fearow01-hq.png","builtin":true,"technical":{"quality":1.4,"ivTotal":109}},"electabuzz02":{"id":"electabuzz02","name":"Electabuzz #02","species":"Electabuzz","price":10,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/electabuzz02-hq.png","builtin":true,"technical":{"quality":1.49,"ivTotal":135}},"gengar01":{"id":"gengar01","name":"Gengar #01","species":"Gengar","price":9,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/gengar01-hq.png","builtin":true,"technical":{"quality":1.41,"ivTotal":126}},"geodude01":{"id":"geodude01","name":"Geodude #01","species":"Geodude","price":10,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/geodude01-hq.png","builtin":true,"technical":{"quality":1.44,"ivTotal":142}},"gloom01":{"id":"gloom01","name":"Gloom #01","species":"Gloom","price":7,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/gloom01-hq.png","builtin":true,"technical":{"quality":1.41,"ivTotal":103}},"gloom02":{"id":"gloom02","name":"Gloom #02","species":"Gloom","price":12,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/gloom02-hq.png","builtin":true,"technical":{"quality":1.5,"ivTotal":143}},"graveler01":{"id":"graveler01","name":"Graveler #01","species":"Graveler","price":11,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/graveler01-hq.png","builtin":true,"technical":{"quality":1.53,"ivTotal":128}},"gyarados01":{"id":"gyarados01","name":"Gyarados #01","species":"Gyarados","price":12,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/gyarados01-hq.png","builtin":true,"technical":{"quality":1.47,"ivTotal":141}},"horsea01":{"id":"horsea01","name":"Horsea #01","species":"Horsea","price":8,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/horsea01-hq.png","builtin":true,"technical":{"quality":1.48,"ivTotal":102}},"ivysaur01":{"id":"ivysaur01","name":"Ivysaur #01","species":"Ivysaur","price":9,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/ivysaur01-hq.png","builtin":true,"technical":{"quality":1.49,"ivTotal":123}},"parasect01":{"id":"parasect01","name":"Parasect #01","species":"Parasect","price":9,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/parasect01-hq.png","builtin":true,"technical":{"quality":1.48,"ivTotal":125}},"persian01":{"id":"persian01","name":"Persian #01","species":"Persian","price":8,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/persian01-hq.png","builtin":true,"technical":{"quality":1.4,"ivTotal":130}},"pidgeotto01":{"id":"pidgeotto01","name":"Pidgeotto #01","species":"Pidgeotto","price":9,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/pidgeotto01-hq.png","builtin":true,"technical":{"quality":1.53,"ivTotal":110}},"pidgeotto02":{"id":"pidgeotto02","name":"Pidgeotto #02","species":"Pidgeotto","price":8,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/pidgeotto02-hq.png","builtin":true,"technical":{"quality":1.48,"ivTotal":104}},"poliwhirl01":{"id":"poliwhirl01","name":"Poliwhirl #01","species":"Poliwhirl","price":9,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/poliwhirl01-hq.png","builtin":true,"technical":{"quality":1.49,"ivTotal":116}},"poliwhirl02":{"id":"poliwhirl02","name":"Poliwhirl #02","species":"Poliwhirl","price":10,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/poliwhirl02-hq.png","builtin":true,"technical":{"quality":1.53,"ivTotal":120}},"poliwhirl03":{"id":"poliwhirl03","name":"Poliwhirl #03","species":"Poliwhirl","price":8,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/poliwhirl03-hq.png","builtin":true,"technical":{"quality":1.45,"ivTotal":117}},"porygon01":{"id":"porygon01","name":"Porygon #01","species":"Porygon","price":9,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/porygon01-hq.png","builtin":true,"technical":{"quality":1.51,"ivTotal":111}},"primeape01":{"id":"primeape01","name":"Primeape #01","species":"Primeape","price":10,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/primeape01-hq.png","builtin":true,"technical":{"quality":1.44,"ivTotal":141}},"psyduck01":{"id":"psyduck01","name":"Psyduck #01","species":"Psyduck","price":10,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/psyduck01-hq.png","builtin":true,"technical":{"quality":1.5,"ivTotal":133}},"psyduck02":{"id":"psyduck02","name":"Psyduck #02","species":"Psyduck","price":8,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/psyduck02-hq.png","builtin":true,"technical":{"quality":1.49,"ivTotal":110}},"pupitar01":{"id":"pupitar01","name":"Pupitar #01","species":"Pupitar","price":10,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/pupitar01-hq.png","builtin":true,"technical":{"quality":1.48,"ivTotal":134}},"quilava01":{"id":"quilava01","name":"Quilava #01","species":"Quilava","price":10,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/quilava01-hq.png","builtin":true,"technical":{"quality":1.48,"ivTotal":128}},"sandslash01":{"id":"sandslash01","name":"Sandslash #01","species":"Sandslash","price":8,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/sandslash01-hq.png","builtin":true,"technical":{"quality":1.51,"ivTotal":105}},"tangela01":{"id":"tangela01","name":"Tangela #01","species":"Tangela","price":12,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/tangela01-hq.png","builtin":true,"technical":{"quality":1.5,"ivTotal":144}},"tyranitar01":{"id":"tyranitar01","name":"Tyranitar #01","species":"Tyranitar","price":12,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/tyranitar01-hq.png","builtin":true,"technical":{"quality":1.45,"ivTotal":143}},"yanma01":{"id":"yanma01","name":"Yanma #01","species":"Yanma","price":8,"sold":false,"rarity":"ÉPICO","imageUrl":"/assets/yanma01-hq.png","builtin":true,"technical":{"quality":1.45,"ivTotal":108}}};

function json(data, init={}) {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type','application/json; charset=utf-8');
  headers.set('Cache-Control','no-store');
  return new Response(JSON.stringify(data), {...init, headers});
}

function cleanText(v, max=80) {
  return String(v ?? '').trim().slice(0,max);
}

function slugify(value) {
  return cleanText(value,80)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,40) || 'pokemon';
}

function validPrice(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n <= 999;
}

function normalizeSignature(v) {
  return String(v || '').trim().toLowerCase().replace(/\s+/g,'');
}

function validPriceForRarity(price, rarity) {
  const n = Number(price);
  if(!validPrice(n)) return false;
  if(String(rarity || '').toUpperCase() === 'ÉPICO') return n >= 7 && n <= 12;
  return true;
}

function normalizeCatalogItem(item, fallback={}) {
  const merged = {...fallback, ...item};
  const rarity = String(merged.rarity || fallback.rarity || 'ÉPICO').toUpperCase();
  merged.rarity = rarity;
  if(rarity === 'ÉPICO' && (!Number.isFinite(Number(merged.price)) || Number(merged.price) < 7 || Number(merged.price) > 12)){
    merged.price = Number(fallback.price || 7);
  }
  return merged;
}

async function readCatalog(env) {
  if(!env.STORE) return structuredClone(DEFAULTS);

  try {
    const saved = await env.STORE.get('_catalog.json', 'json');
    if(!saved) return structuredClone(DEFAULTS);

    const merged = structuredClone(DEFAULTS);
    for(const [id,item] of Object.entries(saved || {})) {
      merged[id] = normalizeCatalogItem(item, merged[id] || {});
      merged[id].id = id;
    }
    return merged;
  } catch {
    return structuredClone(DEFAULTS);
  }
}

async function saveCatalog(env, catalog) {
  if(!env.STORE) throw new Error('KV não conectado ao Worker.');
  await env.STORE.put('_catalog.json', JSON.stringify(catalog));
}

function base64url(bytes) {
  let binary = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for(const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function textBytes(value) {
  return new TextEncoder().encode(String(value));
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    textBytes(secret),
    {name:'HMAC', hash:'SHA-256'},
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, textBytes(value));
  return base64url(sig);
}

function getCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for(const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if(k === name) return rest.join('=');
  }
  return '';
}

async function createSession(env) {
  const exp = Math.floor(Date.now()/1000) + 60*60*12;
  const nonce = crypto.randomUUID();
  const payload = `${exp}.${nonce}`;
  const sig = await hmacHex(env.SESSION_SECRET, payload);
  return `${payload}.${sig}`;
}

async function validSession(request, env) {
  if(!env.SESSION_SECRET) return false;
  const token = getCookie(request, 'pp_admin');
  if(!token) return false;

  const parts = token.split('.');
  if(parts.length !== 3) return false;
  const [expRaw, nonce, sig] = parts;
  const exp = Number(expRaw);
  if(!Number.isFinite(exp) || exp < Math.floor(Date.now()/1000)) return false;

  const expected = await hmacHex(env.SESSION_SECRET, `${expRaw}.${nonce}`);
  if(expected.length !== sig.length) return false;

  let diff = 0;
  for(let i=0;i<expected.length;i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

async function requireAdmin(request, env) {
  return await validSession(request, env);
}

async function serveImage(env, id) {
  if(!/^[a-z0-9-]{3,120}$/i.test(id)) {
    return new Response('Imagem inválida',{status:400});
  }
  if(!env.STORE) return new Response('KV não conectado ao Worker.',{status:503});

  const entry = await env.STORE.getWithMetadata(`images/${id}`, 'arrayBuffer');
  if(!entry || !entry.value) return new Response('Imagem não encontrada',{status:404});

  const contentType = entry.metadata?.contentType || 'application/octet-stream';
  return new Response(entry.value, {
    headers:{
      'Content-Type':contentType,
      'Cache-Control':'public, max-age=3600'
    }
  });
}

async function adminCatalog(request, env) {
  if(!(await requireAdmin(request, env))) {
    return new Response('Acesso administrativo não autorizado.',{status:403});
  }

  if(request.method === 'GET') return json(await readCatalog(env));
  if(request.method !== 'POST') return new Response('Method not allowed',{status:405});

  const type = request.headers.get('content-type') || '';

  if(type.includes('multipart/form-data')) {
    const form = await request.formData();
    const action = cleanText(form.get('action'),20);

    if(action !== 'create') return new Response('Ação inválida.',{status:400});

    const name = cleanText(form.get('name'),80);
    const rarity = cleanText(form.get('rarity') || 'ÉPICO',30);
    const price = Number(form.get('price'));
    const signature = normalizeSignature(form.get('signature'));
    const file = form.get('image');

    if(name.length < 2) return new Response('Informe o nome do Pokémon.',{status:400});
    if(!validPriceForRarity(price, rarity)) {
      return new Response(rarity.toUpperCase() === 'ÉPICO' ? 'Pokémon épico deve custar entre R$ 7 e R$ 12.' : 'Preço inválido.',{status:400});
    }
    if(!(file instanceof File)) return new Response('Selecione o print.',{status:400});

    const allowed = new Set(['image/png','image/jpeg','image/webp']);
    if(!allowed.has(file.type)) return new Response('Use PNG, JPG/JPEG ou WEBP.',{status:400});
    if(file.size <= 0 || file.size > 8*1024*1024) {
      return new Response('A imagem deve ter até 8 MB.',{status:400});
    }

    const id = `${slugify(name)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
    const imageKey = `images/${id}`;

    if(!env.STORE) return new Response('KV não conectado ao Worker.',{status:503});

    await env.STORE.put(imageKey, await file.arrayBuffer(), {
      metadata:{
        contentType:file.type,
        filename:file.name,
        uploadedAt:new Date().toISOString()
      }
    });

    const catalog = await readCatalog(env);

    if(signature){
      const duplicate = Object.values(catalog).find(item => normalizeSignature(item.signature) === signature);
      if(duplicate){
        await env.STORE.delete(imageKey);
        return new Response(`Este Pokémon já está cadastrado como ${duplicate.name}. Assinatura duplicada.`,{status:409});
      }
    }

    const technical = {
      quality: form.get('quality') ? Number(form.get('quality')) : null,
      ivTotal: form.get('ivTotal') ? Number(form.get('ivTotal')) : null,
      hpIv: form.get('hpIv') ? Number(form.get('hpIv')) : null,
      atkIv: form.get('atkIv') ? Number(form.get('atkIv')) : null,
      defIv: form.get('defIv') ? Number(form.get('defIv')) : null,
      spatkIv: form.get('spatkIv') ? Number(form.get('spatkIv')) : null,
      spdefIv: form.get('spdefIv') ? Number(form.get('spdefIv')) : null,
      speedIv: form.get('speedIv') ? Number(form.get('speedIv')) : null,
      nature: cleanText(form.get('nature'),40) || null,
      gender: cleanText(form.get('gender'),20) || null,
      autoScore: form.get('autoScore') ? Number(form.get('autoScore')) : null
    };

    catalog[id] = {
      id, name, price, sold:false, rarity:rarity || 'ÉPICO',
      signature: signature || null,
      imageUrl:`/api/image/${encodeURIComponent(id)}`,
      imageKey, builtin:false, createdAt:new Date().toISOString(),
      technical
    };

    await saveCatalog(env, catalog);
    return json({ok:true,item:catalog[id]});
  }

  const body = await request.json();
  const catalog = await readCatalog(env);
  const id = cleanText(body.id,120);

  if(body.action === 'delete') {
    const item = catalog[id];
    if(!item) return new Response('Pokémon não encontrado.',{status:404});
    if(item.builtin) {
      return new Response('Os Pokémon originais ficam protegidos contra exclusão.',{status:400});
    }
    if(item.imageKey) await env.STORE.delete(item.imageKey);
    delete catalog[id];
    await saveCatalog(env,catalog);
    return json({ok:true,deleted:id});
  }

  if(!catalog[id]) return new Response('Pokémon não encontrado.',{status:404});
  const item = catalog[id];

  if(typeof body.sold === 'boolean') item.sold = body.sold;
  if(body.price !== undefined) {
    if(!validPriceForRarity(body.price, item.rarity)) {
      return new Response(String(item.rarity || '').toUpperCase() === 'ÉPICO' ? 'Pokémon épico deve custar entre R$ 7 e R$ 12.' : 'Preço inválido.',{status:400});
    }
    item.price = Number(body.price);
  }
  if(body.name !== undefined) {
    const name = cleanText(body.name,80);
    if(name.length < 2) return new Response('Nome inválido.',{status:400});
    item.name = name;
  }

  catalog[id] = item;
  await saveCatalog(env,catalog);
  return json({ok:true,item});
}


async function loginAdmin(request, env) {
  if(request.method !== 'POST') return new Response('Method not allowed',{status:405});
  if(!env.ADMIN_PASSWORD || !env.SESSION_SECRET){
    return new Response('Segredos do admin ainda não configurados.',{status:503});
  }

  const body = await request.json().catch(()=>({}));
  const password = String(body.password || '');
  if(password !== env.ADMIN_PASSWORD){
    return new Response('Senha incorreta.',{status:401});
  }

  const token = await createSession(env);
  return json({ok:true},{
    headers:{
      'Set-Cookie':`pp_admin=${token}; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`
    }
  });
}

async function logoutAdmin() {
  return json({ok:true},{
    headers:{
      'Set-Cookie':'pp_admin=; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    }
  });
}

async function sessionStatus(request, env) {
  return json({authenticated:await validSession(request, env)});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if(url.pathname === '/api/catalog' && request.method === 'GET') {
      return json(await readCatalog(env));
    }

    if(url.pathname.startsWith('/api/image/') && request.method === 'GET') {
      const id = decodeURIComponent(url.pathname.slice('/api/image/'.length));
      return serveImage(env, id);
    }

    if(url.pathname === '/admin/api/login') {
      return loginAdmin(request, env);
    }

    if(url.pathname === '/admin/api/logout') {
      return logoutAdmin();
    }

    if(url.pathname === '/admin/api/session') {
      return sessionStatus(request, env);
    }

    if(url.pathname === '/admin/api/catalog') {
      return adminCatalog(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
