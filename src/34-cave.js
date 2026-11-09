/* ================= Печера Шепоту (замість каньйону) ================= */
const CAVE={x0:316,x1:512,z0:-14,z1:14};
const inCave=()=>player.pos.x>CAVE.x0&&player.pos.x<CAVE.x1&&player.pos.z>CAVE.z0&&player.pos.z<CAVE.z1&&player.pos.y<18;
function buildCave(){
  const R=seeded(77),X=472;
  // підлога печери: темний камінь
  box(scene,[200,.12,26],[414,.06,0],"#6B675C",{tex:"stone",tile:5,shadow:false});
  /* --- скельний гребінь із входом --- */
  rockWall(scene,312,-100,312,-17,34,R,{thick:14});rockWall(scene,312,17,312,100,34,R,{thick:14});
  for(let i=0;i<10;i++){const z=-95+i*21,s=10+R()*10;boulder(scene,324+R()*24,s*.6+12,z+(R()-.5)*8,s*1.6,s,s*1.4,R)}
  // масив скелі обабіч коридору (видно ззовні)
  for(const side of[-1,1])for(let x=322;x<520;x+=9){const s=9+R()*9;boulder(scene,x+R()*4,8+R()*14,side*(24+R()*14),s*1.4,16+R()*16,s*1.5,R)}
  /* --- стіни коридору з окремих брил --- */
  rockWall(scene,318,-13,512,-13,20,R,{thick:6,cols:["#6E6A60","#7F7C6E","#5E5A52"]});
  rockWall(scene,318,13,512,13,20,R,{thick:6,cols:["#6E6A60","#7F7C6E","#5E5A52"]});
  rockWall(scene,511,-13,511,13,22,R,{thick:6,cols:["#5E5A52","#6E6A60"]});
  /* --- склепіння й портал (ховаються, коли гравець усередині) --- */
  const roof=roofGroup(CAVE.x0-4,CAVE.x1,CAVE.z0,CAVE.z1,18);W.caveRoof=roof;
  for(let x=318;x<514;x+=8){const s=10+R()*6;boulder(roof,x+R()*3,20+R()*5,(R()-.5)*8,s*1.3,8+R()*6,30,R,"#7F7C6E")}
  // портал: дві масивні брили-колони й перемичка
  boulder(scene,310,15,-18,16,34,14,R,"#8E8B7C",{collide:true});boulder(scene,310,15,18,16,34,14,R,"#8E8B7C",{collide:true});
  for(let i=-1;i<=1;i++)boulder(roof,311,26+Math.abs(i)*-1.5,i*9,14,10,14,R,"#9C9888");
  for(let i=0;i<9;i++)box(roof,[.4,3+R()*6,.4],[305.6,20-R()*3,-12+i*3],"greenMid",{m:"sway"});
  box(roof,[6,1,30],[306,22.8,0],"white",{tex:"moss",tile:3});
  // висячі ліани біля входу (видно завжди)
  for(let i=0;i<7;i++)box(scene,[.35,2+R()*4,.35],[304.5,17-R()*2,-16+i*1.2+(i>3?20:0)],"#4F9A45",{m:"sway"});
  // вирізьблені символи на скелі біля входу
  [["▲",-24],["●",-30],["■",26],["◆",32]].forEach(([s,z],i)=>{const p=box(scene,[.3,3.4,3.4],[303.4,7+i%2*3,z],"#6E6A60");sign(p,"left",s,"#C5DE8E")});
  const nm=box(scene,[.4,3,14],[303.6,23,0],"forestDeep");sign(nm,"left","ПЕЧЕРА ШЕПОТУ","lime300");
  /* --- кам'яне коло й дольмен (натяк на квест) --- */
  for(let i=0;i<7;i++){const a=i/7*6.28,x=286+Math.cos(a)*10,z=-38+Math.sin(a)*10,h=5+R()*4;const m=box(scene,[2,h,1.4],[x,h/2,z],"white",{tex:"stone",tile:2,collide:true,rot:[0,-a/DEG+90,(R()-.5)*8]});
    if(i%2===0){const r=box(scene,[.2,1.2,1.2],[x+Math.cos(a)*-.8,h*.6,z+Math.sin(a)*-.8],"lime300",{m:"neon",rot:[0,-a/DEG,0]})}}
  box(scene,[3,1.2,3],[286,.6,-38],"white",{tex:"stone",tile:2,collide:true});box(scene,[1,1,.2],[286,1.6,-38],"tan",{m:"neon"});
  box(scene,[2,5,2],[292,2.5,30],"white",{tex:"stone",tile:2,collide:true});box(scene,[2,5,2],[300,2.5,30],"white",{tex:"stone",tile:2,collide:true});box(scene,[12,1.6,5],[296,5.8,30],"white",{tex:"stone",tile:3,collide:true});
  // смолоскипи на жердинах уздовж стежки
  for(const [x,z] of[[296,-7],[296,7],[280,-7],[280,7]]){box(scene,[.4,5,.4],[x,2.5,z],"wood");box(scene,[.8,1.2,.8],[x,5.6,z],"orange",{m:"neon",dyn:true})}
  /* --- провідник із факелом біля входу --- */
  const g=personModel({shirt:"#8C5A2B",pants:"#3C5E3F",hat:"sun",hatCol:"#6B3E1E",bag:"#6B3E1E"});g.position.set(322,0,-7);g.rotation.y=-Math.PI/2;scene.add(g);
  const u=g.userData;u.armR.rotation.x=-2.1;const tg=new THREE.Group();tg.position.set(0,-2.2,-.2);u.armR.add(tg);box(tg,[.35,2.8,.35],[0,-.6,0],"wood",{dyn:true});const fl=box(tg,[.8,1,.8],[0,-2.2,0],"orange",{m:"neon",dyn:true});
  W.guideTorch={g,flame:fl,light:pointLight(320,9,-6,0xff9a3c,1.5,46)};
  W.guideTorchLabel=worldLabel("Без вогню далі ні кроку! Твій факел запалиться сам.",V3(322,11,-7),{say:true,max:45});
  /* --- усередині: кристали, сталагміти, старий табір --- */
  for(let i=0;i<14;i++){const x=330+i*12+R()*6,z=(R()<.5?-1:1)*(8.5+R()*1.2);if(x>468)break;
    if(i%3===0){for(let k=0;k<3;k++)box(scene,[.7,1.6+R()*1.6,.7],[x+(R()-.5)*1.6,1,z+(R()-.5)*.8],"#9FE3D8",{m:"neon",rot:[(R()-.5)*30,R()*90,(R()-.5)*30],dyn:true})}
    else{const h=2+R()*3;box(scene,[1.6,h,1.6],[x,h/2,z],"#6E6A60",{shape:"cone",collide:true})}}
  // стародавні позначки на стінах коридору
  [["→ ▲ ●",360],["◆ ◆ ◆",400],["? ■ ?",445]].forEach(([t,x],i)=>{const p=box(scene,[6,2.6,.3],[x,6+i,i%2?9.8:-9.8],"#5E5A52");sign(p,i%2?"front":"back",t,"#F4C27F")});
  box(scene,[3,.3,1.6],[455,.3,-7],"orangeDeep");box(scene,[1,1.2,1],[452,.6,-7],"tan",{m:"neon"});crate(scene,458,0,-8,2);
  /* --- пастки: безпечні плити позначені ◆ --- */
  W.traps=[];const safe=[2,1,3,2];
  for(let col=1;col<=4;col++)for(let lane=1;lane<=3;lane++){
    const x=342.5+(col-1)*15,z=(lane-2)*6.6,ok=safe[col-1]===lane;
    const pl=box(scene,[14.6,.3,6.4],[x,.2,z],ok?"#B9B49C":"#8A7F6A",{tex:"stone",tile:3,shadow:false});
    if(ok)sign(pl,"top","◆   ◆   ◆","lime300");else W.traps.push({x0:x-7.3,x1:x+7.3,z0:z-3.2,z1:z+3.2,y:2.5,respawn:CANYON_RESPAWN,msg:"Обережно, плита хитається! Ступай лише на плити з візерунком ◆"});
  }
  const warn=box(scene,[10,3.6,.4],[328,5,-9.6],"cream");sign(warn,"back","ОБЕРЕЖНО: ПАСТКИ! СТУПАЙ НА ◆","stamp");
  stoneTablet(scene,430,5,9.2,0,"2 — "+SYM[S.solution[1]]);
  /* --- різьблена брама з механізмом --- */
  for(const [z0,z1] of[[-12,-4],[4,12]])box(scene,[4,20,z1-z0],[X,10,(z0+z1)/2],"white",{tex:"castleStone",tile:4,collide:true});
  box(scene,[4,10,8],[X,15,0],"white",{tex:"castleStone",tile:4,collide:true});
  stoneArch(scene,X-2.4,0,0,8,8.2,true,"stone",2);
  W.door=box(scene,[3,9,8],[X,4.5,0],"white",{tex:"stone",tile:3,collide:true,dyn:true});sign(W.door,"left","?","tan");
  W.tiles=[];for(let i=0;i<3;i++){const t=box(scene,[1.2,4,4],[X-2.5,13.6,(i-1)*5],"rock",{dyn:true});W.tiles.push({mesh:t,sign:sign(t,"left","?","ink"),pos:V3(X-3,13.6,(i-1)*5)})}
  const nums=box(scene,[.3,1.6,14],[X-2.1,16.6,0],"cream");sign(nums,"left","1       2       3","forest");
  W.socket=box(scene,[1.4,3,3],[X-2.6,3,-8],"ink",{dyn:true});W.socketPos=V3(X-3,3,-8);
  for(const z of[-11,11])box(scene,[.8,1.4,.8],[X-2.6,9,z],"orange",{m:"neon"});
  /* --- таємна зала --- */
  box(scene,[34,.2,22],[X+19,.1,0],"white",{tex:"castleStone",tile:4,shadow:false});
  for(const z of[-9,9])for(const dx of[8,26])box(scene,[.8,1.6,.8],[X+dx,8,z],"orange",{m:"neon"});
  pointLight(X+17,8,0,0xffc27f,1,34);
  box(scene,[5,3,3.5],[X+30,1.6,0],"gold",{m:"metal",collide:true});box(scene,[5.2,1,3.7],[X+30,3.4,0],"forest");box(scene,[1,1,.3],[X+30,2,-1.85],"pin",{m:"neon"});
  W.ancient=V3(X+30,2,0);W.roomMinX=X+2;
  /* --- скеля-підказка №3 зі сходами з брил --- */
  const pc=box(scene,[22,18,22],[285,9,44],"#8E8B7C",{collide:true});pc.visible=false;
  for(let i=0;i<9;i++)boulder(scene,278+R()*14,4+R()*12,37+R()*14,9+R()*5,10+R()*6,9+R()*5,R,"#8E8B7C");
  box(scene,[20,1,20],[285,18.2,44],"white",{tex:"moss",tile:4});
  for(let i=1;i<=6;i++){const s=box(scene,[5,i*3,5],[271,i*1.5,30+i*4.2],"#9C9888",{collide:true});s.visible=false;boulder(scene,271,i*1.5-.4,30+i*4.2,5.6,i*3+.6,5.4,R,"#9C9888")}
  stoneTablet(scene,285,21.6,44,0,"3 — "+SYM[S.solution[2]],"stone");
}
