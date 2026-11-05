/* Diagrama de arquitetura As-Is / To-Be (mesmo do painel original). */
(function(){
  const D={"stages": ["Recepção / Classificação", "Moegas / Tombadores", "Limpeza", "Secadores / Fornalha", "Armazém / Silos", "Expedição", "Utilidades"], "n2": [[], [["ctl", "conf", "Painéis Autokraft · CLP Wago", "controle de acesso e cancelas"], ["ctl", "iso", "Painel SAUR", "intertravamentos elétricos de segurança do tombamento (graneleiros)"]], [["ctl", "iso", "Painel NBR Tech + expansão interna", "comando de válvulas, esteiras e elevadores · CLP Siemens S7-1200"], ["ctl", "conf", "Painel Kepler", "pré-limpeza 1 e 2"], ["ctl", "int", "Painel Omega Engenharia", "pré-limpeza 3, esteiras e elevadores do fluxo pelo armazém · CLP Siemens S7-1500"]], [["sup", "tst", "Painel Condutiva", "temperatura e umidade de entrada e saída dos secadores"], ["ctl", "iso", "Painel RM", "intertravamento da temperatura do ar de secagem com os exaustores"], ["sup", "iso", "Painel SanTec", "monitoramento de depressões"], ["ctl", "iso", "Painel FACH", "temperatura da fornalha em função da alimentação de cavaco · CLP Siemens S7-1200"]], [["sup", "iso", "Painel NBR Termo", "temperatura dos silos e umidade externa"], ["sup", "iso", "Painel Fockink", "temperatura do armazém e umidade externa"]], [], [["sup", "iso", "Painel + IHM Atlas Copco", "monitoramento e comando automático do compressor"]]], "n1": [["Sistema de pesagem dos caminhões", "Medidor de umidade e balança de amostras", "Sensores das cancelas e leitores de tag"], ["Sensor indutivo de moega cheia", "Corrente dos motores (inclinação e peso)", "Travas de segurança por tipo de caminhão", "Inversor com sistema hidráulico e botoeiras locais", "Atuadores elétricos por pulso (válvulas de saída das moegas)", "Atuadores pneumáticos (manobra entre esteiras e descarga na esteira)"], ["Motores das máquinas de pré-limpeza 1, 2 e 3", "Esteiras e elevadores para limpeza e para secadores"], ["Sensores de nível de cavaco, status de esteiras e roscas e temperatura da fornalha", "Atuadores de alimentação de cavaco", "Monitoramento de depressões na fornalha", "Monitoramento de temperatura e bloqueio de exaustores", "Umidade e temperatura de entrada e saída"], ["Sensores de temperatura dos silos e do armazém", "Aeradores, ventiladores e carrinhos de aeração", "Esteiras e elevadores para silos e armazém"], ["Esteiras e elevadores de expedição (armazém e silo)", "Atuadores nas saídas das caixas (concha de expedição)"], ["Sensor de pressão do ar comprimido (a confirmar)", "Status do compressor (ligado, desligado e falha)", "Câmeras (CFTV)"]], "n0": [["Chegada e fila de caminhões (cadastro)", "Pesagem do caminhão", "Coleta de amostra: braço mecanizado, bomba de vácuo e separador", "Avaliação: umidade, avariado, pH, peso e impureza"], ["6 posições de descarga (2 graneleiro + 4 caçamba)", "Tombador hidráulico (graneleiro)", "Descarga manual “no rodo” (caçamba)", "Moega 06 usada como armazenagem em alta demanda"], ["Máquinas de pré-limpeza 1, 2 e 3", "Restrição: quanto mais úmido o grão, menor a carga admitida"], ["Secadores 1 e 2 e fornalhas 1 e 2", "Exaustores (fluxo de ar quente)", "Roscas de alimentação de cavaco", "Controle de temperatura do ar de secagem"], ["Silos e armazém graneleiro", "Temperatura crítica no centro: acima de 30 °C acelera a deterioração", "Aeração e ventilação"], ["2 caixas de expedição e concha sobre o caminhão", "Caixa dedicada aos grãos do armazém", "Blend por tipo, qualidade e umidade", "Na classificação: pesagem de saída e reanálise de umidade"], ["Compressor Atlas Copco e rede de ar comprimido da planta", "Câmeras de perímetro e de verificação de processo"]]}, el=document.getElementById('arch'), svg=document.getElementById('archsvg'), note=document.getElementById('archNote'), fld=document.getElementById('showField'); if(!el) return;
  const CYL='<svg class="cyl" viewBox="0 0 28 32" aria-hidden="true"><ellipse cx="14" cy="6" rx="12" ry="4.5"/><path d="M2 6v20c0 2.5 5.4 4.5 12 4.5s12-2 12-4.5V6"/><path d="M2 13c0 2.5 5.4 4.5 12 4.5S26 15.5 26 13M2 20c0 2.5 5.4 4.5 12 4.5S26 22.5 26 20"/></svg>';
  const esc=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  function box(id,tp,st,t,d,cls){ return '<div class="box '+st+(cls?' '+cls:'')+'" data-id="'+id+'">'+(tp?'<span class="tp '+tp+'">'+(tp==='ctl'?'CLP':'SCADA/IHM')+'</span>':'')+'<b>'+esc(t)+'</b><span>'+esc(d)+'</span></div>'; }
  function sup(id,st,t,d,cls){ return '<div class="box sbox '+st+(cls?' '+cls:'')+'" data-id="'+id+'"><b>'+esc(t)+'</b><span>'+esc(d)+'</span></div>'; }
  const C=(r,c,inner,cs,rs,cls)=>'<div class="'+(cls||'')+'" style="grid-row:'+r+(rs?' / span '+rs:'')+';grid-column:'+c+(cs?' / span '+cs:'')+'">'+inner+'</div>';
  let cur='asis';
  function render(){
    const to=cur==='tobe'; let h='';
    h+=C(1,1,'', 0,0,'ch corner'); D.stages.forEach((x,k)=>{ h+=C(1,k+2,x,0,0,'ch'); });
    h+=C(2,1,'<b>COE</b>Centro de Excelência Operacional',0,0,'rh rcoe');
    h+=C(2,2,to?'<div class="box coe on" data-id="coe"><b>COE · Centro de Excelência Operacional</b><span>gestão integrada de toda a cadeia, da recepção às utilidades, com dados padronizados do historiador e do ERP</span></div>':'<div class="box coe" data-id="coe"><b>COE</b><span>ainda não existe: nenhum dado chega padronizado</span></div>',7);
    h+=C(3,1,'<b>N4</b>Negócio · ERP',0,0,'rh');
    h+=C(3,2,box('erp','','int','Evolutize (Delsoft) · ERP','base central de relatórios; cobre recepção e classificação','erpb')); h+=C(3,3,'',6);
    h+=C(4,1,'<b>N3</b>Gestão de planta · CCO, SCADA',0,0,'rh');
    h+=C(5,1,'<b>N2</b>Controle (CLP) e supervisão (SCADA/IHM)',0,0,'rh');
    h+=C(4,2,sup('imperio','int','Sistema Império','cadastro, pesagens, classificação, descarga e saída do caminhão','tall'),0,2,'imp');
    if(!to){
      h+=C(4,3,sup('scada','int','CCO / Sala de operação (Altus)','SCADA BluePlant · conecta somente ao painel Omega · sem alarmes centralizados','big'),3);
      h+=C(4,6,'<div class="two">'+sup('fklocal','iso','Sistema de monitoramento local no CCO Fockink','tela própria')+sup('nbrweb','iso','Sistema de monitoramento web NBR Tech','fora do CCO')+'</div>');
      h+=C(4,7,'<div class="box db off" data-id="db">'+CYL+'<div><b>Banco de dados · historiador</b><span>não existe no CCO atual</span></div></div>',2);
    } else {
      h+=C(4,3,sup('scada','int','SCADA central (Altus)','todos os painéis conectados · visão única de alarmes · padrão de dados ISA-95','big'),4);
      h+=C(4,7,'<div class="box db" data-id="db">'+CYL+'<div><b>Banco de dados · historiador de processo</b><span>série temporal para tendências, KPIs e rastreabilidade</span></div></div>',2);
    }
    D.n2.forEach((c,i)=>{ if(i===0) return; h+=C(5,i+2,c.length?c.map((x,k)=>box('n2-'+i+'-'+k,x[0],to?'int':x[1],x[2],x[3])).join(''):'<span class="empty">'+(i===5?'Comando pelos painéis NBR Tech e Omega':'')+'</span>'); });
    if(fld.checked){
      h+=C(6,1,'<b>N1</b>Campo · sensores e atuadores',0,0,'rh'); D.n1.forEach((c,k)=>{ h+=C(6,k+2,'<ul class="fld">'+c.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'); });
      h+=C(7,1,'<b>N0</b>Processo físico',0,0,'rh'); D.n0.forEach((c,k)=>{ h+=C(7,k+2,'<ul class="fld">'+c.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'); });
    }
    el.innerHTML=h;
    note.textContent=to?'Todos os painéis se conectam ao SCADA central, que grava no banco de dados e historiador. O COE, acima do ERP, recebe dados padronizados de toda a cadeia. Controle e intertravamentos continuam nos CLPs locais.':'Os painéis operam em ilhas: poucos chegam ao CCO, não existe banco de dados nem historiador e o COE não recebe dados padronizados.';
    document.querySelectorAll('.tog button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===cur));
    requestAnimationFrame(draw);
  }
  function draw(){
    const H=svg.parentElement.getBoundingClientRect(); svg.setAttribute('viewBox','0 0 '+H.width+' '+H.height);
    const R=id=>{ const e=el.querySelector('[data-id="'+id+'"]'); if(!e) return null; const b=e.getBoundingClientRect(); return {l:b.left-H.left,r:b.right-H.left,t:b.top-H.top,b:b.bottom-H.top,cy:(b.top+b.bottom)/2-H.top,cx:(b.left+b.right)/2-H.left}; };
    let p='<defs><marker id="ahok" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" style="fill:var(--ok)"/></marker><marker id="ahown" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" style="fill:#8A97A6"/></marker></defs>';
    const P=(k,d,noArrow)=>{ p+='<path class="'+k+'" d="'+d+'"'+(noArrow?'':' marker-end="url(#ah'+k+')"')+'/>'; };
    const up=(a,b,k)=>{ const A=R(a),B=R(b); if(A&&B) P(k,'M'+A.cx+','+A.t+' L'+A.cx+','+(B.b+3)); };
    const bus=(col,ks,to,k)=>{ const T=R(to); const bs=ks.map(x=>R('n2-'+col+'-'+x)).filter(Boolean); if(!T||!bs.length) return; const x=bs[0].l-10, y=Math.max(...bs.map(b=>b.cy)); bs.forEach(b=>P(k,'M'+b.l+','+b.cy+' L'+x+','+b.cy,true)); P(k,'M'+x+','+y+' L'+x+','+(T.b+3)); };
    up('imperio','erp','ok');
    if(cur==='asis'){
      const A=R('n2-1-0'),I=R('imperio'); if(A&&I) P('own','M'+A.l+','+A.cy+' L'+(I.r+3)+','+A.cy);
      up('n2-2-0','scada','ok');
      up('n2-2-1','n2-2-0','ok');
      const O=R('n2-2-2'),S=R('scada'); if(O&&S){ const x=O.l-10; P('ok','M'+O.l+','+O.cy+' L'+x+','+O.cy,true); P('ok','M'+x+','+O.cy+' L'+x+','+(S.b+3)); }
      up('n2-4-0','nbrweb','own');
      const F=R('n2-4-1'),FL=R('fklocal'); if(F&&FL){ const x=F.r+9; P('own','M'+F.r+','+F.cy+' L'+x+','+F.cy+' L'+x+','+FL.cy+' L'+(FL.r+3)+','+FL.cy); }
    } else {
      [1,2,3,4].forEach(c=>bus(c,D.n2[c].map((x,k)=>k),'scada','ok'));
      const A=R('n2-6-0'),S=R('scada'),DB=R('db'); if(A&&S&&DB){ const x=A.l-10, ym=DB.b+8, xs=S.r-28; P('ok','M'+A.l+','+A.cy+' L'+x+','+A.cy,true); P('ok','M'+x+','+A.cy+' L'+x+','+ym+' L'+xs+','+ym+' L'+xs+','+(S.b+3)); }
      if(S&&DB) P('ok','M'+S.r+','+S.cy+' L'+(DB.l-3)+','+S.cy);
      up('db','coe','ok'); up('erp','coe','ok'); up('imperio','scada','ok');
    }
    svg.innerHTML=p;
  }
  document.querySelectorAll('.tog button').forEach(b=>b.addEventListener('click',()=>{cur=b.dataset.v;render();}));
  fld.addEventListener('change',render);
  /* 2D e 3D ocupam o mesmo lugar; o modelo só carrega no primeiro uso e abre na visão escolhida no 2D */
  const v2=document.getElementById('vista2d'), v3=document.getElementById('vista3d'), f3=v3.querySelector('iframe');
  const formato=document.querySelectorAll('.formato button');
  formato.forEach(b=>b.addEventListener('click',()=>{
    const tres=b.dataset.d==='3d';
    formato.forEach(x=>x.setAttribute('aria-pressed',x===b));
    v2.hidden=tres; v3.hidden=!tres;
    document.querySelectorAll('.so2d').forEach(e=>{ e.hidden=tres; });
    document.querySelectorAll('.so3d').forEach(e=>{ e.hidden=!tres; });
    if(!tres){ render(); return; }
    note.textContent='Proposta para discussão. Dentro do modelo, compare a situação atual, a proposta inicial e o To-Be recomendado.';
    const src=f3.dataset.base+'#'+(cur==='asis'?'asis':'rec');
    if(f3.getAttribute('src')!==src) f3.setAttribute('src',src);
  }));
  window.addEventListener('resize',()=>requestAnimationFrame(draw));
  document.addEventListener('fullscreenchange',()=>setTimeout(draw,150));
  render();
})();
