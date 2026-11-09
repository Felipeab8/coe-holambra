#!/usr/bin/env node
/* Miniaturas dos indicadores para a Ficha de KPI.

   Uso:  node scripts/miniaturas-kpi.cjs [endereço do videowall]
   Sem argumento, usa o endereço gravado em js/indicadores.js (o mesmo das telas do material).

   Cada indicador ganha uma imagem só com a parte do card de que ele trata, mais o título do card,
   e nada ao redor. O recorte de cada indicador está em fonte/miniaturas-kpi.json. O videowall é
   aberto como uma TV Full HD (?telas=<id>, temas claro e escuro); o que não é do indicador fica
   invisível, os vazios que sobram são fechados e a imagem é gravada em
   img/kpi/<indicador>-claro.webp e -escuro.webp. O índice img/kpi/indice.json guarda as
   dimensões; atualizar.py o leva para js/indicadores.js. Rode de novo quando o videowall mudar
   o visual de algum card e depois rode python atualizar.py. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');
const SAIDA = path.join(RAIZ, 'img', 'kpi');
const MAIOR_LADO = 720;   // a ficha mostra a miniatura com até ~400 px de largura: 720 fica nítido em telas 2x
const QUALIDADE = 0.84;
const TEMAS = ['claro', 'escuro'];

const caixa = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(RAIZ, 'js', 'indicadores.js'), 'utf8'), caixa);
const C = caixa.window.COE;
const linhas = C.linhas.map(l => Object.fromEntries(C.campos.map((k, i) => [k, l[i]])));
const RECORTES = JSON.parse(fs.readFileSync(path.join(RAIZ, 'fonte', 'miniaturas-kpi.json'), 'utf8')).indicadores;
const base = (process.argv[2] || C.url).replace(/\/?$/, '/');

// MINIATURAS_SO=AVR-REC-A01,AVR-CLA (prefixos) refaz só esses indicadores e mantém os demais
const SO = (process.env.MINIATURAS_SO || '').split(',').map(x => x.trim()).filter(Boolean);
const porTela = {};
for (const r of linhas) {
  if (!r.vw || !C.telas[r.cod] || (SO.length && !SO.some(p => r.id.startsWith(p)))) continue;
  (porTela[r.cod] = porTela[r.cod] || []).push(r);
}

/* ---------- no navegador: separa a parte do indicador e esconde o resto ---------- */
function isolar({ codigo, spec }) {
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const visivel = e => e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const todosVis = (raiz, sel) => [...raiz.querySelectorAll(sel)].filter(visivel);
  const escondidos = window.__escondidos = [];
  let periodo = false;

  let cards = todosVis(document, '[data-codigo="' + codigo + '"]');
  if (!cards.length) {
    // card de outro período da tela (ex.: Hoje, 7 dias): escolhe o período no seletor da própria tela
    const bloco = document.querySelector('[data-codigo="' + codigo + '"]');
    const per = bloco && bloco.closest('[data-periodo]');
    const bt = per && document.querySelector('button[data-prod-periodo="' + per.dataset.periodo + '"], button[data-periodo="' + per.dataset.periodo + '"]');
    if (bt) { bt.click(); periodo = true; cards = todosVis(document, '[data-codigo="' + codigo + '"]'); }
  }
  if (!cards.length) return { erro: 'card não visível' };
  const card = cards[spec.elem_n || 0] || cards[0];
  // listas que rolam sozinhas na TV começam do topo (a rolagem automática fica parada no gerador)
  document.querySelectorAll('.table-scroll').forEach(t => { t.scrollTop = 0; });
  let raiz = card;
  if (spec.raiz) raiz = todosVis(card, spec.raiz)[spec.raiz_n || 0] || card;

  function achar(onde, s) {
    let els;
    if (s.todos === 'primeiros') els = s.alvo.split(',').map(p => todosVis(onde, p.trim())[0]).filter(Boolean);
    else els = todosVis(onde, s.alvo);
    if (s.tem) els = els.filter(e => norm(e.textContent).includes(norm(s.tem)));
    if (!s.todos) els = els.slice(0, 1);
    // sub: as partes de dentro do (primeiro) alvo, todas
    if (s.sub) els = els.flatMap(e => todosVis(e, s.sub));
    return els;
  }
  function coluna(onde, s) {
    const tabela = todosVis(onde, 'table')[0];
    if (!tabela) return [];
    const cab = [...tabela.querySelectorAll('thead th')];
    const i = cab.findIndex(th => s.exato ? norm(th.textContent) === norm(s.coluna) : norm(th.textContent).startsWith(norm(s.coluna)));
    if (i < 0) return [];
    // só as linhas que aparecem na área de rolagem da tabela, até seis
    let caixa = tabela.parentElement;
    while (caixa && caixa !== document.body && !/(auto|scroll|hidden)/.test(getComputedStyle(caixa).overflowY)) caixa = caixa.parentElement;
    const limite = caixa && caixa !== document.body ? caixa.getBoundingClientRect().bottom : Infinity;
    let corpo = [...tabela.querySelectorAll('tbody tr')].filter(visivel);
    if (s.linhas_tem) corpo = corpo.filter(tr => norm(tr.textContent).includes(norm(s.linhas_tem)));
    corpo = corpo.filter(tr => tr.getBoundingClientRect().bottom <= limite + 1).slice(0, 6);
    const cols = s.com_primeira && i > 0 ? [0, i] : [i];
    const celulas = [];
    cols.forEach(c => { celulas.push(cab[c]); });
    if (s.rodape) {
      const rod = [...tabela.querySelectorAll('tfoot tr')].filter(visivel).pop();
      if (rod) celulas.push(rod.cells[0], rod.cells[i]);
    } else corpo.forEach(tr => cols.forEach(c => tr.cells[c] && celulas.push(tr.cells[c])));
    return celulas.filter(Boolean);
  }

  let alvos, titulo = null, escopo = card;
  if (spec.doc) {
    alvos = todosVis(document, spec.doc);
    if (!spec.todos) alvos = alvos.slice(0, 1);
    escopo = null;
  } else if (spec.coluna) alvos = coluna(raiz, spec);
  else if (spec.alvo) alvos = achar(raiz, spec);
  else alvos = [raiz];
  if (!alvos.length) return { erro: 'alvo não encontrado' };

  const extras = (spec.mais || []).flatMap(m => { const r = achar(raiz, m); return r.length ? r : achar(card, m); });
  if (escopo && spec.titulo !== false && !alvos.includes(raiz)) {
    const cand = spec.titulo || '.kpi-label, h3, .moega-name, .sa-name, .secador-bloco-nome, .secador-ponto-nome, .secador-col-titulo, .secador-nome, .pr-sec-nome, .fluxo-etapa-nome, .exp-contrato-cliente, .pv-agora-cidade, .est-tile-nome';
    titulo = todosVis(raiz, cand)[0] || todosVis(card, cand)[0] || null;
    if (titulo && [...alvos, ...extras].some(a => a.contains(titulo) || titulo.contains(a))) titulo = null;
  }
  const manter = [...alvos, ...extras, titulo].filter(Boolean);
  window.__titulo = titulo;

  // parte que fica abaixo da área visível de uma lista com rolagem (ex.: linha Geral no fim da tabela)
  const rolavel = e => {
    for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(p).overflowY) && p.scrollHeight > p.clientHeight + 1) return p;
    }
    return null;
  };
  [...alvos, ...extras].forEach(e => {
    const p = rolavel(e);
    if (!p) return;
    const r = e.getBoundingClientRect(), b = p.getBoundingClientRect();
    if (r.bottom > b.bottom) p.scrollTop += r.bottom - b.bottom + 2;
  });

  // tudo o que não é do indicador fica invisível, sem mudar o desenho do card; o selo do código também sai
  const estilo = document.createElement('style');
  estilo.id = 'coe-mini';
  estilo.textContent = '[data-codigo]::before{visibility:hidden!important}';
  document.head.append(estilo);
  if (escopo && !manter.includes(escopo)) (function esconder(el) {
    for (const f of el.children) {
      if (manter.includes(f)) continue;
      if (manter.some(m => f.contains(m))) esconder(f);
      else { escondidos.push([f, f.style.visibility]); f.style.visibility = 'hidden'; }
    }
  })(escopo);

  // rótulos e título contam pelo texto, não pela caixa (um título de bloco ocupa a largura toda)
  const texto = e => { const r = document.createRange(); r.selectNodeContents(e); const b = r.getBoundingClientRect(); return b.width && b.height ? b : e.getBoundingClientRect(); };
  const limite = escopo ? escopo.getBoundingClientRect() : null;
  function caixa(rs, m) {
    let x0 = Math.min(...rs.map(r => r.left)) - m, y0 = Math.min(...rs.map(r => r.top)) - m;
    let x1 = Math.max(...rs.map(r => r.right)) + m, y1 = Math.max(...rs.map(r => r.bottom)) + m;
    if (limite) { x0 = Math.max(x0, limite.left + 1); y0 = Math.max(y0, limite.top + 1); x1 = Math.min(x1, limite.right - 1); y1 = Math.min(y1, limite.bottom - 1); }
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  }
  // célula que junta várias colunas (ex.: Geral) conta pelo texto, para não trazer o vazio ao lado
  const rsCorpo = [...alvos.map(e => (e.colSpan > 1 ? texto(e) : e.getBoundingClientRect())), ...extras.map(texto)].filter(r => r.width && r.height);
  if (!rsCorpo.length) return { erro: 'recorte vazio' };
  const corpo = caixa(rsCorpo, 10);
  // faixas ocupadas, para fechar os vazios entre elas sem distorcer barras e gráficos
  const faixas = (a, b) => rsCorpo.map(r => [Math.max(0, r[a] - corpo[a === 'left' ? 'x' : 'y'] - 3), r[b] - corpo[a === 'left' ? 'x' : 'y'] + 3])
    .sort((u, v) => u[0] - v[0]).reduce((acc, f) => { const u = acc[acc.length - 1]; if (u && f[0] <= u[1]) u[1] = Math.max(u[1], f[1]); else acc.push(f); return acc; }, []);
  const tit = titulo ? caixa([texto(titulo)], 7) : null;
  const pagina = c => c && { x: c.x + scrollX, y: c.y + scrollY, width: c.width, height: c.height };
  return { corpo: pagina(corpo), titulo: pagina(tit), xs: faixas('left', 'right'), ys: faixas('top', 'bottom'), periodo };
}

// o título vai numa faixa própria, em cima: some do corpo para não aparecer duas vezes
function semTitulo() {
  const t = window.__titulo;
  if (t) { window.__escondidos.push([t, t.style.visibility]); t.style.visibility = 'hidden'; }
}

function restaurar() {
  (window.__escondidos || []).forEach(([e, v]) => { e.style.visibility = v; });
  window.__escondidos = [];
  const st = document.getElementById('coe-mini');
  if (st) st.remove();
}

/* ---------- no navegador: fecha os vazios largos, junta título e corpo, reduz e grava em WebP ---------- */
async function acabar({ corpo, titulo, xs, ys, dpr, maior, q }) {
  const carregar = async b64 => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); return i; };
  const img = await carregar(corpo);
  const W = img.width, H = img.height;
  // mantém as faixas ocupadas; vazio maior que 28 px vira 14 px (em pixels de CSS)
  function partes(ocup, total) {
    const out = [];
    let pos = 0;
    for (const [a0, b0] of ocup) {
      const a = Math.round(a0 * dpr), b = Math.min(total, Math.round(b0 * dpr));
      if (a > pos) { const vazio = a - pos; const fica = vazio > 28 * dpr ? 14 * dpr : vazio; out.push([a - fica, a, pos > 0]); }
      if (b > a) out.push([Math.max(a, pos), b, false]);
      pos = Math.max(pos, b);
    }
    if (pos < total) out.push([pos, Math.min(total, pos + 10 * dpr)]);
    return out.filter(([a, b]) => b > a);
  }
  const cols = partes(xs, W), lins = partes(ys, H);
  const cw = cols.reduce((t, f) => t + f[1] - f[0], 0), ch = lins.reduce((t, f) => t + f[1] - f[0], 0);
  let c1 = document.createElement('canvas');
  c1.width = cw; c1.height = ch;
  const g1 = c1.getContext('2d', { willReadFrequently: true });
  const cortes = [];
  let dy = 0;
  for (const [ya, yb] of lins) {
    let dx = 0;
    for (const [xa, xb, vao] of cols) {
      g1.drawImage(img, xa, ya, xb - xa, yb - ya, dx, dy, xb - xa, yb - ya);
      if (vao && dy === 0) cortes.push(dx + (xb - xa) / 2);
      dx += xb - xa;
    }
    dy += yb - ya;
  }
  const fundo = g1.getImageData(2, 2, 1, 1).data, cor = 'rgb(' + fundo[0] + ',' + fundo[1] + ',' + fundo[2] + ')';
  // faixa muito larga (várias colunas lado a lado): quebra nos vãos entre colunas e empilha
  if (cw / ch > 3.2 && cortes.length) {
    const n = Math.min(4, Math.max(2, Math.round(Math.sqrt(cw / ch / 1.8))));
    const pos = [0];
    for (let k = 1; k < n; k += 1) {
      const alvo = cw * k / n, c = cortes.filter(x => x > pos[pos.length - 1] + 40).sort((a, b) => Math.abs(a - alvo) - Math.abs(b - alvo))[0];
      if (c !== undefined && Math.abs(c - alvo) < cw / n * 0.45) pos.push(Math.round(c));
    }
    pos.push(cw);
    if (pos.length > 2) {
      const larg = Math.max(...pos.slice(1).map((x, i) => x - pos[i])), esp = 8 * dpr;
      const c = document.createElement('canvas');
      c.width = larg; c.height = (pos.length - 1) * ch + (pos.length - 2) * esp;
      const g = c.getContext('2d');
      g.fillStyle = cor; g.fillRect(0, 0, c.width, c.height);
      pos.slice(1).forEach((x, i) => g.drawImage(c1, pos[i], 0, x - pos[i], ch, 0, i * (ch + esp), x - pos[i], ch));
      c1 = c;
    }
  }
  // título do card em cima, alinhado à esquerda, sobre o fundo do próprio card
  let final = c1;
  if (titulo) {
    const t = await carregar(titulo);
    const c = document.createElement('canvas');
    c.width = Math.max(c1.width, t.width); c.height = t.height + c1.height;
    const g = c.getContext('2d');
    g.fillStyle = cor;
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(t, 0, 0);
    g.drawImage(c1, 0, t.height);
    final = c;
  }
  // reduz em etapas (metade por vez) para não serrilhar
  let fonte = final, w = final.width, h = final.height;
  const k = Math.min(1, maior / Math.max(w, h)), aw = Math.max(1, Math.round(w * k)), ah = Math.max(1, Math.round(h * k));
  while (w / 2 > aw) {
    const c = document.createElement('canvas');
    c.width = Math.round(w / 2); c.height = Math.round(h / 2);
    c.getContext('2d').drawImage(fonte, 0, 0, c.width, c.height);
    fonte = c; w = c.width; h = c.height;
  }
  const c2 = document.createElement('canvas');
  c2.width = aw; c2.height = ah;
  const g2 = c2.getContext('2d');
  g2.imageSmoothingQuality = 'high';
  g2.drawImage(fonte, 0, 0, aw, ah);
  return { dados: c2.toDataURL('image/webp', q), w: aw, h: ah };
}

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const anterior = SO.length && fs.existsSync(path.join(SAIDA, 'indice.json')) ? JSON.parse(fs.readFileSync(path.join(SAIDA, 'indice.json'), 'utf8')).indicadores || {} : {};
  if (!SO.length) for (const f of fs.readdirSync(SAIDA)) if (f.endsWith('.webp')) fs.unlinkSync(path.join(SAIDA, f));
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  // na TV as listas longas descem sozinhas; para a foto, ficam paradas
  await contexto.addInitScript(() => {
    const original = window.setInterval;
    window.setInterval = function (fn, ms, ...resto) { return fn && fn.name === 'rolarListasTv' ? 0 : original.call(this, fn, ms, ...resto); };
  });
  const pagina = await contexto.newPage();
  const indice = Object.assign({}, anterior), faltas = [];
  for (const [cod, inds] of Object.entries(porTela)) {
    const tela = C.telas[cod];
    for (const tema of TEMAS) {
      // a Visão geral é o próprio mural (8 TVs); as demais abrem sozinhas, como num quadro do mural
      const url = base + (tela.id === 'geral' ? '?' : '?telas=' + encodeURIComponent(tela.id) + '&') + 'tema=' + tema;
      const abrir = async () => {
        await pagina.goto(url, { waitUntil: 'load', timeout: 120000 });
        await pagina.evaluate(() => document.fonts.ready);
        await pagina.waitForTimeout(tela.id === 'geral' ? 9000 : 1500);
      };
      await abrir();
      for (const r of inds) {
        const spec = RECORTES[r.id] || {};
        const res = await pagina.evaluate(isolar, { codigo: r.vw, spec });
        if (res.erro || !res.corpo || res.corpo.width < 8 || res.corpo.height < 8) {
          faltas.push(r.id + ' (' + tema + '): ' + (res.erro || 'recorte vazio'));
          await pagina.evaluate(restaurar);
          continue;
        }
        if (res.periodo) await pagina.waitForTimeout(700);
        const foto = c => pagina.screenshot({ clip: c, fullPage: true, animations: 'disabled' }).then(b => b.toString('base64'));
        const titulo = res.titulo ? await foto(res.titulo) : null;
        if (titulo) await pagina.evaluate(semTitulo);
        const corpo = await foto(res.corpo);
        await pagina.evaluate(restaurar);
        const img = await pagina.evaluate(acabar, { corpo, titulo, xs: res.xs, ys: res.ys, dpr: 2, maior: MAIOR_LADO, q: QUALIDADE });
        fs.writeFileSync(path.join(SAIDA, r.id + '-' + tema + '.webp'), Buffer.from(img.dados.split(',')[1], 'base64'));
        indice[r.id] = Object.assign({ w: img.w, h: img.h, card: r.vw }, spec.nota ? { nota: spec.nota } : {});
        process.stdout.write('.');
        if (res.periodo) await abrir(); // volta ao período padrão da tela para o próximo indicador
      }
    }
  }
  await navegador.close();
  const ordenado = Object.fromEntries(Object.keys(indice).sort().map(k => [k, indice[k]]));
  fs.writeFileSync(path.join(SAIDA, 'indice.json'), JSON.stringify({ videowall: base, gerado: new Date().toISOString().slice(0, 10), indicadores: ordenado }, null, 1) + '\n');
  console.log('\n' + Object.keys(ordenado).length + ' indicadores em img/kpi/' + (faltas.length ? '\nSem recorte: ' + faltas.join('; ') : ''));
  if (faltas.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
