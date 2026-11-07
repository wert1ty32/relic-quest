/* ================= Стан і збереження ================= */
const SAVE_KEY="relicquest_save_v1";
const DEF=()=>({v:2,money:0,unknown:0,artifacts:{},discovered:{},secrets:{},placed:["","","","","","","",""],upgrades:{tool:1,shelves:2,lab:1,backpack:1,bus:1},socket:false,rebirths:0,quest:1,dug:0,researched:0,purchases:0,itemBuys:0,earned:0,lastAncient:0,solution:null,tiles:null,started:false,
  inv:{},hp:MAX_HP,tables:[{end:0,busy:false},{end:0,busy:false},{end:0,busy:false}],
  temple:{mirrors:[1,2,0,2],solved:false,taken:false,secret:false},crypt:{order:null,progress:0,solved:false,taken:false,rope:false,ledge:false,crack:false,crackLoot:false},obs:{solved:false,taken:false},
  fixed:{},flashlightOn:true,waypoint:null,visitors:0});
let S=DEF();
function migrate(d){
  const D=DEF(),o=Object.assign(D,d);
  o.upgrades=Object.assign(DEF().upgrades,d.upgrades||{});
  if(!d.v||d.v<2){o.money=Math.floor(d.knowledge||0);delete o.knowledge;o.upgrades.lab=1;o.v=2}
  o.upgrades.lab=clamp(o.upgrades.lab,1,3);
  ["temple","crypt","obs"].forEach(k=>o[k]=Object.assign(DEF()[k],d[k]||{}));
  if(!Array.isArray(o.tables)||o.tables.length<3)o.tables=DEF().tables;
  return o;
}
function loadSave(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return null;return migrate(JSON.parse(raw))}catch(e){return null}}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(S))}catch(e){}}
function ensurePuzzle(){
  if(!S.solution)S.solution=shuffle([0,1,2,3]).slice(0,3);
  if(!S.tiles)S.tiles=S.solution.map(v=>(v+2)%4);
  if(!S.crypt.order)S.crypt.order=shuffle([0,1,2,3]);
}

/* ================= Утиліти інтерфейсу ================= */
const $=id=>document.getElementById(id);
function toast(text,color){
  const t=document.createElement("div");t.className="toast";t.style.setProperty("--c",color||COL.forest);t.textContent=text;
  const bx=$("toasts");bx.appendChild(t);while(bx.children.length>4)bx.firstChild.remove();
  setTimeout(()=>{t.classList.add("out");setTimeout(()=>t.remove(),320)},3200);
}
let bubbleTimer=0;
function foxSay(text){const b=$("bubble");b.textContent=text;b.classList.remove("off");clearTimeout(bubbleTimer);bubbleTimer=setTimeout(()=>b.classList.add("off"),7000)}
const has=id=>(S.inv[id]||0)>0;

/* ================= Гроші ================= */
let currentEvent=null,eventEndsAt=0,nextEventAt=0;
const payMult=()=>(1+S.rebirths*REBIRTH_BONUS)*(currentEvent&&currentEvent.id==="starnight"?2:1);
const earnLog=[];
function earn(n,why){n=Math.round(n);if(n<=0)return;S.money+=n;S.earned+=n;earnLog.push([performance.now()/1000,n]);$("kVal").classList.remove("bump");void $("kVal").offsetWidth;$("kVal").classList.add("bump");renderHUD()}
function spend(n){if(S.money<n)return false;S.money-=n;renderHUD();return true}
function ratePerMin(){const t=performance.now()/1000;while(earnLog.length&&earnLog[0][0]<t-60)earnLog.shift();return earnLog.reduce((a,b)=>a+b[1],0)}
const capacity=()=>UPGBY.backpack.cap[S.upgrades.backpack-1];
const placedCount=(id,except)=>S.placed.filter((v,k)=>v===id&&k!==except).length;
function exhibitValue(){let s=0;for(let k=0;k<S.upgrades.shelves;k++){const id=S.placed[k];if(id&&ARTBY[id])s+=viewReward(ARTBY[id])}return s}
const luck=()=>S.upgrades.tool+(has("protools")?1:0);

/* ================= Завдання ================= */
const QUESTS=[
 {t:"Іди в Шепітний ліс на півночі. Знайди місце, що блищить, і затисни E, щоб викопати реліквію.",done:()=>S.dug>0,target:()=>nearestOf(digSpots.filter(d=>!d.hidden).map(d=>d.pos))||V3(0,0,-200)},
 {t:"Є реліквія! Неси її до лабораторії на базі (на півдні) і поклади на дослідницький стіл.",done:()=>S.researched>0||S.tables.some(t=>t.busy),target:()=>W.tables[0].pos},
 {t:"Дослідження триває 2 хвилини. Поки чекаєш, зазирни в крамницю «Компас» на площі або копай ще.",done:()=>S.researched>0,target:()=>W.tables[0].pos},
 {t:"Постав артефакт у вітрину музею. Відвідувачі платитимуть за перегляд!",done:()=>exhibitValue()>0,target:()=>W.pedestals[0].pos},
 {t:"Автобус привозить відвідувачів до зупинки біля бази. Заробіть перші 30 грн на екскурсіях.",done:()=>S.earned>=30,target:()=>V3(LAY.stop.x,0,LAY.stop.z)},
 {t:"Купи спорядження в крамниці «Компас» на площі. Почни з компаса або аптечки.",done:()=>S.itemBuys>0,target:()=>W.shopCounter},
 {t:"Дивний камінь — частина механізму! Знайди Піщаний каньйон на сході й встав камінь у гніздо.",done:()=>S.socket,target:()=>W.socketPos},
 {t:"Знайди три камені-підказки з символами й поверни плити в правильному порядку.",done:()=>!!S.secrets.canyon,target:()=>W.socketPos},
 {t:"Двері відчинено! Відкрий скриню предків у таємній кімнаті каньйону.",done:()=>!!S.secrets.key,target:()=>W.ancient},
 {t:"Затоплений храм на заході: спрямуй промінь світла дзеркалами на кришталь.",done:()=>S.temple.solved,target:()=>V3(-392,0,-20)},
 {t:"Темна гробниця на північному сході. Візьми ліхтарик: підказки намальовані на стінах.",done:()=>S.crypt.solved,target:()=>V3(356,0,-290)},
 {t:"Руїни обсерваторії на пагорбі (південний захід): запам'ятай мелодію кристалів.",done:()=>S.obs.solved,target:()=>W.obsStart},
 {t:"Ти справжній дослідник! Збери всю колекцію, відкривай легендарні скрині й розвивай музей.",done:()=>false,target:()=>null},
];
function questTarget(){if(S.waypoint)return V3(S.waypoint[0],0,S.waypoint[1]);const q=QUESTS[S.quest-1];return q&&q.target?q.target():null}
function checkQuest(){let adv=false;while(S.quest<QUESTS.length&&QUESTS[S.quest-1].done()){S.quest++;adv=true}if(adv){foxSay(QUESTS[S.quest-1].t);sfx("quest");renderHUD()}}
function nearestOf(list){let b=null,bd=1e9;for(const p of list){const d=p.distanceTo(player.pos);if(d<bd){bd=d;b=p}}return b}

/* ================= Артефакти ================= */
function roll(level,legendPct){
  const l=level-1,w=[["common",64-6*l],["uncommon",24+2*l],["rare",9+2.5*l],["epic",3+1.2*l],["legendary",legendPct||0]];
  let t=w.reduce((a,b)=>a+Math.max(0,b[1]),0),r=Math.random()*t,rar="common";
  for(const [k,v] of w){if(r<Math.max(0,v)){rar=k;break}r-=Math.max(0,v)}
  const pool=ART.filter(a=>a.r===rar&&a.roll);return pool.length?pool[rint(0,pool.length-1)].id:"stone";
}
function addArtifact(id,quiet){
  const a=ARTBY[id],rr=RAR[a.r];S.artifacts[id]=(S.artifacts[id]||0)+1;const isNew=!S.discovered[id];S.discovered[id]=true;
  toast((isNew?"Нова знахідка: ":"Знахідка: ")+a.name+" · "+rr.name,rr.color);sfx(rr.o>=4?"rare":"find");
  if(isNew&&!quiet){if(id==="stone")foxSay("Дивний камінь… На ньому є вирізи. Схоже, це частина якогось механізму!");else if(rr.o>=4)foxSay("Ого! "+a.name+"! "+a.desc)}
  checkQuest();renderHUD();save();
}

/* ================= Вітрини ================= */
function updatePedestals(){
  W.pedestals.forEach((p,k)=>{
    const unlocked=k<S.upgrades.shelves,id=unlocked?S.placed[k]:"";
    p.base.material=unlocked?mat("white","tex:marble"):mat("rock",null,.4);p.top.material=unlocked?mat("forest"):mat("forest",null,.4);
    if(p.cur!==id){if(p.model){p.holder.remove(p.model);p.model=null}p.cur=id;if(id){p.model=artifactModel(id,1.5);p.holder.add(p.model)}}
    p.label.off=!unlocked;p.label.el.textContent=id?ARTBY[id].name+" · "+viewReward(ARTBY[id])+" грн/перегляд":"Порожня вітрина";
    p.label.el.style.borderColor=id?RAR[ARTBY[id].r].color:"";
  });
}
function placeBest(k){
  const cur=S.placed[k],ci=cur&&ARTBY[cur]?viewReward(ARTBY[cur]):-1;let best=null,bi=ci;
  for(const id in S.artifacts){const a=ARTBY[id];if(a&&S.artifacts[id]-placedCount(id,k)>0&&viewReward(a)>bi){best=id;bi=viewReward(a)}}
  if(best){S.placed[k]=best;toast("У вітрині: "+ARTBY[best].name,RAR[ARTBY[best].r].color);sfx("place");updatePedestals();checkQuest();renderHUD();save()}
  else if(cur)toast("Тут уже найкращий експонат!");else toast("Немає артефактів. Досліди реліквії в лабораторії!",COL.orange);
}
function autoArrange(){
  const list=[];for(const id in S.artifacts){const a=ARTBY[id];if(a)for(let i=0;i<S.artifacts[id];i++)list.push(a)}
  list.sort((a,b)=>viewReward(b)-viewReward(a));for(let k=0;k<8;k++)S.placed[k]=k<S.upgrades.shelves&&list[k]?list[k].id:"";
  updatePedestals();checkQuest();renderHUD();save();toast("Музей оновлено!");sfx("place");
}

/* ================= Автобус і відвідувачі ================= */
const BUS={state:"away",x:-760,v:0,timer:6,mesh:null,col:null,stopX:LAY.stop.x-2,lane:104};
const visitors=[];
const SHIRTS=["#D2601A","#2F7D32","#F4C27F","#9FE3D8","#C9A2E8","#FBF8EC","#D33A2C","#6FA83A","#B8722C"];
function buildBus(){
  const g=new THREE.Group();g.userData.noMerge=true;
  box(g,[20,6.4,6.6],[0,4.2,0],"orange",{dyn:true});box(g,[20.1,1.4,6.7],[0,3,0],"paper",{dyn:true});box(g,[20,.6,6.6],[0,7.7,0],"paper",{dyn:true});
  for(let i=0;i<5;i++)for(const s of[-1,1])box(g,[3,2.2,.1],[-7.2+i*3.6,5.4,s*3.32],"#BFE3F5",{m:"glass",dyn:true});
  box(g,[.1,2.6,5.4],[10.02,5.2,0],"#BFE3F5",{m:"glass",dyn:true});box(g,[2.6,5,.12],[5,3.6,3.34],"#BFE3F5",{m:"glass",dyn:true});
  for(const x of[-6.5,6.5])for(const s of[-1,1])box(g,[2.4,2.4,1.2],[x,1.2,s*3.1],"ink",{shape:"cyl",rot:[0,0,0],dyn:true});
  box(g,[.3,.8,1.4],[10.1,2.4,-2.2],"tan",{m:"neon",dyn:true});box(g,[.3,.8,1.4],[10.1,2.4,2.2],"tan",{m:"neon",dyn:true});
  const sgn=box(g,[8,1.2,.1],[-1,6.6,3.36],"forest",{dyn:true});sign(sgn,"back","МУЗЕЙ ЗНАХІДОК","cream");
  g.position.set(-760,0,BUS.lane);scene.add(g);BUS.mesh=g;
  BUS.col={box:new THREE.Box3(),on:false,tag:"bus"};colliders.push(BUS.col);
}
function passengerCount(){
  const n=S.placed.slice(0,S.upgrades.shelves).filter(Boolean).length,rare=S.placed.slice(0,S.upgrades.shelves).reduce((a,id)=>a+(id?RAR[ARTBY[id].r].o:0),0);
  return clamp(1+Math.floor(n*.5+rare*.12)+(S.upgrades.bus-1),1,9);
}
function floorAt(x,z){if(x>-64.7&&x<64.7&&z>113.3&&z<193.7)return(x>-22&&x<22&&z>128&&z<156)?1.2:1;if(z>92&&z<108)return .12;return groundH(x,z)}
function spawnVisitor(){
  if(visitors.length>=26)return;
  const o={shirt:SHIRTS[rint(0,SHIRTS.length-1)],pants:["#5B6B3A","#3C5E3F","#6B3E1E","#2B4A2E"][rint(0,3)],hat:["cap","sun",null,null][rint(0,3)],hatCol:SHIRTS[rint(0,SHIRTS.length-1)],hair:["#5A3A22","#2B2018","#C9772E","#E9C27F"][rint(0,3)],bag:Math.random()<.4?"#8C5A2B":null,skin:["#F2C29B","#D9A066","#B8722C","#F7D7B5"][rint(0,3)]};
  const g=personModel(o);const sc=.88+Math.random()*.16;g.scale.setScalar(sc);
  const start=V3(BUS.x+5,0,108.6);g.position.copy(start);scene.add(g);
  const occupied=W.pedestals.filter((p,k)=>k<S.upgrades.shelves&&S.placed[k]);const picks=shuffle(occupied.slice()).slice(0,rint(2,4));
  const v={g,pos:start.clone(),path:[],state:"walk",timer:0,picks,phase:Math.random()*6,face:0,walk:0,emote:null,row:-1,spd:6.5+Math.random()*1.5};
  v.path=[V3(start.x+rnd(-1,1),0,110),V3(5+rnd(-1,1),0,110),V3(rnd(-1,1),0,117.5),V3(rnd(-1.5,1.5),0,124),V3(rnd(-1,1),0,131)];
  v.next="museum";visitors.push(v);S.visitors++;
}
function planNextView(v){
  const p=v.picks.shift();
  if(!p){v.path=[V3(rnd(-1,1),0,131),V3(rnd(-1,1),0,124),V3(rnd(-1,1),0,117.5),V3(5+rnd(-1,1),0,110),V3(BUS.stopX+rnd(-8,12),0,110+rnd(-.3,.3))];v.next="wait";return}
  const zRow=p.row?142.5:133.5,cur=v.pos;v.path=[];
  if(Math.abs(cur.z-zRow)>.5){v.path.push(V3(rnd(-.8,.8),0,cur.z));v.path.push(V3(rnd(-.8,.8),0,zRow))}
  v.path.push(V3(p.view.x+rnd(-1.2,1.2),0,zRow));v.next="view";v.ped=p;
}
function updateVisitors(dt){
  for(let i=visitors.length-1;i>=0;i--){const v=visitors[i];
    if(v.state==="walk"){const tgt=v.path[0];
      if(!tgt){if(v.next==="museum"){if(!v.picks.length){v.state="look";v.timer=2.5;emote(v,"Тут порожньо…")}else planNextView(v);continue}
        if(v.next==="view"){v.state="view";v.timer=rnd(3.5,6);v.face=Math.PI;continue}
        if(v.next==="wait"){v.state="wait";continue}
        if(v.next==="board"){scene.remove(v.g);if(v.emote){v.emote.el.remove();labels.splice(labels.indexOf(v.emote),1)}visitors.splice(i,1);continue}}
      const d=V3(tgt.x-v.pos.x,0,tgt.z-v.pos.z),dist=d.length();
      // ввічливо обходимо гравця
      const pd=V3(v.pos.x-player.pos.x,0,v.pos.z-player.pos.z);if(pd.length()<2.6){pd.normalize();v.pos.addScaledVector(pd,dt*3)}
      if(dist<.35)v.path.shift();else{d.multiplyScalar(1/dist);const s=Math.min(v.spd,dist*4);v.pos.addScaledVector(d,s*dt);v.face=Math.atan2(-d.x,-d.z);v.walk+=dt*s*.55}
    }else if(v.state==="view"){v.timer-=dt;v.walk*=.9;
      if(v.timer<=0){const p=v.ped,id=S.placed[p.i];if(id&&p.i<S.upgrades.shelves){const a=ARTBY[id],pay=Math.round(viewReward(a)*payMult());earn(pay);cashPop(p.pos,pay);if(Math.random()<.45)emote(v,a.r==="legendary"||a.r==="epic"?"Неймовірно!":["Ого!","Красиво!","Цікаво…"][rint(0,2)])}
        v.state="walk";planNextView(v)}}
    else if(v.state==="look"){v.timer-=dt;v.face+=dt*1.5;if(v.timer<=0){v.state="walk";v.picks=[];planNextView(v)}}
    else if(v.state==="wait"){v.walk*=.9;v.face=Math.PI;if(BUS.state==="stopped"){v.state="walk";v.path=[V3(BUS.x+5+rnd(-.5,.5),0,108.6)];v.next="board"}}
    v.pos.y=floorAt(v.pos.x,v.pos.z);
    const g=v.g;g.position.lerp(v.pos,Math.min(1,dt*14));let df=v.face-g.rotation.y;df=Math.atan2(Math.sin(df),Math.cos(df));g.rotation.y+=df*Math.min(1,dt*8);
    const sw=Math.sin(v.walk*2)*.6*(v.state==="walk"?1:0);const u=g.userData;u.legL.rotation.x=sw;u.legR.rotation.x=-sw;u.armL.rotation.x=-sw*.8;u.armR.rotation.x=sw*.8;u.head.rotation.y=v.state==="view"?Math.sin(performance.now()/700+v.phase)*.3:0;
    if(v.emote){v.emote.pos.set(g.position.x,g.position.y+10,g.position.z)}
  }
}
function emote(v,text){if(v.emote){v.emote.el.remove();labels.splice(labels.indexOf(v.emote),1)}const L=worldLabel(text,v.pos.clone().setY(10),{max:60,cls:"vis"});v.emote=L;setTimeout(()=>{if(v.emote===L){L.el.remove();labels.splice(labels.indexOf(L),1);v.emote=null}},2600)}
function cashPop(pos,n){const L=worldLabel("+"+n+" грн",pos.clone().add(V3(0,5,0)),{max:80,cls:"cash"});const t0=performance.now();sfx("coin");
  const tick=()=>{const k=(performance.now()-t0)/1400;L.pos.y=pos.y+5+k*3;L.el.style.opacity=String(1-k);if(k<1)requestAnimationFrame(tick);else{L.el.remove();labels.splice(labels.indexOf(L),1)}};tick()}
function updateBus(dt){
  const b=BUS;b.timer-=dt;
  const period=BUS_PERIOD*(currentEvent&&currentEvent.id==="tourists"?.5:1);
  if(b.state==="away"){b.x=-760;if(b.timer<=0){b.state="arriving";b.v=26}}
  else if(b.state==="arriving"){const d=b.stopX-b.x;b.v=Math.max(3,Math.min(26,d*.9));b.x+=b.v*dt;if(d<.3){b.x=b.stopX;b.state="stopped";b.timer=8;b.spawnLeft=passengerCount();b.spawnT=.6;sfx("bus")}}
  else if(b.state==="stopped"){b.spawnT-=dt;if(b.spawnLeft>0&&b.spawnT<=0){spawnVisitor();b.spawnLeft--;b.spawnT=.75}
    const boarding=visitors.some(v=>v.next==="board");if(b.timer<=0&&b.spawnLeft<=0&&!boarding){b.state="leaving";b.v=2}}
  else if(b.state==="leaving"){b.v=Math.min(30,b.v+dt*9);b.x+=b.v*dt;if(b.x>760){b.state="away";b.timer=period}}
  b.mesh.position.set(b.x,0,b.lane);b.col.on=b.state!=="away";b.col.box.min.set(b.x-10,0,b.lane-3.3);b.col.box.max.set(b.x+10,8,b.lane+3.3);
  let eta=b.state==="away"?b.timer+ (760+b.stopX)/26:b.state==="arriving"?(b.stopX-b.x)/Math.max(6,b.v):0;
  W.busBoard.el.textContent=b.state==="stopped"?"Автобус на зупинці":b.state==="leaving"?"Автобус від'їжджає":"Автобус через "+Math.max(1,Math.ceil(eta))+" с";
}

/* ================= Розкопки ================= */
const digSpots=[],chests=[];
function sparkles(g,col,n=3){const s=[];for(let i=0;i<n;i++){const m=box(g,[.5,.5,.5],[0,3,0],col,{m:"neon",shadow:false,dyn:true});m.userData.ph=i*2.1;s.push(m)}return s}
function forestPoint(){for(let t=0;t<40;t++){const F=LAY.forest,x=rnd(F.x1+10,F.x2-10),z=rnd(F.z1+10,F.z2-10);if(W.trees.every(([tx,tz])=>Math.hypot(tx-x,tz-z)>7))return V3(x,groundH(x,z),z)}return V3(0,0,-200)}
function wildPoint(){for(let t=0;t<60;t++){const x=rnd(-560,560),z=rnd(-560,560);if(zoneBlocked(x,z,10))continue;if(W.trees.some(([tx,tz])=>Math.hypot(tx-x,tz-z)<7))continue;return V3(x,groundH(x,z),z)}return forestPoint()}
function spawnDig(){
  const hidden=Math.random()<.3,p=hidden&&Math.random()<.5?wildPoint():forestPoint(),g=new THREE.Group();g.position.copy(p);g.userData.noMerge=true;scene.add(g);
  box(g,[4,1,4],[0,.3,0],"sand",{dyn:true});box(g,[2.4,.6,2.4],[.3,.9,-.2],"sandDark",{dyn:true});
  const sp=sparkles(g,"tan");if(hidden){g.visible=false}
  digSpots.push({pos:p,g,sp,hidden});
}
function removeSpot(list,s){s.alive=false;scene.remove(s.g);if(s.hints)s.hints.forEach(h=>scene.remove(h.g));const i=list.indexOf(s);if(i>=0)list.splice(i,1)}
function dig(s){
  if(S.unknown>=capacity()){toast("Рюкзак повний! Досліди реліквії в лабораторії.",COL.orange);sfx("error");return}
  removeSpot(digSpots,s);S.dug++;sfx("dig");
  if(currentEvent&&currentEvent.id==="quake"&&Math.random()<.05){addArtifact("heart");foxSay("СЕРЦЕ МЕХАНІЗМУ! Його знаходять лише під час Землетрусу!");return}
  S.unknown++;if(s.hidden){S.bonusRelics=(S.bonusRelics||0)+1}
  toast((s.hidden?"Схованка! ":"")+"+1 реліквія в рюкзаку ("+S.unknown+"/"+capacity()+")");checkQuest();renderHUD();save();
}
const digDuration=()=>Math.max(.45,1.8-.32*(S.upgrades.tool-1))*(has("protools")?.6:1);

/* ================= Дослідницькі столи (рівно 120 с) ================= */
function tableAction(i){
  const t=S.tables[i];
  if(i>=S.upgrades.lab){toast("Цей стіл ще не куплено. Відкрий «Покращення» → Дослідницькі столи.",COL.orange);return}
  if(t.busy){const left=Math.ceil((t.end-Date.now())/1000);toast("Дослідження ще триває: "+fmtTime(left));return}
  if(S.unknown<1){toast("Немає реліквій. Копай у Шепітному лісі!",COL.orange);sfx("error");return}
  S.unknown--;t.busy=true;t.end=Date.now()+RESEARCH_TIME*1000;t.bonus=S.bonusRelics>0?(S.bonusRelics--,1):0;
  sfx("place");toast("Реліквію покладено на стіл "+(i+1)+". Дослідження: 2:00");
  if(S.researched===0&&S.quest<=3)foxSay("Дослідження триває рівно 2 хвилини. Можеш піти покопати або зазирнути в крамницю!");
  refreshTables();checkQuest();renderHUD();save();
}
function completeTable(i){
  const t=S.tables[i];t.busy=false;t.end=0;S.researched++;
  const id=!S.discovered.stone&&S.researched<=2?"stone":roll(luck()+(t.bonus?2:0),0);
  W.tables[i].doneT=4;sfx("research");addArtifact(id);refreshTables();save();
}
const fmtTime=s=>Math.floor(Math.max(0,s)/60)+":"+String(Math.max(0,s)%60).padStart(2,"0");
function refreshTables(){
  W.tables.forEach((w,i)=>{const t=S.tables[i],owned=i<S.upgrades.lab;w.tarp.visible=!owned;
    if(t.busy&&!w.relic.children.length){const g=new THREE.Group();box(g,[1.8,1.2,1.4],[0,.6,0],"#8C6A44",{dyn:true});box(g,[1.9,.25,1.5],[0,.7,0],"tan",{dyn:true});box(g,[1.2,.5,.9],[.2,1.35,0],"rockDark",{dyn:true});w.relic.add(g)}
    if(!t.busy&&w.relic.children.length)w.relic.clear();
    w.beam.visible=t.busy;w.scr.material=t.busy?mat("lime300","neon"):mat("forestDeep")})
}
function updateTables(dt,t){
  W.tables.forEach((w,i)=>{const s=S.tables[i],owned=i<S.upgrades.lab;
    if(s.busy&&Date.now()>=s.end)completeTable(i);
    if(s.busy){w.ring.rotation.y+=dt*2.4;w.beam.position.x=w.pos.x+Math.sin(t*2.2)*1.4;w.beam.material.emissiveIntensity=.6+Math.sin(t*9)*.3;w.relic.rotation.y+=dt*.5}
    else w.ring.rotation.y+=dt*.2;
    const L=w.label;if(w.doneT>0){w.doneT-=dt}
    if(!owned){L.el.className="wl prog";L.el.innerHTML="Стіл "+(i+1)+" · купи в «Покращеннях»";}
    else if(w.doneT>0){L.el.className="wl prog done";L.el.innerHTML="Дослідження завершено!"}
    else if(s.busy){const left=Math.ceil((s.end-Date.now())/1000),f=1-left/RESEARCH_TIME;L.el.className="wl prog";L.el.innerHTML="Дослідження · "+fmtTime(left)+"<b><i style='width:"+(f*100).toFixed(1)+"%'></i></b>"}
    else{L.el.className="wl prog";L.el.innerHTML="Стіл "+(i+1)+" вільний"}});
}

/* ================= Запечатані скрині ================= */
let chestSeq=0;
function chestModel(tier){
  const T=CHEST_TIERS[tier],g=new THREE.Group();g.userData.noMerge=true;const sz=tier==="legendary"?1.25:tier==="epic"?1.12:1;
  box(g,[4*sz,2.6*sz,3*sz],[0,1.3*sz,0],T.body==="wood"?"white":T.body,{tex:T.body==="wood"?"planks":undefined,tile:2,dyn:true});
  box(g,[4.2*sz,1*sz,3.2*sz],[0,3*sz,0],T.band,{m:tier==="rare"?undefined:"metal",dyn:true});
  for(const x of[-1.4,1.4])box(g,[.4*sz,2.7*sz,3.15*sz],[x*sz,1.35*sz,0],T.band,{m:"metal",dyn:true});
  box(g,[1*sz,1.2*sz,.3*sz],[0,1.8*sz,-1.6*sz],tier==="rare"?"lime300":"gold",{m:"neon",dyn:true});
  if(tier!=="rare")for(const [x,z] of[[-2,-1.5],[2,-1.5],[-2,1.5],[2,1.5]])box(g,[.6,.6,.6],[x*sz,3.3*sz,z*sz],"gold",{m:"metal",dyn:true});
  if(tier==="legendary"){const col=box(g,[1.6,40,1.6],[0,22,0],"#FFE7A3",{m:"neon",op:.28,dyn:true,shadow:false});g.userData.beam=col;
    const ring=new THREE.Group();for(let a=0;a<6;a++)box(ring,[.7,.7,.15],[Math.cos(a/6*6.28)*3.2,0,Math.sin(a/6*6.28)*3.2],"gold",{m:"neon",dyn:true});ring.position.y=4.5;g.add(ring);g.userData.ring=ring}
  return g;
}
function spawnChest(tier,fixedKey,pos,hintPos){
  if(!tier){const r=Math.random();tier=r<.05&&!chests.some(c=>c.tier==="legendary"&&!c.fixed)?"legendary":r<.3?"epic":"rare"}
  const p=pos||(tier==="legendary"?wildPoint():Math.random()<.7?forestPoint():wildPoint());
  const g=chestModel(tier);g.position.copy(p);scene.add(g);
  const T=CHEST_TIERS[tier],ch={id:++chestSeq,tier,pos:p,g,sp:sparkles(g,T.glow,tier==="rare"?3:5),fixed:fixedKey||null,stage:0,attempts:3,lockedUntil:0,puzzles:null,alive:true};
  if(tier==="legendary"){ch.vals=SYM.map(()=>rint(2,9));ch.clueIdx=[0,1,2].map(()=>rint(0,3));ch.hints=[];
    for(let k=0;k<3;k++){let hp=hintPos?hintPos[k].clone():null;for(let t=0;t<30&&!hp;t++){const a=Math.random()*6.28,r=rnd(12,24),x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;if(!fixedKey&&zoneBlocked(x,z,2))continue;hp=V3(x,fixedKey?p.y:groundH(x,z),z)}
      if(!hp)hp=V3(p.x+8*(k-1),p.y,p.z+10);
      const hg=new THREE.Group();hg.position.copy(hp);hg.userData.noMerge=true;scene.add(hg);box(hg,[2.4,3.2,1],[0,1.6,0],"white",{tex:"stone",tile:2,dyn:true});box(hg,[1,1,.2],[0,2.2,-.55],"gold",{m:"neon",dyn:true});
      ch.hints.push({g:hg,pos:hp.clone().setY(hp.y+2),k})}}
  chests.push(ch);return ch;
}
function makePuzzles(ch){
  if(ch.tier==="rare")return [Math.random()<.5?genRiddle():genSequence(false)];
  if(ch.tier==="epic")return [genRiddle(),genSymbolMath(),genSequence(true)];
  return [{kind:"dials"},{kind:"num",q:"",ans:0,legend:true},genSequence(true)];
}
function chestInteract(ch){
  if(!ch.alive)return;
  if(ch.tier==="legendary"&&!has("decoder")){foxSay("Печатки цієї скрині не зрушити руками. Потрібен Декодер печаток з крамниці «Компас».");sfx("error");return}
  if(Date.now()<ch.lockedUntil){toast("Замок заклинило. Спробуй через "+Math.ceil((ch.lockedUntil-Date.now())/1000)+" с",COL.orange);return}
  if(!ch.puzzles)ch.puzzles=makePuzzles(ch);
  sfx("chest_"+ch.tier);openChestUI(ch);
}
function chestAnswer(ch,ok){
  if(ok){ch.stage++;sfx("ok");if(ch.stage>=ch.puzzles.length){finishChest(ch);return true}openChestUI(ch);return true}
  ch.attempts--;sfx("error");
  if(ch.attempts<=0){ch.lockedUntil=Date.now()+30000;ch.attempts=3;ch.stage=0;ch.puzzles=null;closeModal();toast("Замок заклинило на 30 секунд, а механізм скинувся.",COL.stamp);return false}
  return false;
}
function finishChest(ch){
  const T=CHEST_TIERS[ch.tier];closeModal();removeSpot(chests,ch);sfx("open_"+ch.tier);
  const m=rint(T.money[0],T.money[1]);earn(m);toast("+"+money(m)+" зі скрині",COL.orange);
  let id=roll(luck()+T.luck,T.legendary);if(ch.tier==="legendary"&&RAR[ARTBY[id].r].o<4)id=Math.random()<.5?"sundisc":"crystal";
  if(ch.fixed){S.fixed[ch.fixed]=true;if(ch.fixed==="crypt")id="crown"}
  addArtifact(id);
  if(ch.tier!=="rare"&&Math.random()<.5){const it=Math.random()<.5?"medkit":"lockpicks";S.inv[it]=(S.inv[it]||0)+1;toast("Також у скрині: "+ITEMBY[it].name)}
  foxSay(ch.tier==="legendary"?"ЛЕГЕНДАРНА СКРИНЯ ВІДКРИТА! Такого скарбу ще ніхто не бачив!":ch.tier==="epic"?"Епічно! Три замки — і все наше!":"Правильно! Замок клацнув!");
  renderHUD();save();
}

/* ================= Здоров'я та пастки ================= */
let hurtCD=0,regenT=0;
function damage(n,respawn,msg){
  if(hurtCD>0)return;hurtCD=1.4;S.hp=Math.max(0,S.hp-n);sfx("hurt");$("fade").classList.add("red","on");setTimeout(()=>$("fade").classList.remove("on"),120);setTimeout(()=>$("fade").classList.remove("red"),500);
  if(S.hp<=0){foxSay("Ой! Тобі треба відпочити. Повертаємось додому.");S.hp=MAX_HP;teleport(W.home,true)}
  else{if(msg)foxSay(msg+(S.hp<=2&&has("medkit")?" Натисни Q, щоб скористатися аптечкою.":""));if(respawn)setTimeout(()=>{player.pos.copy(respawn);player.pos.y=Math.max(respawn.y,groundH(respawn.x,respawn.z));player.vel.set(0,0,0)},250)}
  renderHUD();save();
}
function useMedkit(){if(!has("medkit")){toast("Немає аптечки. Купи в крамниці «Компас».",COL.orange);return}if(S.hp>=MAX_HP){toast("Здоров'я вже повне.");return}S.inv.medkit--;S.hp=MAX_HP;sfx("heal");toast("Здоров'я відновлено");renderHUD();save()}
const fallingRocks=[];
function checkTraps(){
  for(const t of W.traps){if(player.pos.x>t.x0&&player.pos.x<t.x1&&player.pos.z>t.z0&&player.pos.z<t.z1&&player.pos.y<t.y){
    if(hurtCD<=0&&t.respawn===CANYON_RESPAWN){const rock=box(scene,[3,3,3],[(t.x0+t.x1)/2,24,(t.z0+t.z1)/2],"rockDark",{dyn:true});fallingRocks.push({m:rock,v:0,life:2})}
    damage(1,t.respawn,t.msg);break}}
  for(const s of W.spikes){if(s.up&&player.pos.x>s.x0&&player.pos.x<s.x1&&player.pos.z>s.z0&&player.pos.z<s.z1&&player.pos.y<2.2)damage(1,V3(364,0,-290),"Шипи! Вони висуваються з підлоги по черзі — дочекайся, поки сховаються.")}
}

/* ================= Каньйон ================= */
function refreshTiles(){W.tiles.forEach((t,i)=>t.sign.userData.setText(SYM[S.tiles[i]]))}
const tilesSolved=()=>S.tiles.every((v,i)=>v===S.solution[i]);
const doors=[];
function slideOpen(mesh,dy,instant){const cl=mesh.userData.col;if(cl)cl.on=false;if(instant){mesh.position.y+=dy;mesh.visible=false;return}doors.push({m:mesh,from:mesh.position.y,dy,t:0});sfx("door")}
function setSocketLit(){W.socket.material=mat("lime300","neon")}
function rotateTile(i){
  if(S.secrets.canyon){toast("Двері вже відчинені!");return}
  S.tiles[i]=(S.tiles[i]+1)%4;refreshTiles();sfx("click");W.tiles[i].mesh.material=mat("lime300");setTimeout(()=>W.tiles[i].mesh.material=mat("rock"),350);
  if(tilesSolved()){if(S.socket){S.secrets.canyon=true;slideOpen(W.door,-9);toast("Таємницю розгадано! Двері відчинено.",COL.orange);earn(500);checkQuest()}
    else foxSay("Плити стали на місце… але гніздо внизу ще порожнє!")}
  save();
}
function useSocket(){
  if(S.socket){toast("Камінь уже в гнізді.");return}
  if((S.artifacts.stone||0)<1){foxSay("Сюди підійде якийсь камінь із вирізами… Пошукай Дивний камінь!");return}
  S.artifacts.stone--;if(placedCount("stone")>S.artifacts.stone){const k=S.placed.lastIndexOf("stone");if(k>=0)S.placed[k]="";updatePedestals()}
  S.socket=true;setSocketLit();sfx("ok");foxSay("Камінь ідеально ліг у гніздо! Тепер плити… Шукай камені-підказки з символами!");
  if(tilesSolved()){S.secrets.canyon=true;slideOpen(W.door,-9)}
  checkQuest();renderHUD();save();
}
function openAncient(){
  if(!S.secrets.key){S.secrets.key=true;earn(5000);addArtifact("key");foxSay("КЛЮЧ ПРЕДКІВ! Він відчиняє місця, яких немає на мапі. Що ж він відчиняє?..");toast("+5 000 грн",COL.orange);S.lastAncient=Date.now()}
  else if(Date.now()-S.lastAncient>=600000){S.lastAncient=Date.now();addArtifact(roll(luck()+3,5))}
  else toast("Скриня наповниться через "+Math.ceil((600000-(Date.now()-S.lastAncient))/60000)+" хв");
  renderHUD();save();
}

/* ================= Затоплений храм: промінь і дзеркала ================= */
// 0 — дзеркало опущене (світло проходить), 1 — «/», 2 — «\». Напрямки: 0 північ(−z), 1 схід, 2 південь, 3 захід
const REFL={1:{1:0,0:1,3:2,2:3},2:{1:2,2:1,3:0,0:3}};
function traceBeam(){
  const T=TEMPLE,pts=[W.sourcePos.clone()];let i=-1,j=2,dir=1,ok=false;
  for(let s=0;s<20;s++){i+=dir===1?1:dir===3?-1:0;j+=dir===2?1:dir===0?-1:0;
    if(i<0||i>3||j<0||j>3){if(dir===0&&i===3&&j<0)ok=true;const x=T.gx+clamp(i,-.6,3.6)*T.cell,z=T.gz+clamp(j,-.6,3.6)*T.cell;pts.push(V3(ok?-420:x,T.y+4.6,ok?-33.5:z));break}
    const m=W.mirrors.find(q=>q.i===i&&q.j===j);if(m){const st=S.temple.mirrors[W.mirrors.indexOf(m)];if(st>0){pts.push(V3(T.gx+i*T.cell,T.y+4.6,T.gz+j*T.cell));dir=REFL[st][dir]}}}
  return {pts,ok};
}
function drawBeam(){
  W.beam.clear();const {pts,ok}=traceBeam();
  for(let k=0;k<pts.length-1;k++){const a=pts[k],b=pts[k+1],len=a.distanceTo(b);if(len<.01)continue;const m=box(W.beam,[.35,.35,len],[(a.x+b.x)/2,a.y,(a.z+b.z)/2],"#FFE7A3",{m:"neon",dyn:true,shadow:false});m.lookAt(b)}
  W.mirrors.forEach((m,k)=>{const st=S.temple.mirrors[k];m.g.rotation.set(st===0?Math.PI/2:0,st===1?45*DEG:st===2?-45*DEG:0,0)});
  W.crystal.material=ok||S.temple.solved?mat("#9FE3D8","neon"):mat("#9FE3D8","glass");
  return ok;
}
function rotateMirror(k){
  if(S.temple.solved){toast("Промінь уже досяг кришталю.");return}
  S.temple.mirrors[k]=(S.temple.mirrors[k]+1)%3;sfx("click");
  if(drawBeam()){S.temple.solved=true;slideOpen(W.sanctumDoor,-10.5);earn(1500);toast("Кришталь засяяв! Святилище відчинено. +1 500 грн",COL.orange);foxSay("Промінь дійшов до кришталю! Святилище на півночі храму відчинене.");checkQuest()}
  save();
}
function pressLooseBrick(){if(S.temple.secret)return;S.temple.secret=true;slideOpen(W.secretPanel,-8);W.looseBrick.visible=false;foxSay("Таємний прохід! Сова дивилася саме сюди.");if(!S.fixed.temple)spawnChest("epic","temple",W.secretChestPos);save()}

/* ================= Темна гробниця ================= */
const GLYPH_SYM=["☾","☀","★","◆"];
function touchGlyph(k){
  if(S.crypt.solved){toast("Гліфи вже мовчать.");return}
  const want=S.crypt.order[S.crypt.progress];
  if(k===want){S.crypt.progress++;W.glyphs[k].mesh.material=mat("#7FD3FF","neon");sfx("note",[523,587,659,784][S.crypt.progress-1]);
    if(S.crypt.progress>=4){S.crypt.solved=true;slideOpen(W.tombDoor,-11);earn(2000);toast("Гробницю відчинено! +2 000 грн",COL.orange);foxSay("Двері гробниці на сході зали відчинилися!");checkQuest()}}
  else{S.crypt.progress=0;W.glyphs.forEach(g=>g.mesh.material=mat("cryptDark"));sfx("error");foxSay(has("flashlight")&&S.flashlightOn?"Не той порядок. Придивися до розписів на стінах — там римські цифри.":"Не той порядок… Тут темно. Може, на стінах щось намальовано? Без ліхтарика не розгледіти.")}
  save();
}
function useRope(){if(!has("rope")){foxSay("Уступ надто високо. Потрібна мотузка з гаком із крамниці «Компас».");sfx("error");return}S.crypt.rope=true;W.rope.visible=true;teleport(W.ledgeTop)}
function breakCrack(){if(!has("metaldetector")){foxSay("Стіна якась дивна… Металошукач підказав би, чи є за нею порожнина.");return}S.crypt.crack=true;W.crackWall.visible=false;W.crackWall.userData.col.on=false;sfx("break");foxSay("Порожнина! За тріснутою стіною — схованка.");save()}

/* ================= Обсерваторія: мелодія кристалів ================= */
const SIMON={seq:[],input:0,round:0,playing:false};
const SIMON_LEN=[3,5,7];
function startSimon(){if(S.obs.solved){toast("Механізм уже розгадано.");return}if(SIMON.playing)return;SIMON.round=0;newSimonRound()}
function newSimonRound(){SIMON.seq=[];for(let i=0;i<SIMON_LEN[SIMON.round];i++)SIMON.seq.push(rint(0,4));SIMON.input=0;playSimon()}
function flashPillar(i,ms=420){const p=W.pillars[i];p.mesh.material=mat(p.col,"neon");sfx("note",p.note);setTimeout(()=>p.mesh.material=mat(p.col),ms)}
function playSimon(){SIMON.playing=true;toast("Раунд "+(SIMON.round+1)+" з 3: слухай і запам'ятовуй");let k=0;const step=()=>{if(k>=SIMON.seq.length){SIMON.playing=false;toast("Тепер повтори: торкайся кристалів у тому ж порядку");return}flashPillar(SIMON.seq[k]);k++;setTimeout(step,780)};setTimeout(step,700)}
function touchPillar(i){
  if(S.obs.solved){flashPillar(i);return}
  if(SIMON.playing||!SIMON.seq.length){flashPillar(i);if(!SIMON.seq.length)toast("Спершу натисни «Запуск» у центрі.");return}
  flashPillar(i,300);
  if(SIMON.seq[SIMON.input]!==i){sfx("error");SIMON.seq=[];foxSay("Збився! Механізм скинувся. Спробуй знову з першого раунду.");return}
  SIMON.input++;if(SIMON.input>=SIMON.seq.length){SIMON.round++;if(SIMON.round>=3){S.obs.solved=true;SIMON.seq=[];slideOpen(W.archiveDoor,-8.5);earn(1200);toast("Мелодію відтворено! Архів відчинено. +1 200 грн",COL.orange);foxSay("Архів біля обсерваторії відчинився!");checkQuest();save()}else{sfx("ok");setTimeout(newSimonRound,900)}}
}

/* ================= Предмети ================= */
function buyItem(id){
  const it=ITEMBY[id];if(it.type==="tool"&&has(id)){toast("Уже є в інвентарі");return}
  if(!spend(it.price)){toast("Бракує грошей: потрібно "+money(it.price),COL.orange);sfx("error");return}
  S.inv[id]=(S.inv[id]||0)+1;S.itemBuys++;sfx("buy");toast("Куплено: "+it.name,COL.orange);
  if(id==="flashlight"){S.flashlightOn=true;foxSay("Ліхтарик! Вмикай і вимикай клавішею F.")}
  if(id==="metaldetector")foxSay("Металошукач пищатиме біля схованок, яких не видно оком.");
  checkQuest();renderHUD();save();
}
function toggleFlashlight(){if(!has("flashlight")){toast("Немає ліхтарика. Купи в крамниці «Компас».",COL.orange);return}S.flashlightOn=!S.flashlightOn;sfx("click");toast("Ліхтарик "+(S.flashlightOn?"увімкнено":"вимкнено"))}

/* ================= Події ================= */
function startEvent(ev){
  currentEvent=ev;eventEndsAt=performance.now()/1000+EVENT_LEN;
  toast("Подія: "+ev.name+" — "+ev.desc,COL.orange);foxSay(ev.name+"! "+ev.desc[0].toUpperCase()+ev.desc.slice(1)+"!");sfx("event");
  if(ev.id==="quake"){shake=2.5;for(let i=0;i<10;i++)spawnDig()}
  if(ev.id==="chestrain")for(let i=0;i<4;i++)spawnChest();
  if(ev.id==="tourists"&&BUS.state==="away")BUS.timer=Math.min(BUS.timer,3);
  renderHUD();
}
function endEvent(){currentEvent=null;nextEventAt=performance.now()/1000+EVENT_EVERY;renderHUD()}

/* ================= Телепорт додому ================= */
let tpBusy=false;
function freeSpot(p){const tmp=player.pos.clone();for(let r=0;r<12;r+=1.5)for(let a=0;a<6.28;a+=.8){player.pos.set(p.x+Math.cos(a)*r,p.y,p.z+Math.sin(a)*r);if(!colliders.some(cl=>cl.on&&overl(cl.box))){const q=player.pos.clone();player.pos.copy(tmp);return q}}player.pos.copy(tmp);return p.clone()}
function teleport(p,home){
  if(tpBusy)return;tpBusy=true;sfx("teleport");$("fade").classList.add("on");
  setTimeout(()=>{const q=freeSpot(p);player.pos.copy(q);player.vel.set(0,0,0);player.modelY=q.y;companion.pos.copy(q).add(V3(4,0,3));camFollow.copy(q);if(home)camYaw=Math.PI;
    setTimeout(()=>{$("fade").classList.remove("on");tpBusy=false},120)},380);
}
function goHome(){if(modalOpen)closeModal();teleport(W.home,true);toast("Ти вдома, на базі");}
