
const boardSize=9;
const BLUE='#4da6ff', RED='#ff5555';
let difficulty=null, selectedTeam=[], cpuTeam=[], pieces=[], selectedPiece=null;
let playerPlacements=[], selectedPlacementType=null;
let movableCells=[], enemyMovableCells=[], specialCells=[], dangerCells=[], forbiddenCells=[];
let gamePhase='title', gameOver=false, history=[];
let lastMovedBy={player:null,cpu:null};
let isAnimating=false;
let teamDetailType='hayate';

const allTypes=[
 {type:'hayate',name:'はやて',icon:'👨‍🚒',image:'images/characters/hayate.png',ability:'追い風',desc:'上下左右1。ナルカミの急降下を支える。'},
 {type:'shion',name:'しおん',icon:'👨‍🎤',image:'images/characters/shion.png',ability:'指揮',desc:'金の動き。マカミの奪取を支える。'},
 {type:'seori',name:'せおり',icon:'👩‍🦳',image:'images/characters/seori.png',ability:'招魂',desc:'前1・左右前斜め・後1。撃破でミタマ復活。'},
 {type:'janome',name:'じゃのめ',icon:'👱‍♀️',image:'images/characters/janome.png',ability:'共鳴',desc:'前1・後1・左右後ろ斜め。オロチを旋回させる。'},
 {type:'jin',name:'だん',icon:'🥷',image:'images/characters/dan.png',ability:'写し身',desc:'相手が直前に動かした駒の動きをコピー。'},
 {type:'narukami',name:'ナルカミ',icon:'🦅',image:'images/characters/narukami.png',ability:'急降下',desc:'上下左右2マス。はやて接触中は上下左右3マス。'},
 {type:'makami',name:'マカミ',icon:'🐺',image:'images/characters/makami.png',ability:'奪取',desc:'銀の動き。しおんの後ろから前の敵を奪取。'},
 {type:'mitama',name:'ミタマ',icon:'👻',image:'images/characters/mitama.png',ability:'輪廻転生',desc:'上下左右1。せおり撃破時、墓地から復活。'},
 {type:'orochi',name:'オロチ',icon:'🐍',image:'images/characters/orochi.png',ability:'旋回',desc:'斜め1。じゃのめ接触中は全方向1。'},
 {type:'luna',name:'ルナ',icon:'🐇',image:'images/characters/luna.png',ability:'',desc:'チェスのナイトの動き。'}
];


function pieceVisualHTML(t, cls='piecePortrait'){
  if(t && t.image){
    return `<img class="${cls} char-${t.type}" src="${t.image}" alt="${t.name}">`;
  }
  return `<span class="${cls} emojiFallback">${t?t.icon:''}</span>`;
}
function appendPieceVisual(parent,t,cls='boardPortrait'){
  let el;
  if(t && t.image){
    el=document.createElement('img');
    el.className=cls+' char-'+t.type;
    el.src=t.image;
    el.alt=t.name;
  }else{
    el=document.createElement('span');
    el.className=cls+' emojiFallback';
    el.textContent=t?t.icon:'';
  }
  parent.appendChild(el);
  return el;
}

function playBGM(){const b=document.getElementById('bgm'); if(!b)return; b.volume=.22; b.play().catch(()=>{});}
function hideAll(){['titleScreen','rulesScreen','difficultyScreen','teamScreen','placementScreen','leaderScreen','gameArea','resultScreen'].forEach(id=>{const el=document.getElementById(id); if(el)el.style.display='none'}); document.getElementById('message').textContent='';}
function showTitle(){hideAll();document.getElementById('titleScreen').style.display='flex'}
function showRules(){hideAll();document.getElementById('rulesScreen').style.display='flex'}
function showDifficulty(){hideAll();document.getElementById('difficultyScreen').style.display='flex'}
function startTeamSelect(d){playBGM();difficulty=d;selectedTeam=[];showTeamSelect()}
function showTeamSelect(){hideTeamConfirm();hideAll();document.getElementById('teamScreen').style.display='flex';renderTeamCards()}
function showLeaderSelect(){if(selectedTeam.length!==5){alert('5体選んでください');return} hideAll();document.getElementById('leaderScreen').style.display='flex';renderLeaderCards()}
function showTeamConfirm(){
  const overlay=document.getElementById('selectConfirmOverlay');
  const faces=document.getElementById('confirmSelectedFaces');
  if(!overlay||!faces)return;
  faces.innerHTML=selectedTeam.map(type=>{
    const t=getType(type);
    return `<div class="confirmFaceCard">${pieceVisualHTML(t,'confirmFace')}</div>`;
  }).join('');
  overlay.style.display='flex';
}
function hideTeamConfirm(){
  const overlay=document.getElementById('selectConfirmOverlay');
  if(overlay)overlay.style.display='none';
}
function confirmTeamSelection(){
  hideTeamConfirm();
  showPlacementScreen();
}
function redoTeamSelection(){
  selectedTeam=[];
  hideTeamConfirm();
  renderTeamCards();
}

function renderTeamCards(){
  const box=document.getElementById('teamCards');
  box.innerHTML='';
  document.getElementById('selectCount').textContent='あと '+(5-selectedTeam.length)+'体　選択してください';
  if(!teamDetailType)teamDetailType=allTypes[0].type;
  allTypes.forEach((t,i)=>{
    const c=document.createElement('div');
    c.className='teamCard'+(selectedTeam.includes(t.type)?' selected':'')+(teamDetailType===t.type?' focused':'');
    c.innerHTML=`<div class="teamCheck">✓</div><div class="teamPortraitWrap">${pieceVisualHTML(t,'teamPortrait')}</div>`;
    c.title=t.name;
    c.onmouseenter=()=>showTeamDetail(t.type);
    c.onfocus=()=>showTeamDetail(t.type);
    c.onclick=()=>{showTeamDetail(t.type);toggleTeam(t.type)};
    box.appendChild(c)
  });
  renderTeamDetail(teamDetailType);
}
function toggleTeam(type){
  if(selectedTeam.includes(type)){
    selectedTeam=selectedTeam.filter(x=>x!==type);
    renderTeamCards();
    return;
  }
  if(selectedTeam.length>=5){
    alert('選べるのは5体までです');
    return;
  }
  selectedTeam.push(type);
  renderTeamCards();
  if(selectedTeam.length===5){
    showTeamConfirm();
  }
}
function showTeamDetail(type){
  teamDetailType=type;
  renderTeamDetail(type);
  document.querySelectorAll('.teamCard').forEach(card=>card.classList.remove('focused'));
  const idx=allTypes.findIndex(t=>t.type===type);
  const card=document.querySelectorAll('.teamCard')[idx];
  if(card)card.classList.add('focused');
}
function renderTeamDetail(type){
  const t=getType(type)||allTypes[0];
  const detail=document.getElementById('teamDetail');
  if(!detail||!t)return;
  const info=getCharacterInfo(t.type);
  detail.innerHTML=`
    <div class="detailHeader">
      <div class="detailPortraitBox">${pieceVisualHTML(t,'detailPortrait')}</div>
      <div>
        <div class="detailName">${t.name}</div>
      </div>
    </div>

    <div class="detailCol detailMoveCol">
      <div class="detailSectionTitle">移動</div>
      ${moveDiagramHTML(t.type)}
      <div class="detailLegend"><span class="legendChip"><span class="legendBox legendBlue"></span>通常移動</span><span class="legendChip"><span class="legendBox legendYellow"></span>能力で増えるマス</span></div>
      <div class="detailText">${info.moveText}</div>
    </div>

    <div class="detailCol abilityDetailCol">
      <div class="detailSectionTitle abilitySectionTitle">特殊能力 <span class="abilityInlineName">${info.abilityTitle}</span></div>
      <div class="detailText">${info.abilityText}</div>
    </div>

    <div class="detailCol">
      <div class="detailSectionTitle">組み合わせ</div>
      <div class="detailText">${info.comboText}</div>
    </div>
  `;
}
function comboIconHTML(type,name){
  const t=getType(type);
  if(!t)return name||'';
  return `<span class="comboPartner">${pieceVisualHTML(t,'comboIcon')}<span>${name||t.name}</span></span>`;
}
function getCharacterInfo(type){
  const data={
    hayate:{abilityTitle:'追い風（おいかぜ）',moveText:'上下左右に1マス動けます。',abilityText:'ナルカミと接触していると、ナルカミの「急降下」が発動します。',comboText:comboIconHTML('narukami')+' の近くにいると強い支援役です。'},
    shion:{abilityTitle:'指揮（しき）',moveText:'将棋の金と同じ動きです。前・左右・前斜め・後ろに動けます。',abilityText:'マカミがしおんの後ろにいると「奪取」を狙えます。',comboText:comboIconHTML('makami')+' と並べると奇襲ができます。'},
    seori:{abilityTitle:'招魂（しょうこん）',moveText:'前1、左右前斜め1、後ろ1。T字のように動けます。',abilityText:'敵を撃破した時、墓地のミタマを後ろ1マスに復活させます。',comboText:comboIconHTML('mitama')+' が墓地にいる時に真価を発揮します。'},
    janome:{abilityTitle:'共鳴（きょうめい）',moveText:'前1、後ろ1、左右後ろ斜め1に動けます。',abilityText:'オロチと接触していると、オロチの「旋回」が発動します。',comboText:comboIconHTML('orochi')+' と組むと移動範囲を広げられます。'},
    jin:{abilityTitle:'写し身（うつしみ）',moveText:'相手が直前に動かした駒と同じ動きになります。',abilityText:'コピー中の駒は盤面上に小さく表示されます。',comboText:'相手の強い動きを利用する変化型の駒です。'},
    narukami:{abilityTitle:'急降下（きゅうこうか）',moveText:'上下左右に2マスまで動けます。はやて接触中は3マス目が黄色で追加されます。',abilityText:'はやてと接触している時、上下左右3マスまで動けます。',comboText:comboIconHTML('hayate')+' と近づくと機動力が上がります。'},
    makami:{abilityTitle:'奪取（だっしゅ）',moveText:'将棋の銀と同じ動きです。前・前斜め・後ろ斜めに動けます。',abilityText:'しおんの後ろ1マスにいる時、しおんの正面の敵を撃破して元の位置に戻ります。',comboText:comboIconHTML('shion')+' の後ろに置くと奇襲できます。'},
    mitama:{abilityTitle:'輪廻転生（りんねてんせい）',moveText:'上下左右に1マス動けます。',abilityText:'せおりが敵を撃破した時、墓地からせおりの後ろに復活できます。',comboText:comboIconHTML('seori')+' と組むと復活ギミックが使えます。'},
    orochi:{abilityTitle:'旋回（せんかい）',moveText:'通常は斜め1マス。じゃのめ接触中は上下左右も黄色で追加されます。',abilityText:'じゃのめと接触している間、全方向1マス動けます。',comboText:comboIconHTML('janome')+' と隣接すると守備も攻撃も広がります。'},
    luna:{abilityTitle:'能力なし',moveText:'チェスのナイトの動きです。縦横に2マス進み、さらに横へ1マスずれるL字8方向に跳びます。',abilityText:'特殊能力はありません。飛び越える動きで敵陣を狙えます。',comboText:'単独で動きが読みにくい潜入役です。'}
  };
  return data[type]||{abilityTitle:'',moveText:'',abilityText:'',comboText:''};
}
function moveDiagramHTML(type){
  const normal=[], special=[];
  const n=(x,y)=>normal.push(`${x},${y}`);
  const sp=(x,y)=>special.push(`${x},${y}`);
  if(type==='hayate'||type==='mitama'){[[0,-1],[-1,0],[1,0],[0,1]].forEach(d=>n(d[0],d[1]));}
  else if(type==='narukami'){[[0,-1],[0,-2],[0,1],[0,2],[-1,0],[-2,0],[1,0],[2,0]].forEach(d=>n(d[0],d[1]));[[0,-3],[0,3],[-3,0],[3,0]].forEach(d=>sp(d[0],d[1]));}
  else if(type==='makami'){[[-1,-1],[0,-1],[1,-1],[-1,1],[1,1]].forEach(d=>n(d[0],d[1]));sp(0,-2);}
  else if(type==='luna'){[[-1,-2],[1,-2],[-2,-1],[2,-1],[-2,1],[2,1],[-1,2],[1,2]].forEach(d=>n(d[0],d[1]));}
  else if(type==='jin'){[[0,-1],[-1,0],[1,0],[0,1]].forEach(d=>sp(d[0],d[1]));}
  else if(type==='orochi'){[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(d=>n(d[0],d[1]));[[0,-1],[-1,0],[1,0],[0,1]].forEach(d=>sp(d[0],d[1]));}
  else if(type==='janome'){[[0,-1],[0,1],[-1,1],[1,1]].forEach(d=>n(d[0],d[1]));}
  else if(type==='seori'){[[0,-1],[-1,-1],[1,-1],[0,1]].forEach(d=>n(d[0],d[1]));}
  else if(type==='shion'){[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[0,1]].forEach(d=>n(d[0],d[1]));}
  let html='<div class="moveDiagram">';
  for(let y=-3;y<=3;y++){
    for(let x=-3;x<=3;x++){
      const key=`${x},${y}`;
      let cls='moveCell', txt='';
      if(x===0&&y===0){cls+=' center';txt='●';}
      else if(special.includes(key)){cls+=' special';txt='■';}
      else if(normal.includes(key)){cls+=' can';txt='■';}
      html+=`<div class="${cls}">${txt}</div>`;
    }
  }
  html+='</div>';
  return html;
}


function showPlacementScreen(){
  if(selectedTeam.length!==5){alert('5体選んでください');return}
  playerPlacements=[];
  selectedPlacementType=null;
  hideAll();
  document.getElementById('placementScreen').style.display='flex';
  renderPlacement();
}
function renderPlacement(){
  const board=document.getElementById('placementBoard');
  const bench=document.getElementById('placementBench');
  const msg=document.getElementById('placementMessage');
  const conf=document.getElementById('placementConfirm');
  board.innerHTML='';
  const placeable=[];
  if(selectedPlacementType){
    for(let y=6;y<=8;y++)for(let x=0;x<boardSize;x++){
      if(!playerPlacements.some(p=>p.x===x&&p.y===y)) placeable.push({x,y,ok:canPlaceAt(x,y)});
    }
  }
  for(let y=0;y<boardSize;y++){
    for(let x=0;x<boardSize;x++){
      const cell=document.createElement('div');
      cell.className='placementCell';
      cell.dataset.x=x;cell.dataset.y=y;
      if(y===0||y===8)cell.classList.add('territory');
      if(y>=6)cell.classList.add('ownSetupZone');
      const existing=playerPlacements.find(p=>p.x===x&&p.y===y);
      const candidate=placeable.find(p=>p.x===x&&p.y===y);
      if(candidate)cell.classList.add(candidate.ok?'placeOK':'placeNG');
      if(existing){
        const t=getType(existing.type);
        appendPieceVisual(cell,t,'placementPortrait');
        cell.classList.add('placedPiece');
        if(selectedPlacementType===existing.type)cell.classList.add('placementSelected');
        cell.onclick=()=>{selectedPlacementType=existing.type; playerPlacements=playerPlacements.filter(p=>p.type!==existing.type); renderPlacement();};
      }else{
        cell.onclick=()=>placeSelectedAt(x,y);
      }
      board.appendChild(cell);
    }
  }
  const waiting=selectedTeam.filter(type=>!playerPlacements.some(p=>p.type===type));
  bench.innerHTML=waiting.length?waiting.map(type=>{
    const t=getType(type);
    const selected=selectedPlacementType===type?' selected':'';
    return `<div class="benchPiece${selected}" data-type="${type}">${pieceVisualHTML(t,'benchPortrait')}<div>${t.name}</div></div>`;
  }).join(''):'<div class="small yellow">全員配置済み</div>';
  bench.querySelectorAll('.benchPiece').forEach(el=>el.onclick=()=>{selectedPlacementType=el.dataset.type;renderPlacement();});
  if(msg){
    if(playerPlacements.length===5)msg.textContent='5体配置しました。確認してください。';
    else if(selectedPlacementType)msg.textContent=getType(selectedPlacementType).name+' を自陣3列に配置してください。赤は隣接禁止です。';
    else msg.textContent='配置する駒を選んでください。配置済みの駒をクリックすると置き直せます。';
  }
  if(conf)conf.style.display=playerPlacements.length===5?'block':'none';
}
function canPlaceAt(x,y){
  if(y<6||y>8)return false;
  if(playerPlacements.some(p=>p.x===x&&p.y===y))return false;
  // 初期配置は隣接禁止。斜めも含めて隣接不可。
  return !playerPlacements.some(p=>Math.max(Math.abs(p.x-x),Math.abs(p.y-y))<=1);
}
function placeSelectedAt(x,y){
  if(!selectedPlacementType)return;
  if(!canPlaceAt(x,y)){
    const msg=document.getElementById('placementMessage');
    if(msg)msg.textContent='そこには配置できません。自陣3列・隣接しないマスを選んでください。';
    return;
  }
  playerPlacements=playerPlacements.filter(p=>p.type!==selectedPlacementType);
  playerPlacements.push({type:selectedPlacementType,x,y});
  selectedPlacementType=null;
  renderPlacement();
}
function confirmPlacement(){
  if(playerPlacements.length!==5)return;
  showLeaderSelect();
}
function redoPlacement(){
  playerPlacements=[];
  selectedPlacementType=null;
  renderPlacement();
}

function renderLeaderCards(){const box=document.getElementById('leaderCards');box.innerHTML=''; selectedTeam.map(getType).forEach(t=>{const c=document.createElement('div');c.className='teamCard leaderChoice';c.innerHTML=`<div class="teamPortraitWrap">${pieceVisualHTML(t,'teamPortrait')}</div><div class="teamName">${t.name}</div><div class="leaderHint">頭領にする</div>`;c.onclick=()=>startBattle(t.type);box.appendChild(c)})}
function getType(type){return allTypes.find(t=>t.type===type)}
function cloneType(t){return JSON.parse(JSON.stringify(t))}
function pickCpuTeam(){let pool=[...allTypes];let arr=[];while(arr.length<5){arr.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0].type)}return arr}
function makeCpuPlacements(team){
  const placed=[];
  const cells=[];
  for(let y=0;y<=2;y++)for(let x=0;x<boardSize;x++)cells.push({x,y});
  for(const type of team){
    let options=cells.filter(c=>!placed.some(p=>p.x===c.x&&p.y===c.y) && !placed.some(p=>Math.max(Math.abs(p.x-c.x),Math.abs(p.y-c.y))<=1));
    if(!options.length)options=cells.filter(c=>!placed.some(p=>p.x===c.x&&p.y===c.y));
    const choice=options[Math.floor(Math.random()*options.length)];
    placed.push({type,x:choice.x,y:choice.y});
  }
  return placed;
}
function startBattle(leaderType){cpuTeam=pickCpuTeam();pieces=[];history=[];selectedPiece=null;movableCells=[];enemyMovableCells=[];specialCells=[];dangerCells=[];forbiddenCells=[];lastMovedBy={player:null,cpu:null};gameOver=false;gamePhase='playerTurn';
 const placements = (playerPlacements&&playerPlacements.length===5)?playerPlacements:selectedTeam.map((type,i)=>({type,x:i+2,y:8}));
 placements.forEach((pl,i)=>{const type=pl.type;pieces.push({...cloneType(getType(type)),id:'p'+i,owner:'player',x:pl.x,y:pl.y,leader:type===leaderType,alive:true,infiltrated:false})});
 const cpuPlacements=makeCpuPlacements(cpuTeam);
 const cpuLeader=cpuTeam[Math.floor(Math.random()*cpuTeam.length)];
 cpuPlacements.forEach((pl,i)=>{const type=pl.type;pieces.push({...cloneType(getType(type)),id:'c'+i,owner:'cpu',x:pl.x,y:pl.y,leader:type===cpuLeader,alive:true,infiltrated:false})});
 hideAll();document.getElementById('gameArea').style.display='flex';setMessage('MISSION START！あなたの番です。駒を選んでください');renderBoard();}
function resetBattle(){if(selectedTeam.length===5){showPlacementScreen()}else showDifficulty()}
function saveHistory(){history.push({pieces:JSON.parse(JSON.stringify(pieces)),gamePhase,gameOver,lastMovedBy:JSON.parse(JSON.stringify(lastMovedBy))})}
function undoMove(){if(history.length===0){setMessage('これ以上戻れません');return}const h=history.pop();pieces=h.pieces;gamePhase=h.gamePhase;gameOver=h.gameOver;lastMovedBy=h.lastMovedBy;clearHighlights();setMessage('1手戻しました');renderBoard()}
function clearHighlights(){selectedPiece=null;movableCells=[];enemyMovableCells=[];specialCells=[];dangerCells=[];forbiddenCells=[]}
function renderBoard(){const b=document.getElementById('board');b.innerHTML='';for(let y=0;y<boardSize;y++){for(let x=0;x<boardSize;x++){const cell=document.createElement('div');cell.className='cell';cell.dataset.x=x;cell.dataset.y=y;if(y===0||y===8)cell.classList.add('territory');const p=getPieceAt(x,y);if(p){cell.classList.add(p.owner);const sp=appendPieceVisual(cell,p,'boardPortrait');if(p.infiltrated)sp.classList.add('infiltrated');if(p.type==='jin'){const copied=getJinCopyType(p);if(copied){const badge=document.createElement('div');badge.className='copyBadge';if(copied.image){const bi=document.createElement('img');bi.src=copied.image;bi.alt=copied.name;badge.appendChild(bi)}else{badge.textContent=copied.icon}cell.appendChild(badge);const cn=document.createElement('div');cn.className='copyName';cn.textContent='写し身:'+copied.name;cell.appendChild(cn)}}/* 盤面では顔を見せるため、駒名ラベルは表示しない */if(p.owner==='player'&&p.leader){const st=document.createElement('div');st.className='leaderMark';st.textContent='★';cell.appendChild(st)}if(selectedPiece&&selectedPiece.id===p.id)cell.classList.add('selectedPiece')}const isMovable=movableCells.some(q=>q.x===x&&q.y===y);const isEnemyMove=enemyMovableCells.some(q=>q.x===x&&q.y===y);const isSpecial=specialCells.some(q=>q.x===x&&q.y===y);if(isMovable)cell.classList.add('movable');if(isEnemyMove)cell.classList.add('enemyMove');if(isSpecial)cell.classList.add('specialMove');if(p&&(isMovable||isEnemyMove||isSpecial)){const ov=document.createElement('div');ov.className='rangeOverlay '+(isSpecial?'yellow':(isMovable?'blue':'red'));cell.appendChild(ov)}if(difficulty==='easy'&&forbiddenCells.some(q=>q.x===x&&q.y===y))cell.classList.add('forbidden');if(difficulty==='easy'&&(dangerCells.some(q=>q.x===x&&q.y===y)||forbiddenCells.some(q=>q.x===x&&q.y===y))){const bo=document.createElement('div');bo.className='explosion';bo.textContent='💥';cell.appendChild(bo)}cell.onclick=()=>handleCell(x,y);b.appendChild(cell)}}renderGrave()}
function renderGrave(){
  const pDead=pieces.filter(p=>!p.alive&&p.owner==='player');
  const cDead=pieces.filter(p=>!p.alive&&p.owner==='cpu');
  renderDeadList('playerGraveList',pDead);
  renderDeadList('cpuGraveList',cDead);
  const dan=getType('jin');
  const playerJinCopy=lastMovedBy.cpu?getType(lastMovedBy.cpu):null;
  const cpuJinCopy=lastMovedBy.player?getType(lastMovedBy.player):null;
  const copyHTML=(copy)=>copy?pieceVisualHTML(copy,'jinCopyTiny')+`<span>${copy.name}</span>`:'<span class="noCopy">まだコピーなし</span>';
  document.getElementById('grave').innerHTML=`
    <div class="jinCopyInfo">
      <span class="jinCopyTitle">写し身</span>
      <span class="jinCopySide blue">青 ${pieceVisualHTML(dan,'jinCopyTiny')} → ${copyHTML(playerJinCopy)}</span>
      <span class="jinCopySide red">赤 ${pieceVisualHTML(dan,'jinCopyTiny')} → ${copyHTML(cpuJinCopy)}</span>
    </div>`;
}
function renderDeadList(id,list){const el=document.getElementById(id);if(!el)return;if(list.length===0){el.innerHTML='<div class="small">なし</div>';return}el.innerHTML=list.map(p=>`<div class="deadPiece"><div class="deadIcon">${pieceVisualHTML(p,'deadPortrait')}</div><div class="deadName">${p.name}</div></div>`).join('')}
function getJinCopyType(p){if(!p||p.type!=='jin')return null;const copyType=lastMovedBy[opponent(p.owner)];return copyType?getType(copyType):null}
async function handleCell(x,y){if(gameOver||isAnimating)return;const p=getPieceAt(x,y);if(gamePhase!=='playerTurn')return;
 if(p&&p.owner==='player'&&p.leader&&p.y===0){saveHistory();p.infiltrated=true;gameOver=true;showResult(true,'潜入成功！任務完了！');renderBoard();return}
 if(selectedPiece&&selectedPiece.owner==='player'&&movableCells.some(q=>q.x===x&&q.y===y)){saveHistory();await performMove(selectedPiece,x,y);clearHighlights();renderBoard();if(!gameOver){gamePhase='cpuTurn';setMessage('CPUの番です…');setTimeout(()=>cpuTurn(),550)}return}
 if(difficulty==='easy'&&forbiddenCells.some(q=>q.x===x&&q.y===y)){setMessage('そこに置くと取られちゃうよ。別の場所を選んでください');return}
 if(p&&p.owner==='player'){selectedPiece=p;let all=getMoves(p,true);if(difficulty==='easy'){forbiddenCells=getForbiddenCells(p,all);movableCells=all.filter(q=>!sameIn(q,forbiddenCells));specialCells=movableCells.filter(q=>q.specialMove||q.special)}else{movableCells=all;forbiddenCells=[];specialCells=all.filter(q=>q.specialMove||q.special)}const abilities=abilityNamesFromMoves(specialCells);setMessage(p.name+'の移動先です'+(abilities.length?'。黄色は '+abilities.join('・')+' で増えたマスです':'')+(difficulty==='easy'?'。💥には置けません':''));enemyMovableCells=[];dangerCells=[];renderBoard();if(abilities.length)showAbilityBanner(abilities,p);return}
 if(p&&p.owner==='cpu'){selectedPiece=p;movableCells=[];forbiddenCells=[];enemyMovableCells=getMoves(p,true);specialCells=enemyMovableCells.filter(q=>q.specialMove||q.special);const abilities=abilityNamesFromMoves(specialCells);if(difficulty==='easy'){dangerCells=enemyMovableCells.filter(q=>{const t=getPieceAt(q.x,q.y);return t&&t.owner==='player'});setMessage(p.name+'の移動先です。赤は相手の移動先、黄色は特殊能力マス、💥は取られる場所です')}else{dangerCells=[];setMessage(p.name+'の移動先です。赤は相手の移動先、黄色は特殊能力マスです')}renderBoard();if(abilities.length)showAbilityBanner(abilities,p);return}}
function showResult(win,msg,reason='infiltrate'){
  gameOver=true;
  setMessage(msg);
  setTimeout(()=>{
    hideAll();
    document.getElementById('resultScreen').style.display='flex';
    document.getElementById('resultTitle').textContent=win?'✨ 任務完了 ✨':'☠ 任務失敗 ☠';
    if(reason==='capture'){
      document.getElementById('resultSub').textContent=win?'⚔️ 頭領撃破！':'☠️ 頭領撃破された！';
      document.getElementById('resultMessage').textContent=win?'敵の頭領を討ち取った！':'頭領を守りきれなかった…';
    }else{
      document.getElementById('resultSub').textContent=win?'🥷 潜入成功！':'⚠️ 潜入された！';
      document.getElementById('resultMessage').textContent=win?'敵本拠地を制圧した！':'敵の任務を阻止できなかった…';
    }
  },900)
}
async function cpuTurn(){if(gameOver||isAnimating)return;const leader=pieces.find(p=>p.owner==='cpu'&&p.leader&&p.alive);if(leader&&leader.y===8){saveHistory();leader.infiltrated=true;renderBoard();showResult(false,'潜入された！任務失敗！');return}saveHistory();let moves=[];pieces.filter(p=>p.owner==='cpu'&&p.alive).forEach(p=>getMoves(p,true).forEach(m=>moves.push({p,m})));if(!moves.length){gamePhase='playerTurn';setMessage('CPUは動けません。あなたの番です');return}let infiltrate=moves.filter(o=>o.p.leader&&o.m.y===8);let attacks=moves.filter(o=>{const t=getPieceAt(o.m.x,o.m.y);return t&&t.owner==='player'});let choice=(infiltrate[0]||attacks[Math.floor(Math.random()*attacks.length)]||moves[Math.floor(Math.random()*moves.length)]);if(choice.m&&(choice.m.specialMove||choice.m.special)&&choice.m.ability){showAbilityBanner([choice.m.ability],choice.p)}await performMove(choice.p,choice.m.x,choice.m.y);renderBoard();if(!gameOver){gamePhase='playerTurn';setMessage('あなたの番です。駒を選んでください')}}

async function performMove(p,x,y){
  const special=getMoves(p,true).find(q=>q.x===x&&q.y===y&&q.special==='dasshu');
  if(special){await animateDashStrike(p,x,y);}else{await animateMovePiece(p,x,y);}
  executeMove(p,x,y);
}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function getCellEl(x,y){return document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);}
function cellCenter(el){const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height};}
async function animateMovePiece(piece,toX,toY){
  const from=getCellEl(piece.x,piece.y); const to=getCellEl(toX,toY);
  if(!from||!to)return;
  isAnimating=true;
  const a=cellCenter(from), b=cellCenter(to);
  const ghost=document.createElement('div');
  ghost.className='movingPiece';
  appendPieceVisual(ghost,piece,'movingPortrait');
  ghost.style.left=(a.x-a.w/2)+'px';
  ghost.style.top=(a.y-a.h/2)+'px';
  ghost.style.width=a.w+'px';
  ghost.style.height=a.h+'px';
  ghost.style.fontSize=Math.max(18,Math.floor(a.h*.56))+'px';
  document.body.appendChild(ghost);
  from.classList.add('animSource');
  await sleep(30);
  ghost.style.transform=`translate(${b.x-a.x}px,${b.y-a.y}px)`;
  await sleep(430);
  const target=getPieceAt(toX,toY);
  if(target&&target.owner!==piece.owner){await showHitEffect(toX,toY);}
  ghost.remove();
  from.classList.remove('animSource');
  isAnimating=false;
}
async function animateDashStrike(piece,toX,toY){
  const from=getCellEl(piece.x,piece.y); const to=getCellEl(toX,toY);
  if(!from||!to)return;
  isAnimating=true;
  const a=cellCenter(from), b=cellCenter(to);
  const ghost=document.createElement('div');
  ghost.className='movingPiece dash';
  appendPieceVisual(ghost,piece,'movingPortrait');
  ghost.style.left=(a.x-a.w/2)+'px';
  ghost.style.top=(a.y-a.h/2)+'px';
  ghost.style.width=a.w+'px';
  ghost.style.height=a.h+'px';
  ghost.style.fontSize=Math.max(18,Math.floor(a.h*.56))+'px';
  document.body.appendChild(ghost);
  await sleep(30);
  ghost.style.transform=`translate(${b.x-a.x}px,${b.y-a.y}px) scale(1.12)`;
  await sleep(260);
  await showHitEffect(toX,toY);
  ghost.style.transform=`translate(0px,0px) scale(1)`;
  await sleep(260);
  ghost.remove();
  isAnimating=false;
}
async function showHitEffect(x,y){
  const cell=getCellEl(x,y); if(!cell)return;
  const boom=document.createElement('div');
  boom.className='hitBoom';
  boom.textContent='💥';
  cell.appendChild(boom);
  await sleep(260);
  boom.remove();
}

function executeMove(p,x,y){const special=getMoves(p,true).find(q=>q.x===x&&q.y===y&&q.special==='dasshu'); if(special){showAbilityBanner(['奪取'],p);const target=getPieceAt(x,y);if(target){capturePiece(p,target);lastMovedBy[p.owner]=p.type}return}
 const target=getPieceAt(x,y);let captured=false;if(target&&target.owner!==p.owner){capturePiece(p,target);captured=true;if(gameOver)return}p.x=x;p.y=y;lastMovedBy[p.owner]=p.type;if(captured&&p.type==='seori')tryReviveMitama(p);if(p.leader){if(p.owner==='player'&&p.y===0){setMessage('頭領が敵陣に到着！次の自分の番でクリックすると潜入です')} if(p.owner==='cpu'&&p.y===8){setMessage('CPU頭領があなたの陣地に到着…次のCPU番で潜入されます')}}}
function capturePiece(attacker,target){
  target.alive=false;
  if(target.leader){
    const playerWon = attacker.owner==='player';
    showResult(playerWon, playerWon?'頭領撃破！任務完了！':'頭領撃破された！任務失敗！', 'capture');
    return;
  }
  if(attacker.type==='seori')setMessage('招魂！ミタマ復活のチャンス')
}
function tryReviveMitama(seori){const dead=pieces.find(p=>!p.alive&&p.owner===seori.owner&&p.type==='mitama');if(!dead)return;const f=forward(seori.owner);const bx=seori.x, by=seori.y-f;if(!inside(bx,by)||getPieceAt(bx,by))return;dead.x=bx;dead.y=by;dead.alive=true;dead.leader=false;setMessage('招魂！ミタマが墓地から復活しました')}
function getForbiddenCells(piece,moves){let arr=[];for(const m of moves){if(m.special)continue;const ox=piece.x, oy=piece.y;const cap=getPieceAt(m.x,m.y);if(cap&&cap.owner!==piece.owner)cap.alive=false;piece.x=m.x;piece.y=m.y;let danger=pieces.filter(p=>p.owner!==piece.owner&&p.alive).some(e=>getMoves(e,true).some(q=>q.x===m.x&&q.y===m.y));piece.x=ox;piece.y=oy;if(cap&&cap.owner!==piece.owner)cap.alive=true;if(danger)arr.push({x:m.x,y:m.y})}return arr}
function getMoves(piece,includeSpecial=false){
  if(!piece.alive)return[];
  let base=[];
  const f=forward(piece.owner);
  const add=(dx,dy,extra={})=>base.push({x:piece.x+dx,y:piece.y+dy,...extra});
  const copiedType=piece.type==='jin' && lastMovedBy[opponent(piece.owner)] ? lastMovedBy[opponent(piece.owner)] : null;
  const type=copiedType || piece.type;

  if(type==='mitama'||type==='hayate'){
    [[0,-1],[0,1],[-1,0],[1,0]].forEach(d=>add(d[0],d[1], copiedType?{specialMove:true,ability:'写し身'}:{}));
  }
  else if(type==='narukami'){
    const boosted=narukamiCanAdjacent(piece);
    base=orthogonalRangeMoves(piece, boosted?3:2, boosted?3:null, boosted?{ability:'急降下'}:{});
    if(copiedType) base=base.map(m=>({...m,specialMove:true,ability:'写し身'}));
  }
  else if(type==='makami'){
    [[-1,f],[0,f],[1,f],[-1,-f],[1,-f]].forEach(d=>add(d[0],d[1], copiedType?{specialMove:true,ability:'写し身'}:{}));
    if(includeSpecial && !copiedType)base=base.concat(dasshuMoves(piece));
  }
  else if(type==='luna'){
    [[-1,-2],[1,-2],[-2,-1],[2,-1],[-2,1],[2,1],[-1,2],[1,2]].forEach(d=>add(d[0],d[1], copiedType?{specialMove:true,ability:'写し身'}:{}));
  }
  else if(type==='orochi'){
    const spinning=!copiedType && isAdjacentToType(piece,'janome');
    if(spinning){
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(d=>add(d[0],d[1]));
      [[0,-1],[-1,0],[1,0],[0,1]].forEach(d=>add(d[0],d[1],{specialMove:true,ability:'旋回'}));
    }else{
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(d=>add(d[0],d[1], copiedType?{specialMove:true,ability:'写し身'}:{}));
    }
  }
  else if(type==='janome'){
    [[0,f],[0,-f],[-1,-f],[1,-f]].forEach(d=>add(d[0],d[1], copiedType?{specialMove:true,ability:'写し身'}:{}));
  }
  else if(type==='seori'){
    [[0,f],[-1,f],[1,f],[0,-f]].forEach(d=>add(d[0],d[1], copiedType?{specialMove:true,ability:'写し身'}:{}));
  }
  else if(type==='shion'){
    [[-1,f],[0,f],[1,f],[-1,0],[1,0],[0,-f]].forEach(d=>add(d[0],d[1], copiedType?{specialMove:true,ability:'写し身'}:{}));
  }
  else {
    [[0,-1],[0,1],[-1,0],[1,0]].forEach(d=>add(d[0],d[1]));
  }

  return base.filter(m=>inside(m.x,m.y)).filter(m=>{const t=getPieceAt(m.x,m.y);return !t||t.owner!==piece.owner});
}

function orthogonalRangeMoves(piece,maxDist,specialStep=null,specialExtra={}){let res=[];[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{for(let step=1;step<=maxDist;step++){let x=piece.x+dx*step,y=piece.y+dy*step;if(!inside(x,y))break;const extra=(specialStep&&step>=specialStep)?{specialMove:true,...specialExtra}:{};const t=getPieceAt(x,y);if(!t){res.push({x,y,...extra});}else{if(t.owner!==piece.owner)res.push({x,y,...extra});break}}});return res}
function rookMoves(piece,minDist){let res=[];[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{for(let step=1;;step++){let x=piece.x+dx*step,y=piece.y+dy*step;if(!inside(x,y))break;const t=getPieceAt(x,y);if(step>=minDist){if(!t)res.push({x,y});else{if(t.owner!==piece.owner)res.push({x,y});break}}else{if(t)break}}});return res}
function dasshuMoves(makami){let res=[];const shions=pieces.filter(p=>p.alive&&p.owner===makami.owner&&p.type==='shion');const f=forward(makami.owner);shions.forEach(s=>{if(makami.x===s.x&&makami.y===s.y-f){const tx=s.x,ty=s.y+f;const target=getPieceAt(tx,ty);if(target&&target.owner!==makami.owner)res.push({x:tx,y:ty,special:'dasshu',specialMove:true,ability:'奪取'})}});return res}
function narukamiCanAdjacent(p){return isAdjacentToType(p,'hayate')}
function isAdjacentToType(p,type){return pieces.some(o=>o.alive&&o.owner===p.owner&&o.type===type&&Math.max(Math.abs(o.x-p.x),Math.abs(o.y-p.y))===1)}
function forward(owner){return owner==='player'?-1:1}function opponent(owner){return owner==='player'?'cpu':'player'}function inside(x,y){return x>=0&&x<boardSize&&y>=0&&y<boardSize}function getPieceAt(x,y){return pieces.find(p=>p.alive&&p.x===x&&p.y===y)}function sameIn(pos,list){return list.some(q=>q.x===pos.x&&q.y===pos.y)}function setMessage(t){document.getElementById('message').textContent=t}
function showAbilityBanner(abilities,piece){
  abilities=[...new Set((abilities||[]).filter(Boolean))];
  if(!abilities.length)return;
  const overlay=document.getElementById('abilityOverlay');
  const name=document.getElementById('abilityName');
  const sub=document.getElementById('abilitySub');
  if(!overlay||!name||!sub)return;
  const label=abilities.join('・');
  name.textContent='【'+label+'】';
  sub.textContent=(piece?piece.name+'　':'')+'黄色のマスは特殊能力で増えた移動先です';
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
}
function closeAbilityBanner(){
  const overlay=document.getElementById('abilityOverlay');
  if(!overlay)return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
}
function abilityNamesFromMoves(moves){return [...new Set((moves||[]).map(q=>q.ability).filter(Boolean))]}

showTitle();

// --- Ver.2.2.3: タイトル手裏剣カーソル ---
(function setupTitleShurikenCursor(){
  const getButtons = () => [document.getElementById('titleStartButton'), document.getElementById('titleRulesButton')].filter(Boolean);
  let activeIndex = -1; // -1 = まだカーソルを出さない
  function clear(){ getButtons().forEach(b => b.classList.remove('keyboardSelected')); }
  function showAt(index){
    const buttons = getButtons();
    if(!buttons.length) return;
    activeIndex = (index + buttons.length) % buttons.length;
    clear();
    buttons[activeIndex].classList.add('keyboardSelected');
    buttons[activeIndex].focus();
  }
  document.addEventListener('keydown', (e)=>{
    const titleVisible = document.getElementById('titleScreen') && document.getElementById('titleScreen').style.display !== 'none';
    if(!titleVisible) return;
    const buttons = getButtons();
    if(!buttons.length) return;
    if(e.key === 'ArrowDown') { e.preventDefault(); showAt(activeIndex < 0 ? 0 : activeIndex + 1); }
    if(e.key === 'ArrowUp') { e.preventDefault(); showAt(activeIndex < 0 ? 0 : activeIndex - 1); }
    if((e.key === 'Enter' || e.key === ' ') && activeIndex >= 0) { e.preventDefault(); buttons[activeIndex].click(); }
  });
  document.addEventListener('mousemove', ()=>{ if(activeIndex >= 0){ activeIndex = -1; clear(); } }, {passive:true});
})();
