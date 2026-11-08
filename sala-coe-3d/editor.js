/* Configurador da Sala do COE: único ambiente editável do material.
   O modelo padrão permanece em modelo.js; aqui ficam seleção, catálogo, histórico, rascunho local e publicação. */
(function(){
  'use strict';
  const model=window.COE_ROOM_MODEL;if(!model)return;
  const $=id=>document.getElementById(id),clone=v=>JSON.parse(JSON.stringify(v)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const serverMode=!!document.querySelector('meta[name="coe-editor-storage"][content="server"]');
  const KEY='coe:sala:layout:v1',kinds=model.kindNames;
  const past=[],future=[];let baseline={},snapshot=null,editing=false,loading=true,saving=false,serial=0,last=null,placing=null,pointerKind='mouse',statusTimer=0,resetArmed=0;
  const fmt=n=>Number(n).toFixed(2).replace('.',',');
  const ICON={
    tv55:'<rect x="3" y="5" width="18" height="11" rx="1"/><path d="M9 20h6"/>',tv75:'<rect x="2" y="4" width="20" height="12" rx="1"/><path d="M8 20h8"/>',
    tvstand:'<rect x="4" y="3" width="16" height="9" rx="1"/><path d="M12 12v8M8 20h8"/>',vw2x2:'<rect x="3" y="4" width="8" height="6"/><rect x="13" y="4" width="8" height="6"/><rect x="3" y="12" width="8" height="6"/><rect x="13" y="12" width="8" height="6"/>',
    vw3x2:'<rect x="2" y="5" width="6" height="6"/><rect x="9" y="5" width="6" height="6"/><rect x="16" y="5" width="6" height="6"/><rect x="2" y="13" width="6" height="6"/><rect x="9" y="13" width="6" height="6"/><rect x="16" y="13" width="6" height="6"/>',
    ledpanel:'<rect x="2" y="4" width="20" height="13" rx="1"/><path d="M5 14l4-4 3 3 4-5 3 3"/>',screen:'<rect x="3" y="3" width="18" height="11" rx="1"/><path d="M12 14v6M7 21h10"/>',
    board:'<rect x="3" y="4" width="18" height="13" rx="1"/><path d="M8 7v7M13 7v4M18 7v5"/>',desk:'<path d="M2 11h20M4 11v8M20 11v8"/><rect x="5" y="4" width="5" height="4"/><rect x="14" y="4" width="5" height="4"/>',
    desk1:'<path d="M4 12h16M6 12v8M18 12v8"/><rect x="8" y="5" width="8" height="5"/>',chair:'<path d="M7 4h10v8H7zM6 12h12M12 12v5M8 20l4-3 4 3"/>',
    table:'<rect x="3" y="9" width="18" height="6" rx="1"/><circle cx="7" cy="5" r="1.5"/><circle cx="17" cy="5" r="1.5"/><circle cx="7" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    roundtable:'<circle cx="12" cy="12" r="5"/><circle cx="12" cy="3.5" r="1.5"/><circle cx="12" cy="20.5" r="1.5"/><circle cx="3.5" cy="12" r="1.5"/><circle cx="20.5" cy="12" r="1.5"/>',
    sofa:'<path d="M4 11V8h16v3M2 11h20v6H2zM4 17v3M20 17v3"/>',armchair:'<path d="M6 11V7h12v4M4 11h16v6H4zM6 17v3M18 17v3"/>',cabinet:'<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M12 3v18M10 11v2M14 11v2"/>',
    rack:'<rect x="6" y="3" width="12" height="18" rx="1"/><path d="M9 7h6M9 11h6M9 15h6"/>',ac:'<rect x="3" y="6" width="18" height="7" rx="2"/><path d="M6 17c1-1 1 1 2 0M11 17c1-1 1 1 2 0M16 17c1-1 1 1 2 0"/>',
    printer:'<path d="M7 9V3h10v6M5 9h14v8H5zM8 14h8v7H8z"/>',camera:'<rect x="5" y="7" width="14" height="5" rx="2"/><circle cx="12" cy="9.5" r="1.4"/><path d="M12 12v4M8 21l4-5 4 5"/>',
    extinguisher:'<path d="M9 8h6v13H9zM12 8V5M12 5h4M10 3h4"/>',wall:'<path d="M3 6h18v12H3zM3 12h18M9 6v6M15 12v6"/>',glasswall:'<rect x="4" y="3" width="16" height="18"/><path d="M8 7l3-3M8 12l7-7M10 16l8-8"/>',
    zone:'<path d="M4 4h16v16H4z" stroke-dasharray="3 2"/><path d="M8 12h8"/>',plant:'<path d="M12 21v-8"/><path d="M12 13c-4 0-6-3-6-7 4 0 6 3 6 7Zm0 0c4 0 6-3 6-7-4 0-6 3-6 7Z"/><path d="M8 21h8"/>',
    logo:'<rect x="2" y="7" width="20" height="9" rx="1"/><path d="M6 11h5M6 13h8"/>'
  };
  const compact=matchMedia('(max-width:760px)');
  function catalogOpen(open){$('room-catalog').classList.toggle('closed',!open);$('room-cat-toggle').setAttribute('aria-expanded',String(open));$('room-cat-toggle').textContent=open?'Recolher':'Abrir';}
  const svg=k=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+(ICON[k]||ICON.desk)+'</svg>';

  /* ---------- mensagens e rascunho local ---------- */
  function status(text,keep){const el=$('room-save-status');clearTimeout(statusTimer);el.textContent=text||'';el.hidden=!text;if(text&&!keep)statusTimer=setTimeout(()=>{el.hidden=true;},6000);}
  function readDraft(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&v.room&&typeof v.room==='object'?v.room:null;}catch(_){return null;}}
  function saveDraft(){try{const room=model.getState();if(same(room,baseline))localStorage.removeItem(KEY);else localStorage.setItem(KEY,JSON.stringify({savedAt:new Date().toISOString(),room}));}catch(_){/* sem armazenamento: o layout vale só nesta visita */}}

  /* ---------- estado ---------- */
  const current=()=>model.getObjects().find(o=>o.id===model.getSelection());
  function mutate(change,opts={}){
    const before=model.getState(),next=clone(before);change(next);const after=model.applyState(next);
    if(same(before,after)){refresh();return false;}
    const now=performance.now(),join=opts.key&&last&&last.key===opts.key&&(opts.window===Infinity||now-last.t<(opts.window||900));
    if(!join){past.push(before);if(past.length>150)past.shift();}
    last=opts.key?{key:opts.key,t:now}:null;future.length=0;saveDraft();refresh();return true;
  }
  function patch(item,values,opts){mutate(room=>{if(item.added){const t=(room.added||[]).find(o=>o.id===item.id);if(t)Object.assign(t,values);}else{room.objects=room.objects||{};const rec={...(room.objects[item.id]||{}),...values};for(const k of Object.keys(rec))if(rec[k]===undefined)delete rec[k];room.objects[item.id]=rec;}},opts);}
  function undo(){if(!past.length)return;future.push(model.getState());model.applyState(past.pop());last=null;saveDraft();refresh();status('Alteração desfeita.');}
  function redo(){if(!future.length)return;past.push(model.getState());model.applyState(future.pop());last=null;saveDraft();refresh();status('Alteração refeita.');}
  const newId=()=>'equipment-'+Date.now().toString(36)+'-'+(++serial).toString(36)+'-'+Math.random().toString(36).slice(2,7);
  function limitOk(){const s=model.getState();if(Object.keys(s.objects||{}).length+(s.added||[]).length>=300){status('Limite de 300 elementos editados atingido. Remova itens adicionados para continuar.');return false;}return true;}
  function add(kind){
    if(!limitOk())return;cancelPlacing();if(model.currentView()==='exterior')model.view('interior');if(compact.matches)catalogOpen(false);
    const c=model.center(),info=model.catalog.find(v=>v.kind===kind)||{},id=newId();
    const item={id,kind,x:c.x,y:0,z:c.z,rotation:0,scale:1,sx:1,sy:1,sz:1,visible:true,name:kinds[kind],description:'',items:[]};if(info.screen)item.screen=0;
    mutate(room=>{room.added=room.added||[];room.added.push(item);},{key:'place:'+id,window:Infinity});model.select(id);
    if(pointerKind==='mouse'){placing=id;model.follow(id);status('Mova o cursor e clique no piso para posicionar. Esc cancela.',true);}
    else status(info.name+' adicionado no centro da vista. Arraste para posicionar.');
  }
  function cancelPlacing(remove){if(!placing)return;const id=placing;placing=null;model.cancelFollow();if(remove&&last&&last.key==='place:'+id){undo();status('Inclusão cancelada.');}else status('');}
  function duplicate(item){
    if(!item||!limitOk())return;const id=newId(),copy={id,kind:item.kind};
    for(const k of ['x','y','z','rotation','scale','sx','sy','sz','name','description','items','screen','color'])if(item[k]!==undefined)copy[k]=clone(item[k]);
    copy.x=Math.min(50,+(item.x+.6).toFixed(2));copy.z=Math.min(50,+(item.z+.6).toFixed(2));copy.name=(item.name+' · cópia').slice(0,200);copy.visible=true;
    if(item.added){if(item.sourceId)copy.sourceId=item.sourceId;}else copy.sourceId=item.id;
    mutate(room=>{room.added=room.added||[];room.added.push(copy);});model.select(id);status('Cópia criada ao lado do original.');
  }
  function remove(item){if(!item)return;if(item.added)mutate(room=>{room.added=(room.added||[]).filter(o=>o.id!==item.id);});else patch(item,{removed:true});model.select(null);status(item.name+' removido. Use Desfazer ou a lista de elementos removidos para recuperar.');}
  function restore(id){const item=model.getObjects().find(o=>o.id===id);if(item){patch(item,{removed:undefined});model.select(id);}}

  /* ---------- painel ---------- */
  function fillCatalog(){
    const q=$('room-cat-search').value.trim().normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(),list=$('room-cat-list');list.replaceChildren();
    const groups=[...new Set(model.catalog.map(v=>v.group))];
    for(const g of groups){const items=model.catalog.filter(v=>v.group===g&&(!q||(v.name+' '+g).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().includes(q)));if(!items.length)continue;
      const h=document.createElement('h3');h.textContent=g;const grid=document.createElement('div');grid.className='room-cat-grid';
      for(const v of items){const b=document.createElement('button');b.type='button';b.dataset.kind=v.kind;b.innerHTML=svg(v.kind)+'<span></span>';b.lastChild.textContent=v.name;b.addEventListener('pointerdown',e=>{pointerKind=e.pointerType||'mouse';});b.onclick=()=>add(v.kind);grid.append(b);}
      list.append(h,grid);}
    if(!list.childElementCount){const p=document.createElement('p');p.className='room-cat-tip';p.textContent='Nenhum item encontrado.';list.append(p);}
  }
  function setInput(id,value){const el=$(id);if(document.activeElement===el)return;el.value=value;}
  function refresh(){
    $('room-mode').disabled=loading;
    const objects=model.getObjects(),id=model.getSelection(),item=objects.find(o=>o.id===id),select=$('room-objects');
    const live=objects.filter(o=>!o.removed),removed=objects.filter(o=>o.removed);
    select.replaceChildren(new Option('— nenhum elemento selecionado —',''));
    for(const [label,list] of [['Maquete da proposta',live.filter(o=>!o.added)],['Itens adicionados',live.filter(o=>o.added)]]){if(!list.length)continue;const g=document.createElement('optgroup');g.label=label;for(const o of list)g.append(new Option(o.name||kinds[o.kind],o.id));select.append(g);}
    select.value=item&&!item.removed?item.id:'';
    $('room-count').textContent=live.filter(o=>!o.added).length+' elementos da proposta · '+live.filter(o=>o.added).length+' adicionados'+(removed.length?' · '+removed.length+' removidos':'');
    const has=!!(item&&!item.removed);$('room-fields').hidden=!has;$('room-empty').hidden=has;
    if(has){
      setInput('room-name',item.name);for(const k of ['x','y','z'])setInput('room-'+k,+(+item[k]).toFixed(2));setInput('room-rotation',Math.round(item.rotation));
      setInput('room-scale',+(+item.scale).toFixed(2));setInput('room-scale-range',item.scale);for(const k of ['sx','sy','sz'])setInput('room-'+k,+(+item[k]).toFixed(2));
      setInput('room-description',item.description||'');setInput('room-items',(item.items||[]).join('\n'));
      $('room-screen-wrap').hidden=!item.hasScreen;if(item.hasScreen){const s=$('room-screen');if(!s.options.length)model.screenNames.forEach((n,i)=>s.append(new Option(n.charAt(0)+n.slice(1).toLowerCase(),String(i))));s.value=String(Number.isInteger(item.screen)?item.screen:0);}
      $('room-color-wrap').hidden=!item.colorable;if(item.colorable)setInput('room-color',item.color||(model.catalog.find(v=>v.kind===item.kind)||{}).color||'#ffffff');
      const size=model.size(item.id);$('room-dims').textContent=size?'Dimensões aproximadas: '+fmt(size.w)+' m (largura) × '+fmt(size.d)+' m (profundidade) × '+fmt(size.h)+' m (altura)':'';
      $('room-reset-object').hidden=item.added;$('room-tag-name').textContent=item.name+(size?' · '+fmt(size.w)+' × '+fmt(size.d)+' m':'');
    }
    const ul=$('room-removed');ul.replaceChildren();$('room-removed-wrap').hidden=!removed.length;$('room-removed-title').textContent='Elementos removidos ('+removed.length+')';
    for(const o of removed){const li=document.createElement('li'),span=document.createElement('span'),b=document.createElement('button');span.textContent=o.name;b.type='button';b.textContent='Restaurar';b.onclick=()=>restore(o.id);li.append(span,b);ul.append(li);}
    const room=model.getState();for(const [key,cid] of [['wallColor','wall'],['floorColor','floor'],['accentColor','accent']])setInput('room-'+cid+'-color',(room.appearance||{})[key]||model.colors[key]);
    $('room-undo').disabled=!past.length;$('room-redo').disabled=!future.length;
    const draft=!same(room,baseline);$('room-revert').disabled=!draft;$('room-reset-all').disabled=same(room,{});
    $('room-publish').disabled=loading||saving||(serverMode&&(!draft||!snapshot));
    $('room-draft-badge').hidden=editing||!draft||loading;
  }
  function field(key){
    /* o valor pertence ao elemento que estava selecionado quando o campo recebeu o foco */
    const input=$('room-'+key),target=input.dataset.target||model.getSelection(),item=model.getObjects().find(o=>o.id===target);delete input.dataset.target;if(!item||item.removed)return;let value;
    if(key==='items')value=input.value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean).slice(0,50).map(v=>v.slice(0,1000));
    else if(key==='screen')value=Number(input.value);
    else if(input.type==='number'){value=input.valueAsNumber;if(!Number.isFinite(value)||!input.checkValidity()){input.reportValidity();return;}}
    else value=input.value;
    patch(item,{[key]:value},{key:key+':'+item.id});
  }

  /* ---------- modo configuração ---------- */
  function setMode(value){
    editing=value===true;if(!editing)cancelPlacing(true);model.setMode(editing);
    for(const id of ['room-catalog','room-editor','room-toolbar','room-hint'])$(id).hidden=!editing;
    document.body.classList.toggle('room-editing',editing);$('room-mode').setAttribute('aria-pressed',String(editing));
    if(editing){if(model.currentView()==='exterior')model.view('interior');fillCatalog();catalogOpen(!compact.matches);status('Modo configuração: adicione, mova, gire, redimensione ou remova qualquer elemento. As alterações ficam salvas neste navegador.');}
    else{$('room-file-menu').hidden=true;status('');}
    refresh();
  }
  function applyState(room){model.applyState(room||{});baseline=model.getState();past.length=0;future.length=0;last=null;saveDraft();refresh();return model.getState();}
  window.COE_ROOM_EDITOR={setMode,getState:()=>model.getState(),applyState,isEditing:()=>editing};

  $('room-mode').onclick=()=>setMode(true);$('room-done').onclick=()=>setMode(false);
  $('room-objects').onchange=()=>{const v=$('room-objects').value;model.select(v||null);if(v)model.focus(v);};
  addEventListener('coe:room-selection',refresh);
  for(const key of ['name','description','items','x','y','z','rotation','scale','sx','sy','sz','screen','color']){const input=$('room-'+key);input.addEventListener('focus',()=>{input.dataset.target=model.getSelection()||'';});input.addEventListener('change',()=>field(key));}
  $('room-scale-range').addEventListener('input',()=>{const item=current();if(item)patch(item,{scale:+$('room-scale-range').value},{key:'scale:'+item.id});});
  document.querySelectorAll('[data-rot]').forEach(b=>b.onclick=()=>{const item=current();if(!item)return;let r=(item.rotation+Number(b.dataset.rot))%360;if(r<=-360)r+=360;patch(item,{rotation:r},{key:'rot:'+item.id});});
  $('room-focus').onclick=()=>model.focus(model.getSelection());
  $('room-duplicate').onclick=()=>duplicate(current());
  $('room-remove').onclick=()=>remove(current());
  $('room-reset-object').onclick=()=>{const item=current();if(item&&!item.added)mutate(room=>{if(room.objects)delete room.objects[item.id];});};
  for(const [key,cid] of [['wallColor','wall'],['floorColor','floor'],['accentColor','accent']])$('room-'+cid+'-color').onchange=()=>mutate(room=>{room.appearance={...(room.appearance||{}),[key]:$('room-'+cid+'-color').value};});
  $('room-reset-colors').onclick=()=>mutate(room=>{delete room.appearance;});
  $('room-undo').onclick=undo;$('room-redo').onclick=redo;
  $('room-snap').onchange=()=>model.setSnap(Number($('room-snap').value));model.setSnap(Number($('room-snap').value));
  $('room-zoom-in').onclick=()=>model.zoom(.83);$('room-zoom-out').onclick=()=>model.zoom(1.2);
  $('room-cat-search').addEventListener('input',fillCatalog);
  $('room-cat-toggle').onclick=()=>catalogOpen($('room-catalog').classList.contains('closed'));
  $('room-file').onclick=()=>{const menu=$('room-file-menu');menu.hidden=!menu.hidden;$('room-file').setAttribute('aria-expanded',String(!menu.hidden));};
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('.room-menu')){$('room-file-menu').hidden=true;$('room-file').setAttribute('aria-expanded','false');}});
  let blankArmed=0;
  $('room-blank').onclick=()=>{
    const b=$('room-blank');if(performance.now()-blankArmed>4000){blankArmed=performance.now();b.textContent='Confirmar: esvaziar a sala';setTimeout(()=>{b.textContent='Começar do zero (manter paredes)';},4000);status('Clique de novo para retirar mobiliário, telas e equipamentos, mantendo paredes e divisórias. É possível desfazer.');return;}
    blankArmed=0;b.textContent='Começar do zero (manter paredes)';$('room-file-menu').hidden=true;model.select(null);
    mutate(room=>{const objects=room.objects||{};for(const o of model.getObjects())if(!o.added&&o.kind!=='wall'&&o.kind!=='glasswall')objects[o.id]={...(objects[o.id]||{}),removed:true};room.objects=objects;delete room.added;});
    status('Sala esvaziada: paredes e divisórias mantidas. Adicione itens pelo catálogo; Desfazer volta ao layout anterior.');
  };
  $('room-reset-all').onclick=()=>{
    const b=$('room-reset-all');if(performance.now()-resetArmed>4000){resetArmed=performance.now();b.textContent='Confirmar restauração';setTimeout(()=>{b.textContent='Restaurar original';},4000);status('Clique novamente para voltar à maquete original da proposta. É possível desfazer.');return;}
    resetArmed=0;b.textContent='Restaurar original';model.select(null);const before=model.getState();if(same(before,{}))return;past.push(before);future.length=0;model.applyState({});last=null;saveDraft();refresh();status('Maquete original restaurada. Use Desfazer para voltar ao layout anterior.');
  };
  $('room-revert').onclick=()=>{past.push(model.getState());future.length=0;model.applyState(baseline);last=null;saveDraft();refresh();$('room-file-menu').hidden=true;status('Rascunho descartado; versão publicada restaurada.');};
  $('room-image').onclick=()=>{model.capture();$('room-file-menu').hidden=true;};
  $('room-export').onclick=()=>{
    const data={schema:'coe-sala-layout',version:1,exportedAt:new Date().toISOString(),room:model.getState()},blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='layout-sala-coe-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('room-file-menu').hidden=true;status('Layout exportado. Importe o arquivo para retomar ou compartilhar esta configuração.');
  };
  $('room-import').onclick=()=>$('room-import-file').click();
  $('room-import-file').onchange=async()=>{
    const file=$('room-import-file').files[0];$('room-import-file').value='';$('room-file-menu').hidden=true;if(!file)return;
    try{if(file.size>3*1024*1024)throw new Error();const data=JSON.parse(await file.text());const room=data&&typeof data==='object'?(data.schema==='coe-sala-layout'||data.schema===1?data.room:data):null;if(!room||typeof room!=='object'||Array.isArray(room))throw new Error();
      model.select(null);const before=model.getState();const after=model.applyState(room);if(!same(before,after)){past.push(before);future.length=0;}last=null;saveDraft();refresh();status('Layout importado: '+((after.added||[]).length)+' itens adicionados e '+Object.keys(after.objects||{}).length+' elementos ajustados.');}
    catch(_){status('Arquivo inválido. Use um layout exportado por este configurador ou o arquivo edicoes.json.');}
  };
  $('room-publish-help').textContent=serverMode?'Disponibiliza este layout para todos que acessam o material.':'No GitHub Pages: baixa dados/edicoes.json com este layout para ser versionado no repositório.';
  $('room-publish').textContent=serverMode?'Publicar layout para todos':'Baixar edicoes.json (publicação)';

  /* ---------- maquete → painel ---------- */
  addEventListener('coe:room-dragging',e=>{const d=e.detail;if(d.id!==model.getSelection())return;setInput('room-x',d.x);setInput('room-z',d.z);if(d.rotation!==undefined)setInput('room-rotation',d.rotation);
    const item=current();if(item)$('room-tag-name').textContent=item.name+(d.wall?' · fixado na parede':'');});
  addEventListener('coe:room-move',e=>{const d=e.detail,item=model.getObjects().find(o=>o.id===d.id);if(!item)return;const pos={x:d.x,z:d.z};if(d.rotation!==undefined)pos.rotation=d.rotation;
    if(d.placed&&placing===d.id){placing=null;patch(item,pos,{key:'place:'+d.id,window:Infinity});last=null;
      if(d.again){add(item.kind);return;}status(item.name+' posicionado'+(d.rotation!==undefined&&d.wall?' na parede':'')+'. Arraste para ajustar; Shift+clique inclui vários.');return;}
    patch(item,pos);});
  /* barra contextual sobre o elemento selecionado */
  $('room-tag').addEventListener('click',e=>{const b=e.target.closest('button[data-q]'),item=current();if(!b||!item)return;const q=b.dataset.q;
    if(q==='rotl'||q==='rotr')patch(item,{rotation:(item.rotation+(q==='rotl'?-15:15))%360},{key:'rot:'+item.id});else if(q==='dup')duplicate(item);else if(q==='del')remove(item);});
  $('room-wallsnap').onchange=()=>{model.setWallSnap($('room-wallsnap').checked);status($('room-wallsnap').checked?'Ímã de parede ligado: telas, painéis e climatização encostam na parede mais próxima.':'Ímã de parede desligado: posicionamento livre.');};
  document.getElementById('scene').addEventListener('pointerdown',e=>{pointerKind=e.pointerType||'mouse';},true);

  /* ---------- atalhos ---------- */
  addEventListener('keydown',e=>{
    if(!editing)return;const typing=e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]');
    if(e.key==='Escape'){if(placing){cancelPlacing(true);e.preventDefault();return;}if(!typing&&model.getSelection()){model.select(null);e.preventDefault();}return;}
    if(typing)return;const ctrl=e.ctrlKey||e.metaKey,k=e.key.toLowerCase(),item=current();
    if(ctrl&&k==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
    if(ctrl&&k==='y'){e.preventDefault();redo();return;}
    if(!item)return;
    if(ctrl&&k==='d'){e.preventDefault();duplicate(item);return;}
    if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();remove(item);return;}
    if(k==='r'){e.preventDefault();patch(item,{rotation:(item.rotation+90)%360},{key:'rot:'+item.id});return;}
    if(k==='q'||k==='e'){e.preventDefault();patch(item,{rotation:((item.rotation+(k==='q'?-1:1)*(e.shiftKey?90:15))%360)},{key:'rot:'+item.id});return;}
    if(k==='f'){e.preventDefault();model.focus(item.id);return;}
    if(e.key==='['||e.key===']'){e.preventDefault();patch(item,{scale:Math.min(3,Math.max(.2,+(item.scale+(e.key===']'?.1:-.1)).toFixed(2)))},{key:'scale:'+item.id});return;}
    const step=(Number($('room-snap').value)||.1)*(e.shiftKey?4:1);
    const moves={ArrowLeft:['x',-step],ArrowRight:['x',step],ArrowUp:['z',-step],ArrowDown:['z',step],PageUp:['y',.1],PageDown:['y',-.1]};
    if(moves[e.key]){e.preventDefault();const [axis,delta]=moves[e.key];patch(item,{[axis]:+(item[axis]+delta).toFixed(2)},{key:'nudge:'+item.id});}
  });

  /* ---------- carga: versão publicada + rascunho local ---------- */
  const endpoint=new URL(serverMode?'../api/editor/state':'../dados/edicoes.json',location.href).href;
  async function load(){
    loading=true;refresh();let published={};
    try{const r=await fetch(endpoint,{cache:'no-store'});if(!r.ok)throw new Error();const data=await r.json();if(data.schema!==1||!Number.isInteger(data.revision))throw new Error();snapshot=data;published=data.room||{};}
    catch(_){if(serverMode)status('Publicação indisponível neste endereço. A configuração continua salva neste navegador.');}
    baseline=model.applyState(published);const draft=readDraft();
    if(draft){const restored=model.applyState(draft);if(!same(restored,baseline))status('Rascunho local restaurado. Em Arquivo, use "Voltar à versão publicada" para descartá-lo.');}
    loading=false;refresh();if(location.hash==='#configurar')setMode(true);
  }
  $('room-publish').onclick=async()=>{
    if(saving||loading)return;saving=true;refresh();const room=model.getState();
    try{
      if(!serverMode){const base=snapshot||{schema:1,revision:0,updatedAt:null,content:{},room:{},cameras:{}},data={...base,room,updatedAt:new Date().toISOString()},blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='edicoes.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status('edicoes.json baixado. Substitua dados/edicoes.json no repositório para publicar este layout no GitHub Pages.');return;}
      const r=await fetch(endpoint,{method:'PUT',headers:{'Content-Type':'application/json','X-COE-Editor':'1'},body:JSON.stringify({revision:snapshot.revision,content:snapshot.content||{},cameras:snapshot.cameras||{},room})});
      if(r.status===409){status('Outra pessoa publicou um layout mais recente. Exporte o seu, recarregue a página e importe-o para comparar.',true);return;}
      if(!r.ok)throw new Error();const result=await r.json();if(result.schema!==1||!Number.isInteger(result.revision))throw new Error();snapshot=result;baseline=clone(room);saveDraft();status('Layout publicado para todos · revisão '+result.revision+'.');
    }catch(_){status('Não foi possível publicar. A configuração continua salva neste navegador; tente novamente.');}
    finally{saving=false;$('room-file-menu').hidden=true;refresh();}
  };
  addEventListener('hashchange',()=>{if(location.hash==='#configurar'&&!loading)setMode(true);});
  setMode(false);load();
})();
