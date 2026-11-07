/* Edição compartilhada da sala. O modelo padrão permanece em modelo.js. */
(function(){
  'use strict';
  const model=window.COE_ROOM_MODEL;if(!model)return;
  const $=id=>document.getElementById(id),clone=value=>JSON.parse(JSON.stringify(value));
  const embedded=parent!==window,serverMode=!!document.querySelector('meta[name="coe-editor-storage"][content="server"]'),history=[];let baseline={},editing=false,snapshot=null,loading=true,saving=false,dirty=false,serial=0;
  const kinds={desk:'Posto operacional',chair:'Cadeira',screen:'Tela',rack:'Rack técnico',table:'Mesa',plant:'Planta'};
  const fields=['name','description','items','x','y','z','rotation','scale','visible'];
  function status(text){$('room-save-status').textContent=text;$('room-save-status').hidden=!text;}
  function current(){return model.getObjects().find(o=>o.id===model.getSelection());}
  function refresh(){
    $('room-mode').disabled=loading;
    const id=model.getSelection(),objects=model.getObjects(),select=$('room-objects');select.replaceChildren();
    for(const item of objects){const option=document.createElement('option');option.value=item.id;option.textContent=(item.name||kinds[item.kind])+(item.visible?'':' · oculto')+(item.added?' · adicionado':'');select.append(option);}
    if(id&&objects.some(o=>o.id===id))select.value=id;
    else if(objects.length){model.select(objects[0].id);return;}
    const item=current();$('room-fields').disabled=!item;
    for(const key of fields){const input=$('room-'+key);if(key==='visible')input.checked=item?item.visible:false;else input.value=item?(key==='items'?item.items.join('\n'):item[key]):'';}
    $('room-focus').disabled=!item;$('room-duplicate').disabled=!item;$('room-remove').disabled=!item||!item.added;$('room-reset-object').disabled=!item||item.added;
    $('room-remove').title=item&&!item.added?'Para objetos originais, desmarque Visível na sala.':'';
    const room=model.getState();for(const [key,id] of [['wallColor','wall'],['floorColor','floor'],['accentColor','accent']])$('room-'+id+'-color').value=(room.appearance||{})[key]||model.colors[key];
    dirty=JSON.stringify(room)!==JSON.stringify(baseline);$('room-undo').disabled=!history.length;$('room-revert').disabled=!dirty;
    $('room-publish').disabled=loading||saving||!dirty||!snapshot;
  }
  function notify(){const room=model.getState();dispatchEvent(new CustomEvent('coe:room-change',{detail:clone(room)}));if(embedded&&location.origin!=='null')parent.postMessage({type:'coe-room:change',room},location.origin);}
  function mutate(change){const before=model.getState(),next=clone(before);change(next);const after=model.applyState(next);if(JSON.stringify(before)===JSON.stringify(after)){refresh();return;}history.push(before);if(history.length>100)history.shift();refresh();status(embedded?'Prévia da sala atualizada. Publique no painel principal.':serverMode?'Prévia local. Use Publicar sala para disponibilizar a todos.':'Prévia local. Baixe as edições e substitua dados/edicoes.json no repositório para publicar.');notify();}
  function updateField(key){const item=current();if(!item)return;const input=$('room-'+key);let value;
    if(key==='visible')value=input.checked;
    else if(key==='items')value=input.value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean).slice(0,50).map(v=>v.slice(0,1000));
    else if(input.type==='number'){value=input.valueAsNumber;if(!Number.isFinite(value)||!input.checkValidity()){input.reportValidity();return;}}
    else value=input.value;
    mutate(room=>{if(item.added){const target=(room.added||[]).find(o=>o.id===item.id);if(target)target[key]=value;}else{room.objects=room.objects||{};room.objects[item.id]={...(room.objects[item.id]||{}),[key]:value};}});
  }
  function setMode(value){editing=value===true;model.setMode(editing);$('room-editor').hidden=!editing;document.body.classList.toggle('room-editing',editing);$('room-mode').textContent=editing?'Exibição':'Editor';$('room-mode').setAttribute('aria-pressed',String(editing));$('room-publish').hidden=embedded||!editing;$('room-save-status').hidden=!editing||!$('room-save-status').textContent;refresh();}
  function applyState(room){model.applyState(room||{});baseline=model.getState();history.length=0;refresh();status('');return model.getState();}
  window.COE_ROOM_EDITOR={setMode,getState:()=>model.getState(),applyState};
  $('room-mode').onclick=()=>setMode(!editing);
  $('room-objects').onchange=()=>model.select($('room-objects').value);
  addEventListener('coe:room-selection',refresh);
  for(const key of fields)$('room-'+key).addEventListener('change',()=>updateField(key));
  $('room-focus').onclick=()=>model.focus(model.getSelection());
  $('room-undo').onclick=()=>{if(!history.length)return;model.applyState(history.pop());refresh();status('Última alteração desfeita.');notify();};
  $('room-revert').onclick=()=>{history.push(model.getState());model.applyState(baseline);refresh();status('Prévia descartada; versão recebida restaurada.');notify();};
  $('room-reset-object').onclick=()=>{const item=current();if(item&&!item.added)mutate(room=>{if(room.objects)delete room.objects[item.id];});};
  $('room-remove').onclick=()=>{const item=current();if(item&&item.added)mutate(room=>{room.added=(room.added||[]).filter(o=>o.id!==item.id);});};
  function addEquipment(source){
    const state=model.getState();if(Object.keys(state.objects||{}).length+(state.added||[]).length>=300){status('Limite de 300 objetos editados atingido. Remova um equipamento adicionado antes de continuar.');return;}
    const id='equipment-'+Date.now().toString(36)+'-'+(++serial).toString(36)+'-'+Math.random().toString(36).slice(2,8),kind=source?source.kind:$('room-kind').value;
    const item={id,kind,x:0,y:0,z:4,rotation:0,scale:1,visible:true,name:kinds[kind],description:'',items:[]};
    if(source){for(const key of fields)item[key]=clone(source[key]);item.x=Math.min(50,item.x+1);item.z=Math.min(50,item.z+1);item.name=(item.name+' · cópia').slice(0,200);item.visible=true;const sourceId=source.added?source.sourceId:source.id;if(sourceId)item.sourceId=sourceId;}
    mutate(room=>{room.added=room.added||[];room.added.push(item);});model.select(id);
  }
  $('room-add').onclick=()=>addEquipment();$('room-duplicate').onclick=()=>{const item=current();if(item)addEquipment(item);};
  for(const [key,id] of [['wallColor','wall'],['floorColor','floor'],['accentColor','accent']])$('room-'+id+'-color').onchange=()=>mutate(room=>{room.appearance={...(room.appearance||{}),[key]:$('room-'+id+'-color').value};});
  $('room-reset-colors').onclick=()=>mutate(room=>{delete room.appearance;});
  $('room-editor').addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!['INPUT','TEXTAREA'].includes(event.target.tagName)){event.preventDefault();$('room-undo').click();}});
  addEventListener('beforeunload',event=>{if(dirty&&!embedded){event.preventDefault();event.returnValue='';}});
  if(embedded){
    loading=false;$('room-mode').hidden=true;$('room-publish').hidden=true;
    addEventListener('message',event=>{if(event.source!==parent||event.origin!==location.origin||location.origin==='null')return;const data=event.data;if(!data||data.type!=='coe-room:state')return;applyState(data.room);setMode(data.editing);});
    setMode(false);if(location.origin!=='null')parent.postMessage({type:'coe-room:ready'},location.origin);
  }else{
    const endpoint=new URL(serverMode?'../api/editor/state':'../dados/edicoes.json',location.href).href;
    if(!serverMode)$('room-publish').textContent='Baixar edições.json';
    async function load(){
      loading=true;refresh();try{const response=await fetch(endpoint,{cache:'no-store'});if(!response.ok)throw new Error();const data=await response.json();if(data.schema!==1||!Number.isInteger(data.revision))throw new Error();snapshot=data;if(!dirty)applyState(data.room);else{baseline=clone(data.room||{});status('Dados carregados. Sua prévia local foi mantida.');}}
      catch{status(serverMode?'Publicação indisponível neste endereço. A edição permanece em prévia local.':'Não foi possível carregar as edições publicadas. Recarregue antes de exportar para preservar as demais páginas.');}
      finally{loading=false;refresh();if(!editing)$('room-save-status').hidden=true;}
    }
    $('room-publish').onclick=async()=>{
      if(saving||loading||!snapshot)return;saving=true;refresh();const outgoingRoom=model.getState();
      try{
        if(!serverMode){const data={...snapshot,room:outgoingRoom,updatedAt:new Date().toISOString()},blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='edicoes.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Arquivo baixado. Substitua dados/edicoes.json no repositório e publique o GitHub Pages para disponibilizar a todos.');return;}
        const response=await fetch(endpoint,{method:'PUT',headers:{'Content-Type':'application/json','X-COE-Editor':'1'},body:JSON.stringify({revision:snapshot.revision,content:snapshot.content||{},cameras:snapshot.cameras||{},room:outgoingRoom})});
        if(response.status===409){status('Outra pessoa publicou uma nova versão. Sua prévia foi mantida. Reabra a sala em outra aba para comparar; descarte a prévia e recarregue para receber a versão atual.');return;}
        if(!response.ok)throw new Error();const result=await response.json();if(result.schema!==1||!Number.isInteger(result.revision))throw new Error();snapshot=result;baseline=clone(outgoingRoom);status('Publicado para todos · revisão '+result.revision+'.');
      }catch{status('Não foi possível publicar. Sua prévia foi mantida; tente novamente quando a conexão voltar.');}
      finally{saving=false;refresh();}
    };
    setMode(false);load();
  }
})();
