/* Auditoria real de todas as rotas. Não substitui uma revisão humana de acessibilidade. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.COE_BASE_URL || 'http://127.0.0.1:8765';
const evidence = process.env.COE_EVIDENCE_DIR || path.resolve(__dirname, '../test-results');
(async () => {
  fs.mkdirSync(evidence, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const errors = [], consoleErrors = [], failed = [], httpErrors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('requestfailed', r => failed.push({ url: r.url(), error: r.failure().errorText }));
  page.on('response', r => { if (r.status() >= 400) httpErrors.push({ url: r.url(), status: r.status() }); });
  const report = { browser: await browser.version(), routes: [], viewports: [], errors, consoleErrors, failed, httpErrors };
  try {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const routes = await page.locator('#estrutura').textContent().then(JSON.parse);
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
      for (const section of routes) for (const route of section.paginas) {
        const hash = '#' + section.id + '/' + route.id;
        await page.evaluate(hash => { location.hash = hash; }, hash);
        await page.locator('#p-' + section.id + '-' + route.id + ':not([hidden])').waitFor();
        await page.waitForTimeout(80);
        const accessibility = await page.evaluate(async () => {
          const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
          return result.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }));
        });
        const state = await page.evaluate(() => ({
          visiblePages: document.querySelectorAll('article.page:not([hidden])').length,
          overflow: document.documentElement.scrollWidth > innerWidth,
          brokenImages: [...document.querySelectorAll('article.page:not([hidden]) img[src]')].filter(i => i.complete && !i.naturalWidth).map(i => i.getAttribute('src')),
          duplicateIds: [...document.querySelectorAll('[id]')].map(n => n.id).filter((id, index, ids) => ids.indexOf(id) !== index),
        }));
        report.routes.push({ hash, theme, ...state, accessibility });
        console.log(theme, hash, 'axe:', accessibility.map(v => v.id).join(',') || 'OK');
      }
    }
    report.expandedViews = [];
    await page.setViewportSize({ width: 390, height: 844 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
      for (const section of routes) for (const route of section.paginas) {
        const hash = '#' + section.id + '/' + route.id;
        await page.evaluate(hash => { location.hash = hash; }, hash);
        const root = page.locator('#p-' + section.id + '-' + route.id);
        await root.waitFor();
        await root.locator('details').evaluateAll(details => details.forEach(detail => { detail.open = true; }));
        const tabs = root.locator('[role="tab"]'), count = await tabs.count();
        for (let tab = 0; tab < Math.max(1, count); tab++) {
          if (count) await tabs.nth(tab).click();
          const accessibility = await page.evaluate(async () => {
            const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
            return result.violations.map(violation => ({ id: violation.id, impact: violation.impact, nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }));
          });
          report.expandedViews.push({ hash, theme, tab, accessibility });
        }
      }
      console.log('Abas e seções abertas em celular:', theme, 'verificadas.');
    }
    report.mobileRoutes = [];
    for (const width of [360, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      for (const section of routes) for (const route of section.paginas) {
        const hash = '#' + section.id + '/' + route.id;
        await page.evaluate(hash => { location.hash = hash; }, hash);
        const current = page.locator('#p-' + section.id + '-' + route.id);
        await current.waitFor();
        await page.waitForTimeout(40);
        report.mobileRoutes.push({ width, hash, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
      }
    }
    await page.evaluate(() => { location.hash = '#inicio'; });
    await page.locator('.hm-hero').waitFor();
    for (const width of [360, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
        await page.waitForTimeout(200);
        await page.locator('#hm-picture img').evaluate(img => img.decode());
        await page.screenshot({ path: path.join(evidence, 'home-' + width + '-' + theme + '.png'), fullPage: true });
        const state = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, image: document.querySelector('#hm-picture img').getAttribute('src') }));
        report.viewports.push({ width, theme, ...state });
      }
    }
  } catch (error) { report.fatal = error.stack; process.exitCode = 1; }
  finally {
    const problems = report.routes.some(route => route.visiblePages !== 1 || route.overflow || route.duplicateIds.length || route.brokenImages.length || route.accessibility.length) ||
      (report.mobileRoutes || []).some(route => route.overflow) || (report.expandedViews || []).some(view => view.accessibility.length) || report.viewports.some(viewport => viewport.overflow) || errors.length ||
      httpErrors.some(error => error.url.startsWith(base));
    if (problems) process.exitCode = 1;
    fs.writeFileSync(path.join(evidence, 'ui-audit.json'), JSON.stringify(report, null, 2));
    await browser.close();
  }
})();
