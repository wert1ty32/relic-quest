/* ================= Мініатюри ================= */
const THUMB={};
function makeThumbs(){
  let r;try{r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true})}catch(e){return}
  r.setSize(220,220);r.outputEncoding=THREE.sRGBEncoding;
  const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xffffff,0x9aa080,1.05));const dl=new THREE.DirectionalLight(0xffffff,.6);dl.position.set(-3,6,-5);sc.add(dl);
  const cam=new THREE.PerspectiveCamera(32,1,.1,100);
  const shot=(obj,eye,look,sil)=>{sc.add(obj);cam.position.set(...eye);cam.lookAt(...look);sc.overrideMaterial=sil?mat("ink"):null;r.render(sc,cam);const u=r.domElement.toDataURL("image/png");sc.remove(obj);return u};
  THUMB.fox=shot(foxModel(1),[-4.2,6.4,-11.5],[0,4.2,0]);
  const f2=foxModel(1);f2.children[12].rotation.z=-2.4;f2.children[12].position.set(-2.1,4.6,0);f2.children[13].position.set(-2.9,5.6,0);THUMB.foxWave=shot(f2,[-3.6,5,-13.5],[0,3.8,0]);
  for(const a of ART){THUMB[a.id]=shot(artifactModel(a.id,1),[2.6,3,-6.4],[0,1.15,0]);THUMB[a.id+"_sil"]=shot(artifactModel(a.id,1),[2.6,3,-6.4],[0,1.15,0],true)}
  r.dispose();try{r.forceContextLoss()}catch(e){}
}

/* ================= Керування ================= */
addEventListener("keydown",e=>{
  if(e.code==="Escape"&&modalOpen){closeModal();return}
  if(!started)return;
  if(modalOpen){if(["KeyM","KeyB","KeyI","KeyC","KeyU"].includes(e.code)&&modalKind!=="chest")closeModal();return}
  keys[e.code]=true;
  if(e.code==="Space"){player.jumpBuf=.15;e.preventDefault()}
  if(e.repeat)return;
  if(e.code==="KeyR")setShiftLock(!shiftLock);
  if(e.code==="KeyF")toggleFlashlight();
  if(e.code==="KeyQ")useMedkit();
  if(e.code==="KeyH")goHome();
  if(e.code==="KeyM")openMap();if(e.code==="KeyB")openStore();if(e.code==="KeyI")openInv();if(e.code==="KeyC")openCollection();if(e.code==="KeyU")openUpg();
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();
});
addEventListener("keyup",e=>{keys[e.code]=false});
addEventListener("blur",()=>{for(const k in keys)keys[k]=false});
let drag=null;
canvas.addEventListener("pointerdown",e=>{canvas.focus();audioInit();if(shiftLock&&e.pointerType==="mouse"){if(document.pointerLockElement!==canvas)setShiftLock(true,true);return}drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener("pointermove",e=>{
  if(shiftLock&&e.pointerType==="mouse"){if(document.pointerLockElement===canvas){camYaw-=e.movementX*.0032;camPitch=clamp(camPitch+e.movementY*.0028,.05,1.25)}return}
  if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
  camYaw-=dx*.006;camPitch=clamp(camPitch+dy*.005,.05,1.25)});
canvas.addEventListener("pointerup",e=>{if(drag&&drag.id===e.pointerId)drag=null});
canvas.addEventListener("pointercancel",()=>drag=null);
canvas.addEventListener("contextmenu",e=>e.preventDefault());
canvas.addEventListener("wheel",e=>{camDist=clamp(camDist+e.deltaY*.02,9,50);e.preventDefault()},{passive:false});
const stEl=$("stick"),knob=stEl.querySelector("i");
stEl.addEventListener("pointerdown",e=>{audioInit();stick.id=e.pointerId;stEl.setPointerCapture(e.pointerId);moveStick(e)});
stEl.addEventListener("pointermove",e=>{if(stick.id===e.pointerId)moveStick(e)});
const endStick=()=>{stick.id=null;stick.x=stick.y=0;knob.style.transform=""};
stEl.addEventListener("pointerup",endStick);stEl.addEventListener("pointercancel",endStick);
function moveStick(e){const r=stEl.getBoundingClientRect();let dx=(e.clientX-r.left-r.width/2)/(r.width/2),dy=(e.clientY-r.top-r.height/2)/(r.height/2);const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}stick.x=dx;stick.y=dy;knob.style.transform=`translate(${dx*36}px,${dy*36}px)`}
const tAct=$("tAct");tAct.addEventListener("pointerdown",e=>{touchAct=true;tAct.setPointerCapture(e.pointerId)});["pointerup","pointercancel"].forEach(t=>tAct.addEventListener(t,()=>touchAct=false));
$("tJump").addEventListener("pointerdown",()=>player.jumpBuf=.15);
// меню на телефоні: усі розділи в одному місці
function openMobileMenu(){
  const it=[["Колекція",openCollection,"bCol"],["Магазин",openStore,"bStore"],["Інвентар",openInv,"bInv"],["Покращення",openUpg,"bShop"],["Карта",openMap,"bMap"],["Дім",goHome,"bHome"],["Нова експедиція",openReb,"bReb"]];
  openModal("menu",'<span class="pill cap">Меню</span>',`<div class="mmenu">${it.map(([n,,id],i)=>`<button class="btn ${id==="bStore"||id==="bHome"?"o":id==="bReb"?"ghost":""}" data-m="${i}">${$(id).querySelector("svg").outerHTML}${n}</button>`).join("")}
  <button class="btn ghost" id="mSnd">${muted?"Увімкнути звук":"Вимкнути звук"}</button>${document.fullscreenEnabled?`<button class="btn ghost" id="mFs">${document.fullscreenElement?"Вийти з повного екрана":"На весь екран"}</button>`:""}</div>`);
  $("mBody").querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{const f=it[+b.dataset.m][1];closeModal();f()});
  $("mSnd").onclick=()=>{audioInit();muted=!muted;$("sndWave").style.display=muted?"none":"";closeModal()};
  const fs=$("mFs");if(fs)fs.onclick=()=>{document.fullscreenElement?document.exitFullscreen():goFullscreen();closeModal()};
}
$("tMenu").onclick=()=>{audioInit();openMobileMenu()};
$("quest").addEventListener("click",()=>$("quest").classList.toggle("open"));
// повний екран і горизонтальна орієнтація (де браузер дозволяє)
function goFullscreen(){try{const el=document.documentElement,r=el.requestFullscreen?el.requestFullscreen({navigationUI:"hide"}):null;
  const lock=()=>{try{const o=screen.orientation&&screen.orientation.lock&&screen.orientation.lock("landscape");if(o&&o.catch)o.catch(()=>{})}catch(e){}};
  if(r&&r.then)r.then(lock).catch(()=>{});else lock()}catch(e){}}
$("slock").onclick=()=>setShiftLock(!shiftLock);
$("sound").onclick=()=>{audioInit();muted=!muted;$("sndWave").style.display=muted?"none":"";toast(muted?"Звук вимкнено":"Звук увімкнено")};
$("bCol").onclick=openCollection;$("bShop").onclick=openUpg;$("bStore").onclick=openStore;$("bInv").onclick=openInv;$("bMap").onclick=openMap;$("bHome").onclick=goHome;$("bReb").onclick=openReb;
$("map").onclick=openMap;

/* ================= Головний цикл ================= */
let started=false,last=performance.now(),saveT=0,guideT=0,guideI=0,attract=0,hudT=0;
const companion={pos:new THREE.Vector3(),face:0};
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?74:60;camera.updateProjectionMatrix()}
addEventListener("resize",resize);
const tmpQ=new THREE.Vector3();
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;const t=now/1000;UNI.uTime.value=t;
  if(started){
    if(!modalOpen&&!tpBusy)physics(dt);
    animatePlayer(dt,t);updateCamera(dt);
    updateBus(dt);updateVisitors(dt);updateTables(dt,t);updateInteract(dt);updateDetectors(dt);
    saveT+=dt;if(saveT>8){saveT=0;save()}
    regenT+=dt;if(regenT>40){regenT=0;if(S.hp<MAX_HP){S.hp++;renderHUD()}}
    if(digSpots.length<16&&Math.random()<dt*1.2)spawnDig();
    if(chests.filter(c=>!c.fixed).length<4&&Math.random()<dt/40)spawnChest();
    if(!currentEvent&&t>nextEventAt)startEvent(EVENTS[rint(0,EVENTS.length-1)]);
    if(currentEvent&&t>eventEndsAt)endEvent();
    hudT+=dt;if(hudT>.25){hudT=0;renderEventTimer();renderCompass();$("rVal").textContent="≈ +"+fmt(ratePerMin())+" грн / хв"+(payMult()>1?"  ·  ×"+String(+payMult().toFixed(2)).replace(".",","):"");drawMinimap()}
  }else{attract+=dt*.05;camera.position.set(Math.sin(attract)*110,58,150+Math.cos(attract)*110);camera.lookAt(0,4,140);updateBus(dt);updateVisitors(dt);updateTables(dt,t)}
  // компаньйон-лисичка
  const back=V3(Math.sin(player.face)*6+Math.cos(player.face)*4,0,Math.cos(player.face)*6-Math.sin(player.face)*4);
  const goal=player.pos.clone().add(back);const dist=V3(companion.pos.x-goal.x,0,companion.pos.z-goal.z).length();
  if(dist>60)companion.pos.copy(goal);else{companion.pos.x+=(goal.x-companion.pos.x)*Math.min(1,dt*3);companion.pos.z+=(goal.z-companion.pos.z)*Math.min(1,dt*3)}
  companion.pos.y+=(Math.max(floorAt(companion.pos.x,companion.pos.z),player.pos.y-6)-companion.pos.y)*Math.min(1,dt*10);if(inDark()||player.pos.y>groundH(player.pos.x,player.pos.z)+2)companion.pos.y+=(player.pos.y-companion.pos.y)*Math.min(1,dt*10);
  if(dist>.6)companion.face+=angDiff(companion.face,Math.atan2(-(goal.x-companion.pos.x),-(goal.z-companion.pos.z)))*Math.min(1,dt*8);
  W.buddy.position.set(companion.pos.x,companion.pos.y+Math.abs(Math.sin(t*6))*(dist>1?.45:.06),companion.pos.z);W.buddy.rotation.y=companion.face;
  // анімації світу
  for(const s of digSpots)if(s.g.visible)s.sp.forEach((m,i)=>{const a=t*1.8+m.userData.ph;m.position.set(Math.cos(a)*1.6,3+Math.sin(t*3+i)*.6,Math.sin(a)*1.6);m.rotation.set(t,t*1.3,0)});
  for(const ch of chests){ch.sp.forEach((m,i)=>{const a=t*1.4+m.userData.ph;m.position.set(Math.cos(a)*2.4,4+Math.sin(t*2+i)*.8,Math.sin(a)*2.4)});if(ch.g.userData.ring)ch.g.userData.ring.rotation.y=t*.8;if(ch.g.userData.beam)ch.g.userData.beam.material.opacity=.2+Math.sin(t*2)*.08}
  for(let i=fallingRocks.length-1;i>=0;i--){const r=fallingRocks[i];r.v-=90*dt;r.m.position.y=Math.max(2.8,r.m.position.y+r.v*dt);r.life-=dt;if(r.life<=0){scene.remove(r.m);fallingRocks.splice(i,1)}}
  for(let i=doors.length-1;i>=0;i--){const d=doors[i];d.t=Math.min(1,d.t+dt*.7);d.m.position.y=d.from+d.dy*(d.t*d.t*(3-2*d.t));if(d.t>=1){d.m.visible=false;doors.splice(i,1)}}
  for(const s of W.spikes){const up=((t+s.ph)%3)<1.2;s.up=up;s.g.position.y+=((up?1.2:-.4)-s.g.position.y)*Math.min(1,dt*14)}
  W.fire.scale.set(1+Math.sin(t*11)*.12,1+Math.sin(t*7)*.2,1+Math.cos(t*9)*.12);W.flag.rotation.y=Math.sin(t*2.2)*.25;W.flag.position.x=-23+Math.sin(t*2.2)*.4;
  W.armillary.children.forEach((r,i)=>{if(r.isGroup){r.rotation.x+=dt*(.2+i*.15);r.rotation.y+=dt*(.3-i*.1)}});W.fountain.position.y=7+Math.sin(t*3)*.4;
  W.guide.position.y=.4+Math.abs(Math.sin(t*2))*.15;guideT+=dt;if(guideT>6){guideT=0;guideI=(guideI+1)%FOXLINES.length;W.guideLabel.el.textContent=FOXLINES[guideI]}
  W.merchant.userData.head.rotation.y=Math.sin(t*.7)*.4;
  // комахи й птахи (оновлюємо лише ближніх)
  for(const b of W.butterflies){if(b.home.distanceTo(player.pos)>160){b.g.visible=false;continue}b.g.visible=true;const a=t*b.sp+b.ph;b.g.position.set(b.home.x+Math.cos(a)*4+Math.sin(a*2.3)*1.5,b.home.y+1.5+Math.sin(a*3)*1.2,b.home.z+Math.sin(a)*4);b.g.rotation.y=-a;const f=Math.sin(t*18+b.ph)*1.1;b.l.rotation.y=f;b.r.rotation.y=-f}
  for(const b of W.birds){const a=t*b.sp+b.off;b.g.position.set(b.cx+Math.cos(a)*b.r,b.h+Math.sin(t*.6+b.ph)*3,b.cz+Math.sin(a)*b.r);b.g.rotation.y=-a+(b.sp>0?0:Math.PI);const f=Math.sin(t*7+b.ph)*.7;b.L.rotation.z=f;b.R.rotation.z=-f}
  {const ps=W.gnats.geometry.attributes.position,sd=W.gnats.userData.seeds,cx=player.pos.x,cy=player.pos.y,cz=player.pos.z;for(let i=0;i<sd.length;i++){const s=sd[i],r=6+s[3]*14;ps.setXYZ(i,cx+Math.cos(t*.5*s[2]+s[0])*r,cy+3+Math.sin(t*s[2]+s[1])*2.5+s[3]*4,cz+Math.sin(t*.4*s[2]+s[1])*r)}ps.needsUpdate=true;W.gnats.material.opacity=inDark()?0:.5+nightK*.5;W.gnats.material.color.set(nightK>.5?"#FFF3A0":"#E8E2B0")}
  updateLighting(dt,t);
  W.sky.position.copy(camera.position);W.stars.position.copy(camera.position);
  renderer.render(scene,camera);
  if(started)updateLabels();
  requestAnimationFrame(loop);
}

/* ================= Старт ================= */
function step(fn){return new Promise(r=>requestAnimationFrame(()=>{fn();r()}))}
async function boot(hotData){
  const saved=(hotData&&hotData.save)||loadSave();
  if(saved)S=saved;ensurePuzzle();
  await loadLogoTexture();
  await step(()=>{makeTextures();buildHeightGrid()});
  await step(buildWorld);
  await step(()=>{
    player.model=personModel({explorer:true,shirt:"#E9C27F"});scene.add(player.model);buildPlayerTorch();
    W.buddy=foxModel(.62);scene.add(W.buddy);buildBus();
    const sg=new THREE.BufferGeometry(),sp=[];for(let i=0;i<1200;i++){const v=new THREE.Vector3(Math.random()-.5,Math.random()*.9+.08,Math.random()-.5).normalize().multiplyScalar(3200);sp.push(v.x,v.y,v.z)}
    sg.setAttribute("position",new THREE.Float32BufferAttribute(sp,3));W.stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xfff6dc,size:2.2,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}));scene.add(W.stars);
    // відновлюємо стан данжів
    if(S.socket)setSocketLit();refreshTiles();if(S.secrets.canyon)slideOpen(W.door,-9,true);
    drawBeam();if(S.temple.solved)slideOpen(W.sanctumDoor,-10.5,true);if(S.temple.secret){slideOpen(W.secretPanel,-8,true);W.looseBrick.visible=false}
    if(!S.temple.taken)W.altarHolder.add(artifactModel("mirror",1.6));
    if(S.temple.secret&&!S.fixed.temple)spawnChest("epic","temple",W.secretChestPos);
    if(S.crypt.solved)slideOpen(W.tombDoor,-11,true);if(S.crypt.rope)W.rope.visible=true;if(S.crypt.crack){W.crackWall.visible=false;W.crackWall.userData.col.on=false}
    if(S.crypt.solved)W.glyphs.forEach(g=>g.mesh.material=mat("#7FD3FF","neon"));
    if(!S.crypt.taken)W.tombHolder.add(artifactModel("shadowmask",1.6));if(!S.crypt.ledge)W.ledgeItem.add(artifactModel("scarab",1.4));
    W.crackLootG=new THREE.Group();W.crackLootG.position.copy(W.crackRoom);scene.add(W.crackLootG);if(!S.crypt.crackLoot)for(let i=0;i<6;i++)box(W.crackLootG,[1,.4,1],[(i%3-1)*1.2,.2+Math.floor(i/3)*.4,0],"gold",{m:"metal",dyn:true});
    if(!S.fixed.crypt)spawnChest("legendary","crypt",W.cryptChestPos,[V3(414,1,-264),V3(446,1,-316),V3(446,1,-262)]);
    if(S.obs.solved)slideOpen(W.archiveDoor,-8.5,true);if(!S.obs.taken)W.archiveHolder.add(artifactModel("astrolabe",1.5));
    if(!S.fixed.obs)spawnChest("epic","obs",W.archiveChestPos);
    refreshTables();updatePedestals();updateBillboards();
  });
  await step(()=>{const r=mergeStatic(scene);console.log("merged",r);buildRelief()});
  await step(()=>{
    for(let i=0;i<14;i++)spawnDig();for(let i=0;i<3;i++)spawnChest();
    player.pos.copy(W.home);player.modelY=player.pos.y;camFollow.copy(player.pos);companion.pos.copy(W.home).add(V3(5,0,-3));
    nextEventAt=performance.now()/1000+EVENT_EVERY;
    makeThumbs();$("qFox").src=THUMB.fox||"";$("stFox").src=THUMB.foxWave||"";
    document.querySelectorAll(".logoImg").forEach(i=>i.src=LOGO_URL);
    if(matchMedia("(pointer:coarse)").matches)$("touchKeys").hidden=false;
    if(matchMedia("(pointer:coarse)").matches&&document.fullscreenEnabled)$("bFull").hidden=false;
    const b=$("bStart");b.disabled=false;b.textContent=saved&&saved.started?"Продовжити експедицію":"Почати експедицію";if(saved&&saved.started)$("bReset").hidden=false;
    renderHUD();resize();drawMinimap();requestAnimationFrame(loop);
    window.claude?.hot?.snapshot?.(()=>({save:S}));
  });
}
let resetArmed=false;
$("bReset").onclick=()=>{if(!resetArmed){resetArmed=true;$("bReset").textContent="Точно? Натисни ще раз";return}
  try{localStorage.removeItem(SAVE_KEY)}catch(e){}location.reload()};
$("bFull").onclick=()=>{goFullscreen();$("bStart").click()};
$("bStart").onclick=()=>{
  audioInit();$("start").hidden=true;started=true;S.started=true;save();canvas.focus();camYaw=Math.PI;
  setTimeout(()=>foxSay(S.quest===1?"Привіт! Я піду з тобою. "+QUESTS[0].t:QUESTS[S.quest-1].t),400);
};
addEventListener("visibilitychange",()=>{if(document.hidden)save()});
addEventListener("pagehide",save);
const startAll=()=>{const hot=window.claude?.hot;hot?.ready?hot.ready(boot):boot(hot?.data??{})};
const fontsReady=document.fonts?Promise.race([document.fonts.load('800 40px "Unbounded"'),new Promise(r=>setTimeout(r,2500))]):Promise.resolve();
fontsReady.then(startAll,startAll);
