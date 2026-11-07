/* Requer servidor.py com banco de TESTE vazio; este teste publica e restaura conteúdo. */
const {test,before,after,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.COE_EDITOR_URL||'http://127.0.0.1:8778';
const staticBase=process.env.COE_STATIC_URL||'http://127.0.0.1:8777';
let browser;
async function state(){return (await fetch(base+'/api/editor/state')).json();}
async function put(s){const r=await fetch(base+'/api/editor/state',{method:'PUT',headers:{'Content-Type':'application/json','X-COE-Editor':'1','Origin':base},body:JSON.stringify(s)});assert.equal(r.status,200);return r.json();}
async function clear(){const s=await state();await put({revision:s.revision,content:{},room:{},cameras:{}});}
before(async()=>{browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});});
beforeEach(clear);
after(async()=>{try{await clear();}finally{await browser.close();}});
async function visit(url=base,options={}){
  const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce',...options});
  await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  p.on('dialog',d=>d.accept());await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.getElementById('coe-editor-toggle')&&!document.getElementById('coe-editor-toggle').disabled);return p;
}
async function edit(p,text){
  if(await p.locator('#coe-editor-toggle').getAttribute('aria-pressed')!=='true')await p.locator('#coe-editor-toggle').click();
  if(await p.locator('#coe-editor-panel').isHidden())await p.locator('#coe-fields-toggle').click();
  await p.locator('#coe-field-search').fill('Visibilidade das operações');
  const key=await p.locator('#coe-field-list option').first().getAttribute('value');await p.locator('#coe-field-list').selectOption(key);await p.locator('#coe-value').fill(text);await p.locator('#coe-apply').click();return key;
}
async function publish(p){await p.locator('#coe-publish').click();await p.waitForFunction(()=>/publicada/.test(document.getElementById('coe-save-status').textContent));}
test('toggle without login, preview isolated and publication shared with a second visitor',async()=>{
  const a=await visit(),b=await visit();try{
    const original=await b.locator('.executive-subtitle').textContent();await edit(a,'Texto executivo compartilhado');
    assert.equal(await a.locator('input[type=password]').count(),0);assert.equal(await a.locator('.executive-subtitle').textContent(),'Texto executivo compartilhado');assert.equal(await b.locator('.executive-subtitle').textContent(),original);
    await a.locator('#coe-display').click();assert.equal(await a.locator('#coe-editor').isHidden(),true);await a.locator('#coe-editor-toggle').click();await publish(a);
    await b.reload();await b.waitForFunction(()=>document.querySelector('.executive-subtitle').textContent==='Texto executivo compartilhado');assert.equal(await b.locator('#coe-editor').isHidden(),true);
  }finally{await a.close();await b.close();}
});
test('simultaneous publication keeps the losing preview and explains conflict',async()=>{
  const a=await visit(),b=await visit();try{await edit(a,'Primeiro autor');await edit(b,'Segundo autor');await publish(a);await b.locator('#coe-publish').click();await b.waitForFunction(()=>/Outra pessoa/.test(document.getElementById('coe-save-status').textContent));assert.equal(await b.locator('.executive-subtitle').textContent(),'Segundo autor');assert.ok(Object.values((await state()).content).includes('Primeiro autor'));}finally{await a.close();await b.close();}
});
test('edits made during a delayed publication remain pending',async()=>{
  const p=await visit();let release;const gate=new Promise(resolve=>release=resolve);try{
    await edit(p,'Primeira prévia');await p.route('**/api/editor/state',async route=>{if(route.request().method()==='PUT'){await gate;await route.continue();}else await route.continue();});
    await p.locator('#coe-publish').click();await p.locator('#coe-value').fill('Segunda prévia');await p.locator('#coe-apply').click();release();await p.waitForFunction(()=>/novas alterações/.test(document.getElementById('coe-save-status').textContent));assert.equal(await p.locator('.executive-subtitle').textContent(),'Segunda prévia');assert.ok(Object.values((await state()).content).includes('Primeira prévia'));
  }finally{release();await p.close();}
});
test('plain text and invalid links cannot execute HTML; undo and history restore snapshots',async()=>{
  const p=await visit();try{const version=(await state()).revision;await edit(p,'<img src=x onerror="window.XSS=true">');assert.equal(await p.evaluate(()=>window.XSS),undefined);assert.equal(await p.locator('.executive-subtitle img').count(),0);await p.locator('#coe-undo').click();assert.match(await p.locator('.executive-subtitle').textContent(),/Visibilidade/);
    await edit(p,'Versão para restaurar');await publish(p);await p.locator('#coe-history').click();await p.locator('#coe-history-list button').filter({hasText:new RegExp('Versão '+version+' ·')}).click();await p.waitForFunction(()=>/Visibilidade/.test(document.querySelector('.executive-subtitle').textContent));assert.match(await p.locator('.executive-subtitle').textContent(),/Visibilidade/);assert.ok(Object.values((await state()).content).includes('Versão para restaurar'));await publish(p);assert.deepEqual((await state()).content,{});
    await p.locator('#coe-field-search').fill('Destino do link');const key=await p.locator('#coe-field-list option').first().getAttribute('value');await p.locator('#coe-field-list').selectOption(key);await p.locator('#coe-value').fill('javascript:alert(1)');await p.locator('#coe-apply').click();assert.match(await p.locator('#coe-field-error').textContent(),/válido/);
  }finally{await p.close();}
});
test('KPI descriptive fields update the real card and remain after publication',async()=>{
  const p=await visit(base+'/#indicadores/ficha-de-kpi');try{await p.locator('#coe-editor-toggle').click();await p.locator('#coe-scope').selectOption('indicadores');const key=await p.evaluate(()=>COE_EDITOR.fields().find(k=>k.startsWith('kpi:')&&k.endsWith(':desc')));const id=key.split(':')[1];await p.locator('#coe-field-search').fill(id+' · Descrição');await p.locator('#coe-field-list').selectOption(key);await p.locator('#coe-value').fill('Descrição compartilhada do indicador');await p.locator('#coe-apply').click();assert.equal(await p.locator('.kf-desc').textContent(),'Descrição compartilhada do indicador');await publish(p);assert.equal((await state()).content[key],'Descrição compartilhada do indicador');}finally{await p.close();}
});
test('static hosting exports a single JSON and reads it for every visitor',async()=>{
  const p=await visit(staticBase);try{await edit(p,'Versão publicada pelo GitHub');assert.equal(await p.locator('#coe-publish').isDisabled(),true);const downloadPromise=p.waitForEvent('download');await p.locator('#coe-export').click();const download=await downloadPromise;const content=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(download.suggestedFilename(),'edicoes.json');assert.ok(Object.values(content.content).includes('Versão publicada pelo GitHub'));
    const b=await browser.newPage();await b.route('**/dados/edicoes.json',route=>route.fulfill({json:content}));await b.goto(staticBase);await b.waitForFunction(()=>document.querySelector('.executive-subtitle').textContent==='Versão publicada pelo GitHub');await b.close();
  }finally{await p.close();}
});
test('room controls persist transforms, names, colors and added equipment to a second browser',async()=>{
  const p=await visit(base+'/#dados/sala-do-coe');try{
    const frame=await p.locator('#p-dados-sala-do-coe iframe').elementHandle().then(h=>h.contentFrame());await frame.waitForFunction(()=>window.COE_ROOM_EDITOR,{timeout:45000});await p.locator('#coe-editor-toggle').click();await p.locator('#coe-panel-close').click();await p.locator('#p-dados-sala-do-coe .mshield').click();await frame.locator('#room-objects').selectOption('area-1');await frame.locator('#room-name').fill('Operações integradas');await frame.locator('#room-name').dispatchEvent('change');await frame.locator('#room-x').fill('-7');await frame.locator('#room-x').dispatchEvent('change');await frame.locator('#room-rotation').fill('30');await frame.locator('#room-rotation').dispatchEvent('change');await frame.locator('#room-kind').selectOption('chair');await frame.locator('#room-add').click();await frame.getByText('Cores da sala',{exact:true}).click();await frame.locator('#room-wall-color').fill('#e1eaf0');await frame.locator('#room-wall-color').dispatchEvent('change');await publish(p);
    const s=await state();assert.equal(s.room.objects['area-1'].name,'Operações integradas');assert.equal(s.room.objects['area-1'].x,-7);assert.equal(s.room.objects['area-1'].rotation,30);assert.equal(s.room.added[0].kind,'chair');assert.equal(s.room.appearance.wallColor,'#e1eaf0');
    const b=await browser.newPage();await b.goto(base+'/sala-coe-3d/');await b.waitForFunction(()=>window.COE_ROOM_EDITOR?.getState().objects?.['area-1']?.x===-7,{timeout:45000});assert.equal(await b.evaluate(()=>COE_ROOM_EDITOR.getState().added.length),1);await b.close();
  }finally{await p.close();}
});
test('editor has no horizontal overflow or serious accessibility violations at mobile and desktop sizes',async()=>{
  const p=await visit();try{await p.locator('#coe-editor-toggle').click();await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});for(const width of [320,768,1440]){await p.setViewportSize({width,height:950});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);const results=await p.evaluate(()=>axe.run('#coe-editor',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));assert.deepEqual(results.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)})),[]);}
    const out=process.env.COE_EVIDENCE_DIR||path.join(__dirname,'..','test-results');fs.mkdirSync(out,{recursive:true});await p.screenshot({path:path.join(out,'modo-editor.png')});
  }finally{await p.close();}
});
test('uploaded image is reencoded and available to a second visitor after publishing',async()=>{
  const p=await visit();try{
    await p.locator('#coe-editor-toggle').click();await p.locator('#coe-field-list').selectOption('hero:light');
    // Seleção do arquivo equivale ao diálogo nativo aberto pelo botão Enviar imagem.
    await p.locator('#coe-upload').click({noWaitAfter:true});
    await p.locator('#coe-upload-file').setInputFiles(path.join(__dirname,'..','dados','f14-p.jpg'));
    await p.waitForFunction(()=>document.querySelector('#hm-picture img').getAttribute('src').startsWith('uploads/'));
    await publish(p);const s=await state();assert.match(s.content['hero:light'],/^uploads\/[a-f0-9]{64}\.webp$/);
    const b=await visit();await b.waitForFunction(()=>document.querySelector('#hm-picture img').getAttribute('src').startsWith('uploads/')&&document.querySelector('#hm-picture img').naturalWidth>0);await b.close();
  }finally{await p.close();}
});
test('original camera editor publishes into the same shared snapshot',async()=>{
  const p=await visit(base+'/#dados/piloto-avare-modelo-3d');try{
    const f=await p.locator('#p-dados-piloto-avare-modelo-3d iframe').elementHandle().then(h=>h.contentFrame());await f.locator('#camEdit').waitFor({state:'attached',timeout:45000});await p.locator('#coe-editor-toggle').click();await p.locator('#coe-panel-close').click();await p.locator('#p-dados-piloto-avare-modelo-3d .mshield').click();await f.locator('#tabCam').click();await f.locator('.item.cam').first().click();await f.locator('#ed-d').fill('Câmera com edição compartilhada');await f.locator('#ed-save').click();await p.waitForFunction(()=>Object.values(COE_EDITOR.getState().cameras).some(c=>c.d==='Câmera com edição compartilhada'));await publish(p);assert.ok(Object.values((await state()).cameras).some(c=>c.d==='Câmera com edição compartilhada'));
  }finally{await p.close();}
});
test('room duplicate, visibility, scale, remove, undo and reset keep the original objects',async()=>{
  const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});try{
    await p.goto(base+'/sala-coe-3d/');await p.waitForFunction(()=>window.COE_ROOM_EDITOR);await p.locator('#room-mode').click();await p.locator('#room-objects').selectOption('area-1');
    const original=await p.locator('#room-x').inputValue();await p.locator('#room-x').fill('-6');await p.locator('#room-x').dispatchEvent('change');await p.locator('#room-undo').click();assert.equal(await p.locator('#room-x').inputValue(),original);
    await p.locator('#room-scale').fill('1.2');await p.locator('#room-scale').dispatchEvent('change');await p.locator('#room-reset-object').click();assert.equal(await p.locator('#room-scale').inputValue(),'1');
    await p.locator('#room-duplicate').click();const id=await p.locator('#room-objects').inputValue();assert.notEqual(id,'area-1');assert.equal(await p.evaluate(()=>COE_ROOM_EDITOR.getState().added[0].sourceId),'area-1');await p.locator('#room-visible').uncheck();assert.equal(await p.evaluate(()=>COE_ROOM_EDITOR.getState().added[0].visible),false);
    await p.locator('#room-remove').click();assert.equal(await p.evaluate(()=>COE_ROOM_EDITOR.getState().added?.length||0),0);await p.locator('#room-undo').click();assert.equal(await p.evaluate(()=>COE_ROOM_EDITOR.getState().added.length),1);assert.equal(await p.evaluate(()=>COE_ROOM_MODEL.getObjects().filter(o=>!o.added).length),21);
  }finally{await p.close();}
});
