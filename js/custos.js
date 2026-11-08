/* Custos do estudo de viabilidade ligados à infraestrutura, a partir de js/viabilidade-dados.js.
   Cada item do catálogo (aba 04 da planilha) pertence a um bloco de fonte/custos-vinculos.json; o bloco diz
   em que página do material o item é tratado. Aqui só se lê e se soma: nenhum valor é digitado à mão. */
(function () {
  'use strict';
  const V = window.VIAB;
  if (!V || !V.custos || !V.vinculos) return;

  const esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const fmt = (v, d) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const reais = v => 'R$ ' + fmt(Math.round(v));
  const curto = v => v >= 1e6 ? 'R$ ' + fmt(v / 1e6, 2).replace(/,?0+$/, '') + ' mi' : v >= 1e3 ? 'R$ ' + fmt(v / 1e3) + ' mil' : reais(v);
  const qtd = v => fmt(v, Number.isInteger(v) ? 0 : 1);
  const tri = t => String(t).replace(/A(\d) Q(\d)/, 'Ano $1, T$2');
  const plural = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);
  const CEN = V.cenarios.nomes, CURTO = ['Mín', 'Rec', 'Comp'];
  const PLANILHA = 'Viabilidade/' + V.fonte;
  const ABA = '04_Business_Case';

  const POR_ID = Object.fromEntries(V.custos.map(c => [c.id, c]));
  const BLOCOS = V.vinculos.blocos.map(b => Object.assign({}, b, { itens: b.ids.map(i => POR_ID[i]) }));
  const POR_BLOCO = Object.fromEntries(BLOCOS.map(b => [b.id, b]));
  const CAMADAS = V.vinculos.camadas;
  const ESTRUTURA = (function () {
    try { return JSON.parse(document.getElementById('estrutura').textContent); } catch (e) { return []; }
  })();
  const PAGINAS = {};
  ESTRUTURA.forEach(e => e.paginas.forEach(p => { PAGINAS[e.id + '/' + p.id] = { titulo: p.titulo, grupo: p.grupo, capitulo: e.nome }; }));
  const pagina = rota => rota.split('/').slice(0, 2).join('/');
  const ondeTxt = b => (PAGINAS[pagina(b.rota)] || {}).titulo || '';

  const soma = (itens, k) => itens.reduce((t, i) => t + i[k], 0);
  const noCenario = (itens, n) => itens.filter(x => x.cen[n]).reduce((t, x) => t + x.total, 0);
  const consultados = itens => itens.filter(x => x.valor === 'QQP').length;
  const faixa = (b, a) => b === a ? '' : 'faixa ' + reais(b) + ' a ' + reais(a);
  const cenariosDe = c => CEN.filter((n, i) => c.cen[i]);
  const linkPlanilha = '<a href="' + esc(PLANILHA) + '" download>planilha do estudo</a>';
  const catalogo = tok => '#viabilidade/investimento-e-retorno/catalogo' + (tok ? '/' + tok : '');
  /* blocos da infraestrutura têm âncora própria (#pagina/custo-<bloco>); os de gestão apontam para o capítulo que trata o tema */
  const ondeHref = b => '#' + (b.rota.startsWith('dados/') ? pagina(b.rota) + '/custo-' + b.id : b.rota);

  function selos(c) {
    const em = cenariosDe(c);
    return '<span class="cv-cn" role="img" aria-label="' + (em.length ? 'Entra no cenário ' + em.join(', ') : 'Fora dos cenários') + '">' +
      CURTO.map((r, i) => '<i' + (c.cen[i] ? ' class="on"' : '') + ' aria-hidden="true">' + r + '</i>').join('') + '</span>';
  }

  function item(c) {
    return '<li class="cv-it">' +
      '<span class="cv-id">' + esc(c.id) + '</span>' +
      '<span class="cv-nm"><b>' + esc(c.item) + '</b><small>' + esc(c.espec) + '</small></span>' +
      '<span class="cv-q"><b>' + qtd(c.qtd) + ' ' + esc(c.un) + '</b><small>× ' + reais(c.unit) + '</small></span>' +
      '<span class="cv-tt"><b>' + reais(c.total) + '</b><small>' + faixa(c.baixo, c.alto) + '</small></span>' +
      '<span class="cv-mt">' + selos(c) + '<small>' + tri(c.ini) + ' · ' + (c.valor === 'QQP' ? 'preço consultado' : 'estimativa') + '</small></span>' +
      '</li>';
  }
  const lista = itens => '<ul class="cv-lista">' + itens.map(item).join('') + '</ul>';

  /* ---------- bloco isolado, junto do equipamento ---------- */
  function bloco(b) {
    const t = soma(b.itens, 'total'), em = CEN.filter((n, i) => b.itens.some(x => x.cen[i]));
    const cen = em.length === 3 ? 'Entra nos três cenários'
      : em.length ? 'Entra ' + (em.length === 1 ? 'no cenário ' : 'nos cenários ') + em.join(' e ') : 'Fora dos cenários';
    return '<aside class="cv cv-solo" data-secao="custo-' + b.id + '" aria-label="Investimento associado no estudo de viabilidade: ' + esc(b.titulo) + '">' +
      '<div class="cv-cab"><span class="cv-k">Estudo de viabilidade · investimento associado</span>' +
      '<b class="cv-t">' + esc(b.titulo) + '</b><span class="cv-val">' + reais(t) + '</span></div>' +
      lista(b.itens) +
      '<div class="cv-pe"><span>' + cen + ' · valores da ' + linkPlanilha + ', aba ' + ABA + '</span>' +
      '<a class="cv-ir" href="' + catalogo(b.id) + '">Ver no catálogo de custos</a></div></aside>';
  }

  /* ---------- bloco como linha de um resumo ---------- */
  function linha(b, maior, aqui) {
    const t = soma(b.itens, 'total'), rec = noCenario(b.itens, 1);
    const fora = aqui && pagina(b.rota) === aqui && !b.rota.endsWith('/custos');
    return '<details class="cv cv-lin" data-secao="custo-' + b.id + '"><summary>' +
      '<span class="cv-tit"><b>' + esc(b.titulo) + '</b><small>' + plural(b.itens.length, 'item', 'itens') +
      ' · ' + (rec ? 'Recomendado ' + curto(rec) : soCenarios(b.itens)) + '</small></span>' +
      '<span class="cv-bar" aria-hidden="true"><i style="width:' + Math.max(2, t / maior * 100).toFixed(1) + '%"></i></span>' +
      '<span class="cv-val">' + reais(t) + '</span></summary>' + lista(b.itens) +
      (fora ? '<p class="cv-nota">Também aparece junto do equipamento, em <a href="#' + esc(b.rota) + '">' + esc(rotuloSecao(b.rota)) + '</a>.</p>' : '') +
      '</details>';
  }
  function soCenarios(itens) {
    const em = CEN.filter((n, i) => itens.some(x => x.cen[i]));
    return em.length ? 'só no cenário ' + em.join(' e ') : 'fora dos cenários';
  }
  function rotuloSecao(rota) {
    const s = rota.split('/')[2], art = document.getElementById('p-' + rota.split('/').slice(0, 2).join('-'));
    const el = s && art && art.querySelector('[data-secao="' + s + '"]');
    const h = el && el.querySelector('h3');
    return h ? h.textContent.replace(/^\d+/, '').trim() : ondeTxt({ rota: rota });
  }

  function totais(itens) {
    return '<div class="cr-top"><div class="cr-tot"><small>Custo direto previsto em 3 anos, na base do estudo</small><b>' + reais(soma(itens, 'total')) + '</b>' +
      '<span>' + faixa(soma(itens, 'baixo'), soma(itens, 'alto')) + ' · ' + plural(itens.length, 'item', 'itens') + ', ' +
      consultados(itens) + ' com preço consultado</span></div>' +
      '<dl class="cr-cen" aria-label="Quanto entra em cada cenário">' + CEN.map((n, i) => {
        const v = noCenario(itens, i);
        return '<div' + (i === 1 ? ' class="rec"' : '') + '><dt>' + n + '</dt><dd' + (v ? '>' + curto(v) : ' title="Nenhum item entra neste cenário">fora') + '</dd></div>';
      }).join('') + '</dl></div>';
  }

  /* ---------- resumo de uma página da infraestrutura ---------- */
  function resumoPagina(el) {
    const rota = el.dataset.custoPagina, blocos = BLOCOS.filter(b => pagina(b.rota) === rota);
    const itens = blocos.flatMap(b => b.itens), maior = Math.max(...blocos.map(b => soma(b.itens, 'total')));
    blocos.sort((a, b) => soma(b.itens, 'total') - soma(a.itens, 'total'));
    el.innerHTML = '<div class="cr">' + totais(itens) +
      '<div class="cr-blocos">' + blocos.map(b => linha(b, maior, rota)).join('') + '</div>' +
      '<p class="cr-fonte">Valores, quantidades e cenários lidos da ' + linkPlanilha + ' (aba ' + ABA + '), sem contingência e sujeitos a cotação. ' +
      '<a class="cv-ir" href="' + catalogo(rota.split('/')[1]) + '">Ver estes itens no catálogo de custos</a></p></div>';
  }

  /* ---------- visão do capítulo: quanto cada página da infraestrutura soma ---------- */
  function resumoCapitulo(el) {
    const infra = BLOCOS.filter(b => b.camada <= 8), todos = V.custos;
    const rotas = [...new Set(infra.map(b => pagina(b.rota)))];
    const cartoes = rotas.map(r => {
      const bl = infra.filter(b => pagina(b.rota) === r), it = bl.flatMap(b => b.itens);
      const camadas = [...new Set(bl.map(b => b.camada))].map(n => (CAMADAS.find(c => c.n === n) || {}).nome);
      return { r: r, it: it, t: soma(it, 'total'), camadas: camadas };
    });
    const maior = Math.max(...cartoes.map(c => c.t)), tInfra = soma(infra.flatMap(b => b.itens), 'total');
    el.innerHTML = '<div class="cc">' + cartoes.map(c => {
      const p = PAGINAS[c.r] || {};
      return '<a class="cc-c" href="#' + c.r + '/custos"><small>' + esc(p.grupo || '') + '</small><b>' + esc(p.titulo || c.r) + '</b>' +
        '<span class="cc-v">' + curto(c.t) + '</span><span class="cc-bar" aria-hidden="true"><i style="width:' + (c.t / maior * 100).toFixed(1) + '%"></i></span>' +
        '<span class="cc-d">' + esc(c.camadas.join(', ')) + ' · ' + plural(c.it.length, 'item', 'itens') + '</span>' +
        '<span class="cc-rec">Recomendado: ' + curto(noCenario(c.it, 1)) + '</span></a>';
    }).join('') + '</div>' +
      '<p class="cr-fonte">A infraestrutura soma ' + reais(tInfra) + ' dos ' + reais(soma(todos, 'total')) + ' do catálogo (' + fmt(tInfra / soma(todos, 'total') * 100) +
      '%); o restante é projeto, equipe e gestão. Valores da ' + linkPlanilha + ', aba ' + ABA + ', sem contingência. ' +
      '<a class="cv-ir" href="' + catalogo() + '">Abrir o catálogo de custos</a></p>';
  }

  /* ---------- fichas: o que cada fornecedor exige e qual item do estudo cobre ---------- */
  function fornecedores(el) {
    const F = V.vinculos.fornecedores;
    const prio = p => /P1/.test(p) ? '<span class="sel grave"><i>●</i>Prioridade 1</span>' : /P2/.test(p) ? '<span class="sel aten"><i>●</i>Prioridade 2</span>' : '<span class="sel ok"><i>●</i>' + esc(p) + '</span>';
    const chip = i => { const c = POR_ID[i], b = POR_BLOCO[c.bloco];
      return '<a class="cv-chip" href="' + ondeHref(b) + '" title="' + esc(c.item) + '"><b>' + c.id + '</b> ' + curto(c.total) + '</a>'; };
    el.innerHTML = '<div class="tbl"><table class="cv-forn"><thead><tr><th>Fornecedor</th><th>Etapa</th><th>Prioridade</th><th>Como integrar</th><th>Hardware adicional</th><th>Itens do estudo</th></tr></thead><tbody>' +
      F.map(f => '<tr><td><b>' + esc(f.nome) + '</b><small>' + esc(f.ctrl) + '</small></td><td>' + esc(f.etapa) + '</td><td>' + prio(f.prio) + '</td><td>' + esc(f.acao) + '</td><td>' + esc(f.hw) + '</td><td><span class="cv-chips">' + f.ids.map(chip).join('') + '</span></td></tr>').join('') +
      '</tbody></table></div>';
  }

  /* ---------- valores em cartões e cadeias já existentes ---------- */
  function cartao(el) {
    const itens = el.dataset.custoIds.split(/\s+/).map(i => POR_ID[i]).filter(Boolean);
    const p = document.createElement('p');
    p.className = 'cv-card';
    p.innerHTML = '<b>' + curto(soma(itens, 'total')) + '</b> no estudo · ' + itens.map(c => c.id).join(', ') +
      ' <a href="' + esc(el.dataset.custoHref) + '">ver itens</a>';
    el.append(p);
  }
  function cadeia(ol) {
    ol.querySelectorAll('li[data-camada]').forEach(li => {
      const n = +li.dataset.camada, it = BLOCOS.filter(b => b.camada === n).flatMap(b => b.itens), c = CAMADAS.find(x => x.n === n);
      const a = document.createElement('a');
      a.className = 'cad-v';
      a.href = '#' + c.rota;
      a.innerHTML = '<b>' + curto(soma(it, 'total')) + '</b><small>' + plural(it.length, 'item', 'itens') + '</small>';
      a.setAttribute('aria-label', c.nome + ': ' + curto(soma(it, 'total')) + ' em ' + plural(it.length, 'item', 'itens') + ', ver na infraestrutura');
      li.append(a);
    });
    const g = BLOCOS.filter(b => b.camada === 9).flatMap(b => b.itens);
    const p = document.createElement('p');
    p.className = 'cr-fonte';
    p.innerHTML = 'Valor de cada camada em 3 anos, na base do estudo e sem contingência; o link leva à página da infraestrutura que detalha os itens. Projeto, equipe e gestão somam mais ' +
      curto(soma(g, 'total')) + '. <a class="cv-ir" href="' + catalogo() + '">Abrir o catálogo de custos</a>';
    ol.after(p);
  }

  /* ---------- catálogo completo, com filtros ---------- */
  function explorador(el) {
    const total = soma(V.custos, 'total');
    const nomeCamada = n => (CAMADAS.find(c => c.n === n) || {}).nome;
    const por = n => V.custos.filter(c => c.camada === n);
    const maior = Math.max(...CAMADAS.map(c => soma(por(c.n), 'total')));
    const pacote = nome => V.pacotes.findIndex(p => p.nome === nome) + 1;
    const estado = { tok: null, cen: -1, valor: '', q: '', ordem: 'id', todos: false };
    const PRIMEIROS = 12; // sem filtro, a lista abre curta e o leitor escolhe uma camada ou pede o catálogo inteiro
    el.innerHTML =
      '<section class="sec"><h3>Investimento por camada da cadeia do dado</h3><p class="vb-apoio">Clique em uma camada para filtrar o catálogo. O link leva à página do material que trata os itens.</p>' +
      '<ol class="cx-cam">' + CAMADAS.map(c => {
        const t = soma(por(c.n), 'total');
        return '<li><button type="button" data-tok="' + c.n + '" aria-pressed="false"><span class="n">' + (c.n < 9 ? c.n : '+') + '</span><b>' + esc(c.nome) + '</b>' +
          '<span class="cx-bar" aria-hidden="true"><i style="width:' + (t / maior * 100).toFixed(1) + '%"></i></span>' +
          '<span class="v">' + curto(t) + '</span><span class="p">' + fmt(t / total * 100) + '%</span></button>' +
          (c.n < 9 ? '<a href="#' + esc(c.rota) + '">' + esc((PAGINAS[pagina(c.rota)] || {}).titulo || '') + '</a>' : '<span class="cx-sem">Governança e roadmap</span>') + '</li>';
      }).join('') + '</ol></section>' +
      '<section class="sec cx" data-secao="itens"><h3>Itens do catálogo</h3>' +
      '<div class="cx-ctrl"><div class="seg-c" role="group" aria-label="Cenário">' +
      ['Todos os itens'].concat(CEN).map((n, i) => '<button type="button" data-cen="' + (i - 1) + '" aria-pressed="' + (i === 0) + '">' + n + '</button>').join('') + '</div>' +
      '<div class="seg-c" role="group" aria-label="Origem do valor"><button type="button" data-valor="" aria-pressed="true">Qualquer origem</button>' +
      '<button type="button" data-valor="QQP" aria-pressed="false">Preço consultado</button><button type="button" data-valor="Estimado" aria-pressed="false">Estimativa</button></div>' +
      '<label class="cx-busca"><span>Buscar no catálogo</span><input type="search" placeholder="Item, ID ou especificação" autocomplete="off"></label></div>' +
      '<p class="cx-res" aria-live="polite"></p><div class="tbl"><table class="cx-t"><thead><tr>' +
      '<th><button type="button" data-ordem="id">ID</button></th><th>Item</th><th>Qtd.</th><th class="cx-n">Unit. base</th>' +
      '<th class="cx-n"><button type="button" data-ordem="total">Total base</button></th><th>Início</th><th>Cenários</th><th>Onde aparece</th></tr></thead><tbody></tbody></table></div>' +
      '<p class="cr-fonte">Conferido na geração do material: a soma dos ' + V.custos.length + ' itens é igual ao total do catálogo da planilha (' + reais(total) + '), ' +
      'a soma por grupo e cenário é igual à tabela de cenários e as abas 02 e 04 trazem a mesma quantidade e o mesmo valor para cada item. ' +
      '<a class="cv-ir" href="' + esc(PLANILHA) + '" download>Baixar a planilha (.xlsx)</a></p></section>';

    const corpo = el.querySelector('tbody'), res = el.querySelector('.cx-res'), busca = el.querySelector('input');
    const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    function resolve(tok) {
      if (!tok) return null;
      if (POR_BLOCO[tok]) return { rot: POR_BLOCO[tok].titulo, ok: c => c.bloco === tok };
      if (/^\d$/.test(tok) && nomeCamada(+tok)) return { rot: 'Camada: ' + nomeCamada(+tok), ok: c => c.camada === +tok, camada: +tok };
      const pg = Object.keys(PAGINAS).find(r => r.split('/')[1] === tok && BLOCOS.some(b => pagina(b.rota) === r));
      if (pg) return { rot: PAGINAS[pg].titulo, ok: c => pagina(POR_BLOCO[c.bloco].rota) === pg };
      const m = /^pacote-(\d)$/.exec(tok), p = m && V.pacotes[+m[1] - 1];
      if (p) return { rot: 'Pacote: ' + p.nome.replace(/^\d+\.\s*/, ''), ok: c => c.pacote === p.nome };
      return null;
    }
    function desenha() {
      const f = resolve(estado.tok), q = norm(estado.q.trim());
      const vis = V.custos.filter(c => (!f || f.ok(c)) && (estado.cen < 0 || c.cen[estado.cen]) && (!estado.valor || c.valor === estado.valor) &&
        (!q || norm(c.id + ' ' + c.item + ' ' + c.espec + ' ' + c.obs).includes(q)));
      vis.sort(estado.ordem === 'total' ? (a, b) => b.total - a.total : (a, b) => a.id.localeCompare(b.id));
      el.querySelectorAll('.cx-cam button').forEach(b => b.setAttribute('aria-pressed', String(!!f && f.camada === +b.dataset.tok)));
      el.querySelectorAll('[data-cen]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.cen === estado.cen)));
      el.querySelectorAll('[data-valor]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.valor === estado.valor)));
      el.querySelectorAll('[data-ordem]').forEach(b => b.closest('th').setAttribute('aria-sort', b.dataset.ordem === estado.ordem ? (estado.ordem === 'total' ? 'descending' : 'ascending') : 'none'));
      const filtros = [f && f.rot, estado.cen >= 0 && 'cenário ' + CEN[estado.cen], estado.valor && (estado.valor === 'QQP' ? 'preço consultado' : 'estimativa'), q && '“' + estado.q.trim() + '”'].filter(Boolean);
      res.innerHTML = '<b>' + plural(vis.length, 'item', 'itens') + '</b> · ' + reais(soma(vis, 'total')) + ' na base' +
        (vis.length ? ' · ' + faixa(soma(vis, 'baixo'), soma(vis, 'alto')) : '') +
        (filtros.length ? ' · ' + esc(filtros.join(' · ')) + ' <button type="button" class="m-limpa">Limpar filtros</button>' : '');
      const corta = !filtros.length && !estado.todos && vis.length > PRIMEIROS;
      corpo.innerHTML = (vis.length ? (corta ? vis.slice(0, PRIMEIROS) : vis).map(c => {
        const b = POR_BLOCO[c.bloco];
        return '<tr><td><b>' + c.id + '</b></td><td><b>' + esc(c.item) + '</b><small>' + esc(c.espec) + '</small></td>' +
          '<td class="nw">' + qtd(c.qtd) + ' ' + esc(c.un) + '</td><td class="cx-n nw">' + reais(c.unit) + '</td>' +
          '<td class="cx-n nw"><b>' + reais(c.total) + '</b><small>' + faixa(c.baixo, c.alto) + '</small></td>' +
          '<td class="nw">' + tri(c.ini) + '<small>' + (c.valor === 'QQP' ? 'preço consultado' : 'estimativa') + ' · pacote ' + pacote(c.pacote) + '</small></td>' +
          '<td>' + selos(c) + '</td><td><a href="' + ondeHref(b) + '">' + esc(ondeTxt(b)) + '</a><small>' + esc(b.titulo) + '</small></td></tr>';
      }).join('') : '<tr><td colspan="8" class="cx-vazio">Nenhum item com estes filtros.</td></tr>') +
        (corta ? '<tr class="cx-mais"><td colspan="8"><button type="button" data-todos>Mostrar os ' + vis.length + ' itens do catálogo</button>' +
          '<span>ou escolha uma camada acima para ver só os itens dela</span></td></tr>' : '');
    }
    el.addEventListener('click', e => {
      const t = e.target.closest('button');
      if (!t || !el.contains(t)) return;
      if (t.dataset.tok) estado.tok = estado.tok === t.dataset.tok ? null : t.dataset.tok;
      else if (t.dataset.cen != null) estado.cen = +t.dataset.cen;
      else if (t.dataset.valor != null) estado.valor = t.dataset.valor;
      else if (t.dataset.ordem) estado.ordem = t.dataset.ordem;
      else if (t.hasAttribute('data-todos')) estado.todos = true;
      else if (t.classList.contains('m-limpa')) { estado.tok = null; estado.cen = -1; estado.valor = ''; estado.q = ''; busca.value = ''; }
      else return;
      desenha();
    });
    busca.addEventListener('input', () => { estado.q = busca.value; desenha(); });

    /* #viabilidade/investimento-e-retorno/catalogo/<bloco | página | camada | pacote-N | cenário> */
    function doEndereco() {
      let p;
      try { p = decodeURIComponent(location.hash.slice(1)).split('/'); } catch (e) { return; }
      if (p[0] !== 'viabilidade' || p[1] !== 'investimento-e-retorno' || p[2] !== 'catalogo') return;
      const tok = p[3] || '', cen = CEN.map(n => norm(n)).indexOf(norm(tok));
      estado.tok = cen < 0 && resolve(tok) ? tok : null;
      estado.cen = cen;
      estado.valor = ''; estado.q = ''; busca.value = '';
      desenha();
      if (tok) requestAnimationFrame(() => el.querySelector('.cx').scrollIntoView({ block: 'start' }));
    }
    window.addEventListener('hashchange', doEndereco);
    desenha();
    doEndereco();
  }

  document.querySelectorAll('[data-custo]').forEach(el => { const b = POR_BLOCO[el.dataset.custo]; if (b) el.innerHTML = bloco(b); });
  document.querySelectorAll('[data-custo-pagina]').forEach(resumoPagina);
  document.querySelectorAll('[data-custo-capitulo]').forEach(resumoCapitulo);
  document.querySelectorAll('[data-custo-fornecedores]').forEach(fornecedores);
  document.querySelectorAll('[data-custo-ids]').forEach(cartao);
  document.querySelectorAll('ol[data-custo-cadeia]').forEach(cadeia);
  document.querySelectorAll('[data-custo-catalogo]').forEach(explorador);
  window.COE_CUSTOS = { blocos: BLOCOS, porId: POR_ID, catalogo: catalogo, onde: ondeHref };
})();
