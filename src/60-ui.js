/* ================= Звук (синтез WebAudio, без файлів) ================= */
let AC=null,muted=false;
function audioInit(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){AC=null}}
function tone(f,d,type,vol,when=0,slide){if(!AC||muted)return;const t=AC.currentTime+when,o=AC.createOscillator(),g=AC.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||.12,t+.012);g.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d+.05)}
function noise(d,vol,freq,when=0){if(!AC||muted)return;const t=AC.currentTime+when,n=AC.createBufferSource(),b=AC.createBuffer(1,Math.floor(AC.sampleRate*d),AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);
  n.buffer=b;const f=AC.createBiquadFilter();f.type="bandpass";f.frequency.value=freq||900;const g=AC.createGain();g.gain.value=vol||.2;n.connect(f).connect(g).connect(AC.destination);n.start(t)}
function sfx(k,arg){if(!AC||muted)return;
  switch(k){
  case"dig":noise(.25,.3,500);noise(.2,.2,300,.15);break;
  case"find":tone(660,.15,"triangle",.12);tone(880,.2,"triangle",.12,.1);break;
  case"rare":[523,659,784,1047].forEach((f,i)=>tone(f,.3,"triangle",.11,i*.08));break;
  case"coin":tone(1318,.09,"square",.04);tone(1760,.14,"square",.035,.06);break;
  case"buy":tone(784,.1,"triangle",.12);tone(1047,.18,"triangle",.12,.08);noise(.08,.08,3000,.02);break;
  case"place":tone(392,.12,"sine",.14);tone(523,.16,"sine",.12,.07);break;
  case"error":tone(220,.18,"sawtooth",.07);tone(196,.22,"sawtooth",.07,.12);break;
  case"ok":tone(587,.12,"triangle",.12);tone(784,.18,"triangle",.12,.09);break;
  case"click":tone(1200,.04,"square",.05);break;
  case"jump":tone(300,.12,"sine",.05,0,520);break;
  case"hurt":tone(180,.25,"sawtooth",.12,0,90);noise(.15,.15,400);break;
  case"heal":[440,554,659].forEach((f,i)=>tone(f,.25,"sine",.1,i*.07));break;
  case"door":noise(1.1,.22,180);tone(80,1,"sawtooth",.05,0,60);break;
  case"break":noise(.6,.4,250);noise(.3,.25,900,.1);break;
  case"bus":tone(392,.35,"square",.05);tone(330,.45,"square",.05,.35);break;
  case"teleport":tone(300,.5,"sine",.1,0,1200);noise(.4,.08,2400);break;
  case"research":[523,659,784,1047,1319].forEach((f,i)=>tone(f,.35,"triangle",.09,i*.07));break;
  case"quest":tone(659,.15,"triangle",.1);tone(988,.3,"triangle",.1,.12);break;
  case"event":tone(523,.2,"square",.05);tone(659,.2,"square",.05,.15);tone(784,.35,"square",.05,.3);break;
  case"note":tone(arg||440,.45,"sine",.16);tone((arg||440)*2,.3,"sine",.04);break;
  case"beep":tone(1500,.05,"square",.04);break;
  // скрині: власні звуки для кожного рівня
  case"chest_rare":tone(440,.12,"triangle",.1);tone(554,.16,"triangle",.1,.08);break;
  case"chest_epic":[330,415,494].forEach((f,i)=>tone(f,.22,"sawtooth",.05,i*.07));noise(.2,.08,1500);break;
  case"chest_legendary":[262,330,392,523].forEach(f=>tone(f,1,"sine",.06));noise(.8,.05,4000,.1);break;
  case"open_rare":tone(523,.15,"triangle",.12);tone(784,.25,"triangle",.12,.1);break;
  case"open_epic":[392,494,587,784,988].forEach((f,i)=>tone(f,.3,"triangle",.1,i*.08));noise(.4,.1,2500,.2);break;
  case"open_legendary":[262,330,392,523,659,784,1047].forEach((f,i)=>tone(f,.6,"triangle",.09,i*.09));[523,659,784].forEach(f=>tone(f,1.6,"sine",.06,.7));noise(1.2,.07,5000,.6);break;
  }}

/* ================= HUD ================= */
function renderHUD(){
  $("kVal").innerHTML="<i>₴</i>&nbsp;"+money(S.money);
  $("rVal").textContent="≈ +"+fmt(ratePerMin())+" грн / хв"+(payMult()>1?"  ·  ×"+String(+payMult().toFixed(2)).replace(".",","):"");
  $("bagVal").textContent=S.unknown+" / "+capacity()+" реліквій";
  $("colVal").textContent="Колекція: "+Object.keys(S.discovered).length+" / "+ART.length+" · Відвідувачів: "+fmt(S.visitors);
  $("qStep").textContent="Завдання "+S.quest+" / "+QUESTS.length;$("qText").textContent=QUESTS[S.quest-1].t;
  $("hearts").innerHTML=Array.from({length:MAX_HP},(_,i)=>`<svg viewBox="0 0 24 24" fill="${i<S.hp?"#D33A2C":"none"}" stroke="#1E5A2B" stroke-width="2"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>`).join("");
  $("compass").hidden=!has("compassItem");
  $("event").hidden=!currentEvent;
  if(modalKind==="upg")renderUpg();if(modalKind==="reb")renderReb();if(modalKind==="store")renderStore();if(modalKind==="inv")renderInv();
}
function renderEventTimer(){if(!currentEvent)return;const left=Math.max(0,Math.ceil(eventEndsAt-performance.now()/1000));$("event").textContent=currentEvent.name.toUpperCase()+" · "+currentEvent.desc+" · "+fmtTime(left)}
const CARD=[["Пн",0],["Пн-Сх",45],["Сх",90],["Пд-Сх",135],["Пд",180],["Пд-Зх",225],["Зх",270],["Пн-Зх",315]];
function renderCompass(){
  if(!has("compassItem"))return;const head=-camYaw;let h="";
  for(const [n,d] of CARD){const rel=angDiff(head,d*DEG);if(Math.abs(rel)>Math.PI/2)continue;h+=`<span class="${n.length>2?"m":""}" style="left:${50+rel/(Math.PI/2)*50}%">${n}</span>`}
  const tg=questTarget();if(tg){const b=Math.atan2(tg.x-player.pos.x,-(tg.z-player.pos.z));const rel=angDiff(head,b);const x=clamp(50+rel/(Math.PI/2)*50,2,98);h+=`<i class="goal" style="left:${x}%"></i>`}
  $("cStrip").innerHTML=h;
}
let beepT=0;
function updateDetectors(dt){
  const det=$("detector");let txt="";
  if(has("metaldetector")){let nd=1e9,ns=null;for(const s of digSpots){if(!s.hidden)continue;const d=s.pos.distanceTo(player.pos);s.g.visible=d<26;if(d<nd){nd=d;ns=s}}
    if(ns&&nd<30){beepT-=dt;if(beepT<=0){sfx("beep");beepT=clamp(nd/14,.12,2)}txt="Металошукач · "+Math.round(nd)+" м"}
    if(!S.crypt.crack&&inCrypt()&&player.pos.distanceTo(V3(404,0,-287))<14)txt="Металошукач: порожнина за стіною!"}
  if(has("treasuredetector")&&!txt){let nd=1e9;for(const ch of chests){const d=ch.pos.distanceTo(player.pos);if(d<nd)nd=d}if(nd<1e9)txt="Найближча скриня · "+Math.round(nd)+" м"}
  det.hidden=!txt;if(txt)det.textContent=txt;
}

/* ================= Карти ================= */
const MAPW=620;let relief=null;
function buildRelief(){
  const N=300,cv=document.createElement("canvas");cv.width=cv.height=N;const x=cv.getContext("2d"),img=x.createImageData(N,N);
  const col=(h,s,pw,road)=>{let c=h<2?[200,226,160]:h<12?[176,212,132]:h<30?[140,190,100]:h<70?[110,165,80]:[150,170,140];if(h>120)c=[222,226,210];c=c.map(v=>v*s);if(pw>0)c=c.map((v,i)=>v*(1-pw)+[226,193,138][i]*pw);if(road>0)c=c.map((v,i)=>v*(1-road)+[94,107,87][i]*road);return c};
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const wx=(i/N*2-1)*MAPW,wz=(j/N*2-1)*MAPW,h=groundH(wx,wz),hx=groundH(wx+4,wz),hz=groundH(wx,wz+4);
    const s=clamp(.82+(-(hx-h)*.06-(hz-h)*.08),.55,1.12);const pw=pathColorW(wx,wz);const cc=col(h,s,pw.path,pw.road);const k=(j*N+i)*4;img.data[k]=cc[0];img.data[k+1]=cc[1];img.data[k+2]=cc[2];img.data[k+3]=255}
  x.putImageData(img,0,0);
  const F=LAY.forest,sx=v=>(v/MAPW+1)/2*N;x.fillStyle="rgba(30,90,43,.22)";x.fillRect(sx(F.x1),sx(F.z1),sx(F.x2)-sx(F.x1),sx(F.z2)-sx(F.z1));
  x.fillStyle="rgba(30,90,43,.75)";for(const [tx,tz] of W.trees){x.beginPath();x.arc(sx(tx),sx(tz),1.5,0,7);x.fill()}
  relief=cv;
}
const PLACES=()=>[
 {n:"Музей і база",x:0,z:150,c:"#D2601A",ic:"home"},{n:"Лабораторія",x:45,z:143,c:"#1E5A2B",ic:"lab"},{n:"Зупинка",x:LAY.stop.x,z:LAY.stop.z,c:"#B04E12",ic:"bus"},
 {n:"Крамниця «Компас»",x:-24,z:-8,c:"#D2601A",ic:"shop"},{n:"Площа",x:0,z:0,c:"#173A1D",ic:"dot"},
 {n:"Піщаний каньйон",x:430,z:0,c:"#B04E12",ic:"dun",done:()=>!!S.secrets.key,diff:"середній"},
 {n:"Затоплений храм",x:-430,z:-20,c:"#4FA3A0",ic:"dun",done:()=>S.temple.solved,diff:"середній"},
 {n:"Темна гробниця",x:415,z:-290,c:"#3F3C36",ic:"dun",done:()=>S.crypt.solved,diff:"складний"},
 {n:"Обсерваторія",x:LAY.obs.x,z:LAY.obs.z,c:"#B8722C",ic:"dun",done:()=>S.obs.solved,diff:"легкий"},
];
function drawMapTo(cv,cx,cz,span,big){
  const x=cv.getContext("2d"),W2=cv.width,H2=cv.height,sc=W2/(span*2),px=v=>(v-cx)*sc+W2/2,pz=v=>(v-cz)*sc+H2/2;
  x.fillStyle="#EEF4DC";x.fillRect(0,0,W2,H2);
  if(relief){const N=relief.width,k=N/(MAPW*2);x.drawImage(relief,(cx-span+MAPW)*k,(cz-span+MAPW)*k,span*2*k,span*2*k,0,0,W2,H2)}
  // будівлі
  x.fillStyle="rgba(23,58,29,.85)";for(const r of [[-24,24,128,158],[30,60,124,162],[-34,-14,-16,0],[-462,-398,-52,12],[358,472,-322,-258],[452,472,-300,-280]]){x.fillRect(px(r[0]),pz(r[2]),(r[1]-r[0])*sc,(r[3]-r[2])*sc)}
  x.strokeStyle="#D2601A";x.lineWidth=Math.max(1,sc*1.2);x.strokeRect(px(-64),pz(114),128*sc,78*sc);
  // скрині (з детектором скарбів)
  if(has("treasuredetector"))for(const ch of chests){x.fillStyle=CHEST_TIERS[ch.tier].glow;x.strokeStyle="#173A1D";x.lineWidth=2;x.beginPath();x.rect(px(ch.pos.x)-5,pz(ch.pos.z)-5,10,10);x.fill();x.stroke()}
  if(BUS.state!=="away"){x.fillStyle="#D2601A";x.fillRect(px(BUS.x-10),pz(BUS.lane-3),20*sc,6*sc)}
  // місця
  const fs=big?14:Math.max(10,W2/32);x.font=`800 ${fs}px Manrope, sans-serif`;x.textAlign="center";
  for(const p of PLACES()){const X=px(p.x),Z=pz(p.z);if(X<-20||Z<-20||X>W2+20||Z>H2+20)continue;
    x.fillStyle=p.c;x.strokeStyle="#FBF8EC";x.lineWidth=3;x.beginPath();if(p.ic==="dun"){x.moveTo(X,Z-9);x.lineTo(X+9,Z+7);x.lineTo(X-9,Z+7);x.closePath()}else x.arc(X,Z,p.ic==="dot"?4:7,0,7);x.fill();x.stroke();
    if(big||p.ic!=="dot"){const t=p.n+(p.done&&p.done()?" ✓":"");x.lineWidth=4;x.strokeStyle="rgba(251,248,236,.9)";x.strokeText(t,X,Z-13);x.fillStyle="#173A1D";x.fillText(t,X,Z-13)}}
  // позначка
  if(S.waypoint){const X=px(S.waypoint[0]),Z=pz(S.waypoint[1]);x.fillStyle="#D33A2C";x.strokeStyle="#FBF8EC";x.lineWidth=3;x.beginPath();x.moveTo(X,Z);x.arc(X,Z-14,8,Math.PI*.8,Math.PI*2.2);x.closePath();x.fill();x.stroke()}
  // гравець
  x.save();x.translate(px(player.pos.x),pz(player.pos.z));x.rotate(-player.face);x.fillStyle="#D2601A";x.strokeStyle="#FBF8EC";x.lineWidth=3;x.beginPath();x.moveTo(0,-12);x.lineTo(8,8);x.lineTo(0,4);x.lineTo(-8,8);x.closePath();x.fill();x.stroke();x.restore();
}
function drawMinimap(){drawMapTo($("map"),player.pos.x,player.pos.z,170,false)}
function openMap(){
  openModal("map",'<span class="pill cap">Карта</span> експедиції',`<div class="mapgrid"><div id="mapWrap"><canvas id="bigmap" width="900" height="900" aria-label="Карта світу. Натисни, щоб поставити позначку"></canvas></div>
  <div class="mapside"><h3>Данжі</h3><ul>${PLACES().filter(p=>p.ic==="dun").map(p=>`<li>${p.n}<b>${p.done()?"пройдено":p.diff}</b></li>`).join("")}</ul>
  <h3>Позначка</h3><p class="lead" style="font-size:13px">Натисни на карту, щоб поставити позначку. Компас покаже до неї напрямок.</p><button class="btn ghost sm" id="clrWp">Прибрати позначку</button>
  <div class="legend"><span><i style="background:#D2601A"></i>Ти</span><span><i style="background:#173A1D"></i>Будівлі</span><span><i style="background:#5E6B57"></i>Дорога</span><span><i style="background:#E2C18A"></i>Стежки</span>${has("treasuredetector")?'<span><i style="background:#FFD34D"></i>Скрині</span>':""}</div></div></div>`);
  const cv=$("bigmap");const draw=()=>{if(modalKind==="map")drawMapTo(cv,0,0,MAPW,true)};draw();
  cv.onclick=e=>{const r=cv.getBoundingClientRect(),wx=((e.clientX-r.left)/r.width*2-1)*MAPW,wz=((e.clientY-r.top)/r.height*2-1)*MAPW;S.waypoint=[wx,wz];sfx("click");draw();save()};
  $("clrWp").onclick=()=>{S.waypoint=null;draw();save()};
  mapTimer=setInterval(draw,500);
}
let mapTimer=0;

/* ================= Модальні вікна ================= */
let modalOpen=false,modalKind=null;
function openModal(kind,title,html){
  clearInterval(mapTimer);modalKind=kind;$("mTitle").innerHTML=title;$("mBody").innerHTML=html;$("modal").hidden=false;modalOpen=true;
  for(const k in keys)keys[k]=false;if(shiftLock&&document.pointerLockElement)document.exitPointerLock();
  setTimeout(()=>$("mClose").focus(),0);
}
function closeModal(){clearInterval(mapTimer);$("modal").hidden=true;modalOpen=false;modalKind=null;canvas.focus();if(shiftLock)setShiftLock(true,true)}
$("mClose").onclick=closeModal;$("modal").addEventListener("pointerdown",e=>{if(e.target.id==="modal")closeModal()});
const svgI=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;

function openCollection(){
  const cards=ART.map(a=>{const f=S.discovered[a.id],n=S.artifacts[a.id]||0,rr=RAR[a.r],dark=f&&(a.r==="legendary"||a.r==="secret");
    return `<article class="card ${dark?"dark":""} ${f?"":"unk"}"><span class="tag">${viewReward(a)} грн</span><img src="${THUMB[f?a.id:a.id+"_sil"]||""}" alt="${f?a.name:"Ще не знайдений артефакт"}"><h3>${f?a.name:"???"}</h3><span class="chip"><i style="background:${rr.color}"></i>${rr.name}</span><span class="n">${f?"У тебе: ×"+n:a.roll?"ще не знайдено":"нагорода данжу"}</span></article>`}).join("");
  openModal("col",'<span class="pill o cap">Колекція</span> артефактів',`<p class="lead">${Object.keys(S.discovered).length} з ${ART.length} знайдено. Ціна на картці — скільки платить один відвідувач за перегляд у вітрині.</p><div class="grid">${cards}</div><div class="foot"><button class="btn o" id="bArr">Розставити найкращі у вітрини</button></div>`);
  $("bArr").onclick=()=>{autoArrange();openCollection()};
}
function renderUpg(){
  $("mBody").innerHTML='<p class="lead">Покращення бази та музею. Гроші заробляють відвідувачі, що приїжджають автобусом.</p><div class="list">'+UPG.map(u=>{const l=S.upgrades[u.id],max=l>=u.max,price=max?0:u.price[l];
    const lv=u.id==="shelves"?"Вітрин: "+l+" / "+u.max:u.id==="lab"?"Столів: "+l+" / "+u.max:"Рівень "+l+" / "+u.max+(u.levels?" · "+u.levels[l-1]:"")+(u.cap?" · "+u.cap[l-1]+" місць":"");
    return `<div class="row"><span class="ic">${svgI(u.icon)}</span><div class="info"><h3>${u.name}</h3><div class="lv">${lv}</div><p>${u.effect}</p></div>${max?'<button class="btn" disabled>Максимум</button>':`<button class="btn o" data-buy="${u.id}" ${S.money<price?"disabled":""}>Купити · ${money(price)}</button>`}</div>`}).join("")+"</div>";
  $("mBody").querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>buyUpg(b.dataset.buy));
}
function openUpg(){openModal("upg",'<span class="pill cap">Покращення</span> бази',"");renderUpg()}
function buyUpg(id){
  const u=UPGBY[id],l=S.upgrades[id];if(l>=u.max)return;const price=u.price[l];
  if(!spend(price)){toast("Бракує грошей: потрібно "+money(price),COL.orange);sfx("error");return}
  S.upgrades[id]=l+1;S.purchases++;sfx("buy");toast(u.name+": рівень "+(l+1)+"!",COL.orange);
  if(id==="shelves")updatePedestals();if(id==="lab")refreshTables();if(id==="bus")updateBillboards();
  checkQuest();renderHUD();renderUpg();save();
}
function updateBillboards(){W.billboards.forEach((b,i)=>b.visible=i<S.upgrades.bus-1)}
let storeCat="Усі";
function renderStore(){
  const cats=["Усі",...new Set(ITEMS.map(i=>i.cat))];
  $("mBody").innerHTML=`<p class="lead">Спорядження для експедицій. Інструменти купуються один раз і лишаються назавжди, витратні предмети можна докуповувати.</p>
  <div class="tabs">${cats.map(c=>`<button aria-pressed="${c===storeCat}" data-cat="${c}">${c}</button>`).join("")}</div>
  <div class="list">${ITEMS.filter(i=>storeCat==="Усі"||i.cat===storeCat).map(i=>{const own=S.inv[i.id]||0;
    return `<div class="row"><span class="ic ${i.type==="consumable"?"o":""}">${svgI(i.icon)}</span><div class="info"><h3>${i.name}</h3><div class="lv">${money(i.price)} · ${i.type==="tool"?"назавжди":"витратний"}</div><p>${i.desc}</p><div class="stats">${i.stats.map(s=>`<span>${s}</span>`).join("")}</div></div>
    ${i.type==="tool"&&own?'<span class="owned">Є в інвентарі</span>':`<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">${own?`<span class="owned">У тебе: ${own}</span>`:""}<button class="btn o" data-item="${i.id}" ${S.money<i.price?"disabled":""}>Купити · ${money(i.price)}</button></div>`}</div>`}).join("")}</div>`;
  $("mBody").querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{storeCat=b.dataset.cat;renderStore()});
  $("mBody").querySelectorAll("[data-item]").forEach(b=>b.onclick=()=>{buyItem(b.dataset.item);renderStore()});
}
function openStore(){openModal("store",'<span class="pill o cap">Крамниця</span> «Компас»',"");renderStore()}
function renderInv(){
  const owned=ITEMS.filter(i=>has(i.id));
  const dung=[["Піщаний каньйон",S.secrets.key],["Затоплений храм",S.temple.solved],["Темна гробниця",S.crypt.solved],["Обсерваторія",S.obs.solved]];
  $("mBody").innerHTML=`<div class="journal">Реліквій у рюкзаку: <b>${S.unknown} / ${capacity()}</b> · Здоров'я: <b>${S.hp} / ${MAX_HP}</b><br>Данжі: ${dung.map(([n,d])=>n+(d?" ✓":" —")).join(" · ")}</div>
  ${owned.length?`<div class="list">${owned.map(i=>`<div class="row"><span class="ic ${i.type==="consumable"?"o":""}">${svgI(i.icon)}</span><div class="info"><h3>${i.name}${i.type==="consumable"?" ×"+S.inv[i.id]:""}</h3><p>${i.desc}</p></div>
    ${i.id==="flashlight"?`<button class="btn ${S.flashlightOn?"o":"ghost"}" id="invFl">${S.flashlightOn?"Вимкнути (F)":"Увімкнути (F)"}</button>`:i.id==="medkit"?`<button class="btn o" id="invMed" ${S.hp>=MAX_HP?"disabled":""}>Використати (Q)</button>`:'<span class="owned">Діє автоматично</span>'}</div>`).join("")}</div>`
  :`<p class="lead">Інвентар порожній. Спорядження продається в крамниці «Компас» на площі.</p><div class="foot"><button class="btn o" id="invStore">Відкрити магазин</button></div>`}`;
  const fl=$("invFl");if(fl)fl.onclick=()=>{toggleFlashlight();renderInv()};const md=$("invMed");if(md)md.onclick=()=>{useMedkit();renderInv()};const st=$("invStore");if(st)st.onclick=openStore;
}
function openInv(){openModal("inv",'<span class="pill cap">Інвентар</span>',"");renderInv()}
function renderReb(){
  const nb=Math.round((S.rebirths+1)*REBIRTH_BONUS*100),ok=S.money>=REBIRTH_COST;
  $("mBody").innerHTML=`<p class="lead">Повністю розвинув музей? Вирушай у нову експедицію. Гроші, покращення й звичайні артефакти скинуться, але відвідувачі назавжди платитимуть на ${nb}% більше. Нагороди данжів, спорядження й відкриття залишаться з тобою.</p>
  <div style="font-weight:800;font-size:14px;font-variant-numeric:tabular-nums">Гроші: ${money(S.money)} / ${money(REBIRTH_COST)}</div><div class="meter"><i style="width:${Math.min(100,S.money/REBIRTH_COST*100).toFixed(1)}%"></i></div>
  <div class="startrow"><button class="btn o big" id="bDoReb" ${ok?"":"disabled"}>Почати заново</button>${S.rebirths?`<span class="stamp cap">Експедицій: ${S.rebirths}</span>`:""}</div>`;
  const b=$("bDoReb");if(b)b.onclick=rebirth;
}
function openReb(){openModal("reb",'<span class="pill cap">Нова</span> експедиція',"");renderReb()}
function rebirth(){
  if(S.money<REBIRTH_COST)return;const keep={};for(const id in S.artifacts)if(ARTBY[id]&&!ARTBY[id].roll)keep[id]=S.artifacts[id];
  Object.assign(S,{artifacts:keep,money:0,unknown:0,upgrades:{tool:1,shelves:2,lab:1,backpack:1,bus:1},placed:["","","","","","","",""],rebirths:S.rebirths+1});
  S.tables.forEach(t=>{t.busy=false;t.end=0});refreshTables();updatePedestals();updateBillboards();renderHUD();save();closeModal();foxSay("Нова експедиція! Відвідувачі тепер платять на "+Math.round(S.rebirths*REBIRTH_BONUS*100)+"% більше.");
}
function showLore(k){
  const T={temple:["«Світло приходить із заходу й шукає кришталь на півночі.","Опусти зайве дзеркало, нахили потрібне — і промінь знайде шлях.","А сова знає, де камінь не тримає стіну.»"]};
  openModal("lore",'<span class="pill cap">Напис</span> на камені',`<div class="journal" style="font-family:var(--f-hand);font-size:24px;line-height:1.25">${T[k].join("<br>")}</div><p class="lead">Дзеркало має три положення: опущене (світло проходить), нахил «/» і нахил «\\». Дивись на мапу підлоги згори: північ — до святилища.</p>`);
}

/* ---- Замки скринь ---- */
function readHint(ch,h){ch.found=ch.found||{};ch.found[h.k]=true;sfx("click");toast("Камінь "+["I","II","III"][h.k]+": "+SYM[ch.clueIdx[h.k]],COL.orange)}
function openChestUI(ch){
  const T=CHEST_TIERS[ch.tier],pz=ch.puzzles[ch.stage],names=ch.tier==="legendary"?["Диски","Код на кришці","Останній замок"]:ch.tier==="epic"?["Загадка","Символи","Ряд"]:["Замок"];
  const stages=`<div class="stages">${names.map((n,i)=>`<span class="${i<ch.stage?"done":i===ch.stage?"cur":""}">${i+1}. ${n}</span>`).join("")}<span>Спроб: ${ch.attempts}</span></div>`;
  let body="";
  if(pz.kind==="opt"){body=`<div class="riddle"><q>${pz.q}</q><div class="opts">${pz.opts.map((o,i)=>`<button class="btn ghost big" data-o="${i}">${o}</button>`).join("")}</div></div>`}
  else if(pz.kind==="num"){let q=pz.q;
    if(pz.legend){q="На кришці викарбувано: "+SYM.map((s,i)=>s+" = "+ch.vals[i]).join(",  ")+". Введи суму значень трьох символів, які стоять на дисках.";pz.ans=ch.clueIdx.reduce((a,i)=>a+ch.vals[i],0)}
    body=`<div class="riddle"><q>${q}</q><div class="display" id="kpD"></div><div class="keypad">${[1,2,3,4,5,6,7,8,9,"⌫",0,"OK"].map(k=>`<button data-k="${k}" aria-label="${k}">${k}</button>`).join("")}</div>${pz.hint&&ch.tier!=="legendary"&&ch.attempts<3?`<p class="lead" style="text-align:center;margin:14px auto 0">${pz.hint}</p>`:""}</div>`}
  else if(pz.kind==="dials"){ch.dials=ch.dials||[0,0,0];const f=ch.found||{};
    body=`<p class="lead">Три диски замка. Правильні символи вибиті на трьох каменях із рунами поруч зі скринею — знайди їх і роздивися.</p>
    <div class="journal">Журнал: ${[0,1,2].map(k=>"Камінь "+["I","II","III"][k]+" — "+(f[k]?SYM[ch.clueIdx[k]]:"не знайдено")).join(" · ")}</div>
    <div class="dials">${ch.dials.map((d,i)=>`<div class="dial"><button class="face" data-d="${i}" aria-label="Диск ${i+1}">${SYM[d]}</button><small>Диск ${["I","II","III"][i]}</small></div>`).join("")}</div><div class="foot"><button class="btn o" id="dialGo">Повернути замок</button></div>`}
  const pick=ch.tier!=="rare"&&has("lockpicks")?`<button class="btn ghost sm" id="usePick">Відмичка: пропустити етап (є ${S.inv.lockpicks})</button>`:"";
  openModal("chest",`<span class="pill ${T.pill} cap">${T.short}</span> скриня`,stages+body+`<div class="err" id="cErr"></div>${pick?`<div class="foot">${pick}</div>`:""}`);
  const fail=()=>{if(!chestAnswer(ch,false))return;$("cErr").textContent="Ні, не те. Залишилось спроб: "+ch.attempts;const sp=$("mBody").querySelector(".stages span:last-child");if(sp)sp.textContent="Спроб: "+ch.attempts};
  $("mBody").querySelectorAll("[data-o]").forEach(b=>b.onclick=()=>{+b.dataset.o===pz.ans?chestAnswer(ch,true):fail()});
  if(pz.kind==="num"){let val="";const D=$("kpD");$("mBody").querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{const k=b.dataset.k;sfx("click");
    if(k==="⌫")val=val.slice(0,-1);else if(k==="OK"){if(!val)return;+val===pz.ans?chestAnswer(ch,true):(fail(),val="")}else if(val.length<5)val+=k;D.textContent=val})}
  if(pz.kind==="dials"){$("mBody").querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{const i=+b.dataset.d;ch.dials[i]=(ch.dials[i]+1)%4;b.textContent=SYM[ch.dials[i]];sfx("click")});
    $("dialGo").onclick=()=>{ch.dials.every((d,i)=>d===ch.clueIdx[i])?chestAnswer(ch,true):fail()}}
  const up=$("usePick");if(up)up.onclick=()=>{S.inv.lockpicks--;toast("Відмичка зламалась, але етап пройдено");chestAnswer(ch,true);save()};
}
