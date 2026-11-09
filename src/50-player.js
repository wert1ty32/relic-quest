/* ================= Гравець: рух, камера, Shift Lock ================= */
const player={pos:new THREE.Vector3(),vel:new THREE.Vector3(),onGround:true,face:0,model:null,walk:0,modelY:0,coyote:0,jumpBuf:0,runBlend:0,support:"ground"};
const PR=1.1,PH=7.2,STEP=1.4;
const WALK=16,RUN=30,ACC=60,DEC=75,AIR=.35,GRAV=95,JUMP=36;
const keys={};let runToggle=false;
let camYaw=Math.PI,camPitch=.46,camDist=24,camDistCur=24,shake=0,shiftLock=false;
const camFollow=new THREE.Vector3();
const stick={x:0,y:0,id:null};
const pBox=new THREE.Box3(),tmpV=new THREE.Vector3();
function playerBox(){pBox.min.set(player.pos.x-PR,player.pos.y,player.pos.z-PR);pBox.max.set(player.pos.x+PR,player.pos.y+PH,player.pos.z+PR);return pBox}
function overl(b){const p=playerBox();return p.min.x<b.max.x-1e-4&&p.max.x>b.min.x+1e-4&&p.min.y<b.max.y-1e-3&&p.max.y>b.min.y+1e-3&&p.min.z<b.max.z-1e-4&&p.max.z>b.min.z+1e-4}
const angDiff=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
let near=[];
function physics(dt){
  // ввід відносно камери
  let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+stick.x;
  let iz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+stick.y;
  let mag=Math.hypot(ix,iz);if(mag>1){ix/=mag;iz/=mag;mag=1}
  const running=(keys.ShiftLeft||keys.ShiftRight||runToggle)&&mag>.1;
  player.runBlend+=((running?1:0)-player.runBlend)*Math.min(1,dt*4);
  const sp=(WALK+(RUN-WALK)*player.runBlend)*mag;
  const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),rx=Math.cos(camYaw),rz=-Math.sin(camYaw);
  let tx=(rx*ix-fx*iz),tz=(rz*ix-fz*iz);const tl=Math.hypot(tx,tz);if(tl>0){tx=tx/tl*sp;tz=tz/tl*sp}
  // плавне прискорення та гальмування
  const cur=Math.hypot(player.vel.x,player.vel.z),want=Math.hypot(tx,tz);
  let a=(want>cur?ACC:DEC)*(player.onGround?1:AIR);const dx=tx-player.vel.x,dz=tz-player.vel.z,dl=Math.hypot(dx,dz);
  if(dl>0){const st=Math.min(dl,a*dt);player.vel.x+=dx/dl*st;player.vel.z+=dz/dl*st}
  const hs=Math.hypot(player.vel.x,player.vel.z);
  // поворот персонажа
  let goal=player.face;if(shiftLock)goal=camYaw;else if(hs>1.2)goal=Math.atan2(-player.vel.x,-player.vel.z);
  player.face+=angDiff(player.face,goal)*Math.min(1,dt*(shiftLock?16:10));
  player.walk+=dt*(hs*.34);
  // стрибок: «койот»-час і буфер
  player.coyote=player.onGround?.12:Math.max(0,player.coyote-dt);player.jumpBuf=Math.max(0,player.jumpBuf-dt);
  if(player.jumpBuf>0&&player.coyote>0){player.vel.y=JUMP;player.onGround=false;player.coyote=0;player.jumpBuf=0;sfx("jump")}
  player.vel.y-=GRAV*dt;if(player.vel.y<-120)player.vel.y=-120;
  near=colliders.filter(cl=>cl.on&&cl.box.max.x>player.pos.x-30&&cl.box.min.x<player.pos.x+30&&cl.box.max.z>player.pos.z-30&&cl.box.min.z<player.pos.z+30);
  const ox=player.pos.x,oz=player.pos.z,gOld=groundH(ox,oz);
  for(const ax of["x","z"]){
    player.pos[ax]+=player.vel[ax]*dt;
    for(const cl of near){if(!overl(cl.box))continue;const b=cl.box;
      if(b.max.y-player.pos.y<=STEP&&player.onGround){const oy=player.pos.y;player.pos.y=b.max.y;if(!near.some(o=>o!==cl&&overl(o.box)))continue;player.pos.y=oy}
      if(player.vel[ax]>0)player.pos[ax]=b.min[ax]-PR-1e-3;else player.pos[ax]=b.max[ax]+PR+1e-3;player.vel[ax]=0;
    }
  }
  // надто крутий схил — не пускає
  const gNew=groundH(player.pos.x,player.pos.z),moved=Math.hypot(player.pos.x-ox,player.pos.z-oz);
  if(moved>.001&&player.pos.y<=gOld+.3&&(gNew-gOld)/moved>1.25){player.pos.x=ox;player.pos.z=oz}
  const prevY=player.pos.y,wasGround=player.onGround;player.pos.y+=player.vel.y*dt;player.onGround=false;let onBox=false;
  for(const cl of near){if(!overl(cl.box))continue;const b=cl.box;
    if(player.vel.y<=0&&prevY>=b.max.y-STEP){player.pos.y=b.max.y;player.vel.y=0;player.onGround=true;onBox=true}
    else if(player.vel.y>0){player.pos.y=b.min.y-PH-1e-3;player.vel.y=0}}
  const g=groundH(player.pos.x,player.pos.z);
  if(player.pos.y<=g){player.pos.y=g;player.vel.y=Math.max(0,player.vel.y);player.onGround=true}
  else if(!onBox&&wasGround&&player.vel.y<=0&&player.pos.y-g<1.6){
    // перевіряємо, чи під ногами немає опори-коробки (щоб не «прилипати» крізь платформи)
    let sup=false;for(const cl of near){const b=cl.box;if(player.pos.x>b.min.x-PR&&player.pos.x<b.max.x+PR&&player.pos.z>b.min.z-PR&&player.pos.z<b.max.z+PR&&Math.abs(b.max.y-prevY)<.05){sup=true;break}}
    if(!sup){player.pos.y=g;player.vel.y=0;player.onGround=true}}
  if(player.pos.y<-40){player.pos.copy(W.home)}
  if(hurtCD>0)hurtCD-=dt;
  checkTraps();
}
const ray=new THREE.Ray();
function updateCamera(dt){
  camFollow.lerp(player.pos,Math.min(1,dt*14));
  const target=tmpV.set(camFollow.x,player.modelY+5.6,camFollow.z);
  if(shiftLock){target.x+=Math.cos(camYaw)*2.4;target.z-=Math.sin(camYaw)*2.4}
  const dir=new THREE.Vector3(Math.sin(camYaw)*Math.cos(camPitch),Math.sin(camPitch),Math.cos(camYaw)*Math.cos(camPitch));
  let d=camDist;ray.set(target,dir);const hit=new THREE.Vector3();
  for(const cl of near){if(cl.box.containsPoint(target))continue;if(ray.intersectBox(cl.box,hit)){const h=hit.distanceTo(target);if(h<d)d=Math.max(3.5,h-.8)}}
  // камера не опускається під рельєф
  camDistCur+=(d-camDistCur)*Math.min(1,dt*(d<camDistCur?18:4));
  camera.position.copy(target).addScaledVector(dir,camDistCur);
  const gh=groundH(camera.position.x,camera.position.z)+1.5;if(camera.position.y<gh)camera.position.y=gh;
  if(shake>0){shake-=dt;const a=Math.min(1,shake)*.9;camera.position.x+=(Math.random()-.5)*a;camera.position.y+=(Math.random()-.5)*a}
  camera.lookAt(target);
  sun.position.set(player.pos.x-130,player.pos.y+220,player.pos.z+90);sun.target.position.set(player.pos.x,player.pos.y,player.pos.z);
}
function animatePlayer(dt,t){
  const pm=player.model;player.modelY+=(player.pos.y-player.modelY)*Math.min(1,dt*20);if(Math.abs(player.pos.y-player.modelY)>6)player.modelY=player.pos.y;
  pm.position.set(player.pos.x,player.modelY,player.pos.z);pm.rotation.y=player.face;
  const hs=Math.hypot(player.vel.x,player.vel.z),amp=Math.min(1,hs/10)*(.55+.4*player.runBlend),f=1.6+player.runBlend*.5;
  const sw=Math.sin(player.walk*f)*amp,u=pm.userData;
  u.legL.rotation.x=sw;u.legR.rotation.x=-sw;u.armL.rotation.x=-sw*.9;u.armR.rotation.x=sw*.9;
  u.body.rotation.x=-.12*player.runBlend*Math.min(1,hs/20);u.body.position.y=Math.abs(Math.sin(player.walk*f))*.18*amp+(hs<1?Math.sin(t*2)*.04:0);
  if(!player.onGround){u.legL.rotation.x=-.5;u.legR.rotation.x=.3;u.armL.rotation.x=-2.4;u.armR.rotation.x=-2.4}
  if(player.torch&&player.torch.g.visible)u.armR.rotation.x=-1.25+Math.sin(t*2)*.05;
}
function setShiftLock(on,silent){
  shiftLock=on;$("slock").classList.toggle("on",on);$("slock").setAttribute("aria-pressed",String(on));$("crosshair").hidden=!on;
  if(on){try{const r=canvas.requestPointerLock&&canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(e){}if(!silent){toast("Shift Lock увімкнено · R щоб вимкнути");sfx("click")}}
  else if(document.pointerLockElement===canvas)document.exitPointerLock();
}
document.addEventListener("pointerlockchange",()=>{if(document.pointerLockElement!==canvas&&shiftLock&&lockWasOn&&!modalOpen)setShiftLock(false);lockWasOn=document.pointerLockElement===canvas});
let lockWasOn=false;

/* ================= Взаємодії ================= */
function interactables(){
  const L=[],pp=player.pos;const nearP=(p,r)=>Math.abs(p.x-pp.x)<r+4&&Math.abs(p.z-pp.z)<r+4;
  for(const s of digSpots){if(s.hidden&&!(has("metaldetector")&&s.g.visible))continue;if(nearP(s.pos,7))L.push({pos:s.pos.clone().setY(s.pos.y+2),r:7,text:s.hidden?"Копати схованку":"Копати",obj:s.hidden?"Металошукач пищить!":"Підозріле місце",hold:digDuration(),run:()=>dig(s)})}
  for(const ch of chests){if(nearP(ch.pos,8))L.push({pos:ch.pos.clone().setY(ch.pos.y+3),r:8,text:"Розгадати замок",obj:CHEST_TIERS[ch.tier].name,hold:.3,run:()=>chestInteract(ch)});
    if(ch.hints)ch.hints.forEach(h=>{if(nearP(h.pos,6))L.push({pos:h.pos,r:6,text:"Роздивитися знаки",obj:"Камінь з рунами",hold:.6,run:()=>readHint(ch,h)})})}
  if(nearP(W.shopCounter,8))L.push({pos:W.shopCounter,r:9,text:"Відкрити магазин",obj:"Крамниця «Компас»",hold:0,run:openStore});
  W.tables.forEach((w,i)=>{if(nearP(w.pos,6)){const t=S.tables[i];L.push({pos:w.pos,r:6.5,text:i>=S.upgrades.lab?"Стіл не куплено":t.busy?"Перевірити дослідження":"Покласти реліквію",obj:"Дослідницький стіл "+(i+1)+" · у рюкзаку "+S.unknown,hold:t.busy||i>=S.upgrades.lab?0:.8,run:()=>tableAction(i)})}});
  W.pedestals.forEach((p,k)=>{if(nearP(p.pos,6))L.push({pos:p.pos,r:6.5,text:k<S.upgrades.shelves?"Виставити артефакт":"Вітрина не куплена",obj:"Вітрина "+(k+1),hold:0,run:()=>k<S.upgrades.shelves?placeBest(k):toast("Купи ще одну вітрину в «Покращеннях»!",COL.orange)})});
  // каньйон
  W.tiles.forEach((t,i)=>{if(nearP(t.pos,12))L.push({pos:t.pos,r:12,text:"Повернути плиту",obj:"Плита "+(i+1),hold:0,run:()=>rotateTile(i)})});
  if(nearP(W.socketPos,8))L.push({pos:W.socketPos,r:8,text:"Вставити Дивний камінь",obj:"Гніздо",hold:.4,run:useSocket});
  if(S.secrets.canyon&&pp.x>W.roomMinX&&nearP(W.ancient,8))L.push({pos:W.ancient,r:8,text:"Відкрити скриню",obj:"Скриня предків",hold:1,run:openAncient});
  // храм
  W.mirrors.forEach((m,k)=>{if(nearP(m.pos,6))L.push({pos:m.pos,r:6,text:"Повернути дзеркало",obj:["Опущене","Нахил «/»","Нахил «\\»"][S.temple.mirrors[k]],hold:0,run:()=>rotateMirror(k)})});
  if(nearP(W.templeHint,7))L.push({pos:W.templeHint,r:7,text:"Прочитати напис",obj:"Табличка храму",hold:0,run:()=>showLore("temple")});
  if(!S.temple.secret&&nearP(V3(-438,4,9),5))L.push({pos:V3(-438,5,9),r:5,text:"Натиснути на камінь",obj:"Камінь іншого кольору",hold:.6,run:pressLooseBrick});
  if(S.temple.solved&&!S.temple.taken&&nearP(W.altarPos,7))L.push({pos:W.altarPos,r:7,text:"Взяти Дзеркало жриці",obj:"Вівтар святилища",hold:.8,run:()=>{S.temple.taken=true;W.altarHolder.clear();addArtifact("mirror")}});
  // гробниця
  W.glyphs.forEach((g,k)=>{if(nearP(g.pos,6))L.push({pos:g.pos,r:6,text:"Торкнутися гліфа "+g.sym,obj:"Гліф",hold:0,run:()=>touchGlyph(k)})});
  if(nearP(W.ledgeBase,6)&&pp.y<4)L.push({pos:W.ledgeBase.clone().setY(4),r:6,text:S.crypt.rope?"Піднятися мотузкою":"Закинути мотузку",obj:"Високий уступ",hold:.6,run:useRope});
  if(!S.crypt.ledge&&nearP(W.ledgeItem.position,6)&&pp.y>8)L.push({pos:W.ledgeItem.position,r:6,text:"Забрати знахідку",obj:"Схованка на уступі",hold:.6,run:()=>{S.crypt.ledge=true;W.ledgeItem.clear();earn(800);addArtifact("scarab");toast("+800 грн",COL.orange)}});
  if(!S.crypt.crack&&nearP(V3(404,3,-287),6))L.push({pos:V3(404,4,-287),r:6,text:has("metaldetector")?"Розбити тріснуту стіну":"Оглянути стіну",obj:has("metaldetector")?"За стіною порожнина":"Тріснута кладка",hold:has("metaldetector")?1.2:0,run:breakCrack});
  if(S.crypt.crack&&!S.crypt.crackLoot&&nearP(W.crackRoom,6))L.push({pos:W.crackRoom.clone().setY(3),r:6,text:"Забрати скарб",obj:"Таємна схованка",hold:.6,run:()=>{S.crypt.crackLoot=true;W.crackLootG&&W.crackLootG.clear();earn(2500);toast("+2 500 грн",COL.orange);addArtifact(roll(luck()+4,3))}});
  if(S.crypt.solved&&!S.crypt.taken&&nearP(W.tombAltar,7))L.push({pos:W.tombAltar,r:7,text:"Взяти Маску Тіні",obj:"Вівтар скарбниці",hold:.8,run:()=>{S.crypt.taken=true;W.tombHolder.clear();addArtifact("shadowmask")}});
  // обсерваторія
  if(nearP(W.obsStart,6))L.push({pos:W.obsStart,r:6,text:S.obs.solved?"Механізм розгадано":"Запуск механізму",obj:"Армілярна сфера",hold:0,run:startSimon});
  W.pillars.forEach((p,i)=>{if(nearP(p.pos,5.5))L.push({pos:p.pos,r:5.5,text:"Торкнутися кристала",obj:"Кристал "+(i+1),hold:0,run:()=>touchPillar(i)})});
  if(S.obs.solved&&!S.obs.taken&&nearP(W.archivePos,6))L.push({pos:W.archivePos,r:6,text:"Взяти Зоряну астролябію",obj:"Архів",hold:.8,run:()=>{S.obs.taken=true;W.archiveHolder.clear();addArtifact("astrolabe")}});
  return L;
}
let target=null,holdT=0,needRelease=false,touchAct=false;
const actHeld=()=>!!(keys.KeyE||touchAct);
function updateInteract(dt){
  const c0=tmpV.set(player.pos.x,player.pos.y+3,player.pos.z);let best=null,bd=1e9;
  if(!modalOpen&&!tpBusy)for(const it of interactables()){const d=it.pos.distanceTo(c0);if(d<it.r&&d<bd){bd=d;best=it}}
  const pr=$("prompt");
  if(!best){pr.hidden=true;target=null;holdT=0;return}
  if(!target||target.text!==best.text||!target.pos.equals(best.pos))holdT=0;
  target=best;$("pText").textContent=best.text;$("pObj").textContent=best.obj;
  if(!actHeld())needRelease=false;
  if(actHeld()&&!needRelease){holdT+=dt;if(holdT>=best.hold){holdT=0;needRelease=true;best.run()}}else holdT=0;
  const f=best.hold>0?Math.min(1,holdT/best.hold):0;$("pRing").setAttribute("stroke-dasharray",(f*125.7).toFixed(1)+" 200");
  const v=best.pos.clone().add(V3(0,3,0)).project(camera);
  if(v.z>1){pr.hidden=true;return}
  pr.hidden=false;pr.style.left=((v.x+1)/2*innerWidth)+"px";pr.style.top=((1-v.y)/2*innerHeight)+"px";
}
function updateLabels(){
  for(const L of labels){if(L.off){L.el.style.display="none";continue}const d=L.pos.distanceTo(camera.position);const v=L.pos.clone().project(camera);
    if(d>L.max||v.z>1||Math.abs(v.x)>1.2||Math.abs(v.y)>1.2){L.el.style.display="none";continue}
    L.el.style.display="";L.el.style.left=((v.x+1)/2*innerWidth)+"px";L.el.style.top=((1-v.y)/2*innerHeight)+"px";if(!L.el.classList.contains("cash"))L.el.style.opacity=Math.min(1,(L.max-d)/12)}
}

/* ================= Світло: ніч, темрява гробниці, ліхтарик ================= */
const flashlight=new THREE.SpotLight(0xfff2d0,0,48,Math.PI/6,.45,1.2);scene.add(flashlight);scene.add(flashlight.target);
let nightK=0,darkK=0;
const inCrypt=()=>player.pos.x>CRYPT.x0&&player.pos.x<CRYPT.x1&&player.pos.z>CRYPT.z0&&player.pos.z<CRYPT.z1&&player.pos.y<14;
const inDark=()=>inCrypt()||inCave();
// факел у руці героя: з'являється в темних місцях, тепле мерехтливе світло
const torchLight=new THREE.PointLight(0xff9a3c,0,44,1.5);scene.add(torchLight);let torchK=0;
function buildPlayerTorch(){const u=player.model.userData,g=new THREE.Group();g.position.set(0,-2.1,-.3);u.armR.add(g);
  box(g,[.32,2.6,.32],[0,-.4,0],"wood",{dyn:true});box(g,[.5,.5,.5],[0,-1.6,0],"ink",{dyn:true});const f=box(g,[.75,1.1,.75],[0,-2.2,0],"orange",{m:"neon",dyn:true});const f2=box(g,[.4,.7,.4],[0,-2.75,0],"#FFD27A",{m:"neon",dyn:true});
  g.visible=false;player.torch={g,f,f2};}
function updateLighting(dt,t){
  const night=currentEvent&&currentEvent.id==="starnight"?1:0,dark=inDark()?1:0;
  nightK+=(night-nightK)*Math.min(1,dt*1.2);darkK+=(dark-darkK)*Math.min(1,dt*2.5);
  const dimSky=Math.max(nightK*.75,darkK*.92);
  scene.background.copy(SKY_DAY).lerp(SKY_NIGHT,nightK).lerp(SKY_DARK,darkK);
  scene.fog.color.copy(FOG_DAY).lerp(SKY_NIGHT,nightK).lerp(SKY_DARK,darkK);scene.fog.near=260-200*darkK;scene.fog.far=1250-1150*darkK;
  hemi.intensity=.9-.55*nightK-.82*darkK;sun.intensity=.9-.7*nightK-.88*darkK;
  const skyTint=1-dimSky;W.sky.material.color.setScalar(skyTint*.95+.05);W.mountains.children.forEach(m=>m.material.color.setScalar(1-dimSky*.8));
  W.stars.material.opacity=nightK*(1-darkK);
  const flOn=has("flashlight")&&S.flashlightOn;flashlight.intensity=flOn?(1.4+darkK*1.4+nightK*.6):0;
  const dir=new THREE.Vector3(-Math.sin(player.face),-.18,-Math.cos(player.face));flashlight.position.set(player.pos.x,player.modelY+5.4,player.pos.z);flashlight.target.position.copy(flashlight.position).addScaledVector(dir,10);
  W.murals.forEach(g=>g.visible=flOn);
  // факел героя
  torchK+=((dark?1:0)-torchK)*Math.min(1,dt*3);const tOn=torchK>.05;if(player.torch){player.torch.g.visible=tOn;const fl=1+Math.sin(t*17)*.08+Math.sin(t*29)*.05;player.torch.f.scale.set(fl,1.1-(fl-1)*2,fl);player.torch.f2.scale.setScalar(fl)}
  if(tOn&&player.torch){player.torch.f.getWorldPosition(torchLight.position);torchLight.position.y+=.6}
  torchLight.intensity=tOn?torchK*(1.6+Math.sin(t*13)*.18+Math.sin(t*7.3)*.14+Math.random()*.06):0;
  if(W.guideTorch){const k=1.45+Math.sin(t*11)*.15+Math.sin(t*6.3)*.12;W.guideTorch.light.intensity=k;W.guideTorch.flame.scale.set(1+Math.sin(t*15)*.1,1+Math.sin(t*9)*.15,1)}
  for(const r of W.roofs){const inside=player.pos.x>r.x0&&player.pos.x<r.x1&&player.pos.z>r.z0&&player.pos.z<r.z1&&player.pos.y<r.top;r.g.visible=!inside}
  W.fireLight.intensity=.7+Math.sin(t*13)*.12+Math.sin(t*7)*.1+nightK*.6;
}
