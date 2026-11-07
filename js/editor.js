/* Editor do material: conteúdo em texto simples, prévia e publicação compartilhada. */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const clone = x => JSON.parse(JSON.stringify(x));
  const empty = () => ({schema:1,revision:0,updatedAt:null,content:{},room:{},cameras:{}});
  const fields = new Map(), owners = new WeakMap(), counts = new Map();
  let published=empty(), draft=empty(), online=false, editing=false, loaded=false, busy=false;
  let selected=null, undo=[], fileTarget=null, historyStates=[], timer;
  const hash = text => {let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0).toString(36);};
  function key(kind,scope,source) {const base=kind+':'+scope+':'+hash(source);const n=(counts.get(base)||0)+1;counts.set(base,n);return base+':'+n;}
  const safeURL = (s,image=false) => {
    if(typeof s!=='string'||!s.trim()||/[\u0000-\u0020\\]/.test(s)||s.startsWith('//'))return false;
    if(s.startsWith('#'))return !image;
    if(/^(https:\/\/)/i.test(s))return true;
    if(!image&&/^(mailto:|tel:)/i.test(s))return true;
    return !s.includes(':')&&!s.startsWith('/')&&!s.split('/').includes('..');
  };
  function add(f) {fields.set(f.key,f);if(f.node){let a=owners.get(f.node)||[];a.push(f);owners.set(f.node,a);} }
  document.querySelectorAll('#conteudo > .page,.rodape').forEach(root => {
    const scope=root.id||'rodape', walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()) {
      const node=walker.currentNode, parent=node.parentElement;
      if(!node.nodeValue.trim()||!parent||parent.closest('script,style,svg,textarea,select,[aria-hidden="true"]'))continue;
      const original=node.nodeValue;
      add({key:key('text',scope,original),scope,node,element:parent,type:'text',original,label:original.trim(),
        read:()=>node.nodeValue,write:v=>{node.nodeValue=v;}});
    }
    root.querySelectorAll('img,a[href],[data-zoom]').forEach(node=>{
      const attrs=node.tagName==='IMG'?['src','alt']:node.tagName==='A'?['href']:['data-zoom'];
      attrs.forEach(attr=>{
        if(node.closest('#hm-picture')&&attr==='src')return;
        const original=node.getAttribute(attr)||'';
        if(attr!=='alt'&&!original)return;
        const label=(attr==='alt'?'Descrição da imagem':attr==='href'?'Destino do link':'Imagem')+': '+(node.alt||node.textContent.trim()||original).slice(0,90);
        add({key:key('attr',scope,attr+':'+original),scope,node,element:node,type:attr==='alt'?'text':attr==='href'?'link':'image',original,label,
          read:()=>node.getAttribute(attr)||'',write:v=>{if(attr==='alt'||safeURL(v,attr!=='href'))node.setAttribute(attr,v);}});
      });
    });
  });
  ['light','dark'].forEach(theme=>{
    const original='img/home/hero-'+(theme==='light'?'claro':'escuro')+'.webp';
    add({key:'hero:'+theme,scope:'p-inicio-objetivo-do-coe',type:'image',original,label:'Imagem da abertura — '+(theme==='light'?'dia':'noite'),
      write:()=>window.dispatchEvent(new Event('coe:media')),read:()=>draft.content['hero:'+theme]||original});
  });
  const kpiNames={ind:'Indicador',desc:'Descrição',card:'Grupo',unidade:'Unidade',um:'Unidade de medida',rep:'Representação',freq:'Frequência',forn:'Fornecedor',fonte:'Fonte',rel:'Relatório',det:'Detalhamento',alerta:'Alerta (Sim / Não)',regra:'Regra',crit:'Critério',calc:'Cálculo descritivo',obs:'Observações',menu:'Menu'};
  window.COE.linhas.forEach(row=>{
    const id=row[window.COE.campos.indexOf('id')];
    Object.entries(kpiNames).forEach(([field,label])=>{
      const index=window.COE.campos.indexOf(field),original=String(row[index]??'');
      add({key:'kpi:'+id+':'+field,scope:'indicadores',type:'text',original,label:id+' · '+label,
        read:()=>String(row[index]??''),write:v=>{row[index]=v;}});
    });
  });
  window.COE_EDITOR={media:theme=>draft.content['hero:'+theme]||null,getState:()=>clone(draft),fields:()=>[...fields.keys()]};

  const toggle=document.createElement('button');toggle.type='button';toggle.id='coe-editor-toggle';toggle.title='Alternar modo exibição e modo editor';toggle.setAttribute('aria-label','Modo editor');toggle.setAttribute('aria-pressed','false');
  toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4 5 5M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14Z"/></svg><span>Editar</span>';
  toggle.disabled=true;$('.ferramentas').prepend(toggle);
  const ui=document.createElement('section');ui.id='coe-editor';ui.hidden=true;ui.setAttribute('aria-label','Editor do material');
  ui.innerHTML=`<div class="coe-editor-bar"><div><strong>Modo editor</strong><span id="coe-save-status" role="status">Conectando ao salvamento…</span></div><div class="coe-editor-actions"><button type="button" id="coe-fields-toggle" aria-expanded="true" aria-controls="coe-editor-panel">Conteúdo</button><button type="button" id="coe-undo">Desfazer</button><button type="button" id="coe-discard">Descartar</button><button type="button" id="coe-history">Histórico</button><button type="button" id="coe-publish" class="coe-primary">Publicar</button><button type="button" id="coe-display">Modo exibição</button></div></div>
  <aside id="coe-editor-panel" aria-label="Propriedades do conteúdo"><header><strong>Editar conteúdo</strong><button type="button" id="coe-panel-close" aria-label="Recolher propriedades">×</button></header><p class="coe-help">Selecione um texto ou imagem no material, ou procure um campo abaixo. Use o menu superior para mudar de página.</p><label for="coe-scope">Conteúdo</label><select id="coe-scope"><option value="page">Página atual</option><option value="all">Todas as páginas</option><option value="indicadores">Fichas dos indicadores</option></select><label for="coe-field-search">Localizar campo</label><input id="coe-field-search" type="search" placeholder="Título, texto ou ID do indicador"><label for="coe-field-list">Campo para editar</label><select id="coe-field-list" size="5"></select><p class="coe-help" id="coe-field-count"></p>
  <div id="coe-properties" hidden><label id="coe-value-label" for="coe-value">Novo conteúdo</label><textarea id="coe-value" rows="6" maxlength="20000"></textarea><p class="coe-help" id="coe-field-help"></p><div class="coe-property-actions"><button type="button" id="coe-apply" class="coe-primary">Aplicar à prévia</button><button type="button" id="coe-original">Restaurar campo</button><button type="button" id="coe-upload" hidden>Enviar imagem</button></div><p id="coe-field-error" role="alert"></p></div>
  <div class="coe-editor-support"><a href="#dados/sala-do-coe" id="coe-room-link">Editar sala 3D →</a><button type="button" id="coe-export">Baixar cópia das alterações</button><label for="coe-import" class="coe-import">Importar cópia JSON<input id="coe-import" type="file" accept="application/json,.json"></label><p class="coe-help">Sem login: quem acessa este material pode publicar. As mudanças só ficam compartilhadas depois de Publicar. No GitHub Pages, baixe a cópia para incluí-la no repositório.</p></div></aside>
  <input id="coe-upload-file" type="file" accept="image/png,image/jpeg,image/webp" hidden>
  <dialog id="coe-history-dialog" aria-labelledby="coe-history-title"><h2 id="coe-history-title">Histórico de publicações</h2><p>Carregar uma versão muda apenas a prévia. Clique em Publicar para torná-la visível a todos.</p><div id="coe-history-list"></div><button type="button" id="coe-history-close">Fechar</button></dialog>`;
  document.body.append(ui);
  function dirty(){return JSON.stringify([draft.content,draft.room,draft.cameras])!==JSON.stringify([published.content,published.room,published.cameras]);}
  function status(message) {
    $('#coe-save-status').textContent=message||(!online?'Prévia local · servidor de publicação indisponível':dirty()?'Alterações na prévia · ainda não publicadas':'Versão '+published.revision+' · sem alterações pendentes');
    $('#coe-publish').disabled=busy||!online||!dirty();$('#coe-undo').disabled=!undo.length||busy;$('#coe-discard').disabled=!dirty()||busy;$('#coe-history').disabled=!online||busy;
  }
  function remember(){undo.push(clone(draft));if(undo.length>30)undo.shift();}
  function setPanel(open){$('#coe-editor-panel').hidden=!open;$('#coe-fields-toggle').setAttribute('aria-expanded',String(open));}
  function send(frame,message){if(frame.contentWindow)frame.contentWindow.postMessage(message,location.origin==='null'?'*':location.origin);}
  function syncFrames(){
    document.querySelectorAll('iframe').forEach(frame=>{
      if((frame.getAttribute('src')||'').includes('sala-coe-3d/'))send(frame,{type:'coe-room:state',room:draft.room,editing});
      if((frame.getAttribute('src')||'').includes('holambra-avare-3d/'))send(frame,{ns:'camedit',type:'state',mode:'shared',canWrite:editing,docs:draft.cameras,editing});
    });
  }
  function mode(value){editing=value;ui.hidden=!value;toggle.setAttribute('aria-pressed',String(value));toggle.setAttribute('aria-label',value?'Modo exibição':'Modo editor');toggle.querySelector('span').textContent=value?'Exibição':'Editar';document.body.classList.toggle('coe-editing',value);if(value){list();status();}else{$('.coe-selected')?.classList.remove('coe-selected');}syncFrames();}
  function apply(){
    let changedKpi=false;
    fields.forEach(f=>{const value=Object.hasOwn(draft.content,f.key)?draft.content[f.key]:f.original;if(typeof value==='string'&&f.read()!==value){f.write(value);if(f.scope==='indicadores')changedKpi=true;}});
    if(changedKpi)window.dispatchEvent(new Event('coe:indicadores-editados'));
    window.dispatchEvent(new Event('coe:conteudo-editado'));
    window.dispatchEvent(new Event('coe:media'));syncFrames();status();
  }
  function list(){
    const scope=$('#coe-scope').value,page=$('#conteudo>.page:not([hidden])')?.id,term=$('#coe-field-search').value.toLocaleLowerCase('pt-BR');
    const matches=[...fields.values()].filter(f=>(scope==='indicadores'?f.scope==='indicadores':scope==='all'?f.scope!=='indicadores':f.scope===page||f.scope==='rodape')&&(!f.node||f.node.isConnected)&&(f.label+' '+f.read()).toLocaleLowerCase('pt-BR').includes(term));
    const select=$('#coe-field-list');select.replaceChildren();matches.slice(0,250).forEach(f=>{const option=document.createElement('option');option.value=f.key;option.textContent=f.label.slice(0,140);select.append(option);});
    $('#coe-field-count').textContent=matches.length>250?'Exibindo 250 de '+matches.length+' campos. Refine a busca.':matches.length+' campos disponíveis';
    if(selected&&matches.includes(selected))select.value=selected.key;
  }
  function choose(f){
    if(!f)return;selected=f;setPanel(true);$('.coe-selected')?.classList.remove('coe-selected');f.element?.classList.add('coe-selected');
    $('#coe-properties').hidden=false;$('#coe-value-label').textContent=f.label.slice(0,110);$('#coe-value').value=Object.hasOwn(draft.content,f.key)?draft.content[f.key]:f.original;
    $('#coe-field-help').textContent=f.type==='image'?'Use uma imagem do projeto, um endereço HTTPS ou envie PNG, JPEG ou WebP (até 5 MB).':f.type==='link'?'Destino: seção #, caminho do projeto ou endereço HTTPS.':'Edite o texto. A formatação e a estrutura do material são preservadas.';
    $('#coe-upload').hidden=f.type!=='image';$('#coe-field-error').textContent='';$('#coe-field-list').value=f.key;
  }
  async function request(path,options={}) {
    const response=await fetch(new URL('api/editor/'+path,document.baseURI),{cache:'no-store',...options,headers:{'X-COE-Editor':'1',...options.headers},signal:AbortSignal.timeout(15000)});
    let data;try{data=await response.json();}catch(e){throw new Error('Servidor de publicação indisponível. Use o servidor incluído na entrega.');}
    if(!response.ok){const error=new Error(response.status===409?'Outra pessoa publicou uma nova versão. Sua prévia foi preservada. Baixe uma cópia e recarregue antes de publicar.':data.error||'Não foi possível concluir a operação.');error.code=response.status;throw error;}
    return data;
  }
  function validSnapshot(s){return s&&s.schema===1&&Number.isInteger(s.revision)&&s.content&&typeof s.content==='object'&&!Array.isArray(s.content)&&Object.keys(s.content).length<=15000&&Object.values(s.content).every(v=>typeof v==='string'&&v.length<=20000)&&s.room&&typeof s.room==='object'&&!Array.isArray(s.room)&&s.cameras&&typeof s.cameras==='object'&&!Array.isArray(s.cameras);}
  async function load(){
    try{if(!document.querySelector('meta[name="coe-editor-storage"][content="server"]'))throw Error('Hospedagem estática.');const s=await request('state');if(!validSnapshot(s))throw Error('Estado do servidor inválido.');online=true;published=s;draft=clone(s);apply();}
    catch(e){online=false;
      try{const r=await fetch(new URL('dados/edicoes.json',document.baseURI),{cache:'no-store'});if(r.ok){const s=await r.json();if(validSnapshot(s)){published=s;draft=clone(s);apply();}}}catch(ignore){}
      status();
    }finally{loaded=true;toggle.disabled=false;window.dispatchEvent(new Event('coe:editor-pronto'));}
  }
  async function publish(){
    if(!online||busy||!dirty())return;busy=true;const sent=clone(draft);status('Publicando alterações…');
    try{const s=await request('state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:published.revision,content:sent.content,room:sent.room,cameras:sent.cameras})});
      const changedMeanwhile=JSON.stringify(draft)!==JSON.stringify(sent);published=s;if(changedMeanwhile){draft.revision=s.revision;}else{draft=clone(s);undo=[];}apply();status(changedMeanwhile?'Versão '+s.revision+' publicada. Há novas alterações na prévia.':'Versão '+s.revision+' publicada para todos.');}
    catch(e){status(e.message);}finally{busy=false;status($('#coe-save-status').textContent);}
  }
  async function history(){
    const dialog=$('#coe-history-dialog'),list=$('#coe-history-list');list.textContent='Carregando…';dialog.showModal();
    try{const data=await request('history');historyStates=data.revisions;list.replaceChildren();if(!historyStates.length)list.textContent='Nenhuma publicação registrada.';
      historyStates.forEach(v=>{const b=document.createElement('button');b.type='button';b.textContent='Versão '+v.revision+' · '+(v.updatedAt?new Date(v.updatedAt).toLocaleString('pt-BR'):'Original');b.onclick=async()=>{try{const s=await request('history/'+v.revision);remember();draft={...s,revision:published.revision};apply();dialog.close();status('Versão '+v.revision+' carregada na prévia. Publique para compartilhar.');}catch(e){list.textContent=e.message;}};list.append(b);});
    }catch(e){list.textContent=e.message;}
  }
  function download(){const blob=new Blob([JSON.stringify(draft,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='edicoes.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Cópia baixada. No GitHub, coloque-a em dados/edicoes.json para publicar a versão estática.');}
  toggle.onclick=()=>mode(!editing);$('#coe-display').onclick=()=>mode(false);$('#coe-fields-toggle').onclick=()=>setPanel($('#coe-editor-panel').hidden);$('#coe-panel-close').onclick=()=>setPanel(false);
  $('#coe-field-search').oninput=list;$('#coe-scope').onchange=list;$('#coe-field-list').onchange=e=>choose(fields.get(e.target.value));
  $('#coe-apply').onclick=()=>{
    if(!selected)return;const value=$('#coe-value').value;
    if(selected.type!=='text'&&!safeURL(value,selected.type==='image')){$('#coe-field-error').textContent='Informe um endereço válido e seguro.';return;}
    remember();if(value===selected.original)delete draft.content[selected.key];else draft.content[selected.key]=value;apply();list();$('#coe-field-error').textContent='';
  };
  $('#coe-original').onclick=()=>{if(selected){remember();delete draft.content[selected.key];apply();choose(selected);}};
  $('#coe-undo').onclick=()=>{if(undo.length){draft=undo.pop();apply();if(selected)choose(selected);}};
  $('#coe-discard').onclick=()=>{if(confirm('Descartar todas as alterações ainda não publicadas?')){remember();draft=clone(published);apply();if(selected)choose(selected);}};
  $('#coe-publish').onclick=publish;$('#coe-history').onclick=history;$('#coe-history-close').onclick=()=>$('#coe-history-dialog').close();$('#coe-export').onclick=download;
  $('#coe-room-link').onclick=()=>setPanel(false);
  $('#coe-import').onchange=async e=>{
    try{const f=e.target.files[0];if(!f)return;if(f.size>3*1024*1024)throw Error('Arquivo maior que 3 MB.');const s=JSON.parse(await f.text());if(!validSnapshot(s))throw Error('Cópia de alterações inválida.');
      for(const [key,value] of Object.entries(s.content)){const field=fields.get(key);if(field&&field.type!=='text'&&!safeURL(value,field.type==='image'))throw Error('A cópia contém um endereço inválido.');}
      if(confirm('Carregar esta cópia na prévia? Ela só será compartilhada ao publicar.')){remember();draft={...s,revision:published.revision};apply();list();}
    }catch(err){status(err.message);}finally{e.target.value='';}
  };
  $('#coe-upload').onclick=()=>{if(!online){$('#coe-field-error').textContent='Envio de imagens requer o servidor. No GitHub Pages, adicione a imagem ao repositório e informe o caminho.';return;}fileTarget=selected;$('#coe-upload-file').click();};
  $('#coe-upload-file').onchange=async e=>{
    const f=e.target.files[0],target=fileTarget;e.target.value='';if(!f||!target)return;
    if(f.size>5*1024*1024){$('#coe-field-error').textContent='A imagem deve ter até 5 MB.';return;}
    try{status('Enviando imagem…');const body=new FormData();body.append('file',f);const result=await request('uploads',{method:'POST',body});remember();draft.content[target.key]=result.url;apply();choose(target);}
    catch(err){$('#coe-field-error').textContent=err.message;status(err.message);}
  };
  document.addEventListener('click',e=>{
    if(!editing||!e.target.closest('#conteudo,.rodape')||e.target.closest('button,input,select,textarea,summary,[role="tab"],iframe,.model'))return;
    let f;
    if(e.target.tagName==='IMG')f=(owners.get(e.target)||[]).find(x=>x.type==='image');
    if(!f){let node;const pos=document.caretPositionFromPoint?.(e.clientX,e.clientY);if(pos)node=pos.offsetNode;else node=document.caretRangeFromPoint?.(e.clientX,e.clientY)?.startContainer;f=(owners.get(node)||[]).find(x=>x.type==='text');}
    if(!f)f=[...fields.values()].find(x=>x.element===e.target&&x.type==='text');
    if(f){e.preventDefault();e.stopImmediatePropagation();choose(f);}
  },true);
  window.addEventListener('coe:pagina',()=>{if(editing){list();selected=null;$('#coe-properties').hidden=true;}syncFrames();});
  window.addEventListener('message',e=>{
    if(e.origin!==location.origin||!e.data)return;
    const frame=[...document.querySelectorAll('iframe')].find(f=>f.contentWindow===e.source);if(!frame)return;
    const src=frame.getAttribute('src')||'',m=e.data;
    if(src.includes('sala-coe-3d/')&&m.type==='coe-room:ready')send(frame,{type:'coe-room:state',room:draft.room,editing});
    if(src.includes('sala-coe-3d/')&&m.type==='coe-room:change'&&editing&&loaded){remember();draft.room=clone(m.room);status();}
    if(src.includes('holambra-avare-3d/')&&m.ns==='camedit'){
      if(m.type==='hello'){send(frame,{ns:'camedit',type:'state',mode:'shared',canWrite:editing,docs:draft.cameras,editing});return;}
      if(!editing||!loaded)return;
      if((m.type==='save'||m.type==='remove')&&/^[a-zA-Z0-9_-]+$/.test(m.id||'')){
        remember();if(m.type==='remove')delete draft.cameras[m.id];else draft.cameras[m.id]=clone(m.doc);syncFrames();status();send(frame,{ns:'camedit',type:'saved'});
      }
    }
  });
  window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
  // Polling apenas em exibição limpa: não troca a prévia de quem está editando.
  timer=setInterval(async()=>{if(!online||editing||dirty()||document.hidden||busy)return;const before=published.revision;try{const s=await request('state');if(!editing&&!dirty()&&!busy&&published.revision===before&&validSnapshot(s)&&s.revision!==published.revision){published=s;draft=clone(s);apply();}}catch(ignore){}},15000);
  window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  load();
})();
