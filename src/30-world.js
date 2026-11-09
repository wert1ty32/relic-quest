/* ================= Світ ================= */
const W={roofs:[],lights:[],anim:[],dark:[]};
const CANYON_RESPAWN=new THREE.Vector3(324,0,0);
const labels=[];
const labelRoot=document.getElementById("labels");
function worldLabel(text,pos,{say=false,max=70,cls=""}={}){const el=document.createElement("div");el.className="wl"+(say?" say":"")+(cls?" "+cls:"");el.textContent=text;labelRoot.appendChild(el);const L={el,pos:pos.clone(),max};labels.push(L);return L}
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
// стіна за межами прямокутника
function wall(par,x0,x1,z0,z1,y0,h,o={}){return box(par,[x1-x0,h,z1-z0],[(x0+x1)/2,y0+h/2,(z0+z1)/2],o.col||"white",{tex:o.tex||"plaster",tile:o.tile||6,collide:o.collide!==false,shadow:o.shadow,dyn:o.dyn})}
function gableRoof(par,x0,x1,z0,z1,y,h,tex,alongX){
  const w=x1-x0,d=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2;
  if(alongX){box(par,[w+2,h,d/2+1],[cx,y+h/2,cz-d/4-.5],"white",{shape:"wedge",material:mat("white","tex:"+tex)});box(par,[w+2,h,d/2+1],[cx,y+h/2,cz+d/4+.5],"white",{shape:"wedge",rot:[0,180,0],material:mat("white","tex:"+tex)})}
  else{box(par,[d+2,h,w/2+1],[cx-w/4-.5,y+h/2,cz],"white",{shape:"wedge",rot:[0,90,0],material:mat("white","tex:"+tex)});box(par,[d+2,h,w/2+1],[cx+w/4+.5,y+h/2,cz],"white",{shape:"wedge",rot:[0,-90,0],material:mat("white","tex:"+tex)})}
}
function roofGroup(x0,x1,z0,z1,top){const g=new THREE.Group();g.userData.noMerge=true;scene.add(g);W.roofs.push({g,x0,x1,z0,z1,top});return g}
function pointLight(x,y,z,col,int,dist){const l=new THREE.PointLight(col,int,dist,1.6);l.position.set(x,y,z);scene.add(l);W.lights.push(l);return l}

function tree(par,x,z,R,big){
  const y=groundH(x,z),h=(big?8:6)+Math.floor(R()*5),s=(big?8:6)+Math.floor(R()*4),leaf=R()<.5?"greenMid":"forest";
  box(par,[2,h,2],[x,y+h/2,z],"white",{tex:"bark",tile:4,collide:true});
  box(par,[s,s*.75,s],[x,y+h+s*.3,z],leaf,{m:"sway"});
  box(par,[s*.6,s*.5,s*.6],[x+.6,y+h+s*.9,z+.4],"leafDark",{m:"sway"});
  if(R()<.4)box(par,[s*.5,s*.4,s*.5],[x-s*.35,y+h+s*.1,z-s*.3],leaf,{m:"sway"});
}
function pine(par,x,z,R){const y=groundH(x,z),h=5+R()*3;box(par,[1.6,h,1.6],[x,y+h/2,z],"white",{tex:"bark",tile:4,collide:true});
  for(let i=0;i<3;i++){const s=7-i*2;box(par,[s,3,s],[x,y+h+i*2.6,z],i%2?"forest":"#25683A",{m:"sway"})}}
function signpost(par,x,z,text,yaw){
  const g=new THREE.Group();g.position.set(x,groundH(x,z),z);g.rotation.y=yaw*DEG;par.add(g);
  box(g,[.8,7,.8],[0,3.5,0],"white",{tex:"planks",tile:2});
  const b=box(g,[10,2.6,.5],[0,6,0],"cream");sign(b,"front",text,"forest");sign(b,"back",text,"forest");
}
function stoneTablet(par,x,y,z,yaw,text,tex){
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=yaw*DEG;par.add(g);
  const t=box(g,[5,6,1.2],[0,0,0],"white",{tex:tex||"stone",tile:3});sign(t,"front",text,"ink");sign(t,"back",text,"ink");
  addCollider(t);return g;
}
function lantern(par,x,y,z){box(par,[.3,2.4,.3],[x,y+1.2,z],"ink");box(par,[1,1.2,1],[x,y+2.9,z],"tan",{m:"neon"});box(par,[1.3,.3,1.3],[x,y+3.6,z],"forest")}
function crate(par,x,y,z,s=3,col){box(par,[s,s,s],[x,y+s/2,z],col||"white",{tex:"planks",tile:s,collide:true})}
function barrel(par,x,y,z){box(par,[2.4,3,2.4],[x,y+1.5,z],"white",{shape:"vcyl",material:mat("white","tex:planks"),collide:true});box(par,[2.5,.25,2.5],[x,y+.6,z],"ink",{shape:"vcyl"});box(par,[2.5,.25,2.5],[x,y+2.4,z],"ink",{shape:"vcyl"})}
function plant(par,x,y,z){box(par,[1.6,1.4,1.6],[x,y+.7,z],"orangeDeep",{collide:true});box(par,[1.8,2,1.8],[x,y+2.2,z],"greenMid",{m:"sway"});box(par,[.6,.6,.6],[x+.5,y+3.2,z],"orange")}
function owl(par,x,y,z,yaw){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=yaw*DEG;par.add(g);
  box(g,[3,2,3],[0,1,0],"white",{tex:"templeStone",tile:3});box(g,[2.4,3.2,2],[0,3.6,0],"templeDark");box(g,[2.6,2.2,2.2],[0,6.2,0],"templeDark");
  box(g,[.7,.7,.1],[-.6,6.4,-1.12],"gold",{m:"neon"});box(g,[.7,.7,.1],[.6,6.4,-1.12],"gold",{m:"neon"});box(g,[.5,.5,.4],[0,5.8,-1.2],"tan",{shape:"wedge",rot:[90,0,0]});
  box(g,[.6,.8,.6],[-.9,7.6,0],"templeDark");box(g,[.6,.8,.6],[.9,7.6,0],"templeDark");g.updateMatrixWorld(true);addCollider(g.children[0]);return g}

function buildWorld(){
  buildTerrain();W.sky=buildSky();W.mountains=buildMountains();
  /* ---------- Хаб ---------- */
  box(scene,[70,.4,70],[0,.2,0],"sand",{shadow:false});
  for(let i=-1;i<=1;i+=2){box(scene,[71,.6,1.5],[0,.3,35*i],"white",{tex:"stone",tile:2,shadow:false});box(scene,[1.5,.6,71],[35*i,.3,0],"white",{tex:"stone",tile:2,shadow:false})}
  box(scene,[10,1,10],[0,.5,12],"orange");
  // фонтан
  box(scene,[12,1.6,12],[14,.8,-14],"white",{shape:"vcyl",material:mat("white","tex:stone"),collide:true});
  box(scene,[10.4,.2,10.4],[14,1.62,-14],"water",{shape:"vcyl",m:"glass"});
  box(scene,[2,5,2],[14,3,-14],"white",{tex:"marble",tile:2});box(scene,[4,.6,4],[14,5.6,-14],"white",{shape:"vcyl",material:mat("white","tex:marble")});
  W.fountain=box(scene,[1.2,2.4,1.2],[14,7,-14],"#BFE3F5",{m:"glass",dyn:true});
  box(scene,[1.6,24,1.6],[-17.6,12,-26],"white",{tex:"planks",tile:2,collide:true});box(scene,[1.6,24,1.6],[17.6,12,-26],"white",{tex:"planks",tile:2,collide:true});
  const board=box(scene,[34,15.6,1],[0,15.4,-26],"forest");logoPlane(board,"back",29);logoPlane(board,"front",29);box(scene,[35.2,1,1.6],[0,23.6,-26],"orange");box(scene,[35.2,1,1.6],[0,7.2,-26],"orange");
  const sub=box(scene,[24,2.6,.3],[0,5.6,-25.4],"orange");sign(sub,"back","RELIC QUEST · ТАЄМНИЦІ АРТЕФАКТІВ","paper");
  signpost(scene,-6,-40,"ЛІС · ПІВНІЧ",0);signpost(scene,40,-9,"ПЕЧЕРА · СХІД",90);signpost(scene,-8,42,"МУЗЕЙ · ПІВДЕНЬ",180);signpost(scene,-40,9,"ХРАМ · ЗАХІД",-90);
  for(let i=0;i<12;i++)box(scene,[1.2,.35,1.2],[14+i*4,.3,16+Math.sin(i*.6)*4],"forest",{shadow:false});
  box(scene,[1.2,4,1.2],[64,2,16],"pin");box(scene,[3.4,3.4,3.4],[64,5,16],"pin",{shape:"ball"});
  const guide=foxModel(1.2);guide.position.set(10,.4,2);guide.rotation.y=200*DEG;scene.add(guide);W.guide=guide;
  W.guideLabel=worldLabel(FOXLINES[0],V3(10,10.5,2),{say:true,max:60});
  // лави
  for(const [x,z,r] of [[-20,22,0],[20,22,0],[22,-26,90]]){const g=new THREE.Group();g.position.set(x,.4,z);g.rotation.y=r*DEG;scene.add(g);box(g,[6,.4,1.6],[0,1.4,0],"white",{tex:"planks",tile:3});box(g,[6,1.4,.3],[0,2.4,.7],"white",{tex:"planks",tile:3});box(g,[.4,1.2,1.4],[-2.6,.6,0],"ink");box(g,[.4,1.2,1.4],[2.6,.6,0],"ink");g.updateMatrixWorld(true);addCollider(g.children[0])}

  /* ---------- Крамниця «Компас» ---------- */
  {const x0=-34,x1=-14,z0=-16,z1=0,y=.4,top=10;
   box(scene,[x1-x0,.4,z1-z0],[(x0+x1)/2,y+.2,(z0+z1)/2],"white",{tex:"planks",tile:4,shadow:false});
   wall(scene,x0,x0+1.2,z0,z1,y,top);wall(scene,x0,x1,z0,z0+1.2,y,top);wall(scene,x0,x1,z1-1.2,z1,y,top);
   wall(scene,x1-1.2,x1,z0,z0+4,y,top);wall(scene,x1-1.2,x1,z1-4,z1,y,top);trimBuilding(scene,x0,x1,z0,z1,y,top,"stone",{x1:[z0+4,z1-4]});box(scene,[1.2,2.5,z1-z0],[x1-.6,y+top-1.25,(z0+z1)/2],"white",{tex:"plaster",tile:6});
   const rg=roofGroup(x0,x1,z0,z1,top+y);gableRoof(rg,x0,x1,z0,z1,y+top,5,"roofOrange",false);
   box(scene,[3,2.2,18],[x1+1.6,y+top-1.4,(z0+z1)/2],"white",{tex:"stripes",tile:4,rot:[0,0,-18]});
   box(scene,[2.5,3.4,10],[x1-3.5,y+1.7,(z0+z1)/2],"white",{tex:"planks",tile:3,collide:true});box(scene,[3,.4,10.6],[x1-3.5,y+3.6,(z0+z1)/2],"forest");
   for(let i=0;i<3;i++){box(scene,[1.6,.3,12],[x0+2.5,y+2+i*2.4,(z0+z1)/2],"white",{tex:"planks",tile:3});
     for(let k=0;k<5;k++)box(scene,[1,1,1],[x0+2.5,y+2.7+i*2.4,z0+4+k*2],["orange","tan","bronze","greenMid","pin"][(i+k)%5],{m:k%3?undefined:"metal"})}
   const sg=box(scene,[16,2.6,.4],[(x0+x1)/2+1,y+top+1.6,z1+.4],"forest");sign(sg,"back","КРАМНИЦЯ «КОМПАС»","cream");
   const sg2=box(scene,[.4,2.6,14],[x1+.4,y+top-4.2,(z0+z1)/2],"cream");sign(sg2,"right","СПОРЯДЖЕННЯ","forest");
   const merchant=personModel({shirt:"#2F7D32",pants:"#6B3E1E",hat:"sun",hatCol:"tan",bag:null});merchant.position.set(x1-6.5,y,(z0+z1)/2);merchant.rotation.y=-Math.PI/2;scene.add(merchant);W.merchant=merchant;
   lantern(scene,x1+1,y,z0-1);lantern(scene,x1+1,y,z1+1);
   W.shopCounter=V3(x1-1,2,(z0+z1)/2);}

  /* ---------- Дорога й автобусна зупинка ---------- */
  buildRoad();
  {const s=LAY.stop;
   box(scene,[34,.5,6],[s.x,.25,s.z+1],"white",{tex:"stone",tile:3,shadow:false});
   box(scene,[16,7,.4],[s.x+4,4,s.z+3.6],"#BFE3F5",{m:"glass"});
   for(const dx of[-4,12])box(scene,[.5,7.5,.5],[s.x+dx,4,s.z+3.6],"forest",{collide:true});
   box(scene,[18,.6,6],[s.x+4,7.9,s.z+1.6],"forest");box(scene,[18.2,.3,6.2],[s.x+4,7.5,s.z+1.6],"orange");
   box(scene,[10,.5,1.8],[s.x+4,1.9,s.z+2.4],"white",{tex:"planks",tile:3,collide:true});box(scene,[10,1.6,.3],[s.x+4,3,s.z+3.2],"white",{tex:"planks",tile:3});
   box(scene,[.4,9,.4],[s.x-10,4.5,s.z-1.8],"ink",{collide:true});const rs=box(scene,[3,3,.3],[s.x-10,9.6,s.z-1.8],"orange");sign(rs,"front","BUS","paper");sign(rs,"back","BUS","paper");
   const tb=box(scene,[5,3.4,.3],[s.x+4,4.8,s.z+3.35],"cream");sign(tb,"front","ЗУПИНКА «МУЗЕЙ»","forest");
   W.busBoard=worldLabel("Автобус через 0 с",V3(s.x+4,10.6,s.z+1.5),{max:70});}
  // рекламні щити (покращення «Рекламні щити»)
  W.billboards=[];for(let i=0;i<3;i++){const g=new THREE.Group();g.userData.noMerge=true;const x=-160-i*150,z=86;g.position.set(x,groundH(x,z),z);scene.add(g);
    box(g,[.6,9,.6],[-5,4.5,0],"ink",{dyn:true});box(g,[.6,9,.6],[5,4.5,0],"ink",{dyn:true});const b=box(g,[14,6,.5],[0,10,0],"orange",{dyn:true});sign(b,"back",["МУЗЕЙ ЗНАХІДОК →","ЛИСИЧКА ЧЕКАЄ!","РЕЛІКВІЇ · 2 КМ"][i],"paper");
    g.visible=false;W.billboards.push(g)}

  /* ---------- База гравця ---------- */
  const B=LAY.base;
  box(scene,[128,1,79],[0,.5,153.5],"lime200",{collide:true,shadow:false});
  box(scene,[130,.8,81],[0,.4,153.5],"forest",{shadow:false});
  // паркан з проходом на півночі
  const fenceSeg=(x0,z0,x1,z1)=>{const L=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.round(L/5));for(let i=0;i<=n;i++){const t=i/n;box(scene,[.6,3.4,.6],[x0+(x1-x0)*t,2.7,z0+(z1-z0)*t],"white",{tex:"planks",tile:2})}
    const ax=Math.abs(x1-x0)>Math.abs(z1-z0);box(scene,ax?[L,.5,.35]:[.35,.5,L],[(x0+x1)/2,3.6,(z0+z1)/2],"white",{tex:"planks",tile:3});box(scene,ax?[L,.5,.35]:[.35,.5,L],[(x0+x1)/2,2.1,(z0+z1)/2],"white",{tex:"planks",tile:3});
    box(scene,ax?[L,3,.6]:[.6,3,L],[(x0+x1)/2,2.5,(z0+z1)/2],"forest",{collide:true}).visible=false};
  fenceSeg(-63,114.6,-9.8,114.6);fenceSeg(9.8,114.6,63,114.6);fenceSeg(-63,114.6,-63,192);fenceSeg(63,114.6,63,192);fenceSeg(-63,192,63,192);
  box(scene,[1.2,7,1.2],[-9,4.5,114.6],"orange",{collide:true});box(scene,[1.2,7,1.2],[9,4.5,114.6],"orange",{collide:true});
  const arch=box(scene,[19.2,2.2,1],[0,8.6,114.6],"forest");sign(arch,"front","МУЗЕЙ ЗНАХІДОК","cream");sign(arch,"back","ТВОЯ БАЗА","cream");
  // доріжка до музею
  box(scene,[10,.12,15],[0,1.06,120.5],"white",{tex:"stone",tile:2,shadow:false});
  /* Музей-павільйон */
  {const x0=-24,x1=24,z0=128,z1=158,y=1,top=12;
   box(scene,[x1-x0,.2,z1-z0],[0,y+.1,(z0+z1)/2],"white",{tex:"floor",tile:6,shadow:false});
   wall(scene,x0,x1,z1-2,z1,y,top);wall(scene,x0,x0+2,z0,z1,y,top);wall(scene,x1-2,x1,z0,z1,y,top);
   wall(scene,x0,-7,z0,z0+2,y,top);wall(scene,7,x1,z0,z0+2,y,top);trimBuilding(scene,x0,x1,z0,z1,y,top,"marble",{z0:[-7,7]});
   {const lp=box(scene,[15.4,7.06,.5],[0,y+top+3.4,z0-.6],"forest");logoPlane(lp,"front",14.6)}box(scene,[14,2.6,2],[0,y+top-1.3,z0+1],"white",{tex:"plaster",tile:6});
   box(scene,[x1-x0+1,1,z1-z0+1],[0,y+top+.5,(z0+z1)/2],"forest");
   for(const x of[-9,9]){box(scene,[2.4,top,2.4],[x,y+top/2,z0-1],"white",{shape:"vcyl",material:mat("white","tex:marble"),collide:true});box(scene,[3.2,.8,3.2],[x,y+.4,z0-1],"white",{tex:"marble",tile:2});box(scene,[3.2,.8,3.2],[x,y+top-.4,z0-1],"white",{tex:"marble",tile:2})}
   box(scene,[22,1.2,4],[0,y+top+.2,z0-1.2],"white",{tex:"marble",tile:3});
   const ms=box(scene,[18,2.4,.4],[0,y+top-3.5,z0-.25],"orange");sign(ms,"front","МУЗЕЙ ЗНАХІДОК","paper");
   for(const zz of[136,146])for(const s of[-1,1]){box(scene,[.3,4,5],[s*(24.2),y+6,zz],"#BFE3F5",{m:"glass"});box(scene,[.5,.5,5.6],[s*24.3,y+3.8,zz],"forest");box(scene,[.5,.5,5.6],[s*24.3,y+8.2,zz],"forest");box(scene,[.9,.9,5],[s*24.9,y+3.2,zz],"orangeDeep");box(scene,[.9,.6,4.6],[s*24.9,y+3.9,zz],"greenMid",{m:"sway"})}
   const rg=roofGroup(x0,x1,z0-3,z1,y+top+1);gableRoof(rg,x0-1,x1+1,z0-3,z1+1,y+top+1,7,"roof",true);
   box(rg,[x1-x0+4,.6,1],[0,y+top+8.1,(z0+z1)/2-1],"forestDeep");
   box(scene,[14,.08,8],[0,y+.24,133],"orange",{shadow:false});box(scene,[6,.08,22],[0,y+.24,143],"orange",{shadow:false});
   for(const [x,z] of[[-20,132],[20,132],[-20,153],[20,153]])plant(scene,x,y+.2,z);
   lantern(scene,-12,y,z0-3);lantern(scene,12,y,z0-3);
   pointLight(0,y+10,143,0xffe2b0,.9,46);
   const banners=[["#D2601A",-23.2],["#1E5A2B",23.2]];for(const [cc,x] of banners){box(scene,[.2,6,3],[x*.995,y+7,150],cc)}
   W.pedestals=[];let k=0;
   for(let row=0;row<2;row++)for(let col=0;col<4;col++){
     const x=-15+col*10,z=138+row*9;
     const base=box(scene,[4,3,4],[x,y+1.5,z],"white",{tex:"marble",tile:2,collide:true,dyn:true});const topM=box(scene,[4.6,.5,4.6],[x,y+3.25,z],"forest",{collide:true,dyn:true});
     box(scene,[1.6,.5,.2],[x,y+2.2,z-2.05],"gold",{m:"metal"});
     const holder=new THREE.Group();holder.position.set(x,y+3.5,z);holder.userData.noMerge=true;scene.add(holder);
     W.pedestals.push({base,top:topM,holder,pos:V3(x,y+3.5,z),view:V3(x,0,row?142.5:133.5),label:worldLabel("Порожня вітрина",V3(x,y+8.6,z),{max:46}),model:null,cur:null,i:k++,row});
   }}
  /* Лабораторія */
  {const x0=30,x1=60,z0=124,z1=162,y=1,top=11;
   box(scene,[x1-x0,.2,z1-z0],[(x0+x1)/2,y+.1,(z0+z1)/2],"white",{tex:"labFloor",tile:8,shadow:false});
   wall(scene,x1-2,x1,z0,z1,y,top);wall(scene,x0,x1,z0,z0+2,y,top);wall(scene,x0,x1,z1-2,z1,y,top);
   wall(scene,x0,x0+2,z0,138,y,top);wall(scene,x0,x0+2,146,z1,y,top);trimBuilding(scene,x0,x1,z0,z1,y,top,"stone",{x0:[138,146]});box(scene,[2,3,8],[x0+1,y+top-1.5,142],"white",{tex:"plaster",tile:6});
   box(scene,[2.2,.5,9],[x0+1,y+top-3.2,142],"forest");
   for(const zz of[132,152]){box(scene,[.3,4,6],[x0-.15,y+6,zz],"#BFE3F5",{m:"glass"});box(scene,[.5,.5,6.6],[x0-.3,y+3.8,zz],"forest");box(scene,[.5,.5,6.6],[x0-.3,y+8.2,zz],"forest")}
   const ls=box(scene,[.4,2.4,12],[x0-.25,y+top+.2,142],"forest");sign(ls,"left","ЛАБОРАТОРІЯ","cream");
   box(scene,[x1-x0+1,1,z1-z0+1],[(x0+x1)/2,y+top+.5,(z0+z1)/2],"forest");
   const rg=roofGroup(x0,x1,z0,z1,y+top+1);gableRoof(rg,x0-1,x1+1,z0-1,z1+1,y+top+1,6,"roof",false);
   box(rg,[3,6,3],[x1-6,y+top+5,z0+6],"white",{tex:"stone",tile:2});box(rg,[3.4,.6,3.4],[x1-6,y+top+8.2,z0+6],"forestDeep");
   box(rg,[.3,10,.3],[x0+8,y+top+8,z1-6],"ink");box(rg,[3,.3,.3],[x0+8,y+top+12,z1-6],"ink");box(rg,[1,1,1],[x0+8,y+top+13,z1-6],"pin",{m:"neon"});
   // шафи та обладнання вздовж стін
   for(let i=0;i<4;i++){const zz=z0+6+i*8.5;box(scene,[2,8,6],[x1-3.2,y+4,zz],"white",{tex:"planks",tile:3,collide:true});
     for(let s=0;s<3;s++){box(scene,[2.2,.3,6.2],[x1-3.2,y+2+s*2.4,zz],"forest");for(let j=0;j<3;j++)box(scene,[.8,1,.8],[x1-3.6,y+2.7+s*2.4,zz-2+j*2],["#9FE3D8","#C5DE8E","#F4C27F","#D2601A"][(i+s+j)%4],{m:"glass"})}}
   const board=box(scene,[.3,4,10],[x1-2.15,y+6.5,z0+5],"forestDeep");sign(board,"left","ДОСЛІДЖЕННЯ","lime300");
   W.tables=[];
   for(let i=0;i<3;i++){const tz=z0+10+i*11,tx=45;
     const tb=box(scene,[9,.6,4.4],[tx,y+3.2,tz],"white",{tex:"planks",tile:3,collide:true});
     for(const [dx,dz] of[[-4,-1.8],[4,-1.8],[-4,1.8],[4,1.8]])box(scene,[.5,3,.5],[tx+dx,y+1.5,tz+dz],"ink");
     box(scene,[1,2.2,1],[tx-3.4,y+4.6,tz+1.2],"ink");box(scene,[.5,1.2,.5],[tx-3.4,y+5.6,tz+.7],"ink",{rot:[30,0,0]});box(scene,[1.4,.4,1.4],[tx-3.4,y+3.7,tz+1.2],"forest");
     const scr=box(scene,[3.4,2.2,.3],[tx+2.6,y+5,tz+2],"forestDeep",{dyn:true});
     const ring=new THREE.Group();ring.position.set(tx,y+7.2,tz);ring.userData.noMerge=true;scene.add(ring);
     for(let a=0;a<8;a++){box(ring,[1.4,.3,.4],[Math.cos(a/8*6.28)*2.2,0,Math.sin(a/8*6.28)*2.2],"bronze",{m:"metal",rot:[0,-a/8*360,0],dyn:true})}
     box(scene,[.25,4,.25],[tx,y+9.3,tz],"ink");
     const beam=box(scene,[.3,3.6,.3],[tx,y+5.2,tz],"lime300",{m:"neon",dyn:true,shadow:false});beam.visible=false;
     const tarp=box(scene,[9.4,1.4,4.8],[tx,y+4.2,tz],"tan",{dyn:true});
     const relic=new THREE.Group();relic.position.set(tx,y+3.5,tz);relic.userData.noMerge=true;scene.add(relic);
     W.tables.push({i,pos:V3(tx,y+3.5,tz),ring,beam,tarp,relic,scr,label:worldLabel("",V3(tx,y+11,tz),{max:42,cls:"prog"})});
   }
   pointLight(45,y+9,140,0xe8fff0,.9,40);
   W.labDoor=V3(x0-3,1,142);}
  // намет, вогнище, ящики, прапор
  {const y=1;const tx=-44,tz=170,w=10,h=7,d=9;
   box(scene,[w,h,d/2],[tx,y+h/2,tz-d/4],"white",{shape:"wedge",material:mat("orange")});box(scene,[w,h,d/2],[tx,y+h/2,tz+d/4],"white",{shape:"wedge",rot:[0,180,0],material:mat("orangeHover")});
   box(scene,[2.4,3.6,.2],[tx,y+1.8,tz-d/2+.6],"ink");box(scene,[w*.9,h*.6,d*.8],[tx,y+h*.3,tz],"forest",{collide:true}).visible=false;
   box(scene,[5,.3,5],[-36,y+.15,150],"rockDark",{shape:"vcyl"});for(let a=0;a<4;a++)box(scene,[3.2,.6,.6],[-36,y+.5,150],"wood",{rot:[0,a*45,0]});
   W.fire=box(scene,[1.6,2.4,1.6],[-36,y+1.6,150],"orange",{m:"neon",dyn:true,shadow:false});W.fireLight=pointLight(-36,y+4,150,0xffa040,.8,26);
   crate(scene,-52,y,176);crate(scene,-48.5,y,177,2.4);crate(scene,-51.5,y+3,176.3,2.2);barrel(scene,-55,y,168);barrel(scene,-55,y,163);
   box(scene,[.5,18,.5],[-26,y+9,118],"ink");W.flag=box(scene,[6,3.6,.2],[-23,y+16,118],"orange",{dyn:true});const fs=W.flag;
   const lab2=box(scene,[16,4,.6],[-30,y+5,117],"cream");sign(lab2,"front","ТВОЯ БАЗА","forest");box(scene,[.8,6,.8],[-37,y+3,117],"white",{tex:"planks",tile:2});box(scene,[.8,6,.8],[-23,y+3,117],"white",{tex:"planks",tile:2});
   for(let i=0;i<5;i++){box(scene,[6,.6,3],[-48+i*0,y+.3,128+i*7],"orangeDeep");for(let k=0;k<4;k++)box(scene,[.8,1.2,.8],[-50+k*1.4,y+1.2,128+i*7],["orange","paper","pin","tan"][(i+k)%4])}}
  W.home=V3(0,1,124);

  /* ---------- Ліс і окремі гаї ---------- */
  const R=seeded(42),F=LAY.forest;W.trees=[];
  const okSpot=(x,z,d)=>!(Math.abs(x)<9&&z>-178)&&Math.hypot(x+180,z+300)>13&&W.trees.every(([tx,tz])=>Math.hypot(tx-x,tz-z)>d);
  const plantTree=(x,z,dens)=>{const k=R();
    if(k<.3)oak(scene,x,z,R,.85+R()*.55+dens*.3);else if(k<.56)spruce(scene,x,z,R,.85+R()*.6);else if(k<.72)birch(scene,x,z,R);
    else if(k<.8)giant(scene,x,z,R);else if(k<.85)deadTree(scene,x,z,R);else spruce(scene,x,z,R,1.3+R()*.5);W.trees.push([x,z])};
  // густий ліс: сітка з тремтінням + шум щільності (галявини, хащі, стежки)
  for(let gx=F.x1;gx<F.x2;gx+=10)for(let gz=F.z1;gz<F.z2;gz+=10){const x=gx+R()*10,z=gz+R()*10,dens=fbm(x*.011+40,z*.011-9);
    if(dens<-.3)continue;if(R()>.62+dens*.7)continue;if(!okSpot(x,z,6))continue;plantTree(x,z,Math.max(0,dens));
    if(R()<.3)forestDecor(scene,x+(R()-.5)*9,z+(R()-.5)*9,R)}
  // узлісся та гаї за межами лісу
  const groves=[[-150,40,10],[160,60,8],[-260,140,12],[230,200,9],[-120,250,10],[120,-60,7],[-200,-60,9],[300,-180,10],[-520,180,9],[520,230,8],[-560,-200,10],[560,-80,7],[-300,-150,8],[180,-150,9]];
  for(const [gx,gz,n] of groves)for(let i=0;i<n;i++){const x=gx+(R()-.5)*64,z=gz+(R()-.5)*64;if(zoneBlocked(x,z,8)||!okSpot(x,z,7))continue;plantTree(x,z,0);if(R()<.25)forestDecor(scene,x+4,z+3,R)}
  for(let i=0;i<46;i++){const x=(R()-.5)*1100,z=(R()-.5)*1000;if(zoneBlocked(x,z,8))continue;const sz=3+R()*6,y=groundH(x,z);boulder(scene,x,y+sz*.25,z,sz*1.3,sz*.8,sz,R,null,{collide:sz>4});if(R()<.5)box(scene,[sz,.4,sz*.8],[x,y+sz*.62,z],"white",{tex:"moss",tile:2})}
  const gate=box(scene,[16,3,.5],[0,6,-114],"forest");sign(gate,"front","ШЕПІТНИЙ ЛІС","cream");sign(gate,"back","ШЕПІТНИЙ ЛІС","cream");
  box(scene,[1,7.5,1],[-8,3.75,-114],"white",{tex:"bark",tile:2,collide:true});box(scene,[1,7.5,1],[8,3.75,-114],"white",{tex:"bark",tile:2,collide:true});
  stoneTablet(scene,-180,groundH(-180,-300)+3,-300,20,"1 — "+SYM[S.solution[0]]);

  buildCave();buildTemple();buildCastle();buildObservatory();
  // межі світу
  for(const [s,p] of [[[1500,300,2],[0,150,-700]],[[1500,300,2],[0,150,700]],[[2,300,1500],[-700,150,0]],[[2,300,1500],[700,150,0]]]){const m=box(scene,s,p,"forest",{collide:true});m.visible=false}
  buildVegetation();buildCritters();
  scene.updateMatrixWorld(true);
}
function zoneBlocked(x,z,pad){
  for(const zn of ZONES){if(zn.skip)continue;if(x>zn.x0-pad&&x<zn.x1+pad&&z>zn.z0-pad&&z<zn.z1+pad)return true}
  if(Math.hypot(x-LAY.obs.x,z-LAY.obs.z)<OBS_R+pad+10)return true;
  if(Math.max(Math.abs(x),Math.abs(z))>600)return true;
  return false;
}

/* ---------- Затоплений храм (захід) ---------- */
const TEMPLE={x0:-462,x1:-398,z0:-52,z1:12,y:1.5,gx:-448,gz:-34,cell:8};
function buildTemple(){
  const T=TEMPLE,y=T.y,st={tex:"templeStone",tile:4};
  // підлога з басейнами (басейни — пастка)
  const fl=(x0,x1,z0,z1)=>box(scene,[x1-x0,y,z1-z0],[(x0+x1)/2,y/2,(z0+z1)/2],"white",{...st,collide:true,shadow:false});
  fl(-462,-458,-52,12);fl(-452,-410,-52,12);fl(-404,-398,-52,12);fl(-458,-452,-52,-32);fl(-458,-452,4,12);fl(-410,-404,-52,-32);fl(-410,-404,4,12);
  for(const px of[-455,-407]){box(scene,[6,.3,36],[px,.35,-14],"white",{material:mat("white","tex:water"),shadow:false});box(scene,[6,.2,36],[px,.05,-14],"templeDark",{shadow:false})}
  W.pools=[{x0:-458,x1:-452,z0:-32,z1:4},{x0:-410,x1:-404,z0:-32,z1:4}];
  W.pools.forEach(p=>W.traps.push({x0:p.x0,x1:p.x1,z0:p.z0,z1:p.z1,y:1.2,respawn:V3(-392,0,-20),msg:"Бульк! Вода в храмі крижана й глибока. Обходь басейни!"}));
  // сходи на схід
  for(let i=0;i<3;i++)box(scene,[2,.5*(i+1),20],[-396+(2-i)*2-2,.25*(i+1),-20],"white",{...st,collide:true,shadow:false});
  const h=14,RT=seeded(19),w=(x0,x1,z0,z1,hh,ruin)=>masonryWall(scene,x0,x1,z0,z1,y,hh||h,RT,{tex:"templeStone",ruin,pilaster:8});
  w(-462,-460,-52,12,0,true);w(-462,-398,-52,-50,0,true);w(-400,-398,-52,-26);w(-400,-398,-14,12);box(scene,[2,4,12],[-399,y+h-2,-20],"white",{...st});stoneArch(scene,-397.6,-20,y,12,8,true,"templeStone",2);
  // південна стіна з таємною панеллю
  w(-462,-442,10,12);w(-434,-398,10,12);box(scene,[8,6,2],[-438,y+h-3,11],"white",{...st});
  W.secretPanel=box(scene,[8,h-6,2],[-438,y+(h-6)/2,11],"white",{tex:"templeStone",tile:4,collide:true,dyn:true});
  W.looseBrick=box(scene,[1.6,1,.4],[-438,y+4,9.8],"#8FA79A",{dyn:true});
  // таємна кімната
  wall(scene,-450,-448,12,30,0,12,{tex:"templeStone"});wall(scene,-428,-426,12,30,0,12,{tex:"templeStone"});wall(scene,-450,-426,28,30,0,12,{tex:"templeStone"});
  box(scene,[24,1,18],[-438,.5,21],"white",{...st,collide:true,shadow:false});const srR=roofGroup(-450,-426,12,30,13);box(srR,[26,1.2,20],[-438,12.6,21],"white",{...st});
  W.secretChestPos=V3(-438,1,24);
  // внутрішня стіна святилища
  w(-460,-444,-36,-34,12);w(-436,-400,-36,-34,12);
  W.sanctumDoor=box(scene,[8,10,2],[-440,y+5,-35],"white",{tex:"templeStone",tile:3,collide:true,dyn:true});
  W.crystal=box(scene,[2,3,2],[-420,y+5,-33.5],"#9FE3D8",{m:"glass",rot:[0,45,0],dyn:true});
  box(scene,[6,2.4,4],[-452,y+1.2,-44],"white",{tex:"marble",tile:2,collide:true});W.altarPos=V3(-452,y+2.4,-44);
  const altarHolder=new THREE.Group();altarHolder.position.copy(W.altarPos);altarHolder.userData.noMerge=true;scene.add(altarHolder);W.altarHolder=altarHolder;
  // колони й руїни (без даху — храм під відкритим небом)
  for(const x of[-456,-444,-432,-420,-408])for(const z of[-46,6]){const hh=x===-432&&z===6?6:h-1;box(scene,[2.6,hh,2.6],[x,y+hh/2,z],"white",{shape:"vcyl",material:mat("white","tex:templeStone"),collide:true})}
  for(let i=0;i<6;i++)box(scene,[2,1,8+i],[-460+i*12,y+h+.5,-51],"white",{...st});
  for(let i=0;i<8;i++)box(scene,[.5,4+i%3*2,.3],[-458+i*8,y+h-3,-49.6],"greenMid",{m:"sway"});
  owl(scene,-446,y,4,180);
  const tab=box(scene,[6,4,.5],[-394,3,-31],"white",{tex:"templeStone",tile:3});sign(tab,"back","ЗАТОПЛЕНИЙ ХРАМ","ink");
  W.templeHint=V3(-394,3,-31);
  // дзеркала й промінь
  W.mirrors=[];const cells=[[1,2],[2,2],[2,0],[3,0]];
  cells.forEach(([i,j],k)=>{const x=T.gx+i*T.cell,z=T.gz+j*T.cell;box(scene,[2.4,3,2.4],[x,y+1.5,z],"white",{tex:"marble",tile:2,collide:true});
    const g=new THREE.Group();g.position.set(x,y+4.6,z);g.userData.noMerge=true;scene.add(g);box(g,[3.4,3,.3],[0,0,0],"#BFE3F5",{m:"glass",dyn:true});box(g,[3.8,.3,.5],[0,1.6,0],"gold",{m:"metal",dyn:true});
    W.mirrors.push({i,j,g,pos:V3(x,y+3,z)})});
  W.sourcePos=V3(T.x0+2,y+4.6,T.gz+2*T.cell);box(scene,[1,3,3],[T.x0+2.2,y+4.6,T.gz+2*T.cell],"#FFE7A3",{m:"neon"});
  W.beam=new THREE.Group();W.beam.userData.noMerge=true;scene.add(W.beam);
}

/* ---------- Руїни обсерваторії (пагорб на південному заході) ---------- */
function buildObservatory(){
  const o=LAY.obs,y=o.h,cx=o.x,cz=o.z;
  box(scene,[60,1,60],[cx,y-.3,cz],"white",{shape:"vcyl",material:mat("white","tex:marble"),shadow:false});
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2,x=cx+Math.cos(a)*27,z=cz+Math.sin(a)*27,hh=i%3===0?5:i%4===0?8:12;
    box(scene,[2.6,hh,2.6],[x,y+hh/2,z],"white",{shape:"vcyl",material:mat("white","tex:marble"),collide:true});if(hh===12)box(scene,[3.4,.8,3.4],[x,y+12.4,z],"white",{tex:"marble",tile:2})}
  box(scene,[10,1.4,10],[cx,y+.7,cz],"white",{shape:"vcyl",material:mat("white","tex:marble"),collide:true});
  W.armillary=new THREE.Group();W.armillary.position.set(cx,y+6,cz);W.armillary.userData.noMerge=true;scene.add(W.armillary);
  for(let r=0;r<3;r++){const ring=new THREE.Group();for(let a=0;a<16;a++){const t=a/16*Math.PI*2;box(ring,[1.2,.3,.3],[Math.cos(t)*(3.2+r*.6),Math.sin(t)*(3.2+r*.6),0],r===1?"gold":"bronze",{m:"metal",rot:[0,0,t/DEG+90],dyn:true})}ring.rotation.y=r*1.1;W.armillary.add(ring)}
  box(W.armillary,[1.4,1.4,1.4],[0,0,0],"orange",{m:"neon",dyn:true});
  box(scene,[1,4.6,1],[cx,y+3.4,cz],"bronze",{m:"metal"});
  W.obsStart=V3(cx,y+2,cz-6);const pl=box(scene,[3,2,1.2],[cx,y+1.8,cz-6],"forest");sign(pl,"front","ЗАПУСК","cream");
  W.pillars=[];const PC=["#D2601A","#8CC04F","#9FE3D8","#F2B632","#D33A2C"],NOTE=[392,440,494,587,659];
  for(let i=0;i<5;i++){const a=-Math.PI/2+(i-2)*.55+Math.PI,x=cx+Math.cos(a)*15,z=cz+Math.sin(a)*15;
    box(scene,[2.4,4,2.4],[x,y+2,z],"white",{tex:"marble",tile:2,collide:true});const cr=box(scene,[1.8,2.4,1.8],[x,y+5.2,z],PC[i],{dyn:true,rot:[0,45,0]});
    W.pillars.push({i,mesh:cr,col:PC[i],note:NOTE[i],pos:V3(x,y+4,z)})}
  // архів (прихована кімната)
  const ax=cx,az=cz+22,x0=ax-7,x1=ax+7,z0=az-5,z1=az+6;
  wall(scene,x0,x1,z1-1.4,z1,y,10,{tex:"marble"});wall(scene,x0,x0+1.4,z0,z1,y,10,{tex:"marble"});wall(scene,x1-1.4,x1,z0,z1,y,10,{tex:"marble"});
  wall(scene,x0,ax-3,z0,z0+1.4,y,10,{tex:"marble"});wall(scene,ax+3,x1,z0,z0+1.4,y,10,{tex:"marble"});box(scene,[6,2,1.4],[ax,y+9,z0+.7],"white",{tex:"marble",tile:2});
  W.archiveDoor=box(scene,[6,8,1.2],[ax,y+4,z0+.7],"bronze",{m:"metal",collide:true,dyn:true});
  const arR=roofGroup(x0,x1,z0,z1,y+11);box(arR,[16,1.2,13],[ax,y+10.6,(z0+z1)/2],"white",{tex:"marble",tile:3});box(arR,[16,.6,1],[ax,y+11.4,z0],"gold",{m:"metal"});
  const as=box(scene,[8,1.6,.3],[ax,y+11.4,z0-.4],"forestDeep");sign(as,"front","АРХІВ","gold");
  box(scene,[4,2,3],[ax-3,y+1,az+2],"white",{tex:"marble",tile:2,collide:true});W.archivePos=V3(ax-3,y+2,az+2);
  W.archiveHolder=new THREE.Group();W.archiveHolder.position.copy(W.archivePos);W.archiveHolder.userData.noMerge=true;scene.add(W.archiveHolder);
  W.archiveChestPos=V3(ax+3,y,az+2.5);
  const t=box(scene,[6,3,.5],[cx,y+1.5,cz-30],"white",{tex:"marble",tile:2});sign(t,"front","ОБСЕРВАТОРІЯ","forest");

}

/* ---------- Рослинність (інстансинг, вітер) ---------- */
function tuftGeo(){const g=new THREE.BufferGeometry(),pos=[],nor=[];const blade=(a,h,lean)=>{const cx=Math.cos(a)*.18,cz=Math.sin(a)*.18,w=.18,dx=-Math.sin(a)*w,dz=Math.cos(a)*w;
    const tx=cx+Math.cos(a)*lean,tz=cz+Math.sin(a)*lean;const v=[[cx-dx,0,cz-dz],[cx+dx,0,cz+dz],[tx,h,tz]];for(const q of v){pos.push(...q);nor.push(0,1,0)}for(const q of[v[1],v[0],v[2]]){pos.push(...q);nor.push(0,1,0)}};
  for(let i=0;i<7;i++)blade(i/7*Math.PI*2+i,.9+(i%3)*.45,.35);g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("normal",new THREE.Float32BufferAttribute(nor,3));return g}
function scatter(count,test,place){const out=[];let tries=0;while(out.length<count&&tries<count*12){tries++;const x=(Math.random()-.5)*1180,z=(Math.random()-.5)*1180;if(!test(x,z))continue;out.push(place(x,z))}return out}
function buildVegetation(){
  const dummy=new THREE.Object3D(),col=new THREE.Color();
  const cluster=(x,z,f,th)=>fbm(x*f+5,z*f-3)>th;
  // трава
  const grassM=addSway(new THREE.MeshLambertMaterial({side:THREE.DoubleSide,vertexColors:false}),.35,true);
  const GN=9000,grass=new THREE.InstancedMesh(tuftGeo(),grassM,GN);let gi=0;
  scatter(GN,(x,z)=>!zoneBlocked(x,z,2)&&cluster(x,z,.018,-.15),(x,z)=>{const s=.8+Math.random()*1.2;dummy.position.set(x,groundH(x,z),z);dummy.rotation.set(0,Math.random()*6.28,0);dummy.scale.set(s,s*(.8+Math.random()*.7),s);dummy.updateMatrix();grass.setMatrixAt(gi,dummy.matrix);
    col.copy(lin(["#7FB24E","#8CC04F","#6FA83A","#9CCB5E"][gi%4]));grass.setColorAt(gi,col);gi++});
  grass.count=gi;grass.userData.noMerge=true;grass.receiveShadow=true;scene.add(grass);
  // квіти
  const FN=1600,flowers=new THREE.InstancedMesh(new THREE.BoxGeometry(.7,.7,.7).translate(0,1.4,0),addSway(new THREE.MeshLambertMaterial(),.3,true),FN);let fi=0;
  const stems=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,1.4,.12).translate(0,.7,0),addSway(new THREE.MeshLambertMaterial({color:lin("#4E8B3A")}),.3,true),FN);
  scatter(FN,(x,z)=>!zoneBlocked(x,z,3)&&cluster(x,z,.03,.25),(x,z)=>{dummy.position.set(x,groundH(x,z),z);dummy.rotation.set(0,Math.random()*6.28,0);const s=.7+Math.random()*.6;dummy.scale.set(s,s,s);dummy.updateMatrix();flowers.setMatrixAt(fi,dummy.matrix);stems.setMatrixAt(fi,dummy.matrix);
    col.copy(lin(["#D2601A","#FBF8EC","#F4C27F","#D33A2C","#C9A2E8"][fi%5]));flowers.setColorAt(fi,col);fi++});
  flowers.count=stems.count=fi;[flowers,stems].forEach(m=>{m.userData.noMerge=true;scene.add(m)});
  // кущі різних розмірів
  const BN=420,bushA=new THREE.InstancedMesh(boxGeo,addSway(new THREE.MeshLambertMaterial(),.12,true),BN),bushB=new THREE.InstancedMesh(boxGeo,addSway(new THREE.MeshLambertMaterial(),.12,true),BN);let bi=0;
  W.bushes=[];
  scatter(BN,(x,z)=>!zoneBlocked(x,z,6)&&(cluster(x,z,.012,.05)||Math.random()<.08)&&W.trees.every(([tx,tz])=>Math.abs(tx-x)>5||Math.abs(tz-z)>5),(x,z)=>{const s=1.5+Math.pow(Math.random(),2)*3.4,y=groundH(x,z);
    dummy.position.set(x,y+s*.35,z);dummy.rotation.set(0,Math.random()*6.28,0);dummy.scale.set(s*1.3,s*.75,s*1.1);dummy.updateMatrix();bushA.setMatrixAt(bi,dummy.matrix);
    dummy.position.set(x+s*.25,y+s*.8,z-s*.15);dummy.scale.set(s*.8,s*.6,s*.8);dummy.updateMatrix();bushB.setMatrixAt(bi,dummy.matrix);
    const g=["#2F7D32","#3E8A3F","#1E5A2B","#4F9A45"][bi%4];bushA.setColorAt(bi,lin(g));bushB.setColorAt(bi,lin(["#6FA83A","#8CC04F"][bi%2]));
    if(s>3.2){const cl={box:new THREE.Box3(V3(x-s*.55,y,z-s*.5),V3(x+s*.55,y+s*.9,z+s*.5)),on:true,tag:"bush"};colliders.push(cl)}
    W.bushes.push(V3(x,y+s,z));bi++});
  bushA.count=bushB.count=bi;
  buildFerns(dummy,col);[bushA,bushB].forEach(m=>{m.userData.noMerge=true;m.castShadow=true;m.receiveShadow=true;scene.add(m)});
}
/* ---------- Комахи й птахи ---------- */
function buildCritters(){
  W.butterflies=[];const wingG=new THREE.PlaneGeometry(.9,.7).translate(.45,0,0);
  for(let i=0;i<26;i++){const g=new THREE.Group();g.userData.noMerge=true;const colr=["#D2601A","#FBF8EC","#F4C27F","#9FE3D8"][i%4];
    const m=new THREE.MeshLambertMaterial({color:lin(colr),side:THREE.DoubleSide});const l=new THREE.Mesh(wingG,m),r=new THREE.Mesh(wingG,m);r.scale.x=-1;g.add(l,r);
    box(g,[.12,.12,.6],[0,0,0],"ink",{dyn:true});scene.add(g);const home=W.bushes[Math.floor(Math.random()*W.bushes.length)]||V3(0,2,0);
    W.butterflies.push({g,l,r,home:home.clone(),ph:Math.random()*10,sp:.6+Math.random()*.6})}
  // мошки/світлячки біля гравця (точки)
  const N=70,pg=new THREE.BufferGeometry();pg.setAttribute("position",new THREE.Float32BufferAttribute(new Float32Array(N*3),3));
  W.gnats=new THREE.Points(pg,new THREE.PointsMaterial({color:lin("#F4E7A0"),size:.35,transparent:true,opacity:.85}));W.gnats.userData={seeds:[...Array(N)].map(()=>[Math.random()*6.28,Math.random()*6.28,1+Math.random()*2,Math.random()])};scene.add(W.gnats);
  // птахи
  W.birds=[];const bw=new THREE.BufferGeometry();bw.setAttribute("position",new THREE.Float32BufferAttribute([0,0,-.6,0,0,.6,2.4,.2,0],3));bw.computeVertexNormals();
  const bm=new THREE.MeshBasicMaterial({color:lin("#173A1D"),side:THREE.DoubleSide,fog:true});
  for(let f=0;f<3;f++){const cx=(Math.random()-.5)*600,cz=(Math.random()-.5)*600,r=120+Math.random()*120,h=70+Math.random()*40,sp=(.05+Math.random()*.04)*(f%2?1:-1);
    for(let i=0;i<5;i++){const g=new THREE.Group();const L=new THREE.Mesh(bw,bm),Rr=new THREE.Mesh(bw,bm);Rr.scale.x=-1;g.add(L,Rr);scene.add(g);W.birds.push({g,L,R:Rr,cx,cz,r:r+i*6,h:h+(i%2)*4,sp,off:i*.06,ph:Math.random()*6})}}
}

// папороть і підлісок у лісі (інстансинг)
function buildFerns(dummy,col){
  const g=new THREE.BufferGeometry(),pos=[],nor=[];for(let i=0;i<6;i++){const a=i/6*6.28,dx=Math.cos(a),dz=Math.sin(a),px=-dz*.35,pz=dx*.35;
    const v=[[px,0,pz],[-px,0,-pz],[dx*2.2-px*.4,1.1,dz*2.2-pz*.4],[dx*2.2+px*.4,1.1,dz*2.2+pz*.4]];for(const t of[[0,1,2],[1,3,2]])for(const k of t){pos.push(...v[k]);nor.push(0,1,0)}}
  g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("normal",new THREE.Float32BufferAttribute(nor,3));
  const N=3600,m=new THREE.InstancedMesh(g,addSway(new THREE.MeshLambertMaterial({side:THREE.DoubleSide}),.25,true),N);let i=0;const F=LAY.forest;
  for(let t=0;t<N*6&&i<N;t++){const x=F.x1+Math.random()*(F.x2-F.x1),z=F.z1+Math.random()*(F.z2-F.z1);if(Math.abs(x)<7&&z>-178)continue;if(fbm(x*.02,z*.02)<-.15)continue;
    dummy.position.set(x,groundH(x,z),z);dummy.rotation.set(0,Math.random()*6.28,0);const s=.8+Math.random()*1.1;dummy.scale.set(s,s,s);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);m.setColorAt(i,lin(["#2F7D32","#3E8A3F","#4F9A45","#25683A"][i%4]));i++}
  m.count=i;m.userData.noMerge=true;m.receiveShadow=true;scene.add(m);
}
