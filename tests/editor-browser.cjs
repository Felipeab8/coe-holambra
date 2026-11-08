/* Configurador da Sala do COE: único ambiente editável do material.
   Os testes estáticos usam COE_STATIC_URL (python -m http.server). Os de publicação exigem servidor.py
   com banco de TESTE vazio em COE_EDITOR_URL: eles publicam e restauram o layout. */
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const base=process.env.COE_EDITOR_URL||'http://127.0.0.1:8778';
const staticBase=process.env.COE_STATIC_URL||'http://127.0.0.1:8777';
let browser;
before(async()=>{browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});});
after(async()=>{await browser.close();});
async function room(url,options={}){
  const p=await browser.newPage({viewport:{width:1440,height:900},...options});p.setDefaultTimeout(90000);
  await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.COE_ROOM_EDITOR&&!document.getElementById('room-mode').disabled);return p;
}
const state=p=>p.evaluate(()=>COE_ROOM_EDITOR.getState());
/* com WebGL por software, duas maquetes animadas disputam a CPU: só a página em uso renderiza */
const focusPage=async(on,off)=>{await off.evaluate(()=>{window.COE_MODELO_ATIVO=false;});await on.evaluate(()=>{window.COE_MODELO_ATIVO=true;});};
async function configure(p){await p.locator('#room-mode').click();await p.waitForFunction(()=>COE_ROOM_EDITOR.isEditing());await p.locator('[data-view="planta"]').click();await p.waitForFunction(()=>!COE_ROOM_MODEL.busy());await p.waitForTimeout(300);}
async function drag(p,id,dx,dy){const q=await p.evaluate(id=>COE_ROOM_MODEL.project(id),id);await p.mouse.move(q.x,q.y);await p.mouse.down();for(let i=1;i<=8;i++)await p.mouse.move(q.x+dx*i/8,q.y+dy*i/8);await p.mouse.up();}

test('the configurator adds catalog items by placement, moves, rotates, scales and removes any element',async()=>{
  const p=await room(staticBase+'/sala-coe-3d/');try{
    await p.evaluate(()=>localStorage.clear());
    assert.equal(await p.locator('#room-catalog').isHidden(),true);await configure(p);
    assert.ok(await p.locator('#room-cat-list [data-kind]').count()>=20);
    await p.locator('[data-kind="tv75"]').click();await p.mouse.move(700,500);await p.mouse.move(720,480);await p.mouse.click(720,480);
    let s=await state(p);assert.equal(s.added.length,1);assert.equal(s.added[0].kind,'tv75');const tv=s.added[0].id;
    assert.equal(await p.locator('#room-objects').inputValue(),tv);
    await p.locator('[data-rot="90"]').click();await p.locator('#room-scale').fill('1.5');await p.locator('#room-scale').dispatchEvent('change');
    await p.locator('#room-screen').selectOption('2');
    s=await state(p);assert.equal(s.added[0].rotation,90);assert.equal(s.added[0].scale,1.5);assert.equal(s.added[0].screen,2);
    await drag(p,'area-1',60,-80);s=await state(p);assert.ok(s.objects['area-1'].x!==undefined&&s.objects['area-1'].z!==undefined);
    await p.keyboard.press('e');s=await state(p);assert.equal(s.objects['area-1'].rotation,15);
    await p.locator('#room-remove').click();s=await state(p);assert.equal(s.objects['area-1'].removed,true);
    assert.equal(await p.locator('#room-removed li').count(),1);await p.locator('#room-removed-title').click();await p.locator('#room-removed button').click();
    s=await state(p);assert.equal(s.objects['area-1'].removed,undefined);
    await p.keyboard.press('Control+z');s=await state(p);assert.equal(s.objects['area-1'].removed,true);
    await p.keyboard.press('Control+y');s=await state(p);assert.equal(s.objects['area-1'].removed,undefined);
  }finally{await p.close();}
});

test('wall-mounted items snap to the nearest wall, Shift keeps placing and the contextual bar acts on the selection',async()=>{
  const p=await room(staticBase+'/sala-coe-3d/');try{
    await p.evaluate(()=>localStorage.clear());await configure(p);
    const q=await p.evaluate(()=>COE_ROOM_MODEL.project('area-4'));
    await p.locator('[data-kind="tv75"]').click();await p.mouse.move(q.x-60,q.y);await p.mouse.move(q.x-85,q.y);
    await p.keyboard.down('Shift');await p.mouse.click(q.x-85,q.y);await p.keyboard.up('Shift');
    await p.mouse.move(q.x-85,q.y+60);await p.mouse.click(q.x-85,q.y+60);
    let s=await state(p);assert.equal(s.added.length,2);
    for(const tv of s.added){assert.equal(tv.rotation,90);assert.ok(Math.abs(tv.x+11.78)<.05,'TV encostada na parede esquerda');}
    await p.locator('#room-tag [data-q="rotr"]').click();s=await state(p);assert.equal(s.added[1].rotation,105);
    await p.locator('#room-tag [data-q="del"]').click();s=await state(p);assert.equal(s.added.length,1);
    await p.locator('#room-wallsnap').uncheck();await p.locator('[data-kind="tv55"]').click();await p.mouse.move(q.x-70,q.y+30);await p.mouse.click(q.x-85,q.y+30);
    s=await state(p);assert.equal(s.added[1].rotation,0);
    await p.locator('#room-file').click();await p.locator('#room-blank').dblclick();s=await state(p);
    assert.equal(s.added,undefined);assert.equal(s.objects['area-1'].removed,true);assert.equal(s.objects['divisoria-vidro'],undefined);
    await p.evaluate(()=>localStorage.clear());
  }finally{await p.close();}
});

test('a layout survives reload as a local draft, exports, imports and restores the original',async()=>{
  const p=await room(staticBase+'/sala-coe-3d/');try{
    await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForFunction(()=>window.COE_ROOM_EDITOR&&!document.getElementById('room-mode').disabled);
    await configure(p);await p.locator('#room-cat-search').fill('parede');await p.locator('[data-kind="wall"]').click();await p.keyboard.press('Escape');
    assert.equal((await state(p)).added,undefined);
    await p.locator('[data-kind="wall"]').click();await p.mouse.move(600,400);await p.mouse.click(600,400);
    await p.locator('#room-proportions summary').click();await p.locator('#room-sx').fill('2');await p.locator('#room-sx').dispatchEvent('change');
    await p.evaluate(()=>{const i=document.getElementById('room-color');i.value='#aa3344';i.dispatchEvent(new Event('change'));});
    const before=await state(p);assert.equal(before.added[0].sx,2);assert.equal(before.added[0].color,'#aa3344');
    await p.reload();await p.waitForFunction(()=>window.COE_ROOM_EDITOR&&!document.getElementById('room-mode').disabled);
    assert.deepEqual(await state(p),before);assert.equal(await p.locator('#room-draft-badge').isVisible(),true);
    await configure(p);await p.locator('#room-file').click();const dl=p.waitForEvent('download');await p.locator('#room-export').click();
    const file=await (await dl).path();const exported=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(exported.schema,'coe-sala-layout');assert.deepEqual(exported.room,before);
    await p.locator('#room-reset-all').dblclick();assert.deepEqual(await state(p),{});
    await p.locator('#room-file').click();await p.locator('#room-import-file').setInputFiles(file);await p.waitForFunction(()=>(COE_ROOM_EDITOR.getState().added||[]).length===1);
    assert.deepEqual(await state(p),before);
    await p.locator('#room-file').click();const pub=p.waitForEvent('download');await p.locator('#room-publish').click();
    const json=JSON.parse(fs.readFileSync(await (await pub).path(),'utf8'));assert.equal(json.schema,1);assert.deepEqual(json.room,before);
    await p.evaluate(()=>localStorage.clear());
  }finally{await p.close();}
});

test('inside the material the configurator is the only editing surface',async()=>{
  const p=await browser.newPage({viewport:{width:1440,height:900}});
  try{
    await p.goto(staticBase+'/#dados/sala-do-coe');await p.locator('#p-dados-sala-do-coe:not([hidden])').waitFor();
    assert.equal(await p.locator('#coe-editor-toggle').count(),0);
    const frame=await p.locator('#p-dados-sala-do-coe iframe').elementHandle().then(h=>h.contentFrame());await frame.waitForFunction(()=>window.COE_ROOM_EDITOR&&!document.getElementById('room-mode').disabled);
    await p.locator('#p-dados-sala-do-coe .mshield').click();await frame.locator('#room-mode').click();
    assert.equal(await frame.locator('#room-editor').isVisible(),true);assert.equal(await frame.locator('#room-toolbar').isVisible(),true);
    assert.equal(await p.locator('a.mlink[href="sala-coe-3d/index.html#configurar"]').count(),1);
    for(const route of ['#dados/piloto-avare-modelo-3d','#dados/arquitetura-as-is-e-to-be','#indicadores/ficha-de-kpi','#inicio']){
      await p.evaluate(r=>{location.hash=r;},route);await p.waitForTimeout(300);
      assert.equal(await p.locator('article.page:not([hidden]) :is([contenteditable="true"],#room-mode,#camEdit)').count(),0,route);
    }
  }finally{await p.close();}
});

test('publication on the included server shares the layout with a second visitor and detects conflicts',async t=>{
  let reachable=true;try{await fetch(base+'/api/editor/state');}catch(_){reachable=false;}
  if(!reachable){t.skip('servidor de teste indisponível');return;}
  const read=async()=>(await fetch(base+'/api/editor/state')).json();
  const write=async s=>fetch(base+'/api/editor/state',{method:'PUT',headers:{'Content-Type':'application/json','X-COE-Editor':'1','Origin':base},body:JSON.stringify(s)});
  const reset=async()=>{const s=await read();await write({revision:s.revision,content:s.content||{},cameras:s.cameras||{},room:{}});};
  await reset();const a=await room(base+'/sala-coe-3d/'),b=await room(base+'/sala-coe-3d/');
  try{
    await a.evaluate(()=>localStorage.clear());await b.evaluate(()=>localStorage.clear());
    await focusPage(a,b);await configure(a);await a.locator('[data-kind="ledpanel"]').click();await a.mouse.move(700,420);await a.mouse.click(700,420);
    await a.locator('#room-file').click();await a.locator('#room-publish').click();await a.waitForFunction(()=>/publicado para todos/.test(document.getElementById('room-save-status').textContent));
    const published=await read();assert.equal(published.room.added[0].kind,'ledpanel');
    await b.evaluate(()=>localStorage.clear());await b.reload();await b.waitForFunction(()=>(COE_ROOM_EDITOR.getState().added||[]).length===1);await focusPage(b,a);
    await configure(b);await b.locator('[data-kind="plant"]').click();await b.mouse.click(650,450);
    await write({revision:published.revision,content:published.content||{},cameras:published.cameras||{},room:{}});
    await b.locator('#room-file').click();await b.locator('#room-publish').click();await b.waitForFunction(()=>/Outra pessoa publicou/.test(document.getElementById('room-save-status').textContent));
    assert.equal((await state(b)).added.length,2);
  }finally{await a.evaluate(()=>localStorage.clear()).catch(()=>{});await a.close();await b.close();await reset();}
});
