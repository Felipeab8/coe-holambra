/* Sala conceitual da Cooperativa Holambra. Geometria local; nenhuma fonte de dados ao vivo. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const areas = [
    {name:'Coordenação geral',icon:'ico-telescope.svg',x:-3,z:5.3,description:'Mesa central para acompanhamento integrado, reuniões rápidas e tomada de decisão.',items:['Mesa de coordenação e cadeiras operacionais','Monitores de apoio e videoconferência','Visão direta do videowall']},
    {name:'Operações',icon:'ico-armazenamento.svg',x:-8,z:-2.8,description:'Posto proposto para acompanhar o fluxo operacional e tratar desvios da recepção à expedição.',items:['Dois postos com monitores duplos','Telefone IP e rádio de comunicação','Acompanhamento ilustrativo da operação']},
    {name:'Qualidade',icon:'ico-armazenamento.svg',x:-3,z:-2.8,description:'Posto proposto para consulta de parâmetros e acompanhamento da qualidade na cadeia.',items:['Monitores individuais de acompanhamento','Comunicação com a equipe da unidade','Telas ilustrativas de parâmetros']},
    {name:'Planejamento e controle',icon:'ico-telescope.svg',x:2,z:-2.8,description:'Posto proposto para consolidar informações e apoiar o planejamento entre as unidades.',items:['Estações com múltiplos monitores','Painéis demonstrativos de situação','Telefone IP e comunicação operacional']},
    {name:'Automação',icon:'ico-telescope.svg',x:-8,z:1.3,description:'Posto proposto para acompanhar o estado dos sistemas e apoiar as equipes de automação.',items:['Duas estações de acompanhamento','Canal de comunicação com a unidade','Acesso visual à parede auxiliar de monitoramento']},
    {name:'Manutenção e dados',icon:'ico-armazenamento.svg',x:-3,z:1.3,description:'Posto proposto para acompanhar ativos, eventos e a disponibilidade de informações.',items:['Estações de trabalho e monitores duplos','Comunicação por telefone e rádio','Painel demonstrativo de equipamentos']},
    {name:'Melhoria contínua',icon:'ico-creditos.svg',x:2,z:1.3,description:'Posto proposto para análises de desempenho e preparação das rotinas de gestão.',items:['Dois postos de análise','Telas individuais e quadro de acompanhamento','Apoio às reuniões da coordenação']}
  ];
  function fail(message) {
    const status=$('status');status.hidden=false;status.replaceChildren();
    const p=document.createElement('p');p.textContent=message;status.append(p);
    const retry=document.createElement('button');retry.textContent='Tentar novamente';retry.onclick=()=>location.reload();status.append(retry);
    document.documentElement.dataset.modelo='erro';
  }
  if (!window.THREE || !THREE.OrbitControls) { fail('Bibliotecas 3D indisponíveis. Confira a conexão e tente novamente.');return; }
  let renderer;
  try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true}); }
  catch(e) { fail('WebGL indisponível neste navegador. Ative a aceleração gráfica ou use outro navegador.');return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Maquete interativa da sala do COE');canvas.setAttribute('role','img');$('scene').append(canvas);
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(44,1,.1,240);
  const controls=new THREE.OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=2;controls.maxDistance=80;
  const shell=new THREE.Group(),roof=new THREE.Group(),front=new THREE.Group(),interior=new THREE.Group(),landscape=new THREE.Group();
  scene.add(shell,roof,front,interior,landscape);
  const selectable=[],labels=[],lights=[];let currentView='exterior',selected=-1,showLabels=true,animation=null,night=false;
  const roomObjects=new Map();let roomEditing=false,roomSelection=null,roomState={};
  const kindNames={desk:'Posto operacional',chair:'Cadeira',screen:'Tela',rack:'Rack técnico',table:'Mesa',plant:'Planta'};
  function registerObject(id,group,metadata,added=false){
    group.userData.roomId=id;
    const defaults={x:group.position.x,y:group.position.y,z:group.position.z,rotation:THREE.MathUtils.radToDeg(group.rotation.y),scale:group.scale.x,visible:group.visible,name:metadata.name||kindNames[metadata.kind],description:metadata.description||'',items:[...(metadata.items||[])]};
    roomObjects.set(id,{id,group,kind:metadata.kind||'desk',icon:metadata.icon||'ico-telescope.svg',added,sourceId:metadata.sourceId,defaults,data:{...defaults}});
    return group;
  }
  function captureObject(id,start,x,y,z,metadata){
    const children=interior.children.slice(start),group=new THREE.Group();group.position.set(x,y,z);interior.add(group);
    for(const child of children){child.position.sub(group.position);group.add(child);}
    return registerObject(id,group,metadata);
  }
  const mats={};
  function mat(key,color,roughness=.65,metalness=0){return mats[key]||(mats[key]=new THREE.MeshStandardMaterial({color:new THREE.Color(color).convertSRGBToLinear(),roughness,metalness}));}
  const navy=mat('navy',0x003a70,.4,.12), red=mat('red',0xef3340,.45,.1), white=mat('white',0xf1f2f0),wall=mat('wall',0xdce2e5,.86),metal=mat('metal',0x8799a9,.26,.75),dark=mat('dark',0x18212d,.45,.25),fabric=mat('fabric',0x293849,.96),wood=mat('wood',0xac8364,.67),stone=mat('stone',0xc4c4bc,.88),grass=mat('grass',0x52724b,.96),leaves=mat('leaves',0x3e6541,.94);
  const glass=new THREE.MeshPhysicalMaterial({color:0xb8d9e7,transparent:true,opacity:.25,roughness:.12,metalness:.25,depthWrite:false});
  const glow=new THREE.MeshBasicMaterial({color:0xffe2ac}),cool=new THREE.MeshBasicMaterial({color:0xc7e6ff});
  const boxGeo=new THREE.BoxGeometry(1,1,1),cylGeo=new THREE.CylinderGeometry(1,1,1,16),sphereGeo=new THREE.SphereGeometry(1,10,8);
  function mesh(g,geometry,material,x,y,z,sx=1,sy=1,sz=1){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
  function box(g,x,y,z,w,h,d,m){return mesh(g,boxGeo,m,x,y,z,w,h,d);}
  function cylinder(g,x,y,z,r,h,m){return mesh(g,cylGeo,m,x,y,z,r,h,r);}
  function sphere(g,x,y,z,r,m){return mesh(g,sphereGeo,m,x,y,z,r,r,r);}
  function texture(draw,w=512,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);return t;}
  function face(g,x,y,z,w,h,t,ry=0){const m=new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide});const o=mesh(g,new THREE.PlaneGeometry(w,h),m,x,y,z);o.rotation.y=ry;o.castShadow=false;return o;}
  function lettering(text,sub='',bg='#003a70',fg='#ffffff'){return texture((c,w,h)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle=fg;c.font='600 58px Arial';c.fillText(text,28,112);c.font='25px Arial';c.fillText(sub,30,158);},1024,256);}
  const floorTex=texture((c,w,h)=>{c.fillStyle='#b49a7d';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=32){for(let x=-128;x<w;x+=256){const shift=(y/32%2)*128;c.fillStyle=['#b7a089','#ad9478','#bca78e','#ab927c'][(y/32+x/256+16)%4|0];c.fillRect(x+shift,y,254,31);}c.strokeStyle='#786c5a30';for(let i=0;i<5;i++){c.beginPath();c.moveTo(0,y+i*6+3);c.lineTo(w,y+i*6+4);c.stroke();}}},512,512);floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(6,5);
  const floorMat=new THREE.MeshStandardMaterial({map:floorTex,roughness:.7});
  const asphaltTex=texture((c,w,h)=>{c.fillStyle='#626c73';c.fillRect(0,0,w,h);for(let i=0;i<5000;i++){const x=(i*73)%w,y=(i*137+Math.floor(i/13))%h;c.fillStyle=i%2?'#ffffff12':'#00000014';c.fillRect(x,y,1,1);}},256,256);asphaltTex.wrapS=asphaltTex.wrapT=THREE.RepeatWrapping;asphaltTex.repeat.set(14,14);
  const asphalt=new THREE.MeshStandardMaterial({map:asphaltTex,roughness:1});
  function dashboard(title,index){return texture((c,w,h)=>{c.fillStyle='#081e34';c.fillRect(0,0,w,h);c.fillStyle='#153b60';c.fillRect(0,0,w,44);c.fillStyle='#eef6ff';c.font='bold 19px Arial';c.fillText(title,18,28);c.font='10px Arial';c.fillStyle='#9fb4cc';c.fillText('DEMONSTRAÇÃO · SEM DADOS AO VIVO',18,h-12);
    if(index%3===0){c.fillStyle='#174269';c.fillRect(18,60,270,154);c.strokeStyle='#7999ad';c.lineWidth=3;for(let i=0;i<6;i++){c.beginPath();c.moveTo(28+i*45,68);c.lineTo(70+i*31,205);c.stroke();}for(let i=0;i<5;i++){c.beginPath();c.moveTo(24,79+i*28);c.lineTo(280,98+i*21);c.stroke();}for(let i=0;i<7;i++){c.fillStyle=i===4?'#ef3340':'#8ac6d5';c.fillRect(60+i*29,94+(i%3)*37,8,8);}c.fillStyle='#c1dcf0';c.font='16px Arial';c.fillText('Fluxo operacional',315,84);for(let i=0;i<5;i++){c.fillStyle='#315d7f';c.fillRect(315,101+i*21,158,8);c.fillStyle='#79adc8';c.fillRect(315,101+i*21,75+i*13,8);}}
    else if(index%3===1){for(let i=0;i<6;i++){let x=18+(i%3)*164,y=60+Math.floor(i/3)*82;c.fillStyle='#295169';c.fillRect(x,y,150,72);c.fillStyle='#6c8990';c.fillRect(x,y+44,150,28);c.fillStyle='#b2bdc0';c.fillRect(x+19,y+14,83,33);c.fillStyle='#314658';c.fillRect(x+32,y+25,18,22);c.fillStyle='#e2edf3';c.font='11px Arial';c.fillText('CÂMERA DEMO '+(i+1),x+5,y+12);}}
    else {for(let i=0;i<3;i++){c.fillStyle='#193e60';c.fillRect(18+i*164,60,150,62);c.fillStyle='#d6e8f5';c.font='14px Arial';c.fillText(['Operação','Qualidade','Disponibilidade'][i],30+i*164,84);c.font='24px Arial';c.fillStyle='#9ed9e4';c.fillText('—',30+i*164,111);}c.strokeStyle='#88cada';c.lineWidth=3;c.beginPath();for(let i=0;i<21;i++){const x=20+i*23,y=198-22*Math.sin(i*.8+index)-i*1.2;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.strokeStyle='#355673';c.lineWidth=1;for(let i=0;i<3;i++){c.beginPath();c.moveTo(18,148+i*29);c.lineTo(494,148+i*29);c.stroke();}}
  });}
  const screenTextures=areas.map((a,i)=>dashboard(a.name,i)),wallTextures=['VISÃO GERAL','CÂMERAS · UNIDADE','INDICADORES','FLUXO OPERACIONAL','QUALIDADE','EQUIPAMENTOS','PLANEJAMENTO','SITUAÇÃO OPERACIONAL'].map(dashboard);
  // Implantação externa e acessos.
  box(landscape,0,-.28,0,76,.4,65,grass);box(landscape,0,-.03,18,48,.12,17,asphalt);box(landscape,0,.03,9.5,30,.18,4.5,stone);box(landscape,16,.02,0,7,.18,24,stone);
  box(shell,0,.18,0,24.5,.36,17.5,stone);box(interior,-3,.39,0,17.8,.12,16.2,floorMat);box(interior,9,.39,0,5.6,.12,16.2,mat('tile',0xd7dbdc,.38));
  for(let x=-20;x<=20;x+=5){box(landscape,x,.05,20,.1,.025,6.4,white);if(x<20)box(landscape,x+2.5,.05,23.2,4.9,.025,.1,white);}
  box(landscape,0,.08,13.2,3.2,.18,4.2,stone);for(let i=0;i<6;i++)box(landscape,-1.3+i*.52,.04,15.5,.3,.02,2.6,white);
  function car(x,z,color){const g=new THREE.Group();landscape.add(g);g.position.set(x,.25,z);box(g,0,.6,0,1.9,.65,4.2,mat('car'+color,color,.25,.4));box(g,0,1.12,-.15,1.65,.65,2.2,mat('carGlass',0x254455,.17,.5));box(g,0,1.48,-.2,1.68,.12,1.8,mat('car'+color,color,.25,.4));for(const xx of [-.97,.97])for(const zz of [-1.25,1.25]){const o=cylinder(g,xx,.3,zz,.37,.2,dark);o.rotation.z=Math.PI/2;}for(const xx of [-.6,.6])box(g,xx,.65,2.12,.4,.13,.04,glow);}
  car(-17.5,20,0xe1e5e6);car(-7.5,20,0x28486a);car(12.5,20,0xb5b7b9);
  function tree(x,z,r=1.5){cylinder(landscape,x,1.25,z,.16,2.6,wood);for(let i=0;i<5;i++){const a=i*1.256;sphere(landscape,x+Math.cos(a)*r*.45,3.1+(i%2)*.4,z+Math.sin(a)*r*.45,r,leaves);}cylinder(landscape,x,.15,z,1.2,.18,stone);}
  for(const p of [[-17,7],[-18,-6],[17,8],[18,-5],[-7,-14],[5,-14],[17,-14],[-19,15],[20,15]])tree(...p);
  for(const x of [-9,9]){box(landscape,x,.27,10.4,8,.55,1.2,stone);for(let i=0;i<12;i++){sphere(landscape,x-3.5+i*.62,.7,10.4,.33,leaves);sphere(landscape,x-3.5+i*.62,.94,10.4,.09,i%3?red:glow);}}
  for(const x of [-13.4,13.4])for(const z of [-6,3,10]){cylinder(landscape,x,.6,z,.09,1.2,dark);cylinder(landscape,x,1.15,z,.12,.13,glow);}
  box(landscape,-13.7,1.8,9.8,1.2,3.6,.35,navy);face(landscape,-13.7,2.3,10,1.08,.6,lettering('COE','Cooperativa Holambra'));face(landscape,-13.7,1.4,10,1.08,.5,lettering('ACESSO','Centro operacional'));box(landscape,-13.7,.35,9.8,1.2,.12,.38,red);
  // Envoltória institucional e cobertura com iluminação arquitetônica.
  box(shell,0,2.45,-8.4,24,4.2,.24,wall);box(shell,-12,2.45,0,.24,4.2,17,wall);box(shell,12,2.45,0,.24,4.2,17,wall);
  for(const x of [-11.8,-7.8,-3.8,.2,4.2,8.2,11.8])box(front,x,2.2,8.42,.13,3.6,.15,metal);
  box(front,0,2.2,8.4,23.8,3.6,.05,glass);box(front,0,.5,8.44,24,.25,.25,navy);box(front,0,4.25,8.6,24,1,1.0,navy);box(front,0,3.73,8.65,24,.08,1.05,red);
  box(front,7.7,2.05,8.48,2.4,3.3,.08,glass);for(const x of [7.2,8.2])box(front,x,1.7,8.61,.05,.6,.06,metal);
  box(front,7.6,3.5,10,6,.18,3.6,navy);for(const x of [4.8,10.4])box(front,x,1.75,11.5,.12,3.5,.12,metal);box(front,7.6,3.39,10,5.4,.035,3.0,glow);
  face(front,6.5,4.35,9.13,4.5,.6,lettering('COE','Centro Operacional de Excelência'));
  const loader=new THREE.TextureLoader();loader.load('../img/marca/holambra-escuro.svg',t=>{t.encoding=THREE.sRGBEncoding;face(front,-5.6,4.25,9.13,6,.0+1.25,t);},undefined,()=>{});
  box(roof,0,4.7,0,24.7,.35,17.7,mat('roof',0xcbd2d5,.7,.2));for(const x of [-12,12])box(roof,x,4.95,0,.22,.25,17.7,navy);for(const z of [-8.7,8.7])box(roof,0,4.95,z,24.7,.25,.22,navy);
  for(let i=0;i<4;i++){box(roof,-6+i*3.5,5.0,-2.2,3.1,.08,3.5,mat('solar',0x16374c,.2,.4));for(let j=0;j<5;j++)box(roof,-7.2+i*3.5+j*.6,5.05,-2.2,.025,.01,3.45,metal);}box(roof,9,5,-3,2.4,.6,2.8,white);
  // Parede de videowall, revestimentos acústicos e monitores auxiliares.
  box(interior,-3,2.5,-8.05,17.7,4,.24,navy);for(let i=0;i<38;i++)box(interior,-11.5+i*.45,2.5,-7.86,.05,3.8,.12,wood);
  let objectStart=interior.children.length;
  box(interior,-3,2.52,-7.65,13.1,3.0,.26,dark);
  for(let row=0;row<2;row++)for(let col=0;col<4;col++){const x=-7.85+col*3.23,y=3.25-row*1.45;box(interior,x,y,-7.45,3.2,1.42,.15,dark);face(interior,x,y,-7.36,3.12,1.35,wallTextures[row*4+col]);}
  box(interior,-3,.63,-7.3,13.8,.4,.7,wood);box(interior,-3,.86,-7.31,13.8,.025,.72,metal);
  captureObject('videowall',objectStart,-3,0,-7.5,{kind:'screen',name:'Videowall principal',description:'Oito telas de monitoramento e console de apoio.',items:['Oito telas demonstrativas','Console inferior']});
  // Circulação lateral, coordenação e sala técnica, em vidro.
  box(interior,6,1.9,0,.055,3,16,glass);for(const z of [-7.8,-4,0,4,7.8])box(interior,6,2.1,z,.08,3.5,.09,metal);
  box(interior,9,2.1,-1.1,5.8,3.5,.12,wall);box(interior,9,2.1,4.6,5.8,3.5,.06,glass);
  function monitor(g,x,z,t,y=.96,w=.63){box(g,x,y+.35,z,w,.42,.05,dark);face(g,x,y+.35,z+.031,w-.04,.37,t);box(g,x,y+.1,z,.045,.2,.05,metal);box(g,x,y,z+.04,.25,.025,.16,dark);}
  const keys=texture((c,w,h)=>{c.fillStyle='#26313d';c.fillRect(0,0,w,h);for(let y=0;y<5;y++)for(let x=0;x<15;x++){c.fillStyle='#66717e';c.fillRect(8+x*33,8+y*43,26,30);}},512,256);
  function phone(g,x,z){const o=box(g,x,.95,z,.18,.055,.23,dark);o.rotation.x=.15;box(g,x,1.015,z-.06,.18,.04,.05,dark);box(g,x,1.01,z,.08,.005,.07,navy);for(let i=0;i<3;i++)for(let j=0;j<3;j++)box(g,x-.04+i*.04,.985,z+.05+j*.03,.02,.006,.015,metal);}
  function chair(g,x,z,ry=0){const c=new THREE.Group();g.add(c);c.position.set(x,0,z);c.rotation.y=ry;cylinder(c,0,.33,0,.035,.55,metal);box(c,0,.66,0,.55,.13,.52,fabric);box(c,0,1.04,.25,.55,.72,.09,fabric);box(c,0,1.49,.28,.38,.16,.1,dark);for(const xx of [-.34,.34]){box(c,xx,.76,0,.035,.35,.04,metal);box(c,xx,.94,-.03,.08,.055,.35,dark);}for(let i=0;i<5;i++){const a=i*Math.PI*.4,o=box(c,Math.sin(a)*.2,.12,Math.cos(a)*.2,.04,.05,.42,metal);o.rotation.y=a;const wheel=cylinder(c,Math.sin(a)*.4,.08,Math.cos(a)*.4,.065,.045,dark);wheel.rotation.z=Math.PI/2;}}
  function zone(index){const a=areas[index],g=new THREE.Group();g.position.set(a.x,0,a.z);g.userData.area=index;interior.add(g);selectable.push(g);
    box(g,0,.87,0,index===0?4.2:3.9,.12,index===0?1.4:1.15,index===0?wood:white);for(const x of [-1.6,1.6]){box(g,x,.44,0,.08,.8,.8,metal);box(g,x,.08,0,.65,.06,.85,metal);}box(g,0,.7,-.38,3.7,.3,.08,navy);
    for(const x of [-1,1]){monitor(g,x-.34,-.1,screenTextures[index]);monitor(g,x+.34,-.1,wallTextures[(index+2)%8]);const keyboard=face(g,x,.943,.3,.6,.22,keys);keyboard.rotation.x=-Math.PI/2;box(g,x+.45,.95,.3,.09,.04,.14,dark);phone(g,x-.68,.27);box(g,x+.72,.99,-.18,.1,.22,.08,dark);cylinder(g,x+.72,1.19,-.18,.009,.22,dark);box(g,x+.7,.42,-.08,.22,.5,.4,dark);box(g,x+.7,.57,.13,.035,.07,.01,cool);chair(g,x,1.0);}
    if(index===0){chair(g,-2.6,0,-Math.PI/2);chair(g,2.6,0,Math.PI/2);}
    registerObject('area-'+index,g,{...a,kind:'desk'});
    const label=document.createElement('span');label.className='zone-label';label.textContent=a.name;$('labels').append(label);labels.push({el:label,position:new THREE.Vector3(a.x,1.9,a.z),group:g});
  }
  areas.forEach((a,i)=>zone(i));
  objectStart=interior.children.length;
  box(interior,9,.85,1.5,3.5,.12,1.5,wood);for(const x of [7.7,9,10.3]){chair(interior,x,2.7);chair(interior,x,.3,Math.PI);}box(interior,9,.42,1.5,.5,.8,.7,metal);
  captureObject('mesa-reuniao',objectStart,9,0,1.5,{kind:'table',name:'Mesa de reunião e cadeiras',description:'Conjunto de coordenação e colaboração.'});
  objectStart=interior.children.length;
  box(interior,9,2.25,-.99,3.3,1.9,.08,dark);face(interior,9,2.25,-.93,3.15,1.75,dashboard('SALA DE DECISÃO',2));sphere(interior,9,3.27,-.9,.055,dark);face(interior,9,3.6,-.96,3,.5,lettering('COORDENAÇÃO','Colaboração e decisão'));
  captureObject('tela-reuniao',objectStart,9,0,-.99,{kind:'screen',name:'Tela da coordenação',description:'Tela, câmera e identificação da sala de decisão.'});
  objectStart=interior.children.length;
  box(interior,9,.88,6.7,3.4,1.1,1,wood);box(interior,9,1.46,6.7,3.7,.08,1.2,white);monitor(interior,9,6.4,screenTextures[0],1.5);chair(interior,9,5.6,Math.PI);
  captureObject('recepcao',objectStart,9,0,6.7,{kind:'desk',name:'Balcão de recepção',description:'Balcão, monitor e cadeira de recepção.'});
  for(let i=0;i<3;i++){const x=7.1+i*1.7;objectStart=interior.children.length;box(interior,x,1.6,-5.7,1.25,2.4,1.2,dark);for(let j=0;j<9;j++){box(interior,x,.65+j*.22,-5.05,1.1,.15,.07,metal);for(let k=0;k<3;k++)box(interior,x-.4+k*.15,.65+j*.22,-5,.025,.025,.02,cool);}box(interior,x,1.6,-5,1.2,2.35,.04,glass);captureObject('rack-'+(i+1),objectStart,x,0,-5.7,{kind:'rack',name:'Rack técnico '+(i+1),description:'Equipamentos de rede e comunicação.'});}
  objectStart=interior.children.length;
  box(interior,11.7,3.6,-4,.18,.6,3.4,white);face(interior,9,3.7,-8.24,4,.6,lettering('TI E COMUNICAÇÃO','Infraestrutura de apoio'));
  captureObject('apoio-tecnico',objectStart,11.7,0,-4,{kind:'rack',name:'Climatização e identificação técnica'});
  for(let row=0;row<2;row++)for(let col=0;col<2;col++){objectStart=interior.children.length;const o=face(interior,5.85,2.1+row*.85,-4.8+col*1.65,1.5,.8,wallTextures[1],-Math.PI/2);box(interior,5.9,2.1+row*.85,-4.8+col*1.65,.07,.85,1.55,dark);captureObject('tela-auxiliar-'+row+'-'+col,objectStart,5.9,0,-4.8+col*1.65,{kind:'screen',name:'Tela auxiliar '+(row*2+col+1)});}
  for(const x of [-8,-3,2,9])for(const z of [-4.5,2.6]){box(roof,x,4.47,z,3,.07,.18,metal);box(roof,x,4.42,z,2.85,.02,.12,glow);}
  for(const z of [-4,2,6]){box(roof,-3,4.25,z,16,.12,.14,metal);box(roof,9,4.25,z,4.5,.12,.14,metal);}
  for(const x of [-9,3]){objectStart=interior.children.length;box(interior,x,3.8,8.1,1.5,.45,.28,white);box(interior,x,3.65,8.27,1.2,.06,.03,dark);captureObject('climatizacao-'+(x+10),objectStart,x,0,8.1,{kind:'rack',name:'Climatização '+(x<0?'oeste':'leste')});}cylinder(interior,-11.7,.9,7.6,.13,.7,red);
  const hemi=new THREE.HemisphereLight(0xdbeeff,0x687258,.8);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffedcf,1.5);sun.position.set(-18,29,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;sun.shadow.camera.far=90;sun.shadow.bias=-.0003;sun.shadow.normalBias=.04;scene.add(sun);
  for(const p of [[-7,3.8,-3],[1,3.8,-3],[-7,3.8,4],[1,3.8,4],[9,3.8,1]]){const l=new THREE.PointLight(0xffeacb,.5,13,2);l.position.set(...p);scene.add(l);lights.push(l);}
  const views={exterior:{pos:[32,16,36],target:[0,1.7,1]},interior:{pos:[3.4,3.4,7],target:[-3,1.6,-5]},planta:{pos:[0,39,.01],target:[0,0,0]},videowall:{pos:[-3,2.6,1],target:[-3,2.5,-7.5]},reuniao:{pos:[10.8,3.2,4.1],target:[8.7,1.5,.3]},tecnica:{pos:[10.4,3,-1.7],target:[8.6,1.6,-6]}};
  function describe(title,text,items=[]){$('details').replaceChildren();const h=document.createElement('h3');h.textContent=title;$('details').append(h);const p=document.createElement('p');p.textContent=text;$('details').append(p);if(items.length){const ul=document.createElement('ul');items.forEach(v=>{const li=document.createElement('li');li.textContent=v;ul.append(li);});$('details').append(ul);}}
  function move(pos,target){if(matchMedia('(prefers-reduced-motion: reduce)').matches){camera.position.fromArray(pos);controls.target.fromArray(target);controls.update();animation=null;}else animation={from:camera.position.clone(),targetFrom:controls.target.clone(),to:new THREE.Vector3(...pos),target:new THREE.Vector3(...target),start:performance.now()};}
  function view(name){currentView=name;selected=-1;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===name));document.querySelectorAll('[data-zone]').forEach(b=>b.setAttribute('aria-pressed','false'));roof.visible=name!=='planta';front.visible=name==='exterior';$('roof-toggle').setAttribute('aria-pressed',roof.visible);move(views[name].pos,views[name].target);const info={exterior:['Visão externa','Fachada institucional, acesso coberto, totem, jardim e estacionamento operacional.'],interior:['Núcleo operacional','Estações orientadas para o videowall, circulação e mesa central de coordenação.'],planta:['Distribuição dos ambientes','Vista superior para entender postos operacionais, coordenação, recepção e sala técnica.'],videowall:['Monitoramento integrado','Mural frontal com oito telas e parede auxiliar de câmeras. Conteúdo demonstrativo, sem dados ao vivo.'],reuniao:['Coordenação e colaboração','Sala envidraçada com mesa de reunião, tela de situação e videoconferência.'],tecnica:['Infraestrutura tecnológica','Racks, equipamentos de rede, comunicação e climatização representados conceitualmente.']};describe(...info[name]);}
  function select(index){if(roomEditing){selectRoomObject('area-'+index);return;}const a=roomObjects.get('area-'+index).data;view('interior');selected=index;document.querySelectorAll('[data-zone]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.zone)===index));move([a.x+1.8,a.y+3.3,a.z+3.8],[a.x,a.y+1.0,a.z]);describe(a.name,a.description,a.items);if(innerWidth<761){$('areas').classList.remove('closed');$('areas-toggle').setAttribute('aria-expanded','true');}}
  areas.forEach((a,i)=>{const b=document.createElement('button');b.type='button';b.dataset.zone=i;b.setAttribute('aria-pressed','false');const img=document.createElement('img');img.src='../img/icones/'+a.icon;img.alt='';b.append(img,document.createTextNode(a.name));b.onclick=()=>select(i);$('zones').append(b);});
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
  $('roof-toggle').onclick=()=>{roof.visible=!roof.visible;front.visible=roof.visible;$('roof-toggle').setAttribute('aria-pressed',roof.visible);};
  $('labels-toggle').onclick=()=>{showLabels=!showLabels;$('labels-toggle').setAttribute('aria-pressed',showLabels);};
  function zoom(f){animation=null;camera.position.sub(controls.target).multiplyScalar(f).add(controls.target);controls.update();}
  $('zoom-in').onclick=()=>zoom(.83);$('zoom-out').onclick=()=>zoom(1.2);$('reset').onclick=()=>view(currentView);
  $('areas-toggle').onclick=()=>{const open=$('areas').classList.toggle('closed');$('areas-toggle').setAttribute('aria-expanded',!open);};
  const compact=matchMedia('(max-width:760px)');
  function sidebarLayout(){ $('areas').classList.toggle('closed',compact.matches);$('areas-toggle').setAttribute('aria-expanded',!compact.matches); }
  compact.addEventListener('change',sidebarLayout);sidebarLayout();
  $('theme').onclick=()=>{document.documentElement.dataset.theme=night?'light':'dark';};
  function applyTheme(){night=document.documentElement.dataset.theme==='dark';document.querySelector('header img').src='../img/marca/holambra'+(night?'-escuro':'')+'.svg';scene.background=new THREE.Color(night?0x081522:0xc9dae4);scene.fog=new THREE.Fog(night?0x081522:0xc9dae4,70,140);sun.intensity=night?.18:1.5;hemi.intensity=night?.35:.8;lights.forEach(l=>l.intensity=night?1.7:1.2);renderer.toneMappingExposure=night?1.3:1.05;}
  new MutationObserver(applyTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});applyTheme();
  $('capture').onclick=()=>{renderer.render(scene,camera);canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='sala-coe-'+currentView+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});};
  // Editor conceitual: somente overrides serializáveis; a geometria aprovada é a referência.
  const originalColors={wallColor:wall.color.clone(),floorColor:floorMat.color.clone(),accentColor:navy.color.clone()};
  const selectionBox=new THREE.BoxHelper(new THREE.Object3D(),0xef3340);selectionBox.visible=false;selectionBox.material.depthTest=false;selectionBox.material.transparent=true;selectionBox.material.opacity=.9;selectionBox.renderOrder=1000;scene.add(selectionBox);
  function selectRoomObject(id){roomSelection=roomObjects.has(id)?id:null;updateSelectionBox();dispatchEvent(new CustomEvent('coe:room-selection',{detail:roomSelection}));}
  function updateSelectionBox(){const item=roomObjects.get(roomSelection);selectionBox.visible=!!(roomEditing&&item&&item.group.visible);if(selectionBox.visible)selectionBox.setFromObject(item.group);}
  function cleanRecord(value){
    const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;
    for(const [key,min,max] of [['x',-50,50],['y',-20,20],['z',-50,50],['rotation',-360,360],['scale',.2,3]])if(typeof value[key]==='number'&&Number.isFinite(value[key]))out[key]=Math.min(max,Math.max(min,value[key]));
    if(typeof value.visible==='boolean')out.visible=value.visible;
    if(typeof value.name==='string')out.name=value.name.slice(0,200);
    if(typeof value.description==='string')out.description=value.description.slice(0,5000);
    if(Array.isArray(value.items))out.items=value.items.filter(v=>typeof v==='string').slice(0,50).map(v=>v.slice(0,1000));
    return out;
  }
  function cleanRoom(value){
    const result={};if(!value||typeof value!=='object'||Array.isArray(value))return result;
    const objects={};if(value.objects&&typeof value.objects==='object')for(const [id,record] of Object.entries(value.objects)){const item=roomObjects.get(id);if(item&&!item.added)objects[id]=cleanRecord(record);}if(Object.keys(objects).length)result.objects=objects;
    const ids=new Set([...roomObjects.values()].filter(v=>!v.added).map(v=>v.id));
    if(Array.isArray(value.added)){
      const added=[];for(const item of value.added.slice(0,300-Object.keys(objects).length)){
        if(!item||typeof item.id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(item.id)||['__proto__','constructor','prototype'].includes(item.id)||ids.has(item.id)||!Object.hasOwn(kindNames,item.kind))continue;
        ids.add(item.id);const record={id:item.id,kind:item.kind,...cleanRecord(item)};const source=roomObjects.get(item.sourceId);if(source&&!source.added)record.sourceId=source.id;added.push(record);
      }if(added.length)result.added=added;
    }
    if(value.appearance&&typeof value.appearance==='object'){const appearance={};for(const key of Object.keys(originalColors))if(/^#[a-f\d]{6}$/i.test(value.appearance[key]))appearance[key]=value.appearance[key];if(Object.keys(appearance).length)result.appearance=appearance;}
    return result;
  }
  function createEquipment(data){
    const source=roomObjects.get(data.sourceId);let g;
    if(source&&!source.added){g=source.group.clone(true);g.traverse(o=>{delete o.userData.roomId;delete o.userData.area;});g.position.set(0,0,0);g.rotation.set(0,0,0);g.scale.setScalar(1);g.visible=true;}
    else{
      g=new THREE.Group();
      if(data.kind==='desk'||data.kind==='table'){
        box(g,0,.87,0,data.kind==='desk'?3.9:3.5,.12,1.4,data.kind==='desk'?white:wood);for(const x of [-1.4,1.4])box(g,x,.44,0,.09,.8,.9,metal);
        if(data.kind==='desk'){for(const x of [-1,1]){monitor(g,x-.34,-.1,screenTextures[1]);monitor(g,x+.34,-.1,wallTextures[2]);phone(g,x-.68,.27);chair(g,x,1);}}
      }else if(data.kind==='chair')chair(g,0,0);
      else if(data.kind==='screen'){box(g,0,1.8,0,3.2,1.8,.1,dark);face(g,0,1.8,.06,3.1,1.7,wallTextures[0]);cylinder(g,0,.65,0,.06,1.2,metal);box(g,0,.12,0,1,.1,.7,dark);}
      else if(data.kind==='rack'){box(g,0,1.6,0,1.25,2.4,1.2,dark);for(let j=0;j<9;j++){box(g,0,.65+j*.22,.65,1.1,.15,.07,metal);box(g,-.4,.65+j*.22,.7,.03,.03,.02,cool);}}
      else if(data.kind==='plant'){cylinder(g,0,.65,0,.38,.7,stone);cylinder(g,0,1.25,0,.06,.8,wood);for(let i=0;i<5;i++)sphere(g,Math.sin(i*1.25)*.25,1.65+(i%2)*.2,Math.cos(i*1.25)*.25,.4,leaves);}
    }
    interior.add(g);registerObject(data.id,g,{...data,name:kindNames[data.kind]},true);return roomObjects.get(data.id);
  }
  function applyRoomState(value){
    const next=cleanRoom(value),added=new Map((next.added||[]).map(v=>[v.id,v]));
    for(const [id,item] of roomObjects)if(item.added&&(!added.has(id)||added.get(id).kind!==item.kind||added.get(id).sourceId!==item.sourceId)){interior.remove(item.group);roomObjects.delete(id);}
    for(const data of added.values())if(!roomObjects.has(data.id))createEquipment(data);
    for(const item of roomObjects.values()){
      const data=item.added?added.get(item.id):(next.objects||{})[item.id];item.data={...item.defaults,...data};
      item.group.position.set(item.data.x,item.data.y,item.data.z);item.group.rotation.y=THREE.MathUtils.degToRad(item.data.rotation);item.group.scale.setScalar(item.data.scale);item.group.visible=item.data.visible;
      if(!item.added&&item.id.startsWith('area-')){const index=Number(item.id.slice(5)),label=labels[index],button=document.querySelector('[data-zone="'+index+'"]');label.el.textContent=item.data.name;button.lastChild.nodeValue=item.data.name;button.hidden=!item.data.visible;}
    }
    for(const [key,material] of [['wallColor',wall],['floorColor',floorMat],['accentColor',navy]]){if(next.appearance&&next.appearance[key])material.color.set(next.appearance[key]).convertSRGBToLinear();else material.color.copy(originalColors[key]);}
    roomState=next;if(!roomObjects.has(roomSelection))roomSelection=null;scene.updateMatrixWorld(true);updateSelectionBox();
    if(selected>=0){const data=roomObjects.get('area-'+selected).data;describe(data.name,data.description,data.items);}
    return JSON.parse(JSON.stringify(roomState));
  }
  window.COE_ROOM_MODEL={
    getState:()=>JSON.parse(JSON.stringify(roomState)),applyState:applyRoomState,
    getObjects:()=>[...roomObjects.values()].map(v=>({id:v.id,kind:v.kind,icon:v.icon,added:v.added,sourceId:v.sourceId,...JSON.parse(JSON.stringify(v.data))})),
    getSelection:()=>roomSelection,select:selectRoomObject,
    setMode(editing){roomEditing=editing===true;updateSelectionBox();canvas.setAttribute('aria-label',roomEditing?'Maquete da sala: clique em um equipamento para editar; use o painel para alterar sua posição.':'Maquete interativa da sala do COE');},
    focus(id){const item=roomObjects.get(id);if(!item)return;view('interior');const p=item.group.position;move([p.x+4,p.y+4,p.z+6],[p.x,p.y+1,p.z]);},
    colors:{wallColor:'#dce2e5',floorColor:'#ffffff',accentColor:'#003a70'}
  };
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};animation=null;});
  canvas.addEventListener('pointerup',e=>{if(!down||e.button!==0||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5||(!roomEditing&&currentView==='exterior'))return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const candidates=roomEditing?[...roomObjects.values()].filter(v=>v.group.visible).map(v=>v.group):selectable.filter(g=>g.visible);const hit=raycaster.intersectObjects(candidates,true)[0];if(hit){let object=hit.object;const key=roomEditing?'roomId':'area';while(object&&object.userData[key]===undefined)object=object.parent;if(object){if(roomEditing)selectRoomObject(object.userData.roomId);else select(object.userData.area);}}});
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(e.key)){e.preventDefault();e.stopPropagation();animation=null;if(e.key==='Home')view(currentView);else if(e.key==='+'||e.key==='-')zoom(e.key==='+'?.83:1.2);else{const delta=e.key==='ArrowLeft'?-.06:e.key==='ArrowRight'?.06:0;const offset=camera.position.clone().sub(controls.target);if(delta)offset.applyAxisAngle(new THREE.Vector3(0,1,0),delta);else offset.y=Math.max(.5,offset.y+(e.key==='ArrowUp'?.5:-.5));camera.position.copy(controls.target).add(offset);controls.update();}}});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('A sessão gráfica foi interrompida. Recarregue o modelo para continuar.');});
  function resize(){const r=$('scene').getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe($('scene'));resize();camera.position.fromArray(views.exterior.pos);controls.target.fromArray(views.exterior.target);controls.update();
  function frame(time){requestAnimationFrame(frame);if(document.hidden||window.COE_MODELO_ATIVO===false)return;if(animation){const t=Math.min(1,(time-animation.start)/850),ease=1-Math.pow(1-t,3);camera.position.lerpVectors(animation.from,animation.to,ease);controls.target.lerpVectors(animation.targetFrom,animation.target,ease);if(t===1)animation=null;}controls.update();for(const label of labels){const point=label.group?label.group.localToWorld(new THREE.Vector3(0,1.9,0)):label.position;const p=point.clone().project(camera),visible=showLabels&&(!label.group||label.group.visible)&&currentView!=='exterior'&&p.z<1&&p.z>0&&Math.abs(p.x)<.95&&Math.abs(p.y)<.95;label.el.hidden=!visible;if(visible){label.el.style.left=(p.x*.5+.5)*innerWidth+'px';label.el.style.top=(-p.y*.5+.5)*innerHeight+'px';}}renderer.render(scene,camera);}
  requestAnimationFrame(frame);$('status').hidden=true;document.documentElement.dataset.modelo='pronto';
})();
