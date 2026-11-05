/* Estudo de viabilidade: tabelas, gráficos e simulador, a partir de js/viabilidade-dados.js. */
(function () {
  'use strict';
  const V = window.VIAB, C = window.COE;
  const alvo = n => document.querySelector('[data-v="' + n + '"]');
  const esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const fmt = (v, d) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const mi = v => 'R$ ' + fmt(v / 1e6, 1) + ' mi';
  const mil = v => (v ? fmt(v / 1e3) : '–');
  const pct = (a, b) => fmt(a / b * 100) + '%';
  const tabela = (cab, linhas) => '<div class="tbl"><table class="' + (/^(ID|Gate)$/.test(cab[0]) ? 'vb-id' : '') + '"><thead><tr>' + cab.map(c => '<th>' + c + '</th>').join('') +
    '</tr></thead><tbody>' + linhas.map(l => '<tr>' + l.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  const selo = (cl, g, t) => '<span class="sel ' + (cl === 'crit' ? 'grave' : cl) + '"><i>' + g + '</i>' + esc(t) + '</span>';
  const CEN = V.cenarios.nomes, REC = 1;
  const tri = t => esc(t).replace(/A(\d) Q(\d)/g, 'Ano $1, T$2');
  const ROT_ONDA = { 1: 'Onda 1, sistemas existentes', 2: 'Onda 2, automação', 3: 'Onda 3, sem fonte definida' };

  /* dica: um balão só, alimentado pelo atributo data-dica de cada marca */
  const dica = document.getElementById('dica');
  document.addEventListener('mousemove', e => {
    const m = e.target.closest && e.target.closest('[data-dica]');
    if (!m) { dica.hidden = true; return; }
    dica.textContent = m.dataset.dica; dica.hidden = false;
    const x = Math.min(e.clientX + 14, innerWidth - dica.offsetWidth - 8);
    dica.style.left = Math.max(8, x) + 'px'; dica.style.top = (e.clientY + 16) + 'px';
  });

  /* ---------- parecer e origem ---------- */
  const R = C.linhas.map(l => Object.fromEntries(C.campos.map((k, i) => [k, l[i]])));
  const contaOnda = o => R.filter(r => r.onda === o).length;
  const legendaOndas = '<div class="vb-leg">' + ['1', '2', '3'].map(o => '<span><i class="o-ponto o' + o + '"></i>' + ROT_ONDA[o] + '</span>').join('') + '</div>';

  alvo('ondas-barra').innerHTML = '<div class="vb-faixa" role="img" aria-label="Das ' + R.length + ' informações do painel: ' +
    ['1', '2', '3'].map(o => contaOnda(o) + ' na onda ' + o).join(', ') + '">' +
    ['1', '2', '3'].map(o => { const n = contaOnda(o); return '<div class="seg o' + o + '" style="flex-grow:' + n + '"></div>'; }).join('') + '</div>' +
    '<div class="vb-faixa-rot">' + ['1', '2', '3'].map(o => { const n = contaOnda(o);
      return '<div style="flex-grow:' + n + '"><b>' + n + '</b><span>' + pct(n, R.length) + ' das informações, onda ' + o + '</span></div>'; }).join('') + '</div>';

  alvo('parecer').innerHTML = tabela(['Dimensão', 'Evidência favorável', 'Condicionante principal', 'Parecer', 'Gate', 'Responsável'],
    V.parecer.map(p => {
      const conf = /confirmar/i.test(p.par);
      return ['<b>' + esc(p.dim) + '</b>', esc(p.evid), esc(p.cond), conf ? selo('crit', '?', p.par) : selo('aten', '!', p.par), esc(p.gate), esc(p.dono)];
    }));

  (function origem() {
    const maximo = Math.max(...Object.values(C.telas).map(t => t.n));
    const linha = t => {
      const n = o => R.filter(r => r.cod === t.cod && r.onda === o).length;
      const segs = ['1', '2', '3'].map(o => n(o) ? '<i class="o' + o + '" style="flex-grow:' + n(o) + '" data-dica="' + esc(t.titulo) + ': ' + n(o) + ' na onda ' + o + '"></i>' : '').join('');
      return '<a class="vb-lin" href="#indicadores/ficha-de-kpi/tela:' + t.cod + '"><span class="nome"><b>' + t.cod + '</b> ' + esc(t.titulo) + '</span>' +
        '<span class="trilha"><span class="barra" style="width:' + (t.n / maximo * 100) + '%">' + segs + '</span><em>' + t.n + '</em></span></a>';
    };
    const ts = Object.values(C.telas);
    alvo('origem-telas').innerHTML = legendaOndas +
      '<h4 class="vb-gr">Camada tática</h4>' + ts.filter(t => !t.cod.startsWith('E')).map(linha).join('') +
      '<h4 class="vb-gr">Visão estratégica</h4>' + ts.filter(t => t.cod.startsWith('E')).map(linha).join('');
  })();

  /* ---------- cenários ---------- */
  const c = V.cenarios;
  alvo('recomendacao').textContent = 'Recomendação do estudo: ' + V.recomendacao.charAt(0).toLowerCase() + V.recomendacao.slice(1);
  alvo('cenarios-cards').innerHTML = '<div class="vb-cen">' + CEN.map((nome, i) =>
    '<div class="cen' + (i === REC ? ' rec' : '') + '"><div class="topo"><h3>' + nome + '</h3><span>' + c.ondas[i] + '</span></div>' +
    '<b class="valor">' + mi(c.total[i]) + '</b><small>em 3 anos, com contingência</small>' +
    '<dl><dt>Informações automáticas</dt><dd>' + fmt(c.info[i]) + ' de ' + R.length + '</dd>' +
    '<dt>Investimento (CAPEX e serviços)</dt><dd>' + mi(c.invest[i]) + '</dd>' +
    '<dt>Custo anual em regime</dt><dd>' + mi(c.opex[i]) + '</dd>' +
    '<dt>Faixa do custo direto</dt><dd>' + mi(c.baixa[i]) + ' a ' + mi(c.alta[i]) + '</dd></dl></div>').join('') + '</div>';

  (function barras() {
    const maximo = Math.max(...c.total);
    const partes = [['invest', 'Investimento (CAPEX e serviços)', 'o1'], ['opex_impl', 'Equipe, PMO e licenças na implantação', 'o2'], ['conting', 'Contingência', 'o3']];
    alvo('cenarios-barras').innerHTML = '<div class="vb-leg">' + partes.map(p => '<span><i class="o-ponto ' + p[2] + '"></i>' + p[1] + '</span>').join('') + '</div>' +
      CEN.map((nome, i) => '<div class="vb-lin sem-link"><span class="nome">' + nome + '</span><span class="trilha"><span class="barra alta" style="width:' + (c.total[i] / maximo * 100) + '%">' +
        partes.map(p => '<i class="' + p[2] + '" style="flex-grow:' + c[p[0]][i] + '" data-dica="' + nome + ', ' + p[1].toLowerCase() + ': ' + mi(c[p[0]][i]) + '"></i>').join('') +
        '</span><em>' + mi(c.total[i]) + '</em></span></div>').join('');
  })();

  alvo('cenarios-grupos').innerHTML = (function () {
    const lin = (n, v, cl) => ['<span class="' + (cl || '') + '">' + esc(n) + '</span>'].concat(v.map(x => '<span class="dir ' + (cl || '') + '">' + mil(x) + '</span>'));
    return tabela(['Grupo de custo'].concat(CEN.map((n, i) => '<span class="dir">' + n + '</span>')),
      V.grupos.map(g => lin(g.nome, g.v)).concat([lin('Custo direto em 3 anos', c.direto, 'forte'), lin('Contingência sobre o investimento', c.conting), lin('Total referencial em 3 anos', c.total, 'forte')]));
  })();

  (function desembolso() {
    const el = alvo('desembolso');
    let cen = CEN[REC];
    const rot = V.desembolso.tri.map(tri);
    function desenha() {
      const s = V.desembolso.serie[cen], maximo = Math.max(...Object.values(V.desembolso.serie).flat());
      el.innerHTML = '<div class="seg-c" role="group" aria-label="Cenário">' + CEN.map(n => '<button type="button" data-c="' + n + '" aria-pressed="' + (n === cen) + '">' + n + '</button>').join('') + '</div>' +
        '<div class="vb-col">' + s.map((v, i) => '<div class="c" data-dica="' + rot[i] + ': ' + mi(v) + '"><span style="height:' + (v / maximo * 100) + '%"></span><small>' + V.desembolso.tri[i].replace('A', '').replace(' Q', '.') + '</small></div>').join('') + '</div>' +
        '<p class="vb-apoio">Rótulo: ano e trimestre (1.1 é o primeiro trimestre do ano 1). Ano 1: ' + mi(s.slice(0, 4).reduce((a, b) => a + b)) + ', ano 2: ' + mi(s.slice(4, 8).reduce((a, b) => a + b)) + ', ano 3: ' + mi(s.slice(8).reduce((a, b) => a + b)) + '. Valores sem contingência.</p>';
    }
    el.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { cen = b.dataset.c; desenha(); } });
    desenha();
  })();

  alvo('catalogo').textContent = fmt(V.catalogo.Estimado.pct * 100) + '% do catálogo é estimativa; só ' + fmt(V.catalogo.QQP.itens) + ' de ' + fmt(V.catalogo.QQP.itens + V.catalogo.Estimado.itens) + ' itens têm preço consultado.';

  /* ---------- retorno ---------- */
  const F = V.fluxo;
  alvo('retorno-metas').innerHTML = '<div class="vb-metas">' + CEN.map((n, i) =>
    '<div class="' + (i === REC ? 'rec' : '') + '"><h3>' + n + '</h3><b>' + mi(F.equilibrio[n]) + '</b><span>por ano para o VPL de 5 anos chegar a zero</span><small>' + mi(c.payback3[i]) + ' por ano para payback simples de 3 anos</small></div>').join('') + '</div>';

  (function simulador() {
    const el = alvo('simulador');
    let cen = CEN[REC], ben = F.equilibrio[cen], mexeu = false;
    el.innerHTML = '<div class="sim"><div class="sim-e"><div class="seg-c" role="group" aria-label="Cenário">' +
      CEN.map(n => '<button type="button" data-c="' + n + '">' + n + '</button>').join('') + '</div>' +
      '<label for="simB">Benefício anual pleno</label><output id="simV" for="simB"></output>' +
      '<input type="range" id="simB" min="0" max="10000000" step="100000">' +
      '<button type="button" class="sim-eq">Voltar ao ponto de equilíbrio</button>' +
      '<dl><dt>VPL em 5 anos</dt><dd id="simVpl"></dd><dt>Caixa acumulado fica positivo</dt><dd id="simCaixa"></dd><dt>Payback simples (fórmula do estudo)</dt><dd id="simPay"></dd></dl></div>' +
      '<div class="sim-g" id="simG"></div></div>';
    const s = el.querySelector('#simB');
    function calcula() {
      const custos = F.custos[cen], i = CEN.indexOf(cen);
      const fluxos = custos.map((k, a) => ben * F.rampa[a] - k);
      let acum = 0;
      return {
        vpl: fluxos.reduce((t, x, a) => t + x / Math.pow(1 + F.taxa, a + 1), 0),
        acum: fluxos.map(x => (acum += x)),
        pay: ben > c.opex[i] ? (c.invest[i] + c.conting[i]) / (ben - c.opex[i]) : null,
      };
    }
    function grafico(acum) {
      const g = el.querySelector('#simG'), w = g.clientWidth;
      if (!w) return;
      const h = 250, e = 62, d = 14, t = 16, b = 28;
      const lim = Math.max(20e6, ...acum.map(Math.abs)), tot = lim * 2;
      const y = v => t + (lim - v) / tot * (h - t - b), x = i => e + i * (w - e - d) / 4;
      const pts = acum.map((v, i) => x(i) + ',' + y(v)).join(' ');
      const marcas = [-20e6, -10e6, 0, 10e6, 20e6].filter(v => Math.abs(v) <= lim);
      g.innerHTML = '<svg width="' + w + '" height="' + h + '" role="img" aria-label="Fluxo de caixa acumulado em 5 anos">' +
        marcas.map(v => '<line class="' + (v ? 'grade' : 'zero') + '" x1="' + e + '" x2="' + (w - d) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
          '<text class="eixo-t" x="' + (e - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + fmt(v / 1e6) + '</text>').join('') +
        '<text class="eixo-t" x="' + e + '" y="11">R$ mi, acumulado</text>' +
        '<polyline class="linha" points="' + pts + '"/>' +
        acum.map((v, i) => '<circle class="ponto" cx="' + x(i) + '" cy="' + y(v) + '" r="5" data-dica="Ano ' + (i + 1) + ': ' + mi(v) + ' acumulados"/>' +
          '<text class="eixo-t" x="' + x(i) + '" y="' + (h - 8) + '" text-anchor="' + (i === 4 ? 'end' : i ? 'middle' : 'start') + '">Ano ' + (i + 1) + '</text>').join('') + '</svg>';
    }
    function desenha() {
      const r = calcula();
      s.value = ben;
      el.querySelector('#simV').textContent = mi(ben) + ' por ano';
      el.querySelector('#simVpl').textContent = (r.vpl < 0 && Math.abs(r.vpl) >= 5e4 ? '−' : '') + mi(Math.abs(r.vpl) < 5e4 ? 0 : Math.abs(r.vpl));
      const positivo = r.acum.findIndex(v => v >= 0);
      el.querySelector('#simCaixa').textContent = positivo < 0 ? 'depois do ano 5' : 'no ano ' + (positivo + 1);
      el.querySelector('#simPay').textContent = r.pay ? fmt(r.pay, 1) + ' anos' : 'não se paga: fica abaixo do custo anual';
      el.querySelectorAll('[data-c]').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === cen));
      grafico(r.acum);
    }
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-c]');
      if (b) { cen = b.dataset.c; if (!mexeu) ben = F.equilibrio[cen]; desenha(); }
      if (e.target.closest('.sim-eq')) { ben = F.equilibrio[cen]; mexeu = false; desenha(); }
    });
    s.addEventListener('input', () => { ben = +s.value; mexeu = true; desenha(); });
    window.addEventListener('resize', desenha); // a página começa oculta: redesenha quando aparece
    desenha();
  })();

  alvo('beneficios').innerHTML = tabela(['Ganho', 'O que medir', 'Evidência no painel', 'Fórmula', 'Responsável'],
    V.beneficios.map(b => ['<b>' + esc(b.nome) + '</b>', esc(b.var), esc(b.evid), esc(b.formula), esc(b.resp)]));
  alvo('premissas-fluxo').textContent = 'Premissas de referência: taxa de desconto de ' + fmt(F.taxa * 100) + '% ao ano, a substituir pelo custo de capital da Holambra, e captura do benefício de ' +
    F.rampa.map(x => fmt(x * 100) + '%').join(', ') + ' nos anos 1 a 5. Payback simples = (investimento + contingência) ÷ (benefício anual − custo anual em regime): essa fórmula não considera a rampa de captura nem os custos da implantação, por isso o caixa acumulado leva mais tempo para ficar positivo. Fonte: business case do arquivo de apoio (aba 04).';

  /* ---------- pacotes, priorização, plano ---------- */
  alvo('pacotes').innerHTML = tabela(['Pacote', 'Modalidade sugerida', 'Itens', '<span class="dir">Recomendado (R$ mil)</span>', 'Momento'],
    V.pacotes.map(p => ['<b>' + esc(p.nome.replace(/^\d+\.\s*/, '')) + '</b>', esc(p.modo), esc(p.itens), '<span class="dir">' + mil(+p.rec) + '</span>', tri(p.gate)]));

  (function prioridade() {
    const cont = {};
    V.prioridade.forEach(p => { cont[p.leitura] = (cont[p.leitura] || 0) + 1; });
    alvo('prioridade-resumo').innerHTML = '<div class="vb-cont">' + Object.keys(cont).map(k => '<div><b>' + cont[k] + '</b><span>' + esc(k) + '</span></div>').join('') + '</div>';
    const maximo = Math.max(...V.prioridade.map(p => +p.score));
    const fases = [...new Set(V.prioridade.map(p => p.fase))];
    const nomeFase = { 'Fase 0': 'Fase 0: descoberta e decisões', 'Fase 1': 'Fase 1: ganhos rápidos com o que existe', 'Fase 2': 'Fase 2: integração da automação', 'Fase 3': 'Fase 3: SAP e escala' };
    alvo('prioridade').innerHTML = fases.map(f => '<section class="sec"><h3>' + (nomeFase[f] || f) + '</h3>' +
      tabela(['ID', 'Iniciativa', 'Leitura', 'Impacto', 'Esforço', 'Complex.', 'Usa o existente', 'Score'],
        V.prioridade.filter(p => p.fase === f).sort((a, b) => b.score - a.score).map(p => [p.id, esc(p.nome), esc(p.leitura), p.imp, p.esf, p.cpx, esc(p.usa),
          '<span class="vb-score" data-dica="Depende de: ' + esc(p.dep) + '"><i style="width:' + (+p.score / maximo * 100) + '%"></i><b>' + fmt(+p.score, +p.score % 1 ? 1 : 0) + '</b></span>'])) + '</section>').join('');
  })();

  (function gantt() {
    const meses = Array.from({ length: 12 }, (_, i) => i + 1);
    const fases = [...new Set(V.roadmap.map(r => r.fase))];
    alvo('gantt').innerHTML = '<div class="tbl"><div class="gantt"><div class="g-cab"><span>Iniciativa</span><span class="g-meses">' + meses.map(m => '<span>M' + m + '</span>').join('') + '</span><span>Marco de saída</span></div>' +
      fases.map(f => '<div class="g-fase">' + f + '</div>' + V.roadmap.filter(r => r.fase === f).map(r =>
        '<div class="g-lin"><span class="g-n"><b>' + r.id + '</b> ' + esc(r.nome) + '</span><span class="g-trilha"><i style="grid-column:' + r.ini + ' / ' + (+r.fim + 1) + '" data-dica="' + esc(r.tipo) + ', M' + r.ini + (r.fim !== r.ini ? ' a M' + r.fim : '') + '"></i></span><span class="g-m">' + esc(r.marco) + '</span></div>').join('')).join('') + '</div></div>';
  })();

  alvo('gates').innerHTML = tabela(['Gate', 'Etapa', 'Condições mínimas', 'Evidência', 'Trimestre', 'Aprovador'],
    V.gates.map(g => ['<b>' + g.id + '</b>', esc(g.etapa), esc(g.cond), esc(g.evid), tri(g.tri), esc(g.aprov)]));
  alvo('dependencias').innerHTML = tabela(['Dependência', 'Por que importa'], V.dependencias.map(d => [esc(d.dep), esc(d.porque)]));

  /* ---------- catálogo de custos, normas ---------- */
  const num = v => Number(v) || 0;
  const reais = v => 'R$ ' + fmt(v);
  const qtd = v => fmt(num(v), Number.isInteger(num(v)) ? 0 : 1);
  [['infra', 'Critério'], ['instrumentos', 'Aplicação'], ['sistemas', 'Escopo']].forEach(([k, rot]) => {
    const itens = V.catalogo_itens[k], soma = itens.reduce((t, i) => t + num(i.total), 0);
    alvo('cat-' + k + '-rot').textContent = 'Ver os ' + itens.length + ' itens orçados (' + mi(soma) + ' na base do estudo)';
    alvo('cat-' + k).innerHTML = tabela(['ID', 'Item', 'Qtd.', 'Total base (R$)', 'Início', rot],
      itens.map(i => ['<b>' + esc(i.id) + '</b>', esc(i.item), qtd(i.qtd) + ' ' + esc(i.un), fmt(num(i.total)), tri(i.ini), esc(i.obs)]));
  });
  alvo('normas').innerHTML = tabela(['Requisito', 'Onde se aplica', 'Gate ou critério'], V.normas.map(n => ['<b>' + esc(n.req) + '</b>', esc(n.onde), esc(n.gate)]));

  /* ---------- sala do COE ---------- */
  (function sala() {
    const S = V.sala, maior = Math.max(...S.opcoes.map(o => num(o.larg)));
    const grade = o => o.grade.split('x').map(n => parseInt(n, 10));
    alvo('vw-opcoes').innerHTML = S.opcoes.map(o => {
      const [c, l] = grade(o);
      return '<div class="vw-op"><div class="vw-area"><div class="vw-tela" style="width:' + (num(o.larg) / maior * 100) + '%;grid-template-columns:repeat(' + c + ',1fr)" role="img" aria-label="Grade de ' + esc(o.grade) + ' monitores">' +
        '<i></i>'.repeat(c * l) + '</div></div><b>' + esc(o.nome) + '</b><span class="vw-num">' + reais(num(o.inv)) + '</span>' +
        '<small>' + esc(o.grade) + ', ' + o.mon + ' monitores, ' + fmt(num(o.larg), 2) + ' m × ' + fmt(num(o.alt), 2) + ' m</small><small>' + esc(o.ind) + '</small></div>';
    }).join('');
    const base = S.opcoes[0], oito = S.opcoes.find(o => num(o.mon) === 8);
    alvo('vw-alerta').innerHTML = oito
      ? '<b>Ponto em aberto:</b> o mural foi desenhado com 8 TVs, mas o orçamento base prevê ' + base.mon + ' monitores. A opção ' + esc(oito.nome) + ' (' + esc(oito.grade) + ') chega às 8 telas com acréscimo de ' + reais(num(oito.inv) - num(base.inv)) + ', se a parede da sala comportar ' + fmt(num(oito.larg), 2) + ' m de largura.'
      : '<b>Ponto em aberto:</b> o mural foi desenhado com 8 TVs, mas o orçamento base prevê ' + base.mon + ' monitores.';
    alvo('sala-zonas').innerHTML = tabela(['Zona', 'Área (m²)', 'O que contém', 'Requisito principal'],
      S.zonas.map(z => ['<b>' + esc(z.nome) + '</b>', esc(z.area), esc(z.cont), esc(z.req)]).concat([['<b>Total</b>', '<b>' + S.zonas.reduce((t, z) => t + num(z.area), 0) + '</b>', '', '']]));
    alvo('sala-telas').innerHTML = tabela(['Tela ou equipamento', 'Qtd.', 'Onde fica', 'Tipo', 'Conteúdo exibido', 'Cenário'],
      S.telas.map(t => ['<b>' + esc(t.item) + '</b>', qtd(t.qtd) + ' ' + esc(t.un), esc(t.obs), esc(t.tipo), esc(t.cont), esc(t.cen)]));
    alvo('sala-tv-conclusao').textContent = S.tv_conclusao[0].toUpperCase() + S.tv_conclusao.slice(1);
    alvo('sala-tv').innerHTML = tabela(['Critério', 'TV comercial', 'Monitor profissional', 'Recomendação'], S.tv.map(t => ['<b>' + esc(t.crit) + '</b>', esc(t.tv), esc(t.mon), esc(t.rec)]));
    alvo('sala-bench-rot').textContent = 'Ver os ' + S.benchmark.length + ' elementos e como se aplicam em Avaré';
    alvo('sala-bench').innerHTML = tabela(['Elemento', 'Como aparece nos centros de referência', 'Aplicação no COE', 'Classificação'],
      S.benchmark.map(b => ['<b>' + esc(b.el) + '</b>', esc(b.ref), esc(b.app), esc(b.cls)]));
  })();

  /* ---------- plano mestre ---------- */
  (function planoMestre() {
    const P = V.plano, pilares = [...new Set(P.map(i => i.pilar))];
    const trimestres = Array.from({ length: 12 }, (_, i) => 'A' + (Math.floor(i / 4) + 1) + ' T' + (i % 4 + 1));
    const pos = t => { const m = /A(\d) Q(\d)/.exec(t); return (m[1] - 1) * 4 + +m[2]; };
    const custo = l => l.reduce((t, i) => t + i.custo, 0);
    const naoIniciadas = P.filter(i => /não iniciado/i.test(i.status)).length;
    alvo('pm-metas').innerHTML = '<div><h3>Iniciativas</h3><b>' + P.length + '</b><span>em ' + pilares.length + ' pilares</span></div>' +
      '<div><h3>Custo base vinculado</h3><b>' + mi(custo(P)) + '</b><span>' + (Math.abs(custo(P) - c.direto[2]) < 1 ? 'custo direto do cenário Completo, em 3 anos, antes de contingência' : 'em 3 anos, antes de contingência') + '</span></div>' +
      '<div><h3>Situação</h3><b>' + naoIniciadas + ' de ' + P.length + '</b><span>ainda não iniciadas</span></div>';
    let filtro = '';
    alvo('pm-filtros').innerHTML = ['', ...pilares].map(p => '<button type="button" data-p="' + esc(p) + '" aria-pressed="' + !p + '">' + esc(p || 'Todos') + ' <small>' + (p ? P.filter(i => i.pilar === p).length : P.length) + '</small></button>').join('');
    function desenha() {
      const lista = filtro ? P.filter(i => i.pilar === filtro) : P;
      const grupos = filtro ? [filtro] : pilares;
      alvo('pm-gantt').innerHTML = '<div class="tbl"><div class="gantt pm"><div class="g-cab"><span>Iniciativa</span><span class="g-meses">' + trimestres.map(t => '<span>' + t + '</span>').join('') + '</span><span>Responsável</span></div>' +
        grupos.map(g => { const l = lista.filter(i => i.pilar === g);
          return '<div class="g-fase">' + esc(g) + ' <small>' + l.length + ' iniciativas, ' + mi(custo(l)) + '</small></div>' + l.map(i =>
            '<div class="g-lin"><span class="g-n"><b>' + esc(i.id) + '</b> ' + esc(i.nome) + '</span><span class="g-trilha"><i class="' + (i.prio === 'Crítica' ? 'crit' : '') + '" style="grid-column:' + pos(i.ini) + ' / ' + (pos(i.fim) + 1) + '" data-dica="' + esc(i.prio) + ', ' + esc(i.onda) + ', ' + tri(i.ini) + (i.fim !== i.ini ? ' a ' + tri(i.fim) : '') + '"></i></span><span class="g-m">' + esc(i.resp) + '</span></div>').join(''); }).join('') +
        '</div></div><div class="vb-leg"><span><i class="o-ponto pm-crit"></i>Prioridade crítica</span><span><i class="o-ponto o1"></i>Demais prioridades</span></div>';
      alvo('pm-det-rot').textContent = 'Ver entregável, custo, KPI e critério de aceite de ' + (lista.length === 1 ? '1 iniciativa' : 'cada uma das ' + lista.length + ' iniciativas');
      alvo('pm-det').innerHTML = tabela(['ID', 'Iniciativa', 'Entregável', 'Prioridade', 'Onda', 'Dependência', 'Custo base (R$)', 'KPI', 'Critério de aceite'],
        lista.map(i => ['<b>' + esc(i.id) + '</b>', esc(i.nome), esc(i.entrega), esc(i.prio), esc(i.onda), esc(i.dep), i.custo ? fmt(i.custo) : '–', esc(i.kpi), esc(i.aceite)]));
    }
    alvo('pm-filtros').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      filtro = b.dataset.p;
      alvo('pm-filtros').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
      desenha();
    });
    desenha();
  })();

  /* ---------- riscos ---------- */
  (function riscos() {
    const probs = ['Alta', 'Média', 'Baixa'], imps = ['Baixo', 'Médio', 'Alto'];
    let filtro = null;
    const cl = { 'Crítico': 'crit', 'Alto': 'aten', 'Médio': 'neutro', 'Baixo': 'neutro' }, gl = { 'Crítico': '×', 'Alto': '!', 'Médio': '–', 'Baixo': '–' };
    const lista = alvo('riscos'), mapa = alvo('riscos-mapa');
    function desenha() {
      mapa.innerHTML = '<div class="mapa" role="group" aria-label="Riscos por probabilidade e impacto"><span class="m-y">Probabilidade</span>' +
        probs.map(p => '<span class="m-r">' + p + '</span>' + imps.map(i => {
          const n = V.riscos.filter(r => r.prob === p && r.imp === i).length, nv = { Alta: 3, 'Média': 2, Baixa: 1 }[p] * { Alto: 3, 'Médio': 2, Baixo: 1 }[i];
          const on = filtro === p + '|' + i;
          return '<button type="button" class="m-c n' + nv + '" data-f="' + p + '|' + i + '"' + (n ? '' : ' disabled') + ' aria-pressed="' + on + '" aria-label="' + n + ' riscos com probabilidade ' + p + ' e impacto ' + i + '">' + (n || '') + '</button>';
        }).join('')).join('') + '<span></span>' + imps.map(i => '<span class="m-b">' + i + '</span>').join('') + '<span class="m-x">Impacto</span></div>' +
        (filtro ? '<button type="button" class="m-limpa">Mostrar todos os riscos</button>' : '<p class="vb-apoio">Clique em uma célula para filtrar.</p>');
      const L = V.riscos.filter(r => !filtro || r.prob + '|' + r.imp === filtro).sort((a, b) => b.pont - a.pont || a.id.localeCompare(b.id));
      lista.innerHTML = tabela(['ID', 'Risco', 'Criticidade', 'Mitigação', 'Responsável'],
        L.map(r => [r.id, '<b>' + esc(r.risco) + '</b><small class="pi">probabilidade ' + r.prob.toLowerCase() + ', impacto ' + r.imp.toLowerCase() + '</small>', selo(cl[r.crit], gl[r.crit], r.crit), esc(r.mitig), esc(r.dono)]));
    }
    mapa.addEventListener('click', e => {
      const b = e.target.closest('[data-f]');
      if (b) { filtro = filtro === b.dataset.f ? null : b.dataset.f; desenha(); }
      if (e.target.closest('.m-limpa')) { filtro = null; desenha(); }
    });
    desenha();
  })();

  alvo('oportunidades').innerHTML = tabela(['ID', 'Oportunidade', 'Como aproveitar', 'Responsável'], V.oportunidades.map(o => [o.id, '<b>' + esc(o.item) + '</b>', esc(o.acao), esc(o.dono)]));
  alvo('pendencias-rot').textContent = 'Ver as ' + V.pendencias.length + ' pendências que travam engenharia, prazo e orçamento';
  alvo('pendencias').innerHTML = tabela(['ID', 'Tema', 'Pendência', 'Responsável', 'Prazo', 'Se não resolver'],
    V.pendencias.map(p => [p.id, esc(p.tema), esc(p.item), esc(p.resp), tri(p.prazo), esc(p.impacto)]));

  /* ---------- diagnóstico de campo ---------- */
  (function diagnostico() {
    const barra = alvo('diag-barra'), conta = alvo('diag-conta');
    if (!barra) return;
    const SIT = [['integrado', 'No SCADA'], ['porta', 'Porta identificada'], ['confirmar', 'A confirmar'], ['sem', 'Sem comunicação']];
    const linhas = [...document.querySelectorAll('.dg-parada tr[data-c]')];
    let filtro = null;
    barra.innerHTML = SIT.map(([k, nome]) => {
      const n = linhas.filter(l => l.dataset.c === k).length;
      return '<button type="button" class="dg-seg ' + k + '" data-k="' + k + '" aria-pressed="false" style="flex-grow:' + n + '"><i></i><b>' + n + '</b><span>' + nome + '</span></button>';
    }).join('');
    function aplica() {
      linhas.forEach(l => { l.hidden = !!filtro && l.dataset.c !== filtro; });
      document.querySelectorAll('.dg-parada').forEach(p => {
        p.hidden = !p.querySelector('tr[data-c]:not([hidden])');
      });
      barra.querySelectorAll('.dg-seg').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === filtro)));
      const vis = linhas.filter(l => !l.hidden).length;
      conta.innerHTML = filtro ? vis + ' de ' + linhas.length + ' equipamentos. <button type="button" class="m-limpa">Mostrar todos</button>' : linhas.length + ' equipamentos e sistemas visitados.';
    }
    barra.addEventListener('click', e => {
      const b = e.target.closest('.dg-seg');
      if (!b) return;
      filtro = filtro === b.dataset.k ? null : b.dataset.k;
      aplica();
    });
    conta.addEventListener('click', e => { if (e.target.closest('.m-limpa')) { filtro = null; aplica(); } });
    aplica();
  })();

  /* ---------- decisões ---------- */
  alvo('validacao').textContent = 'Situação da validação com a Holambra: ' + V.validacao.replace(/ – /g, ', ') + '.';
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  document.querySelectorAll('[data-prazo]').forEach(li => {
    const [a, m, d] = li.dataset.prazo.split('-').map(Number);
    const dias = Math.round((new Date(a, m - 1, d) - hoje) / 864e5);
    const t = li.querySelector('time');
    t.innerHTML = '<b>' + String(d).padStart(2, '0') + '/' + String(m).padStart(2, '0') + '/' + a + '</b><small>' +
      (dias < 0 ? 'venceu há ' + (-dias) + ' dias' : dias === 0 ? 'vence hoje' : 'faltam ' + dias + ' dias') + '</small>';
    li.classList.toggle('perto', dias <= 14);
  });
})();
