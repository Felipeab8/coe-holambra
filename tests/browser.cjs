const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.COE_BASE_URL || 'http://127.0.0.1:8765';
let browser;
before(async () => { browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); });
after(async () => { if (browser) await browser.close(); });
async function visit(hash = '', options = {}, blocked = []) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', ...options });
  // Font availability must not gate local navigation regressions.
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  for (const pattern of blocked) await page.route(pattern, route => route.abort());
  await page.goto(base + '/' + hash, { waitUntil: 'domcontentloaded' });
  await page.locator('article.page:not([hidden])').waitFor();
  return page;
}
test('home remains integrated with the original router', async () => {
  const page = await visit();
  try {
    assert.equal(await page.locator('article.page').count(), 18);
    assert.equal(await page.locator('.hm-hero h1').count(), 1);
    await page.getByRole('link', { name: 'Iniciar leitura', exact: true }).click();
    await page.locator('#p-objetivos-ponto-de-partida-e-objetivos:not([hidden])').waitFor();
    await page.locator('.marca').click();
    await page.locator('#p-inicio-objetivo-do-coe:not([hidden])').waitFor();
  } finally { await page.close(); }
});

test('executive opening is concise and objectives have one canonical location', async () => {
  const page = await visit();
  try {
    assert.equal(await page.locator('.hm-title').innerText(), 'Centro Operacional de Excelência');
    assert.equal(await page.locator('.hm-stats, .hm-objs, .hm-fase').count(), 0);
    assert.equal(await page.locator('.approved-topics > li').count(), 7);
    assert.equal(await page.locator('.hm-exec, .hm-msgs, .hm-dlist, .hm-files').count(), 0);
    assert.equal(await page.locator('.hm-root section').count(), 2);
    await page.getByRole('link', { name: 'Iniciar leitura', exact: true }).click();
    const objectives = page.locator('#p-objetivos-ponto-de-partida-e-objetivos');
    await objectives.waitFor();
    assert.equal(await objectives.locator('.g3 .card').count(), 6);
    assert.match(await objectives.innerText(), /Contexto e escuta das áreas/);
    assert.equal(await objectives.locator('details:not([open])').count(), 0);
  } finally { await page.close(); }
});

test('restored challenge cards preserve original stages and deep-linked tabs', async () => {
  const page = await visit('#desafios/dores-operacionais/cadeia', { viewport: { width: 390, height: 844 } });
  try {
    const root = page.locator('#p-desafios-dores-operacionais');
    assert.equal(await root.locator('.chain-restored .step:visible').count(), 7);
    assert.equal(await root.locator('[data-aba="transversais"][role="tabpanel"]:visible').count(), 0);
    await root.getByRole('tab', { name: 'Dores transversais', exact: true }).click();
    assert.equal(await root.locator('.dor:visible').count(), 7);
    await root.getByRole('tab', { name: 'Por etapa da cadeia', exact: true }).click();
    assert.equal(await root.locator('.chain-restored .step:visible').count(), 7);
    for (const width of [320, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
  } finally { await page.close(); }
});

test('pending items are consolidated once, without bracket placeholders or invented priorities', async () => {
  const page = await visit('#roadmap/expansao-e-jornada/priorizacao');
  try {
    const section = page.locator('[data-secao="priorizacao"]');
    assert.match(await section.innerText(), /Plano e gates/);
    assert.equal(await section.locator('a[href="#roadmap/plano-e-gates/priorizacao"]').count(), 1);
    assert.equal(await page.locator('article.page').evaluateAll(pages => pages.filter(p => /\[(INSERIR|DEFINIR|VALIDAR|PENDENTE|INFORMA|DESCREVER)/.test(p.textContent)).length), 0);
    assert.equal(await page.locator('article.page .pend-note').count(), 3);
    assert.equal(await page.locator('a[href^="#decisoes"], a[href*="decisoes-e-proximos-passos"], [data-prazo]').count(), 0);
  } finally { await page.close(); }
});

test('mobile home actions and card descriptions are not covered by navigation or arrows', async () => {
  const page = await visit('', { viewport: { width: 390, height: 844 } });
  try {
    for (const width of [320, 390, 699, 768]) {
      await page.setViewportSize({ width, height: 844 });
      const cta = page.getByRole('link', { name: 'Iniciar leitura', exact: true });
      await cta.scrollIntoViewIfNeeded();
      assert.equal(await cta.evaluate(link => {
        const box = link.getBoundingClientRect();
        return link.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
      }), true, 'Primary action covered at ' + width + 'px');
      assert.deepEqual(await page.locator('.hm-card').evaluateAll(cards => cards.filter(card => {
        const text = card.querySelector('.hm-card-d').getBoundingClientRect();
        const arrow = card.querySelector('.hm-card-go').getBoundingClientRect();
        return arrow.top < text.bottom;
      }).map(card => card.querySelector('b').textContent)), [], 'Arrow overlaps card copy at ' + width + 'px');
    }
    await page.getByRole('link', { name: 'Iniciar leitura', exact: true }).click();
    await page.locator('#p-objetivos-ponto-de-partida-e-objetivos:not([hidden])').waitFor();
  } finally { await page.close(); }
});
test('hero covers ultrawide screens and branding styles travel with HTML', async () => {
  const page = await visit('', { viewport: { width: 3840, height: 2013 } });
  try {
    for (const theme of ['light', 'dark']) {
      await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
      await page.locator('#hm-picture img').evaluate(img => img.decode());
      assert.equal(await page.locator('#hm-picture img').evaluate(img => {
        const picture = img.getBoundingClientRect(), media = img.closest('.hm-media').getBoundingClientRect();
        return picture.left <= media.left && picture.right >= media.right;
      }), true);
      assert.equal(await page.locator('.rodape-marca img:visible').count(), 1);
    }
    assert.equal(await page.locator('link[rel="stylesheet"][href^="css/"]').count(), 0);
  } finally { await page.close(); }
});

test('malformed percent encoding does not interrupt navigation', async () => {
  const page = await visit(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.evaluate(() => { location.hash = '%E0%A4%A'; });
    await page.waitForTimeout(100);
    assert.deepEqual(errors, []);
    assert.equal(await page.locator('article.page:not([hidden])').getAttribute('id'), 'p-inicio-objetivo-do-coe');
    await page.locator('.pg-bt.prox').click();
    await page.locator('#p-objetivos-ponto-de-partida-e-objetivos:not([hidden])').waitFor();
  } finally { await page.close(); }
});
test('KPI with no matching data clears the previously selected card', async () => {
  const page = await visit('#indicadores/ficha-de-kpi');
  try {
    await page.locator('#kpiBusca').fill('NO_MATCH_999999');
    assert.match(await page.locator('#kpiCount').textContent(), /^0 indicadores$/);
    assert.equal(await page.locator('#kpiCard .kf-id').count(), 0);
    assert.match(await page.locator('#kpiCard').textContent(), /Nenhum indicador/);
    await page.locator('#kpiBusca').fill('');
    assert.match(await page.locator('#kpiCount').textContent(), /^416 indicadores$/);
    assert.equal(await page.locator('#kpiCard .kf-id').count(), 1);
  } finally { await page.close(); }
});
test('menu arrow keys do not change the current page', async () => {
  const page = await visit('#objetivos');
  try {
    await page.locator('[data-e="objetivos"] .etapa-l').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    assert.equal(await page.locator('article.page:not([hidden])').getAttribute('id'), 'p-objetivos-ponto-de-partida-e-objetivos');
  } finally { await page.close(); }
});
test('Escape closes the mobile drawer and restores focus', async () => {
  const page = await visit('#objetivos', { viewport: { width: 390, height: 844 } });
  try {
    await page.locator('#btMenu').click();
    assert.equal(await page.locator('#btMenu').getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#btMenu').getAttribute('aria-expanded'), 'false');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'btMenu');
  } finally { await page.close(); }
});
test('KPI list can be navigated with arrow keys', async () => {
  const page = await visit('#indicadores/ficha-de-kpi');
  try {
    const first = await page.locator('.kf-i').first().getAttribute('data-id');
    await page.locator('.kf-i').first().focus();
    await page.keyboard.press('ArrowDown');
    assert.notEqual(await page.locator('#kpiCard .kf-id').textContent(), first);
    assert.equal(await page.locator('.kf-i[tabindex="0"]').count(), 1);
  } finally { await page.close(); }
});

test('embedded 3D models follow the panel theme and pause off-page', async () => {
  const page = await visit('#dados/piloto-avare-modelo-3d');
  try {
    const iframe = page.locator('#p-dados-piloto-avare-modelo-3d iframe');
    const frame = await iframe.elementHandle().then(handle => handle.contentFrame());
    await frame.locator('#scene canvas').waitFor({ timeout: 30000 });
    await page.locator('#btTema').click();
    const theme = await page.locator('html').getAttribute('data-theme');
    await page.waitForTimeout(100);
    assert.equal(await frame.locator('html').getAttribute('data-theme'), theme);
    await page.locator('.marca').click();
    await page.locator('.hm-hero').waitFor();
    await page.waitForTimeout(100);
    assert.equal(await frame.evaluate(() => window.COE_MODELO_ATIVO), false);
  } finally { await page.close(); }
});
test('editing exists only in the COE room: no global editor and the Avaré model stays view-only', async () => {
  const page = await visit('#dados/piloto-avare-modelo-3d');
  try {
    assert.equal(await page.locator('#coe-editor-toggle, #coe-editor').count(), 0);
    assert.equal(await page.evaluate(() => typeof window.COE_EDITOR), 'undefined');
    const frame = await page.locator('#p-dados-piloto-avare-modelo-3d iframe').elementHandle().then(handle => handle.contentFrame());
    await frame.locator('#tabCam').waitFor({ state: 'attached', timeout: 30000 });
    await page.locator('#p-dados-piloto-avare-modelo-3d .mshield').click();
    await frame.locator('#tabCam').click();
    assert.equal(await frame.locator('#camEdit, #ceAdd, #ceExp, .ced, .ce-tools').count(), 0);
    assert.equal(await frame.locator('.item.cam').count(), 32);
    await frame.locator('.item.cam').first().click();
    assert.match(await frame.locator('#card').innerText(), /CAM 01/);
    assert.equal(await frame.locator('#card input, #card textarea, #card select').count(), 0);
    assert.equal(await page.locator('[data-zoom="sala-coe-3d/perspectivas.webp"], .vb-fig[data-zoom], button.vb-fig').count(), 0);
  } finally { await page.close(); }
});

test('skip link preserves the current route', async () => {
  const page = await visit('#governanca');
  try {
    await page.locator('.pular').focus(); await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    assert.equal(await page.locator('article.page:not([hidden])').getAttribute('id'), 'p-governanca-modelo-de-governanca');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'conteudo');
  } finally { await page.close(); }
});
test('unknown KPI deep link displays a missing-data state', async () => {
  const page = await visit('#indicadores/ficha-de-kpi/INVALID-ID');
  try {
    assert.match(await page.locator('#kpiCard').textContent(), /Indicador não encontrado/);
    assert.equal(await page.locator('#kpiCard .kf-id').count(), 0);
  } finally { await page.close(); }
});

test('all 18 routes and home shortcuts remain reachable', async () => {
  const page = await visit();
  try {
    await page.evaluate(() => { location.hash = '#viabilidade/decisoes-e-proximos-passos'; });
    await page.locator('#p-viabilidade-situacao-atual:not([hidden])').waitFor();
    await page.evaluate(() => { location.hash = '#viabilidade/plano-e-gates/priorizacao'; });
    await page.locator('#p-roadmap-plano-e-gates:not([hidden]) section[data-aba="priorizacao"]:not([hidden])').waitFor();
    const routes = [
      '#inicio/objetivo-do-coe', '#objetivos/ponto-de-partida-e-objetivos', '#desafios/dores-operacionais',
      '#indicadores/telas-do-video-wall-avare', '#indicadores/ficha-de-kpi', '#dados/diagnostico',
      '#dados/diagnostico-de-campo', '#dados/piloto-avare-modelo-3d', '#dados/fichas-dos-equipamentos',
      '#dados/sala-do-coe', '#dados/arquitetura-as-is-e-to-be', '#dados/sistemas-e-historicos',
      '#viabilidade/situacao-atual', '#viabilidade/investimento-e-retorno', '#viabilidade/solucao-e-contratacao',
      '#governanca/modelo-de-governanca', '#roadmap/plano-e-gates', '#roadmap/expansao-e-jornada',
    ];
    for (const hash of routes) {
      await page.evaluate(hash => { location.hash = hash; }, hash);
      await page.locator('#p-' + hash.slice(1).replace('/', '-') + ':not([hidden])').waitFor();
      assert.equal(await page.locator('article.page:not([hidden])').count(), 1);
    }
    await page.evaluate(() => { location.hash = '#inicio'; });
    const shortcuts = await page.locator('.hm-root a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute('href')));
    assert.equal(shortcuts.length, 9);
    for (let index = 0; index < shortcuts.length; index++) {
      await page.evaluate(() => { location.hash = '#inicio'; });
      await page.locator('.hm-hero').waitFor();
      await page.locator('.hm-root a[href^="#"]').nth(index).click();
      await page.waitForURL('**/' + shortcuts[index]);
      await page.waitForFunction(section => document.querySelector('article.page:not([hidden])').id.startsWith('p-' + section + '-'), shortcuts[index].slice(1).split('/')[0]);
    }
  } finally { await page.close(); }
});
test('search opens the exact KPI and can be dismissed with Escape', async () => {
  const page = await visit();
  try {
    await page.keyboard.press('Control+k');
    await page.locator('#buscaCampo').fill('AVR-VG-M01');
    await page.keyboard.press('Enter');
    await page.locator('#p-indicadores-ficha-de-kpi:not([hidden])').waitFor();
    assert.equal(await page.locator('#kpiCard .kf-id').textContent(), 'AVR-VG-M01');
    await page.locator('#abrirBusca').click(); await page.keyboard.press('Escape');
    assert.equal(await page.locator('#busca').evaluate(dialog => dialog.open), false);
  } finally { await page.close(); }
});
test('return simulator and tabs respond to keyboard and scenario changes', async () => {
  const page = await visit('#viabilidade/investimento-e-retorno/retorno');
  try {
    const original = await page.locator('#simVpl').textContent();
    await page.locator('#simB').focus(); await page.keyboard.press('Home');
    assert.notEqual(await page.locator('#simVpl').textContent(), original);
    await page.locator('.sim [data-c="Completo"]').click();
    assert.equal(await page.locator('.sim [data-c="Completo"]').getAttribute('aria-pressed'), 'true');
    await page.locator('.sim-eq').click();
    assert.match(await page.locator('#simVpl').textContent(), /R\$ 0,0 mi/);
    await page.getByRole('tab', { name: 'Cenários', exact: true }).click();
    assert.equal(await page.getByRole('tab', { name: 'Cenários', exact: true }).getAttribute('aria-selected'), 'true');
  } finally { await page.close(); }
});
test('field photo opens, advances and closes in the existing viewer', async () => {
  const page = await visit('#dados/sistemas-e-historicos');
  try {
    await page.locator('#p-dados-sistemas-e-historicos [data-zoom]').first().click();
    assert.equal(await page.locator('#lente').evaluate(dialog => dialog.open), true);
    const first = await page.locator('#lenteImg').getAttribute('src');
    await page.locator('#lente [data-a="proxima"]').click();
    assert.notEqual(await page.locator('#lenteImg').getAttribute('src'), first);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#lente').evaluate(dialog => dialog.open), false);
  } finally { await page.close(); }
});
test('architecture switches between 2D, 3D and the original As-Is view', async () => {
  const page = await visit('#dados/arquitetura-as-is-e-to-be');
  try {
    await page.locator('.tog [data-v="tobe"]').click();
    assert.equal(await page.locator('.tog [data-v="tobe"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-d="3d"]').click();
    const frame = await page.locator('#vista3d iframe').elementHandle().then(handle => handle.contentFrame());
    await frame.locator('#scene canvas').waitFor({ timeout: 30000 });
    assert.equal(await frame.evaluate(() => location.hash), '#rec');
    await page.locator('[data-d="2d"]').click();
    await page.locator('.tog [data-v="asis"]').click();
    assert.equal(await page.locator('#vista2d').isVisible(), true);
    await page.waitForTimeout(100);
    assert.equal(await frame.evaluate(() => window.COE_MODELO_ATIVO), false);
  } finally { await page.close(); }
});
test('only the selected hero theme is downloaded and motion preference is honored', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const heroRequests = [];
  page.on('request', request => { if (request.url().includes('/img/home/')) heroRequests.push(request.url()); });
  await page.addInitScript(() => localStorage.setItem('coe:tema', 'dark'));
  try {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.locator('#hm-picture img').evaluate(image => image.decode());
    assert.equal(heroRequests.length, 1);
    assert.ok(heroRequests[0].endsWith('hero-escuro.webp'));
    assert.equal(await page.locator('.hm-title').evaluate(element => getComputedStyle(element).animationName), 'none');
  } finally { await page.close(); }
});
test('file protocol keeps local navigation working', async () => {
  const { pathToFileURL } = require('node:url'); const path = require('node:path');
  const page = await browser.newPage();
  try {
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('.hm-root a[href="#objetivos"]').first().click();
    await page.locator('#p-objetivos-ponto-de-partida-e-objetivos:not([hidden])').waitFor();
  } finally { await page.close(); }
});

test('inherited property names are not treated as KPI IDs', async () => {
  const page = await visit('#indicadores/ficha-de-kpi/toString');
  try {
    assert.match(await page.locator('#kpiCard').textContent(), /Indicador não encontrado/);
    await page.evaluate(() => { location.hash = '#indicadores/ficha-de-kpi/constructor'; });
    await page.waitForTimeout(100);
    assert.match(await page.locator('#kpiCard').textContent(), /Indicador não encontrado/);
  } finally { await page.close(); }
});

test('expanded diagnostic and architecture diagrams are accessible on mobile', async () => {
  const page = await visit('#dados/diagnostico', { viewport: { width: 390, height: 844 } });
  try {
    await page.locator('#p-dados-diagnostico [role="tab"]').nth(1).click();
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const scan = async () => page.evaluate(async () => {
      const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
      return result.violations.map(violation => violation.id);
    });
    assert.deepEqual(await scan(), []);
    await page.evaluate(() => { location.hash = '#dados/arquitetura-as-is-e-to-be'; });
    await page.locator('#vista2d').waitFor();
    assert.equal(await page.locator('.archw').getAttribute('tabindex'), '0');
    assert.deepEqual(await scan(), []);
  } finally { await page.close(); }
});

test('COE room model supports views, selection, capture, theme and pause in the original page', async () => {
  // The live TVs come from the external videowall site; without it the room falls back to its demo screens.
  const page = await visit('#dados/sala-do-coe', {}, ['https://felipeab8.github.io/**']);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  try {
    const host = page.locator('iframe[title="Modelo 3D da sala do COE da Cooperativa Holambra"]');
    const frame = await host.elementHandle().then(handle => handle.contentFrame());
    await frame.waitForFunction(() => document.documentElement.dataset.modelo === 'pronto');
    await page.locator('#p-dados-sala-do-coe .mshield').click();
    assert.equal(await frame.locator('canvas').count(), 1);
    for (const name of ['interior', 'planta', 'videowall', 'reuniao', 'tecnica', 'exterior']) {
      await frame.locator('[data-view="' + name + '"]').click();
      assert.equal(await frame.locator('[data-view="' + name + '"]').getAttribute('aria-pressed'), 'true');
    }
    assert.equal(await frame.locator('#areas').isHidden(), true);
    assert.equal(await frame.locator('#areas-toggle').getAttribute('aria-expanded'), 'false');
    await frame.locator('#areas-toggle').click();
    await frame.locator('[data-zone="1"]').click();
    assert.match(await frame.locator('#details').innerText(), /Operações/);
    await frame.locator('#areas-close').click();
    assert.equal(await frame.locator('#areas').isHidden(), true);
    assert.match(await frame.locator('#cap-t').innerText(), /Operações/);
    await frame.locator('#areas-toggle').click();
    assert.equal(await frame.locator('[data-tv]').count(), 9);
    await frame.locator('[data-tv="8"]').click();
    assert.equal(await frame.locator('[data-view="reuniao"]').getAttribute('aria-pressed'), 'true');
    assert.match(await frame.locator('#cap-t').innerText(), /E0 · Visão da unidade/);
    assert.match(await frame.locator('#cap-link').getAttribute('href'), /\?telas=est-geral&tema=/);
    await frame.locator('#areas-close').click();
    await frame.locator('#tour-toggle').click();
    await frame.locator('#tour-play').click();
    const step = Number((await frame.locator('#cap-step').innerText()).match(/(\d) de 6/i)[1]);
    assert.ok(step >= 1 && step < 6);
    await frame.locator('#tour-next').click();
    assert.match(await frame.locator('#cap-step').innerText(), new RegExp((step + 1) + ' de 6', 'i'));
    const order = ['exterior', 'interior', 'videowall', 'reuniao', 'tecnica', 'planta'];
    assert.equal(await frame.locator('[data-view="' + order[step] + '"]').getAttribute('aria-pressed'), 'true');
    await frame.locator('#tour-stop').click();
    assert.equal(await frame.locator('#cap-tour').isHidden(), true);
    await frame.locator('#walk-toggle').click();
    assert.equal(await frame.locator('#walk-hint').isVisible(), true);
    await frame.locator('#walk-exit').click();
    assert.equal(await frame.locator('#walk-hint').isHidden(), true);
    const downloadPromise = page.waitForEvent('download');
    await frame.locator('#capture').click();
    assert.match((await downloadPromise).suggestedFilename(), /^sala-coe-.*\.png$/);
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; document.dispatchEvent(new Event('coe:modelos')); });
    await frame.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    assert.equal(await page.locator('#p-dados-sala-do-coe .sala-render button, #p-dados-sala-do-coe .sala-render [data-zoom]').count(), 0);
    assert.match(await page.locator('#p-dados-sala-do-coe .sala-render figcaption').innerText(), /Perspectivas de acabamento/);
    await page.evaluate(() => { location.hash = '#inicio'; });
    await frame.waitForFunction(() => window.COE_MODELO_ATIVO === false);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('COE room offers recovery when its 3D dependencies fail', async () => {
  const page = await browser.newPage();
  try {
    await page.route('https://cdnjs.cloudflare.com/**', route => route.abort());
    await page.goto(base + '/sala-coe-3d/');
    await page.waitForFunction(() => document.documentElement.dataset.modelo === 'erro');
    assert.match(await page.locator('#status').innerText(), /Bibliotecas 3D indisponíveis/);
    assert.equal(await page.locator('#status button').innerText(), 'Tentar novamente');
  } finally { await page.close(); }
});

test('COE room area panel remains consistent when resizing between desktop and mobile', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  try {
    await page.goto(base + '/sala-coe-3d/');
    await page.waitForFunction(() => document.documentElement.dataset.modelo === 'pronto');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.getElementById('areas').classList.contains('closed'));
    assert.equal(await page.locator('#areas-toggle').getAttribute('aria-expanded'), 'false');
    await page.locator('#areas-toggle').click();
    assert.equal(await page.locator('#areas-toggle').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('#areas').isVisible(), true);
    await page.setViewportSize({ width: 1440, height: 900 });
    assert.equal(await page.locator('#areas').isVisible(), true);
  } finally { await page.close(); }
});

test('infrastructure pages show the workbook values and link both ways with the viability catalog', async () => {
  const page = await visit('#dados/diagnostico/custos');
  try {
    const V = await page.evaluate(() => window.VIAB);
    const soma = ids => ids.reduce((t, i) => t + V.custos.find(c => c.id === i).total, 0);
    const reais = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
    // visão do capítulo: um cartão por página da infraestrutura que tem itens no estudo
    const cards = page.locator('#p-dados-diagnostico .cc-c');
    assert.equal(await cards.count(), 5);
    assert.doesNotMatch(await page.locator('#p-inicio-objetivo-do-coe').evaluate(e => e.textContent), /Entrega do projeto ·/, 'selo da capa removido');
    // sala: o resumo soma os blocos e o videowall traz C005 com a quantidade e o valor da planilha
    await page.evaluate(() => { location.hash = '#dados/sala-do-coe/custo-sala-videowall'; });
    const bloco = page.locator('#p-dados-sala-do-coe [data-secao="custo-sala-videowall"]');
    await bloco.locator('.cv-lista').waitFor();
    assert.equal(await bloco.evaluate(d => d.open), true);
    const sala = V.vinculos.blocos.filter(b => b.rota.startsWith('dados/sala-do-coe'));
    assert.equal(await page.locator('#p-dados-sala-do-coe .cr-tot b').innerText(), reais(soma(sala.flatMap(b => b.ids))));
    const c005 = bloco.locator('.cv-it', { hasText: 'C005' });
    assert.match(await c005.innerText(), /6 un\.[\s\S]*R\$ 6\.100[\s\S]*R\$ 36\.600/);
    // diagnóstico de campo: o radar das moegas aparece dentro da parada, com o valor da planilha
    await page.evaluate(() => { location.hash = '#dados/diagnostico-de-campo/recepcao-e-moegas'; });
    const moega = page.locator('#p-dados-diagnostico-de-campo [data-secao="recepcao-e-moegas"] .cv-solo');
    await moega.waitFor();
    assert.match(await moega.innerText(), /C052[\s\S]*R\$ 75\.000/);
    assert.equal(await moega.locator('.cv-cn i.on').allInnerTexts().then(t => t.join(',')), 'Comp');
    // do bloco para o catálogo filtrado, e de volta para a página da infraestrutura
    await moega.getByRole('link', { name: 'Ver no catálogo de custos' }).click();
    await page.locator('#p-viabilidade-investimento-e-retorno section.aba[data-aba="catalogo"]:not([hidden])').waitFor();
    const linhas = page.locator('#p-viabilidade-investimento-e-retorno .cx-t tbody tr');
    assert.equal(await linhas.count(), 1);
    assert.match(await page.locator('.cx-res').innerText(), /1 item · R\$ 75\.000/);
    await linhas.first().getByRole('link', { name: 'Diagnóstico de campo' }).click();
    await page.locator('#p-dados-diagnostico-de-campo:not([hidden])').waitFor();
    assert.equal(await page.locator('#p-dados-diagnostico-de-campo [data-secao="recepcao-e-moegas"]').evaluate(d => d.open), true);
  } finally { await page.close(); }
});

test('the viability catalog filters by layer, scenario and search, and its totals close with the workbook', async () => {
  const page = await visit('#viabilidade/investimento-e-retorno/catalogo');
  try {
    const V = await page.evaluate(() => window.VIAB);
    const reais = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
    const res = page.locator('.cx-res');
    assert.match(await res.innerText(), new RegExp('83 itens · ' + reais(V.custos.reduce((t, c) => t + c.total, 0)).replace(/\$/g, '\\$').replace(/\./g, '\\.')));
    assert.equal(await page.locator('.cx-t tbody tr:not(.cx-mais)').count(), 12);
    await page.locator('.cx-mais button').click();
    assert.equal(await page.locator('.cx-t tbody tr').count(), 83);
    for (const [i, nome] of V.cenarios.nomes.entries()) {
      await page.locator('[data-cen="' + i + '"]').click();
      assert.match(await res.innerText(), new RegExp(reais(V.cenarios.direto[i]).replace(/\$/g, '\\$').replace(/\./g, '\\.')), nome);
    }
    await page.locator('.cx-res .m-limpa').click();
    await page.locator('.cx-cam button[data-tok="8"]').click();
    assert.equal(await page.locator('.cx-cam button[data-tok="8"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.cx-t tbody tr').count(), V.custos.filter(c => c.camada === 8).length);
    await page.locator('.cx-busca input').fill('videoconferencia');
    assert.equal(await page.locator('.cx-t tbody tr').count(), 1);
    assert.equal(await page.locator('a.cx-dl').getAttribute('href'), 'Viabilidade/' + V.fonte);
    // a cadeia do dado na solução mostra o valor de cada camada e leva à infraestrutura
    await page.evaluate(() => { location.hash = '#viabilidade/solucao-e-contratacao'; });
    const cadeia = page.locator('#p-viabilidade-solucao-e-contratacao .vb-cadeia .cad-v');
    assert.equal(await cadeia.count(), 8);
    await cadeia.nth(7).click();
    await page.locator('#p-dados-sala-do-coe:not([hidden])').waitFor();
  } finally { await page.close(); }
});

test('every KPI sheet shows only its own part of the videowall card and opens the indicator on its screen', async () => {
  const page = await visit('#indicadores/ficha-de-kpi');
  try {
    const C = await page.evaluate(() => window.COE);
    assert.deepEqual(Object.keys(C.mini).sort(), C.linhas.map(l => l[0]).sort(), 'uma miniatura por indicador');
    const card = page.locator('#p-indicadores-ficha-de-kpi #kpiCard');
    // a Visão geral mostra o mural e leva à página do mural
    assert.match(await card.locator('.kf-mini-bt img.so-claro').getAttribute('src'), /img\/kpi\/AVR-VG-M01-claro\.webp$/);
    await page.waitForFunction(() => { const i = document.querySelector('#kpiCard .kf-mini-bt img.so-claro'); return i && i.complete && i.naturalWidth > 0; });
    assert.equal(await card.locator('.kf-mini-bt img.so-claro').isVisible(), true);
    assert.equal(await card.locator('.kf-mini-bt img.so-escuro').isVisible(), false);
    // um indicador de tela: a miniatura é só a parte dele e a legenda diz o que é e onde está
    await page.locator('.kf-i[data-id="AVR-REC-A01"]').click();
    const bt = card.locator('.kf-mini-bt');
    assert.match(await bt.locator('img.so-claro').getAttribute('src'), /AVR-REC-A01-claro\.webp$/);
    assert.match(await card.locator('.kf-mini figcaption').innerText(), /Com tag por cultura[\s\S]*no card Caminhões na fila \(AVR-REC-A\)[\s\S]*Tela da recepção/);
    await page.locator('.kf-i[data-id="AVR-REC-G05"]').click();
    assert.match(await card.locator('.kf-mini-nota').innerText(), /balão/);
    await page.locator('.kf-i[data-id="AVR-REC-A01"]').click();
    await bt.click();
    await page.locator('#telao[open]').waitFor();
    assert.match(await page.locator('#telaoSub').innerText(), /Com tag por cultura \(AVR-REC-A\)/);
    const tela = await page.locator('#telaoTela iframe').getAttribute('data-tela');
    assert.match(tela, /\?telas=0&/);
    if (new URL(tela).origin === new URL(page.url()).origin) {
      // no mesmo domínio (GitHub Pages da mesma conta) só a parte do indicador fica contornada dentro da tela
      const frame = page.frameLocator('#telaoTela iframe');
      await frame.locator('.coe-destaque').first().waitFor({ timeout: 30000 });
      assert.equal(await frame.locator('.coe-destaque').count(), 1);
      assert.match(await frame.locator('.coe-destaque').innerText(), /Com tag/i);
      assert.equal(await frame.locator('[data-codigo="AVR-REC-A"].coe-destaque').count(), 0);
    }
    await page.keyboard.press('Escape');
  } finally { await page.close(); }
});
