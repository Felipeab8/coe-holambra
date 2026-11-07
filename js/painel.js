/* Painel COE Holambra: navegação, mural ao vivo, ficha de KPI e busca. */
(function () {
  'use strict';
  const C = window.COE;
  const ESTRUTURA = JSON.parse(document.getElementById('estrutura').textContent);
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const raiz = document.documentElement;
  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento: vale só nesta visita */ } };
  const plural = (n, um, varios) => n + ' ' + (n === 1 ? um : varios);

  /* ---------- páginas ---------- */
  const paginas = [];
  ESTRUTURA.forEach((e, ei) => e.paginas.forEach((p, pi) => paginas.push({
    etapa: e, pagina: p, ei, pi, el: document.getElementById('p-' + e.id + '-' + p.id),
    hash: '#' + e.id + '/' + p.id,
  })));
  const FICHA = paginas.find(x => x.el.querySelector('#kpiCard'));
  const MURAL = paginas.find(x => x.el.querySelector('#mural'));
  let atual = null;

  /* cada etapa abre um menu com as suas páginas; o campo "grupo" de etapas.json vira coluna */
  const SETA = '<svg class="seta" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  $('#etapas').innerHTML = ESTRUTURA.map(e => {
    const grupos = [];
    e.paginas.forEach(p => {
      const g = grupos[grupos.length - 1];
      if (g && g.nome === (p.grupo || '')) g.paginas.push(p); else grupos.push({ nome: p.grupo || '', paginas: [p] });
    });
    const colunas = grupos.map(g => '<div class="sus-col">' + (g.nome ? '<span class="sus-rot">' + esc(g.nome) + '</span>' : '') +
      g.paginas.map((p, i) => '<a href="#' + e.id + '/' + p.id + '" style="--i:' + i + '">' + esc(p.titulo) + '</a>').join('') + '</div>').join('');
    return '<li class="etapa' + (grupos.length > 1 ? ' larga' : '') + (e.paginas.length === 1 ? ' unica' : '') + '" data-e="' + e.id + '">' +
      '<button type="button" class="etapa-l" aria-expanded="false" aria-controls="m-' + e.id + '"><span>' + esc(e.palavra || e.nome) + '</span>' + SETA + '</button>' +
      '<div class="suspenso" id="m-' + e.id + '"><div class="sus-in"><p class="sus-tit">' + esc(e.nome) + '</p><div class="sus-cols">' + colunas + '</div></div></div></li>';
  }).join('');

  function marcar(a) {
    $$('.etapa').forEach((li, i) => {
      li.classList.toggle('ativa', i === a.ei);
      li.classList.toggle('feita', i < a.ei);
    });
    $$('.suspenso a').forEach(l => {
      if (l.getAttribute('href') === a.hash) l.setAttribute('aria-current', 'page');
      else l.removeAttribute('aria-current');
    });
    $('#migalha').textContent = a.etapa.nome + ' / ' + a.pagina.titulo;
    const total = a.etapa.paginas.length;
    $('#posicao').textContent = total > 1 ? 'Página ' + (a.pi + 1) + ' de ' + total : '';
    document.title = a.pagina.titulo + ' | COE Holambra';
    raiz.dataset.pagina = a.etapa.id;
    window.dispatchEvent(new Event('coe:pagina'));
    document.querySelector('.migalha').hidden = a.etapa.id === 'inicio';
    const i = paginas.indexOf(a), ant = paginas[i - 1], prox = paginas[i + 1];
    const ponta = d => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (d < 0 ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7') + '"/></svg>';
    const botao = (p, d, rot) => (p
      ? '<a class="pg-bt ' + (d < 0 ? 'ant' : 'prox') + '" href="' + p.hash + '" aria-label="' + rot + ': ' + esc(p.pagina.titulo) + '"><span class="pg-seta">' + ponta(d) + '</span><span class="pg-txt"><small>' + rot + '</small><b>' + esc(p.pagina.titulo) + '</b></span></a>'
      : '');
    /* sem próxima, o lugar fica ocupado: quem vinha clicando não acerta o botão de voltar por engano */
    const fim = '<span class="pg-bt fim"><span class="pg-txt"><small>Próxima</small><b>Fim do painel</b></span></span>';
    $('#passos').innerHTML = botao(ant, -1, 'Anterior') + (prox ? botao(prox, 1, 'Próxima') : fim);
  }

  function mostrar(a, extra) {
    const trocou = a !== atual;
    if (trocou) {
      if (atual) { atual.el.hidden = true; if (atual === MURAL) desligarMural(); }
      a.el.hidden = false;
      atual = a;
      marcar(a);
      $$('iframe[data-src]', a.el).forEach(f => { f.src = f.dataset.src; f.removeAttribute('data-src'); });
      if (a === MURAL) ligarMural();
      window.scrollTo(0, 0);
      $('#conteudo').focus({ preventScroll: true });
      sincronizarModelos();
      window.dispatchEvent(new Event('resize')); // o diagrama de arquitetura mede a página visível
      fecharGaveta();
    }
    if (a === FICHA && extra) abrirIndicador(extra);
    else if (extra) {
      const secao = $$('[data-secao]', a.el).find(el => el.dataset.secao === extra);
      if (secao) requestAnimationFrame(() => secao.scrollIntoView({ block: 'start', behavior: 'instant' }));
      else if (abrirAba(a.el, extra)) window.scrollTo(0, 0);
    }
  }

  function rota() {
    let partes;
    try { partes = decodeURIComponent(location.hash.slice(1)).split('/'); }
    catch (erro) { partes = []; }
    const [e, p, extra] = partes;
    mostrar(paginas.find(x => x.etapa.id === e && (!p || x.pagina.id === p)) || paginas.find(x => x.etapa.id === e) || paginas[0], extra);
  }
  window.addEventListener('hashchange', rota);

  function passoPagina(d) {
    const p = paginas[paginas.indexOf(atual) + d];
    if (p) location.hash = p.hash;
  }

  /* ---------- abas: páginas irmãs reunidas sem alongar a rolagem ---------- */
  function selecionarAba(caixa, id) {
    $$(':scope > .abas-lista [role="tab"]', caixa).forEach(b => {
      const sim = b.dataset.aba === id;
      b.setAttribute('aria-selected', sim);
      b.tabIndex = sim ? 0 : -1;
    });
    $$(':scope > .aba', caixa).forEach(p => { p.hidden = p.dataset.aba !== id; });
    window.dispatchEvent(new Event('resize')); // gráficos medem a área visível
  }
  function abrirAba(pagina, id) {
    const p = $$('.aba', pagina).find(x => x.dataset.aba === id);
    if (p) selecionarAba(p.parentElement, id);
    return !!p;
  }
  $$('.abas').forEach(caixa => {
    const paineis = $$(':scope > .aba', caixa);
    const lista = document.createElement('div');
    lista.className = 'abas-lista';
    lista.setAttribute('role', 'tablist');
    lista.innerHTML = paineis.map((p, i) => '<button type="button" role="tab" data-aba="' + p.dataset.aba + '" id="aba-' + p.dataset.aba +
      '" aria-controls="painel-' + p.dataset.aba + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + esc(p.dataset.rotulo) + '</button>').join('');
    paineis.forEach(p => {
      p.id = 'painel-' + p.dataset.aba;
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', 'aba-' + p.dataset.aba);
    });
    caixa.prepend(lista);
    lista.addEventListener('click', e => {
      const b = e.target.closest('[role="tab"]');
      if (!b) return;
      selecionarAba(caixa, b.dataset.aba);
      try { history.replaceState(null, '', atual.hash + '/' + b.dataset.aba); } catch (x) { /* só o endereço deixa de acompanhar */ }
    });
    lista.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const l = $$('[role="tab"]', lista), i = l.indexOf(document.activeElement);
      const b = l[(i + (e.key === 'ArrowRight' ? 1 : -1) + l.length) % l.length];
      e.preventDefault(); e.stopPropagation();
      selecionarAba(caixa, b.dataset.aba);
      b.focus();
    });
  });

  /* ---------- menu, tema, tela cheia ---------- */
  const gavetaQuery = matchMedia('(max-width: 1240px)');
  const itensMenu = $$('.etapa');
  let esperaMenu = 0, ponteiro = 'mouse';
  function alternaItem(li, aberto) {
    li.classList.toggle('aberta', aberto);
    $('.etapa-l', li).setAttribute('aria-expanded', aberto);
  }
  const abrirItem = li => itensMenu.forEach(x => alternaItem(x, x === li));
  const fecharItens = () => itensMenu.forEach(x => alternaItem(x, false));
  function fecharGaveta() {
    $('#trilho').classList.remove('aberto');
    $('#veu').hidden = true;
    $('#btMenu').setAttribute('aria-expanded', 'false');
    fecharItens();
  }
  function alternarMenu() {
    if (!gavetaQuery.matches) return;
    const aberto = $('#trilho').classList.toggle('aberto');
    $('#veu').hidden = !aberto;
    $('#btMenu').setAttribute('aria-expanded', aberto);
    if (aberto) { const a = atual && $('.etapa[data-e="' + atual.etapa.id + '"]'); if (a) abrirItem(a); } else fecharItens();
  }
  document.addEventListener('pointerdown', e => {
    ponteiro = e.pointerType;
    if (!e.target.closest('.barra-topo')) fecharItens();
  });
  itensMenu.forEach((li, n) => {
    const botao = $('.etapa-l', li);
    li.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse' || gavetaQuery.matches) return;
      clearTimeout(esperaMenu);
      esperaMenu = setTimeout(() => abrirItem(li), 70);
    });
    li.addEventListener('pointerleave', e => {
      if (e.pointerType !== 'mouse' || gavetaQuery.matches) return;
      clearTimeout(esperaMenu);
      esperaMenu = setTimeout(fecharItens, 220);
    });
    botao.addEventListener('click', e => {
      clearTimeout(esperaMenu);
      /* etapa de uma página só não tem o que escolher: vai direto, em qualquer dispositivo */
      if (li.classList.contains('unica')) { location.hash = li.dataset.e; fecharGaveta(); return; }
      /* com o mouse o menu já abriu ao passar; o clique vai direto à primeira página da etapa */
      if (e.detail > 0 && ponteiro === 'mouse' && !gavetaQuery.matches) { location.hash = li.dataset.e; fecharItens(); return; }
      if (li.classList.contains('aberta')) alternaItem(li, false); else abrirItem(li);
    });
    botao.addEventListener('keydown', e => {
      const vai = d => { const b = $('.etapa-l', itensMenu[(n + d + itensMenu.length) % itensMenu.length]); b.focus(); if (itensMenu.some(x => x.classList.contains('aberta'))) abrirItem(b.parentElement); };
      if (e.key === 'ArrowRight') { e.preventDefault(); vai(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); vai(-1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); abrirItem(li); setTimeout(() => $('.suspenso a', li).focus(), 30); }
    });
    li.addEventListener('keydown', e => {
      if (e.key === 'Escape' && li.classList.contains('aberta')) { e.stopPropagation(); alternaItem(li, false); botao.focus(); }
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.target.closest('.suspenso')) {
        e.preventDefault();
        const l = $$('.suspenso a', li), i = l.indexOf(e.target);
        l[(i + (e.key === 'ArrowDown' ? 1 : -1) + l.length) % l.length].focus();
      }
    });
  });
  document.querySelector('.barra-topo').addEventListener('focusout', () => {
    setTimeout(() => {
      if (!document.activeElement.closest('.barra-topo')) fecharGaveta();
    }, 0);
  });
  gavetaQuery.addEventListener('change', fecharGaveta);
  $('.pular').addEventListener('click', e => {
    e.preventDefault(); $('#conteudo').focus({ preventScroll: true }); window.scrollTo(0, 0);
  });
  $('#btMenu').addEventListener('click', alternarMenu);
  $('#veu').addEventListener('click', fecharGaveta);
  $('#btTopo').addEventListener('click', () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));

  const temaUrl = () => (raiz.dataset.theme === 'light' ? 'claro' : 'escuro');
  const temaTela = () => (raiz.dataset.theme === 'light' ? 'theme-light' : 'theme-dark');
  $('#btTema').addEventListener('click', () => {
    raiz.dataset.theme = raiz.dataset.theme === 'light' ? 'dark' : 'light';
    guardar('coe:tema', raiz.dataset.theme);
    sincronizarModelos();
    $$('iframe.vw').forEach(f => { if (f.src && f.contentWindow) f.contentWindow.postMessage({ tipo: 'videowall:tema', tema: temaTela() }, new URL(C.url).origin); });
  });
  /* uma TV que ainda carregava quando o tema mudou recebe o tema atual ao terminar */
  document.addEventListener('load', e => {
    const f = e.target;
    if (f.matches && f.matches('iframe.vw') && f.src && f.contentWindow) f.contentWindow.postMessage({ tipo: 'videowall:tema', tema: temaTela() }, new URL(C.url).origin);
  }, true);

  function telaCheia() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (raiz.requestFullscreen) raiz.requestFullscreen().catch(() => {});
  }
  $('#btCheia').addEventListener('click', telaCheia);

  function sincronizarModelos() {
    $$('iframe', document.querySelector('#conteudo')).forEach(f => {
      if (f.classList.contains('vw') || !f.getAttribute('src') || !f.contentWindow) return;
      const url = new URL(f.getAttribute('src'), location.href);
      if (url.origin !== location.origin) return;
      const visivel = !document.hidden && !!f.getClientRects().length;
      f.contentWindow.postMessage({ tipo: 'coe:modelo', tema: raiz.dataset.theme, ativo: visivel }, url.origin === 'null' ? '*' : url.origin);
    });
  }
  // A ponte de edição compartilhada das câmeras é mantida em editor.js.
  document.addEventListener('visibilitychange', sincronizarModelos);
  document.addEventListener('coe:modelos', sincronizarModelos);
  document.addEventListener('load', e => {
    if (e.target.tagName === 'IFRAME') sincronizarModelos();
  }, true);

  /* modelos 3D: o scroll da página não fica preso no modelo; clique para interagir */
  $$('.model').forEach(m => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mshield'; b.innerHTML = '<span>Clique para interagir com o modelo 3D</span>';
    m.style.position = 'relative'; m.prepend(b);
    b.addEventListener('click', () => { b.hidden = true; const f = $('iframe', m); if (f) f.focus(); });
    m.addEventListener('mouseleave', () => { b.hidden = false; });
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('.mfs');
    if (!b) return;
    const m = $('.model', b.closest('.page'));
    if (m && m.requestFullscreen) m.requestFullscreen().catch(() => {});
  });

  /* ---------- telas do videowall ---------- */
  const mural = $('#mural');
  const srcTela = ids => C.url + '?telas=' + ids.map(encodeURIComponent).join(',') + '&tema=' + temaUrl();
  // cada iframe desenha uma TV em 1920x1080 e escala para o quadro, como o mural do videowall
  const escala = new ResizeObserver(es => es.forEach(({ target }) => {
    target.style.setProperty('--escala', target.clientWidth / 1920);
  }));

  // Liga uma TV por vez, só as que estão à vista: 8 telas abrindo juntas travam a página.
  let turno = null;
  const naVista = q => { const r = q.getBoundingClientRect(); return r.top < innerHeight + 120 && r.bottom > -120; };
  function ligarIframe(f, depois) {
    const aviso = f.parentElement && $('.tv-aviso', f.parentElement);
    let terminou = false;
    const finalizar = carregou => {
      if (terminou) return;
      terminou = true; clearTimeout(limite);
      if (carregou) f.dataset.ligada = Date.now();
      if (aviso) {
        aviso.hidden = carregou;
        if (!carregou) aviso.textContent = 'Tela indisponível. Abra o videowall ou tente novamente.';
      }
      if (depois) depois();
    };
    const limite = setTimeout(() => finalizar(false), 15000);
    f.addEventListener('load', () => finalizar(true), { once: true });
    f.addEventListener('error', () => finalizar(false), { once: true });
    f.src = f.dataset.tela;
  }
  function proximaTv() {
    clearTimeout(turno); turno = null;
    const f = $$('iframe.vw:not([src])', mural).find(x => naVista(x.parentElement));
    if (!f) return;
    turno = setTimeout(proximaTv, 2500);
    ligarIframe(f, () => { if (turno) proximaTv(); });
  }
  window.addEventListener('scroll', () => { if (!turno && mural.childElementCount) proximaTv(); }, { passive: true });

  function telaNoQuadro(q, ids, titulo) {
    $$('iframe', q).forEach(f => f.remove());
    const f = document.createElement('iframe');
    f.className = 'vw'; f.title = titulo; f.dataset.tela = srcTela(ids);
    const aviso = $('.tv-aviso', q);
    if (aviso) aviso.hidden = false;
    q.append(f);
    return f;
  }

  let visao = 'tatica';
  const escolhas = {}; // TV -> tela fixa escolhida; sem escolha, fica no rodízio
  const RODIZIO_MS = 10000; // igual a QUADRO_INTERVALO, no script.js do videowall

  function resumoTv(tv) {
    const p = [];
    if (tv.telas.length > 1) p.push(tv.telas.length + ' telas');
    p.push(plural(tv.ind, 'indicador', 'indicadores'));
    if (tv.alertas) p.push(tv.alertas + ' com alerta');
    return p.join(', ');
  }

  /* o videowall reveza as telas sozinho, a partir do carregamento: abre-se a que está à vista */
  function telaEmRodizio(tvEl, tv) {
    const ligada = +($('iframe', tvEl) || { dataset: {} }).dataset.ligada;
    return ligada ? tv.telas[Math.floor((Date.now() - ligada) / RODIZIO_MS) % tv.telas.length] : tv.telas[0];
  }

  function ligarMural() {
    const tvs = C[visao];
    mural.innerHTML =
      '<div class="mural-barra"><div class="seg" role="group" aria-label="Visão do mural">' +
      '<button type="button" data-visao="tatica" aria-pressed="' + (visao === 'tatica') + '">Camada tática</button>' +
      '<button type="button" data-visao="estrategica" aria-pressed="' + (visao === 'estrategica') + '">Visão estratégica</button></div>' +
      '<p>Clique em uma tela para abrir. ' + (visao === 'tatica' ? 'TVs com mais de uma tela fazem rodízio a cada 10 segundos.' : 'Histórico mensal e anual, uma tela por área.') + '</p>' +
      '<a href="' + esc(C.url) + '" target="_blank" rel="noopener">Abrir o videowall completo</a></div>' +
      '<div class="mural-grade">' + tvs.map((tv, i) =>
        '<figure class="tv" data-i="' + i + '"><div class="tv-tela"><span class="tv-aviso">Ligando a tela</span>' +
        '<button type="button" class="tv-abrir" aria-label="Abrir ' + esc(tv.nome) + '"><span>Abrir tela</span></button></div>' +
        '<figcaption><div class="tv-placa"><span class="tv-n">' + esc(tv.n) + '</span><div><b>' + esc(tv.nome) + '</b><small>' + resumoTv(tv) + '</small></div></div>' +
        (tv.telas.length > 1 ? '<div class="tv-abas" role="group" aria-label="Telas de ' + esc(tv.nome) + '">' +
          '<button type="button" data-t="" aria-pressed="true">Rodízio</button>' +
          tv.telas.map(t => '<button type="button" data-t="' + esc(t.cod) + '" aria-pressed="false">' + esc(t.titulo) + '</button>').join('') + '</div>' : '') +
        '</figcaption></figure>').join('') + '</div>';
    $$('.tv', mural).forEach((el, i) => {
      const tv = tvs[i], q = $('.tv-tela', el), fixa = escolhas[visao + i];
      const lista = fixa ? tv.telas.filter(t => t.cod === fixa) : tv.telas;
      telaNoQuadro(q, lista.map(t => t.id), tv.nome);
      if (fixa) $$('.tv-abas button', el).forEach(b => b.setAttribute('aria-pressed', b.dataset.t === fixa));
      escala.observe(q);
    });
    proximaTv();
  }

  function desligarMural() {
    clearTimeout(turno); turno = null;
    escala.disconnect();
    mural.innerHTML = ''; // fora da página as TVs saem, para não rodar telas escondidas
  }

  mural.addEventListener('click', e => {
    const v = e.target.closest('[data-visao]');
    if (v) { if (v.dataset.visao !== visao) { desligarMural(); visao = v.dataset.visao; ligarMural(); } return; }
    const tvEl = e.target.closest('.tv');
    if (!tvEl) return;
    const i = +tvEl.dataset.i, tv = C[visao][i];
    const aba = e.target.closest('.tv-abas button');
    if (aba) {
      escolhas[visao + i] = aba.dataset.t;
      $$('.tv-abas button', tvEl).forEach(b => b.setAttribute('aria-pressed', b === aba));
      const q = $('.tv-tela', tvEl), lista = aba.dataset.t ? tv.telas.filter(t => t.cod === aba.dataset.t) : tv.telas;
      ligarIframe(telaNoQuadro(q, lista.map(t => t.id), tv.nome));
      return;
    }
    if (e.target.closest('.tv-abrir')) {
      const lista = C[visao].flatMap(x => x.telas.map(t => Object.assign({ tv: x.nome }, t)));
      const cod = escolhas[visao + i] || telaEmRodizio(tvEl, tv).cod;
      abrirTelao(lista, lista.findIndex(t => t.cod === cod));
    }
  });

  /* telão: tela ampliada e funcional */
  const telao = $('#telao'), telaoTela = $('#telaoTela');
  let listaTelao = [], posTelao = 0;
  function telaDoTelao() {
    const t = listaTelao[posTelao];
    $('#telaoNome').textContent = t.tv || t.titulo;
    $('#telaoSub').textContent = t.tv ? t.titulo : '';
    $('#telaoConta').textContent = listaTelao.length > 1 ? (posTelao + 1) + ' de ' + listaTelao.length : '';
    $('#telaoLink').href = C.url + '?telas=' + encodeURIComponent(t.id);
    $$('[data-a="anterior"],[data-a="proxima"]', telao).forEach(b => { b.hidden = listaTelao.length < 2; });
    ligarIframe(telaNoQuadro(telaoTela, [t.id], t.titulo));
  }
  function abrirTelao(lista, i) {
    listaTelao = lista; posTelao = Math.max(0, i);
    telaDoTelao();
    telao.showModal();
    escala.observe(telaoTela);
  }
  function fecharTelao() { telao.close(); }
  telao.addEventListener('close', () => { escala.unobserve(telaoTela); telaoTela.innerHTML = ''; });
  telao.addEventListener('click', e => {
    if (e.target === telao) return fecharTelao();
    const a = e.target.closest('[data-a]');
    if (!a) return;
    if (a.dataset.a === 'fechar') return fecharTelao();
    posTelao = (posTelao + (a.dataset.a === 'proxima' ? 1 : -1) + listaTelao.length) % listaTelao.length;
    telaDoTelao();
  });

  /* ---------- lente das fichas por sistema ---------- */
  const lente = $('#lente');
  let listaLente = [], posLente = 0;
  function imagemDaLente() {
    const e = listaLente[posLente];
    $('#lenteImg').src = e.dataset.zoom; $('#lenteImg').alt = e.dataset.cap;
    $('#lenteNome').textContent = e.dataset.cap;
    $('#lenteConta').textContent = listaLente.length > 1 ? (posLente + 1) + ' de ' + listaLente.length : '';
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-zoom]');
    if (!t) return;
    listaLente = $$('[data-zoom][data-grp="' + t.dataset.grp + '"]');
    posLente = listaLente.indexOf(t);
    imagemDaLente(); lente.showModal();
  });
  lente.addEventListener('click', e => {
    if (e.target === lente) return lente.close();
    const a = e.target.closest('[data-a]');
    if (!a) return;
    if (a.dataset.a === 'fechar') return lente.close();
    posLente = (posLente + (a.dataset.a === 'proxima' ? 1 : -1) + listaLente.length) % listaLente.length;
    imagemDaLente();
  });

  /* ---------- ficha de KPI ---------- */
  const R = C.linhas.map(l => Object.fromEntries(C.campos.map((k, i) => [k, l[i]])));
  const POR_ID = Object.fromEntries(R.map(r => [r.id, r]));
  const el = {
    tela: $('#kpiTela'), busca: $('#kpiBusca'), forn: $('#kpiForn'), sit: $('#kpiSit'),
    alerta: $('#kpiAlerta'), onda: $('#kpiOnda'), lista: $('#kpiList'), card: $('#kpiCard'), conta: $('#kpiCount'),
  };
  let idAtual = R[0].id;

  const nomeTela = t => t.titulo;
  const opcoesTela = (rot, cods) => '<optgroup label="' + rot + '">' + cods.map(c =>
    '<option value="' + c + '">' + c + ' ' + esc(nomeTela(C.telas[c])) + ' (' + C.telas[c].n + ')</option>').join('') + '</optgroup>';
  const tatCods = Object.keys(C.telas).filter(c => !c.startsWith('E'));
  const estCods = Object.keys(C.telas).filter(c => c.startsWith('E'));
  el.tela.innerHTML = '<option value="">Todas as telas (' + R.length + ')</option>' + opcoesTela('Camada tática', tatCods) + opcoesTela('Visão estratégica', estCods);
  const fornecedores = [...new Set(R.map(r => r.forn).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
  el.forn.innerHTML = '<option value="">Todos</option>' + fornecedores.map(f => '<option>' + esc(f) + '</option>').join('');
  const sits = { Novo: 'Novos', Alterado: 'Alterados', Pendente: 'Pendentes' };
  el.sit.innerHTML = '<option value="">Todas</option>' + Object.keys(sits).map(s =>
    '<option value="' + s + '">' + sits[s] + ' (' + R.filter(r => r.sit === s).length + ')</option>').join('');

  el.onda.innerHTML = '<option value="">Todas</option>' + ['1', '2', '3'].map(o =>
    '<option value="' + o + '">Onda ' + o + ' (' + R.filter(r => r.onda === o).length + ')</option>').join('');

  const campo = x => (!x ? '<span class="vazio">Não informado</span>' : (norm(x) === 'validar' ? '<span class="val">Validar</span>' : esc(x)));
  const item = (rot, v) => '<div><span>' + rot + '</span><p>' + campo(v) + '</p></div>';

  function ficha(id) {
    const r = POR_ID[id];
    if (!Object.hasOwn(POR_ID, id)) return;
    idAtual = id;
    const al = /^sim/i.test(r.alerta), t = C.telas[r.cod];
    el.card.innerHTML =
      '<div class="kf-top"><span class="kf-id">' + esc(r.id) + '</span><span>' + esc(r.tela) + '</span>' +
      (r.sit ? '<span class="kf-sit ' + r.sit.toLowerCase() + '">' + r.sit + '</span>' : '') +
      '<button type="button" class="kf-ver" data-cod="' + esc(r.cod) + '">Ver na tela</button></div>' +
      '<h3><small>' + esc(r.card) + '</small>' + esc(r.ind) + '</h3><p class="kf-desc">' + esc(r.desc) + '</p>' +
      '<div class="kf-sec"><b>Exibição</b><div class="kf-grid">' +
      item('Unidade de medida', r.um) + item('Representação visual', r.rep) + item('Frequência de atualização', r.freq) +
      item('Menu lateral', r.menu) + item('Código no videowall', r.vw) + item('Unidade', r.unidade) + '</div></div>' +
      '<div class="kf-sec"><b>Dados</b><div class="kf-grid">' +
      item('Fornecedor de dados', r.forn) + item('Onda de implantação', r.onda ? 'Onda ' + r.onda : '') + item('Fonte de dados', r.fonte) + item('Relatório (fonte de extração)', r.rel) +
      (r.det ? item('Detalhamento (camada tática)', r.det) : '') + '</div></div>' +
      (r.calc && norm(r.calc) !== 'n/a' ? '<div class="kf-sec"><b>Cálculo</b><p class="kf-txt">' + esc(r.calc) + '</p></div>' : '') +
      '<div class="kf-sec"><b>Alerta</b>' + (al
        ? '<p class="kf-al on">Tem regra de alerta</p>' + (r.regra ? '<p class="kf-txt">' + esc(r.regra) + '</p>' : '') +
          (r.crit ? '<p class="kf-txt"><span>Critério de alerta</span>' + esc(r.crit) + '</p>' : '')
        : '<p class="kf-al">Sem regra de alerta</p>') + '</div>' +
      (r.obs ? '<div class="kf-sec"><b>Observação</b><p class="kf-txt">' + esc(r.obs) + '</p></div>' : '');
    $$('.kf-i', el.lista).forEach(b => {
      const selecionado = b.dataset.id === id;
      b.setAttribute('aria-selected', selecionado); b.tabIndex = selecionado ? 0 : -1;
    });
    if (t && t.id === 'geral') $('.kf-ver', el.card).textContent = 'Ver o mural';
  }

  function listar() {
    const t = el.tela.value, s = norm(el.busca.value.trim()), f = el.forn.value, si = el.sit.value, al = el.alerta.checked, on = el.onda.value;
    const F = R.filter(r => (!t || r.cod === t) && (!f || r.forn === f) && (!si || r.sit === si) && (!on || r.onda === on) &&
      (!al || /^sim/i.test(r.alerta)) && (!s || norm(r.ind + ' ' + r.card + ' ' + r.id + ' ' + r.desc).includes(s)));
    el.conta.textContent = plural(F.length, 'indicador', 'indicadores');
    let h = '', g = '';
    F.forEach(r => {
      const gg = (t ? '' : r.cod + ' ') + r.card;
      if (gg !== g) { g = gg; h += '<div class="kf-g">' + esc(gg) + '</div>'; }
      h += '<button type="button" class="kf-i" role="option" data-id="' + esc(r.id) + '"><span>' + esc(r.ind) + '</span><small>' + esc(r.id) + '</small></button>';
    });
    el.lista.innerHTML = h || '<p class="kf-c kf-nada">Nenhum indicador com esses filtros. Limpe a busca ou escolha outra tela.</p>';
    if (F.length) ficha(F.some(r => r.id === idAtual) ? idAtual : F[0].id);
    else el.card.innerHTML = '<p class="kf-nada" role="status">Nenhum indicador com esses filtros. Ajuste os filtros para exibir uma ficha.</p>';
  }

  function abrirIndicador(id) {
    const limpar = () => { el.tela.value = ''; el.busca.value = ''; el.forn.value = ''; el.sit.value = ''; el.onda.value = ''; el.alerta.checked = false; };
    if (id.startsWith('tela:')) { limpar(); el.tela.value = id.slice(5); listar(); return; } // link vindo da origem dos dados
    if (!Object.hasOwn(POR_ID, id)) {
      el.card.innerHTML = '<p class="kf-nada" role="status">Indicador não encontrado. Escolha um indicador na lista ou revise o endereço.</p>';
      $$('.kf-i', el.lista).forEach(b => { b.setAttribute('aria-selected', 'false'); b.tabIndex = -1; });
      const primeiro = $('.kf-i', el.lista); if (primeiro) primeiro.tabIndex = 0;
      return;
    }
    limpar();
    idAtual = id; listar();
    const b = $('.kf-i[data-id="' + id + '"]', el.lista);
    if (b) el.lista.scrollTop = b.offsetTop - el.lista.offsetTop - el.lista.clientHeight / 2; // só a lista rola, não a página
  }

  el.lista.addEventListener('click', e => { const b = e.target.closest('.kf-i'); if (b) ficha(b.dataset.id); });
  el.lista.addEventListener('keydown', e => {
    const opcoes = $$('.kf-i', el.lista), indice = opcoes.indexOf(e.target);
    if (indice < 0 || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation();
    const proximo = e.key === 'Home' ? 0 : e.key === 'End' ? opcoes.length - 1 :
      (indice + (e.key === 'ArrowDown' ? 1 : -1) + opcoes.length) % opcoes.length;
    ficha(opcoes[proximo].dataset.id); opcoes[proximo].focus();
  });
  [el.tela, el.forn, el.sit, el.onda, el.alerta].forEach(x => x.addEventListener('change', listar));
  el.busca.addEventListener('input', listar);
  el.card.addEventListener('click', e => {
    const b = e.target.closest('.kf-ver');
    if (!b) return;
    const t = C.telas[b.dataset.cod];
    if (t.id === 'geral') { location.hash = MURAL.hash; return; }
    const lista = [...C.tatica, ...C.estrategica].flatMap(x => x.telas.map(y => Object.assign({ tv: x.nome }, y)));
    abrirTelao(lista, lista.findIndex(x => x.cod === t.cod));
  });
  listar();

  /* ---------- busca geral ---------- */
  window.addEventListener('coe:indicadores-editados', () => {
    C.linhas.forEach((linha, index) => C.campos.forEach((campo, col) => { R[index][campo] = linha[col]; }));
    const valor = el.forn.value;
    const lista = [...new Set(R.map(r => r.forn).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
    el.forn.innerHTML = '<option value="">Todos</option>' + lista.map(f => '<option>' + esc(f) + '</option>').join('');
    el.forn.value = lista.includes(valor) ? valor : '';
    listar();
  });
  const busca = $('#busca'), campoBusca = $('#buscaCampo'), listaBusca = $('#buscaLista');
  let indicePaginas = null, marcado = 0;
  function abrirBusca() {
    if (!indicePaginas) indicePaginas = paginas.map(p => ({
      p, txt: norm(p.pagina.titulo + ' ' + p.etapa.nome + ' ' + p.el.textContent),
      abas: $$('.aba', p.el).map(a => ({ id: a.dataset.aba, rot: a.dataset.rotulo, txt: norm(a.textContent) })),
    }));
    campoBusca.value = ''; resultados(); busca.showModal(); campoBusca.focus();
  }
  window.addEventListener('coe:conteudo-editado', () => { indicePaginas = null; });
  function resultados() {
    const q = norm(campoBusca.value.trim());
    const pags = (q ? indicePaginas.filter(x => x.txt.includes(q)) : indicePaginas).slice(0, 7).map(x => {
      const aba = q && x.abas.find(a => a.txt.includes(q)); // o resultado abre na aba onde o termo está
      return { href: x.p.hash + (aba ? '/' + aba.id : ''), t: x.p.pagina.titulo + (aba ? ' · ' + aba.rot : ''), s: x.p.etapa.nome };
    });
    const inds = q ? R.filter(r => norm(r.ind + ' ' + r.id + ' ' + r.card).includes(q)).slice(0, 12).map(r => ({
      href: FICHA.hash + '/' + r.id, t: r.ind, s: r.card + ', ' + r.id,
    })) : [];
    const secao = (rot, l) => (l.length ? '<li class="rot">' + rot + '</li>' + l.map(x =>
      '<li><a href="' + esc(x.href) + '"><b>' + esc(x.t) + '</b><span>' + esc(x.s) + '</span></a></li>').join('') : '');
    if (!q) {
      listaBusca.innerHTML = ESTRUTURA.map(e => secao(e.nome, paginas.filter(p => p.etapa === e).map(p => ({
        href: p.hash, t: p.pagina.titulo, s: p.pagina.grupo || '',
      })))).join('');
      marcado = 0; destacar();
      return;
    }
    listaBusca.innerHTML = secao('Páginas', pags) + secao('Indicadores', inds) ||
      '<li class="nada">Nada encontrado. Tente outra palavra ou o ID do indicador.</li>';
    marcado = 0; destacar();
  }
  function destacar() {
    const ls = $$('a', listaBusca);
    ls.forEach((a, i) => a.classList.toggle('marcado', i === marcado));
    if (ls[marcado]) ls[marcado].scrollIntoView({ block: 'nearest' });
  }
  campoBusca.addEventListener('input', resultados);
  campoBusca.addEventListener('keydown', e => {
    const ls = $$('a', listaBusca);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (ls.length) { marcado = (marcado + (e.key === 'ArrowDown' ? 1 : -1) + ls.length) % ls.length; destacar(); }
    }
    if (e.key === 'Enter' && ls[marcado]) { e.preventDefault(); ls[marcado].click(); }
  });
  listaBusca.addEventListener('click', e => { if (e.target.closest('a')) busca.close(); });
  busca.addEventListener('click', e => { if (e.target === busca) busca.close(); });
  $('#abrirBusca').addEventListener('click', abrirBusca);

  document.addEventListener('error', e => {
    const imagem = e.target;
    if (imagem.tagName !== 'IMG' || imagem.dataset.erro) return;
    imagem.dataset.erro = 'true';
    const aviso = document.createElement('span'); aviso.className = 'recurso-erro';
    aviso.textContent = 'Imagem indisponível: ' + (imagem.alt || 'recurso visual');
    imagem.insertAdjacentElement('afterend', aviso);
  }, true);

  // Tabelas extensas podem ser roladas também por quem usa apenas teclado.
  const tabelas = $$('.tbl, .archw');
  function tabelasAcessiveis() {
    tabelas.forEach(caixa => {
      const larga = caixa.scrollWidth > caixa.clientWidth + 1;
      if (larga && caixa.getClientRects().length) {
        caixa.tabIndex = 0; caixa.setAttribute('role', 'region');
        const titulo = caixa.closest('section,article').querySelector('h2,h3,h4');
        caixa.setAttribute('aria-label', (caixa.classList.contains('archw') ? 'Diagrama: ' : 'Tabela: ') + (titulo ? titulo.textContent.trim() : 'dados do painel'));
      } else {
        caixa.removeAttribute('tabindex'); caixa.removeAttribute('role'); caixa.removeAttribute('aria-label');
      }
    });
  }
  $$('thead th').forEach(cabecalho => cabecalho.setAttribute('scope', 'col'));
  window.addEventListener('resize', tabelasAcessiveis);
  document.addEventListener('toggle', tabelasAcessiveis, true);

  /* ---------- teclado ---------- */
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented) return;
    if (e.key === 'Escape' && $('#btMenu').getAttribute('aria-expanded') === 'true' && !busca.open && !telao.open && !lente.open) {
      e.preventDefault(); fecharGaveta(); $('#btMenu').focus(); return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (!busca.open) abrirBusca(); return; }
    if (telao.open) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') $('[data-a="' + (e.key === 'ArrowRight' ? 'proxima' : 'anterior') + '"]', telao).click();
      return;
    }
    if (lente.open) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') $('[data-a="' + (e.key === 'ArrowRight' ? 'proxima' : 'anterior') + '"]', lente).click();
      return;
    }
    if (busca.open || e.target.closest('input,textarea,select,button,a,summary,[contenteditable],[role="tab"],[role="option"]') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { passoPagina(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { passoPagina(-1); e.preventDefault(); }
    if (e.key === '/') { e.preventDefault(); abrirBusca(); }
    if (e.key === 'f' || e.key === 'F') telaCheia();
    if (e.key === 'm' || e.key === 'M') alternarMenu();
  });

  rota();
})();
