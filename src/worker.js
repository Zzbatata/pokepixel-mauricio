const DEFAULTS = {"jumpluff01": {"id": "jumpluff01", "name": "Jumpluff #01", "price": 5, "sold": false, "rarity": "ÉPICO", "imageUrl": "/assets/jumpluff01-hq.png", "builtin": true}, "jumpluff02": {"id": "jumpluff02", "name": "Jumpluff #02", "price": 4, "sold": false, "rarity": "ÉPICO", "imageUrl": "/assets/jumpluff02-hq.png", "builtin": true}, "kabutops01": {"id": "kabutops01", "name": "Kabutops #01", "price": 6, "sold": false, "rarity": "ÉPICO", "imageUrl": "/assets/kabutops01-hq.png", "builtin": true}, "kabutops02": {"id": "kabutops02", "name": "Kabutops #02", "price": 5, "sold": false, "rarity": "ÉPICO", "imageUrl": "/assets/kabutops02-hq.png", "builtin": true}, "machoke01": {"id": "machoke01", "name": "Machoke #01", "price": 4, "sold": false, "rarity": "ÉPICO", "imageUrl": "/assets/machoke01-hq.png", "builtin": true}, "machoke02": {"id": "machoke02", "name": "Machoke #02", "price": 4, "sold": false, "rarity": "ÉPICO", "imageUrl": "/assets/machoke02-hq.png", "builtin": true}, "machoke03": {"id": "machoke03", "name": "Machoke #03", "price": 4, "sold": false, "rarity": "ÉPICO", "imageUrl": "/assets/machoke03-hq.png", "builtin": true}, "machoke04": {"id": "machoke04", "name": "Machoke #04", "price": 3, "sold": false, "rarity": "ÉPICO", "imageUrl": "/assets/machoke04-hq.png", "builtin": true}, "machoke05": {"id": "machoke05", "name": "Machoke #05", "price": 3, "sold": false, "rarity": "ÉPICO", "imageUrl": "/assets/machoke05-hq.png", "builtin": true}, "magmar01": {"id": "magmar01", "name": "Magmar #01", "price": 3, "sold": false, "rarity": "ÉPICO", "imageUrl": "/assets/magmar01-hq.png", "builtin": true}, "magnemite01": {"id": "magnemite01", "name": "Magnemite #01", "price": 5, "sold": false, "rarity": "ÉPICO", "imageUrl": "/assets/magnemite01-hq.png", "builtin": true}, "nidorina01": {"id": "nidorina01", "name": "Nidorina #01", "price": 3, "sold": false, "rarity": "ÉPICO", "imageUrl": "/assets/nidorina01-hq.png", "builtin": true}, "ninetales01": {"id": "ninetales01", "name": "Ninetales #01", "price": 4, "sold": false, "rarity": "ÉPICO", "imageUrl": "/assets/ninetales01-hq.png", "builtin": true}};

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

async function readCatalog(env) {
  if(!env.STORE) return structuredClone(DEFAULTS);

  try {
    const saved = await env.STORE.get('_catalog.json', 'json');
    if(!saved) return structuredClone(DEFAULTS);

    const merged = structuredClone(DEFAULTS);
    for(const [id,item] of Object.entries(saved || {})) {
      merged[id] = { ...(merged[id] || {}), ...item, id };
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

function requireAdmin(request, env) {
  if(env.DEV_ADMIN_BYPASS === '1') return true;
  return Boolean(
    request.headers.get('Cf-Access-Jwt-Assertion') ||
    request.headers.get('Cf-Access-Authenticated-User-Email')
  );
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
  if(!requireAdmin(request, env)) {
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
    const file = form.get('image');

    if(name.length < 2) return new Response('Informe o nome do Pokémon.',{status:400});
    if(!validPrice(price)) return new Response('Preço inválido.',{status:400});
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
    if(!validPrice(body.price)) return new Response('Preço inválido.',{status:400});
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

    if(url.pathname === '/admin/api/catalog') {
      return adminCatalog(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
