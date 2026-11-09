/* ================= Замок Тіней (замість гробниці) ================= */
const CRYPT={x0:349,x1:472,z0:-322,z1:-258,top:11};
const CASTLE={x0:346,x1:482,z0:-334,z1:-246};
function roundTower(par,x,z,r,h,R){
  box(par,[r*2,h,r*2],[x,h/2,z],"white",{shape:"vcyl",material:mat("white","tex:castleStone"),collide:true});
  box(par,[r*2+1.2,1.4,r*2+1.2],[x,1,z],"white",{shape:"vcyl",material:mat("white","tex:castleStone")});
  box(par,[r*2+1.4,1,r*2+1.4],[x,h+.2,z],"white",{shape:"vcyl",material:mat("white","tex:castleStone")});
  for(let i=0;i<12;i++){const a=i/12*6.28;box(par,[1.6,1.8,1.2],[x+Math.cos(a)*(r+.4),h+1.6,z+Math.sin(a)*(r+.4)],"white",{tex:"castleStone",tile:2,rot:[0,-a/DEG,0]})}
  box(par,[r*2+3,h*.5,r*2+3],[x,h+3+h*.25,z],"forest",{shape:"cone"});
  box(par,[.3,5,.3],[x,h+3+h*.5+2.5,z],"ink");box(par,[3,1.8,.15],[x+1.6,h+3+h*.5+4,z],"orange",{dyn:true});
  for(let lv=0;lv<2;lv++)for(let k=0;k<4;k++){const a=k*1.57+lv*.78+.4;box(par,[.5,2.4,.5],[x+Math.cos(a)*(r+.05),h*.35+lv*h*.3,z+Math.sin(a)*(r+.05)],lv?"#FFD27A":"#1B1A17",{m:lv?"neon":undefined})}
}
function squareTower(par,x0,x1,z0,z1,h,R){
  masonryWall(par,x0,x1,z0,z0+1.6,0,h,R,{crenel:true,pilaster:20});masonryWall(par,x0,x1,z1-1.6,z1,0,h,R,{crenel:true,pilaster:20});
  masonryWall(par,x0,x0+1.6,z0,z1,0,h,R,{crenel:true,pilaster:20});masonryWall(par,x1-1.6,x1,z0,z1,0,h,R,{crenel:true,pilaster:20});
  box(par,[x1-x0,1,z1-z0],[(x0+x1)/2,h-.5,(z0+z1)/2],"white",{tex:"castleStone",tile:4});
  for(const yy of[h*.4,h*.7])box(par,[.4,2.2,.6],[x0-.15,yy,(z0+z1)/2],"#1B1A17");
}
function buildCastle(){
  const R=seeded(53),st={tex:"castleStone",tile:4},cw=(x0,x1,z0,z1,hh)=>masonryWall(scene,x0,x1,z0,z1,0,hh||CRYPT.top,R,{tex:"castleStone",noCornice:true,pilaster:30});
  // двір і підлога
  box(scene,[136,.2,88],[414,.1,-290],"white",{tex:"cobble",tile:6,shadow:false});
  /* --- зовнішні мури із зубцями --- */
  const H=16;
  masonryWall(scene,354,474,-334,-331,0,H,R,{crenel:true});masonryWall(scene,354,474,-249,-246,0,H,R,{crenel:true});
  masonryWall(scene,479,482,-326,-254,0,H,R,{crenel:true});
  masonryWall(scene,346,349,-326,-306,0,H,R,{crenel:true});masonryWall(scene,346,349,-274,-254,0,H,R,{crenel:true});
  for(const [x,z] of[[347.5,-332.5],[480.5,-332.5],[347.5,-247.5],[480.5,-247.5]])roundTower(scene,x,z,7,26,R);
  // бійниці та знамена на мурах
  for(let x=362;x<470;x+=12){box(scene,[.5,2.4,.4],[x,9,-334.2],"#1B1A17");box(scene,[.5,2.4,.4],[x,9,-245.8],"#1B1A17")}
  for(const [x,z,cc] of[[392,-245.7,"orange"],[436,-245.7,"forest"],[392,-334.3,"forest"],[436,-334.3,"orange"]]){box(scene,[4,7,.2],[x,10,z],cc);box(scene,[1.6,1.6,.25],[x,11,z],"gold",{m:"metal",rot:[0,0,45]})}
  /* --- надбрамні вежі, арка, ґрати, міст --- */
  squareTower(scene,340,352,-308,-296,24,R);squareTower(scene,340,352,-284,-272,24,R);
  const gateRoof=new THREE.Group();gateRoof.userData.noMerge=true;scene.add(gateRoof);W.roofs.push({g:gateRoof,x0:338,x1:356,z0:-296,z1:-284,top:12});
  box(gateRoof,[12,10,12],[346,17,-290],"white",{...st});for(let z=-295;z<=-285;z+=2.5)box(gateRoof,[12.4,1.6,1.2],[346,22.8,z],"white",{...st});
  stoneArch(scene,339.6,-290,0,10,7.5,true,"castleStone",2.4);
  const gs=box(scene,[.4,2.2,10],[339.2,15,-290],"forestDeep");sign(gs,"left","ЗАМОК ТІНЕЙ","gold");
  W.portcullis=new THREE.Group();W.portcullis.position.set(341,10,-290);W.portcullis.userData.noMerge=true;scene.add(W.portcullis);
  for(let z=-4;z<=4;z+=1.6)box(W.portcullis,[.35,6,.35],[0,0,z],"#3F3C36",{m:"metal",dyn:true});for(let y=-2;y<=2;y+=2)box(W.portcullis,[.35,.35,9],[0,y,0],"#3F3C36",{m:"metal",dyn:true});
  box(scene,[14,.5,10],[333,.25,-290],"white",{tex:"planks",tile:3,shadow:false});for(const z of[-295,-285]){box(scene,[.3,.3,12],[338,6,z],"ink",{rot:[48,90,0]})}
  for(const z of[-297.5,-282.5])box(scene,[.8,1.6,.8],[339,8,z],"orange",{m:"neon",dyn:true});
  /* --- прохід у замок --- */
  cw(349,410,-296,-294);cw(349,402,-286,-284);cw(406,410,-286,-284);
  W.crackWall=box(scene,[4,CRYPT.top,2],[404,CRYPT.top/2,-285],"white",{tex:"stone",tile:3,collide:true,dyn:true});
  cw(398,400,-284,-272);cw(408,410,-284,-272);cw(398,410,-274,-272);
  W.crackRoom=V3(404,1,-278);
  /* --- тронна зала --- */
  cw(410,412,-322,-294);cw(410,412,-286,-258);cw(410,452,-322,-320);cw(410,452,-260,-258);cw(450,452,-322,-294);cw(450,452,-286,-258);
  W.tombDoor=box(scene,[2,CRYPT.top,8],[451,CRYPT.top/2,-290],"white",{tex:"castleStone",tile:4,collide:true,dyn:true});
  cw(452,472,-300,-298);cw(452,472,-282,-280);cw(470,472,-300,-280);
  for(let z=-316;z<=-264;z+=13)for(const x of[416,446])box(scene,[1.8,CRYPT.top,1.8],[x,CRYPT.top/2,z],"white",{shape:"oct",material:mat("white","tex:castleStone"),collide:true});
  box(scene,[6,.1,52],[431,.22,-290],"stamp",{shadow:false});
  box(scene,[5,2,4],[431,1,-316],"white",{tex:"castleStone",tile:2,collide:true});box(scene,[4,6,1],[431,5,-317.8],"forest");box(scene,[4.6,.6,4.4],[431,2.3,-316],"orange");
  /* --- дахи (ховаються, коли гравець усередині) --- */
  const rg=roofGroup(349,482,-334,-246,CRYPT.top+1.5);W.cryptRoof=rg;
  box(rg,[61,1.2,12],[379.5,CRYPT.top+.6,-290],"white",{...st});for(let x=352;x<408;x+=3)box(rg,[1.4,1.4,1],[x,CRYPT.top+1.8,-295.5],"white",{...st});
  box(rg,[44,1.2,66],[431,CRYPT.top+.6,-290],"white",{...st});gableRoof(rg,409,453,-323,-257,CRYPT.top+1.2,12,"roofOrange",true);
  box(rg,[12,1.2,14],[404,CRYPT.top+.6,-278],"white",{...st});
  // донжон над скарбницею
  for(const [x0,x1,z0,z1] of[[451,473,-301,-299],[451,473,-281,-279],[451,453,-301,-279],[471,473,-301,-279]])box(rg,[x1-x0,22,z1-z0],[(x0+x1)/2,CRYPT.top+11,(z0+z1)/2],"white",{...st});
  for(let x=452;x<473;x+=2.6)for(const z of[-300.5,-279.5])box(rg,[1.3,1.6,1.4],[x,CRYPT.top+22.8,z],"white",{...st});
  for(const [x,z] of[[451,-301],[473,-301],[451,-279],[473,-279]]){box(rg,[3.6,27,3.6],[x,CRYPT.top+13.5,z],"white",{shape:"oct",material:mat("white","tex:castleStone")});box(rg,[5,6,5],[x,CRYPT.top+30,z],"forest",{shape:"cone"})}
  box(rg,[26,12,26],[462,CRYPT.top+28,-290],"orange",{shape:"cone",rot:[0,45,0]});
  for(let k=0;k<3;k++)for(const z of[-301.2,-278.8])box(rg,[2,3,.3],[455+k*7,CRYPT.top+14,z],"#FFD27A",{m:"neon"});
  for(let k=0;k<2;k++)box(rg,[.3,3,2],[473.2,CRYPT.top+14,-294+k*8],"#FFD27A",{m:"neon"});
  /* --- шипи --- */
  W.spikes=[];for(const [x,ph] of[[376,0],[391,1.4]]){const g=new THREE.Group();g.position.set(x,0,-290);g.userData.noMerge=true;scene.add(g);
    box(scene,[6,.2,8],[x,.15,-290],"cryptDark",{shadow:false});for(let a=0;a<4;a++)for(let b=0;b<3;b++)box(g,[.5,2.4,.5],[-2.2+a*1.45,-1,-2.6+b*2.6],"#C9CFD2",{m:"metal",dyn:true});
    W.spikes.push({g,x0:x-3,x1:x+3,z0:-294,z1:-286,ph,up:false})}
  /* --- гліфи й розписи --- */
  const GL=["☾","☀","★","◆"];W.glyphs=[];
  [[421,-302],[441,-302],[421,-278],[441,-278]].forEach(([x,z],k)=>{box(scene,[3,3,3],[x,1.5,z],"white",{...st,collide:true});const s=box(scene,[2.4,2.4,2.4],[x,4.2,z],"cryptDark",{dyn:true});sign(s,"top",GL[k],"#7FD3FF");sign(s,"front",GL[k],"#7FD3FF");sign(s,"back",GL[k],"#7FD3FF");W.glyphs.push({k,sym:GL[k],mesh:s,pos:V3(x,3,z)})});
  W.murals=[];const ord=S.crypt.order;
  [[412.2,-312,"right"],[412.2,-268,"right"],[449.6,-312,"left"],[449.6,-268,"left"]].forEach(([x,z,f],k)=>{const p=box(scene,[.2,4,8],[x,6,z],"#2B2A33",{dyn:true});const sg=sign(p,f,["I","II","III","IV"][k]+" · "+GL[ord[k]],"#F4C27F");W.murals.push(sg.userData.group)});
  /* --- галерея для мотузки --- */
  box(scene,[16,1,8],[421,9,-316],"white",{...st,collide:true});box(scene,[16,9,1],[421,4.5,-312.3],"white",{...st,collide:true});
  for(let x=414;x<=428;x+=2)box(scene,[.3,1.6,.3],[x,10.3,-312.4],"ink");box(scene,[16,.3,.3],[421,11,-312.4],"ink");
  W.ledgeBase=V3(421,1,-309);W.ledgeTop=V3(421,9.5,-317);
  W.rope=box(scene,[.3,9,.3],[421,4.5,-311.8],"tan",{dyn:true});W.rope.visible=false;
  W.ledgeItem=new THREE.Group();W.ledgeItem.position.set(425,9.5,-317);W.ledgeItem.userData.noMerge=true;scene.add(W.ledgeItem);
  /* --- скарбниця --- */
  box(scene,[6,2.4,4],[466,1.2,-290],"white",{tex:"marble",tile:2,collide:true});W.tombAltar=V3(466,2.4,-290);
  W.tombHolder=new THREE.Group();W.tombHolder.position.copy(W.tombAltar);W.tombHolder.userData.noMerge=true;scene.add(W.tombHolder);
  W.cryptChestPos=V3(460,0,-296);
  W.cryptLights=[pointLight(431,8,-290,0x7fd3ff,.7,34),pointLight(462,7,-290,0xffb35a,.6,22)];
  for(const [x,z] of[[412.8,-300],[412.8,-280],[449.2,-300],[449.2,-280]])box(scene,[.6,1.4,.6],[x,7,z],"#7FD3FF",{m:"neon"});
  /* --- природний підніжжя: скелі й кущі довкола мурів --- */
  for(let i=0;i<26;i++){const a=i/26*6.28,x=414+Math.cos(a)*78,z=-290+Math.sin(a)*56;if(Math.abs(z+290)<14&&x<350)continue;boulder(scene,x,2+R()*2,z,6+R()*6,4+R()*5,6+R()*6,R,null,{collide:true})}
}
