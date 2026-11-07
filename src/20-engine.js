/* ================= Рушій: сцена, світло, небо ================= */
const canvas=document.getElementById("c");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(1.75,window.devicePixelRatio||1));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const lin=h=>new THREE.Color(h).convertSRGBToLinear();
const SKY_DAY=lin("#BFE3F5"),SKY_NIGHT=lin("#1B2A44"),SKY_DARK=lin("#0E120F");
scene.background=SKY_DAY.clone();
const FOG_DAY=lin("#D7E8D6");
scene.fog=new THREE.Fog(FOG_DAY.clone(),260,1250);
const hemi=new THREE.HemisphereLight(0xffffff,0x7d8f62,.9);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d6,.9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-95,right:95,top:95,bottom:-95,near:1,far:520});sun.shadow.bias=-.0005;sun.shadow.normalBias=.4;
scene.add(sun);scene.add(sun.target);
const camera=new THREE.PerspectiveCamera(60,1,.3,4200);
const UNI={uTime:{value:0},uWind:{value:1}};

/* ---- Шум і рельєф ---- */
function hash2(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s)}
function vnoise(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,ux=fx*fx*(3-2*fx),uz=fz*fz*(3-2*fz);
  const a=hash2(ix,iz),b=hash2(ix+1,iz),cc=hash2(ix,iz+1),d=hash2(ix+1,iz+1);return (a+(b-a)*ux+(cc-a)*uz+(a-b-cc+d)*ux*uz)*2-1}
function fbm(x,z){let s=0,a=.5,f=1;for(let i=0;i<4;i++){s+=vnoise(x*f,z*f)*a;f*=2.03;a*=.5}return s}

/* Ключові місця світу */
const LAY={
 hub:{x:0,z:0}, base:{x:0,z:150}, stop:{x:26,z:110}, road:{z:100},
 forest:{x1:-260,x2:260,z1:-360,z2:-120},
 canyon:{x:410,z:0}, temple:{x:-430,z:-20}, crypt:{x:405,z:-290}, obs:{x:-330,z:235,h:16},
 shop:{x:-22,z:-6},
};
/* Зони вирівнювання рельєфу: rect {x0,x1,z0,z1,h,pad,col} */
const ZONES=[
 {x0:-36,x1:36,z0:-36,z1:36,h:0,pad:40},
 {x0:-56,x1:56,z0:108,z1:196,h:0,pad:40},
 {x0:-720,x1:720,z0:91,z1:109,h:0,pad:34,col:"road"},
 {x0:-5,x1:5,z0:-125,z1:-36,h:0,pad:14,col:"path"},
 {x0:-5,x1:5,z0:36,z1:91,h:0,pad:14,col:"path"},
 {x0:36,x1:300,z0:-5,z1:5,h:0,pad:16,col:"path"},
 {x0:-385,x1:-36,z0:-5,z1:5,h:0,pad:16,col:"path"},
 {x0:280,x1:550,z0:-100,z1:96,h:0,pad:34},
 {x0:-480,x1:-370,z0:-80,z1:40,h:0,pad:36},
 {x0:340,x1:475,z0:-350,z1:-225,h:0,pad:36},
 {x0:255,x1:345,z0:-298,z1:-282,h:0,pad:14,col:"path"},
 {x0:-56,x1:-300,z0:0,z1:0,h:0,pad:0,skip:1},
];
// доріжка до обсерваторії та плато на пагорбі задаються окремо
const OBS_R=34,OBS_PAD=78;
function zoneW(z,x,zz){const dx=Math.max(z.x0-x,0,x-z.x1),dz=Math.max(z.z0-zz,0,zz-z.z1),d=Math.hypot(dx,dz);return z.pad?1-smooth(0,z.pad,d):(d===0?1:0)}
function terrainRaw(x,z){
  let h=fbm(x*.0042+3.1,z*.0042-7.3)*22+fbm(x*.014+11,z*.014)*4.5;
  const F=LAY.forest;const inF=smooth(30,0,Math.max(F.x1-x,0,x-F.x2,F.z1-z,0,z-F.z2));h*=1-.45*inF;
  const r=Math.max(Math.abs(x),Math.abs(z)*1.05);h+=smooth(560,720,r)*95+smooth(640,760,r)*80;
  return Math.max(h,-5);
}
function terrainH(x,z){
  let h=terrainRaw(x,z);
  const o=LAY.obs,dO=Math.hypot(x-o.x,z-o.z),wO=1-smooth(OBS_R,OBS_R+OBS_PAD,dO);h=h*(1-wO)+o.h*wO;
  for(const zn of ZONES){if(zn.skip)continue;const w=zoneW(zn,x,z);if(w>0)h=h*(1-w)+zn.h*w}
  return h;
}
function pathColorW(x,z){let road=0,path=0;for(const zn of ZONES){if(!zn.col)continue;const dx=Math.max(zn.x0-x,0,x-zn.x1),dz=Math.max(zn.z0-z,0,z-zn.z1),d=Math.hypot(dx,dz);const w=1-smooth(0,2.5,d);if(zn.col==="road")road=Math.max(road,w);else path=Math.max(path,w)}
  // доріжка до обсерваторії (крива)
  return {road,path};
}
/* Швидка сітка висот для фізики */
const HG={size:1700,step:4,n:0,data:null};
function buildHeightGrid(){HG.n=Math.floor(HG.size/HG.step)+1;HG.data=new Float32Array(HG.n*HG.n);const h0=-HG.size/2;
  for(let j=0;j<HG.n;j++)for(let i=0;i<HG.n;i++)HG.data[j*HG.n+i]=terrainH(h0+i*HG.step,h0+j*HG.step)}
function groundH(x,z){const h0=-HG.size/2,fx=(x-h0)/HG.step,fz=(z-h0)/HG.step;let i=Math.floor(fx),j=Math.floor(fz);
  if(i<0||j<0||i>=HG.n-1||j>=HG.n-1)return 0;const tx=fx-i,tz=fz-j,n=HG.n,d=HG.data;
  return (d[j*n+i]*(1-tx)+d[j*n+i+1]*tx)*(1-tz)+(d[(j+1)*n+i]*(1-tx)+d[(j+1)*n+i+1]*tx)*tz}

/* ---- Процедурні текстури ---- */
const TEX={};
function canvasTex(name,w,h,draw){const cv=document.createElement("canvas");cv.width=w;cv.height=h;const x=cv.getContext("2d");draw(x,w,h);const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;TEX[name]=t;return t}
function speckle(x,w,h,n,cols,a){for(let i=0;i<n;i++){x.globalAlpha=a*(.4+Math.random()*.6);x.fillStyle=cols[i%cols.length];const s=1+Math.random()*2.5;x.fillRect(Math.random()*w,Math.random()*h,s,s)}x.globalAlpha=1}
function makeTextures(){
  canvasTex("plaster",256,256,(x,w,h)=>{x.fillStyle="#F3EEDC";x.fillRect(0,0,w,h);speckle(x,w,h,1400,["#E2DCC4","#FFFDF2","#D8D1B6"],.6);x.strokeStyle="rgba(150,140,110,.18)";x.lineWidth=2;for(let y=64;y<h;y+=64){x.beginPath();x.moveTo(0,y);x.lineTo(w,y);x.stroke()}});
  canvasTex("planks",256,256,(x,w,h)=>{const cols=["#9A6537","#8C5A2B","#A26E3E","#83552B"];for(let i=0;i<8;i++){x.fillStyle=cols[i%4];x.fillRect(i*32,0,32,h);x.strokeStyle="rgba(50,25,8,.45)";x.lineWidth=2;x.strokeRect(i*32+1,0,31,h);x.strokeStyle="rgba(60,30,10,.25)";x.lineWidth=1;for(let k=0;k<5;k++){x.beginPath();const ox=i*32+4+Math.random()*24;x.moveTo(ox,0);x.bezierCurveTo(ox+4,h*.3,ox-4,h*.6,ox+2,h);x.stroke()}x.fillStyle="rgba(40,20,5,.6)";x.beginPath();x.arc(i*32+16,(i*57)%h,2.5,0,7);x.fill()}});
  const blocks=(name,base,mortar,var1,rows,cols)=>canvasTex(name,256,256,(x,w,h)=>{x.fillStyle=mortar;x.fillRect(0,0,w,h);const bh=h/rows,bw=w/cols;for(let r=0;r<rows;r++)for(let k=-1;k<cols;k++){const ox=(r%2?bw/2:0)+k*bw;x.fillStyle=var1[(r*7+k*3+99)%var1.length];x.fillRect(ox+2,r*bh+2,bw-4,bh-4);x.fillStyle="rgba(255,255,255,.12)";x.fillRect(ox+2,r*bh+2,bw-4,3)}speckle(x,w,h,900,["#000","#fff"],.08)});
  blocks("stone","#B9B49C","#8E8B7C",["#BDB8A0","#B2AD95","#C4BFA8","#ADA88F"],4,2);
  blocks("templeStone","#A9B8AE","#6E8178",["#A9B8AE","#9FAFA4","#B3C1B7","#98A99E"],4,2);
  blocks("cryptStone","#5E5A52","#2F2C27",["#5E5A52","#55514A","#67625A","#4C4943"],5,3);
  blocks("marble","#EDE6D3","#C8C0A8",["#EDE6D3","#F4EEDD","#E4DCC6","#EAE2CC"],3,2);
  canvasTex("sandstone",256,256,(x,w,h)=>{const cols=["#D9A066","#CF9358","#E0AB72","#C98A55","#D59B60"];let y=0;while(y<h){const t=8+Math.random()*26;x.fillStyle=cols[Math.floor(Math.random()*cols.length)];x.fillRect(0,y,w,t);y+=t}speckle(x,w,h,1500,["#8C5A2B","#F4C27F"],.15)});
  canvasTex("roof",256,256,(x,w,h)=>{x.fillStyle="#173F1F";x.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let k=-1;k<8;k++){const ox=k*32+(r%2?16:0),oy=r*32;x.fillStyle=["#1E5A2B","#22652F","#1B5227"][(r+k+9)%3];x.beginPath();x.moveTo(ox+1,oy);x.lineTo(ox+31,oy);x.lineTo(ox+31,oy+22);x.quadraticCurveTo(ox+16,oy+34,ox+1,oy+22);x.closePath();x.fill();x.fillStyle="rgba(255,255,255,.08)";x.fillRect(ox+3,oy+2,26,3)}});
  canvasTex("roofOrange",256,256,(x,w,h)=>{x.fillStyle="#8C3D0E";x.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let k=-1;k<8;k++){const ox=k*32+(r%2?16:0),oy=r*32;x.fillStyle=["#D2601A","#C65922","#DA6E2A"][(r+k+9)%3];x.beginPath();x.moveTo(ox+1,oy);x.lineTo(ox+31,oy);x.lineTo(ox+31,oy+22);x.quadraticCurveTo(ox+16,oy+34,ox+1,oy+22);x.closePath();x.fill()}});
  canvasTex("floor",256,256,(x,w,h)=>{for(let r=0;r<4;r++)for(let k=0;k<4;k++){x.fillStyle=(r+k)%2?"#E9DFC3":"#D9C9A0";x.fillRect(k*64,r*64,64,64);x.strokeStyle="rgba(120,100,60,.35)";x.strokeRect(k*64+.5,r*64+.5,63,63)}speckle(x,w,h,600,["#8C5A2B","#fff"],.1)});
  canvasTex("labFloor",256,256,(x,w,h)=>{for(let r=0;r<4;r++)for(let k=0;k<4;k++){x.fillStyle=(r+k)%2?"#E3EFC4":"#EEF4DC";x.fillRect(k*64,r*64,64,64);x.strokeStyle="rgba(30,90,43,.25)";x.strokeRect(k*64+.5,r*64+.5,63,63)}});
  canvasTex("asphalt",256,256,(x,w,h)=>{x.fillStyle="#5E6B57";x.fillRect(0,0,w,h);speckle(x,w,h,3000,["#4E5A48","#6F7C67","#86917C"],.5)});
  canvasTex("bark",128,256,(x,w,h)=>{x.fillStyle="#8C5A2B";x.fillRect(0,0,w,h);x.strokeStyle="rgba(40,20,5,.4)";x.lineWidth=3;for(let i=0;i<10;i++){const ox=Math.random()*w;x.beginPath();x.moveTo(ox,0);x.lineTo(ox+(Math.random()-.5)*12,h);x.stroke()}});
  canvasTex("stripes",128,128,(x,w,h)=>{for(let i=0;i<4;i++){x.fillStyle=i%2?"#FBF8EC":"#D2601A";x.fillRect(i*32,0,32,h)}});
  canvasTex("water",256,256,(x,w,h)=>{x.fillStyle="#4FA3A0";x.fillRect(0,0,w,h);x.strokeStyle="rgba(255,255,255,.35)";x.lineWidth=2;for(let i=0;i<26;i++){const y=Math.random()*h,ox=Math.random()*w;x.beginPath();x.moveTo(ox,y);x.quadraticCurveTo(ox+10,y-4,ox+22,y);x.stroke()}});
}

/* ---- Матеріали ---- */
const matCache={};
function mat(col,kind,op){
  const k=col+"|"+(kind||"")+"|"+(op||1);if(matCache[k])return matCache[k];
  const color=lin(c(col));const o={color};
  if(kind==="neon"){o.emissive=color;o.emissiveIntensity=.9}
  if(kind==="glass"){o.transparent=true;o.opacity=.55}
  if(kind==="metal"){o.emissive=color.clone().multiplyScalar(.14)}
  if(kind&&kind.startsWith("tex:")){o.map=TEX[kind.slice(4)];o.color=col==="white"?new THREE.Color(1,1,1):color}
  if(op&&op<1){o.transparent=true;o.opacity=op;o.depthWrite=false}
  const m=new THREE.MeshLambertMaterial(o);if(kind==="sway")addSway(m,.22);
  return matCache[k]=m;
}
// легке коливання від вітру (листя, кущі, трава)
function addSway(m,amp,instanced){
  m.onBeforeCompile=sh=>{sh.uniforms.uTime=UNI.uTime;sh.uniforms.uWind=UNI.uWind;
    sh.vertexShader="uniform float uTime;uniform float uWind;\n"+sh.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
      vec3 wp=(modelMatrix*${instanced?"instanceMatrix*":""}vec4(transformed,1.)).xyz;
      float k=${instanced?"clamp(position.y,0.,2.)":"1."};
      transformed.x+=sin(uTime*1.7+wp.x*.11+wp.z*.07)*${amp.toFixed(2)}*k*uWind;
      transformed.z+=cos(uTime*1.3+wp.z*.09)*${(amp*.6).toFixed(2)}*k*uWind;`)};
  m.customProgramCacheKey=()=>"sway"+amp+(instanced?"i":"");return m;
}

const boxGeo=new THREE.BoxGeometry(1,1,1);
const cylGeo=new THREE.CylinderGeometry(.5,.5,1,22);cylGeo.rotateX(Math.PI/2);
const vcylGeo=new THREE.CylinderGeometry(.5,.5,1,16);
const sphGeo=new THREE.SphereGeometry(.5,20,14);
const wedgeGeo=(()=>{const g=new THREE.BufferGeometry();const v=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5],[-.5,.5,.5],[.5,.5,.5]];
  const f=[[0,1,2],[0,2,3],[3,2,5],[3,5,4],[0,5,1],[0,4,5],[0,3,4],[1,5,2]];const pos=[],uv=[];f.forEach(t=>t.forEach(i=>{pos.push(...v[i]);uv.push(v[i][0]+.5,v[i][1]+.5)}));
  g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g})();
// куб із UV, що масштабуються за розміром (для текстур, які тайляться)
const tgeoCache={};
function tgeo(sx,sy,sz,tile){const k=[sx,sy,sz,tile].map(v=>v.toFixed(2)).join("|");if(tgeoCache[k])return tgeoCache[k];
  const g=new THREE.BoxGeometry(sx,sy,sz),uv=g.attributes.uv;const dims=[[sz,sy],[sz,sy],[sx,sz],[sx,sz],[sx,sy],[sx,sy]];
  for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k2=f*4+i;uv.setXY(k2,uv.getX(k2)*dims[f][0]/tile,uv.getY(k2)*dims[f][1]/tile)}
  return tgeoCache[k]=g}

const colliders=[]; // {box:THREE.Box3, on:true, tag}
const DEG=Math.PI/180;
function addCollider(m,tag){m.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(m);const cl={box:b,on:true,tag:tag||"",mesh:m};colliders.push(cl);m.userData.col=cl;return cl}
// box(parent,[sx,sy,sz],[x,y,z],color,{rot,collide,m,op,shape,shadow,tex,tile,dyn})
function box(parent,s,p,col,o={}){
  let g,m;
  if(o.tex){g=tgeo(s[0],s[1],s[2],o.tile||4);m=new THREE.Mesh(g,mat(col||"white","tex:"+o.tex))}
  else{g=o.shape==="wedge"?wedgeGeo:o.shape==="cyl"?cylGeo:o.shape==="vcyl"?vcylGeo:o.shape==="ball"?sphGeo:boxGeo;m=new THREE.Mesh(g,o.material||mat(col,o.m,o.op));m.scale.set(s[0],s[1],s[2])}
  m.position.set(p[0],p[1],p[2]);
  if(o.rot)m.rotation.set(o.rot[0]*DEG,o.rot[1]*DEG,o.rot[2]*DEG);
  m.castShadow=o.shadow!==false;m.receiveShadow=true;
  if(o.dyn)m.userData.dyn=true;
  parent.add(m);
  if(o.collide)addCollider(m,o.tag);
  return m;
}
function assemble(parts,scale=1){const g=new THREE.Group();g.userData.noMerge=true;
  for(const q of parts){box(g,q.s.map(v=>v*scale),q.p.map(v=>v*scale),q.c,{rot:q.rot,m:q.m,shape:q.w?"wedge":q.cyl?"cyl":undefined})}return g}
function artifactModel(id,scale=1){return assemble(ARTBY[id].parts,scale)}

/* ---- Персонажі ---- */
const FOX=[
 P([1,.45,1.15],[-.6,.22,-.05],"boot"),P([1,.45,1.15],[.6,.22,-.05],"boot"),P([.85,1.1,.85],[-.6,.95,0],"foxDark"),P([.85,1.1,.85],[.6,.95,0],"foxDark"),
 P([2.4,2,1.6],[0,2.5,0],"fox"),P([1,1.5,.1],[0,2.45,-.82],"paper"),P([.65,2.02,1.64],[-.88,2.5,0],"hat"),P([.65,2.02,1.64],[.88,2.5,0],"hat"),
 P([2.44,.28,1.66],[0,1.75,0],"boot"),P([.4,.4,.1],[0,1.75,-.86],"tan"),
 P([2.6,.4,1.8],[0,3.55,0],"forest"),P([1,.8,.2],[0,3,-.88],"forest",{w:1,rot:[180,0,0]}),
 P([.6,1.8,.6],[-1.55,2.55,0],"fox"),P([.66,.45,.66],[-1.55,1.5,0],"paper"),P([.6,1.8,.6],[1.55,2.55,0],"fox"),P([.66,.45,.66],[1.55,1.5,0],"paper"),
 P([1,.9,1.2],[0,1.9,1.3],"fox"),P([.95,1,.9],[0,2.5,2.2],"fox"),P([.9,.9,.9],[0,3.2,2.7],"paper"),
 P([3.4,2.6,2.6],[0,4.95,0],"fox"),P([1,.9,.1],[-1.2,4.3,-1.31],"paper"),P([1,.9,.1],[1.2,4.3,-1.31],"paper"),P([1.2,.85,.7],[0,4.4,-1.6],"paper"),P([.5,.35,.3],[0,4.75,-1.95],"ink"),
 P([.5,.6,.1],[-.75,5.3,-1.31],"ink"),P([.5,.6,.1],[.75,5.3,-1.31],"ink"),P([.18,.18,.05],[-.85,5.45,-1.37],"white"),P([.18,.18,.05],[.65,5.45,-1.37],"white"),
 P([.35,.2,.05],[-1.25,4.85,-1.33],"#F2A07B"),P([.35,.2,.05],[1.25,4.85,-1.33],"#F2A07B"),
 P([.9,1.3,.6],[-1.35,6.75,0],"fox"),P([.92,.38,.62],[-1.35,7.25,0],"earTip"),P([.45,.75,.05],[-1.35,6.6,-.31],"paper"),
 P([.9,1.3,.6],[1.35,6.75,0],"fox"),P([.92,.38,.62],[1.35,7.25,0],"earTip"),P([.45,.75,.05],[1.35,6.6,-.31],"paper"),
 P([4,.25,3.4],[0,6.38,0],"hat"),P([1.7,.8,1.6],[0,6.9,0],"hat"),P([1.72,.25,1.62],[0,6.62,0],"forest"),
];
function foxModel(scale=1){const g=assemble(FOX,scale);g.userData.head=g.children[19];return g}
// Блокова людина: гравець (дослідник) і відвідувачі
function personModel(o={}){
  const g=new THREE.Group();g.userData.noMerge=true;const add=(s,p,col,par=g)=>box(par,s,p,col,{dyn:true});
  const shirt=o.shirt||"#E9C27F",pants=o.pants||"#5B6B3A",skin=o.skin||"skin";
  const legL=new THREE.Group(),legR=new THREE.Group(),armL=new THREE.Group(),armR=new THREE.Group(),body=new THREE.Group();
  g.add(body);legL.position.set(-.55,2,0);legR.position.set(.55,2,0);armL.position.set(-1.55,4.1,0);armR.position.set(1.55,4.1,0);
  [legL,legR].forEach(l=>{add([1,1.7,1.1],[0,-.85,0],pants,l);add([1.1,.45,1.25],[0,-1.8,-.05],o.shoes||"boot",l);g.add(l)});
  [armL,armR].forEach(a=>{add([.8,1.9,.9],[0,-.9,0],shirt,a);add([.7,.5,.7],[0,-2,0],skin,a);body.add(a)});
  add([2.4,2.2,1.3],[0,3.1,0],shirt,body);add([2.42,.4,1.32],[0,2.15,0],o.belt||"boot",body);
  if(o.explorer){add([2.42,.5,.1],[0,3.9,-.66],"forest",body);add([1.8,2,1],[0,3.2,1.1],"orange",body);add([1.4,.6,1.02],[0,2.5,1.15],"orangeDeep",body)}
  else if(o.bag)add([1.4,1.6,.8],[0,3.2,1],o.bag,body);
  const head=new THREE.Group();head.position.set(0,4.2,0);body.add(head);
  add([2,2,2],[0,1,0],skin,head);add([.3,.4,.05],[-.45,1.1,-1.01],"ink",head);add([.3,.4,.05],[.45,1.1,-1.01],"ink",head);add([.6,.15,.05],[0,.55,-1.01],"#B04E12",head);
  if(o.explorer){add([3,.25,3],[0,2.1,0],"hat",head);add([2.1,.8,2.1],[0,2.6,0],"hat",head);add([2.12,.28,2.12],[0,2.3,0],"forest",head)}
  else if(o.hat==="cap"){add([2.1,.6,2.1],[0,2.2,0],o.hatCol||"orange",head);add([1.6,.2,1],[0,1.95,-1.4],o.hatCol||"orange",head)}
  else if(o.hat==="sun"){add([2.8,.2,2.8],[0,2.05,0],o.hatCol||"tan",head);add([1.9,.6,1.9],[0,2.4,0],o.hatCol||"tan",head)}
  else add([2.1,.5,2.1],[0,2.2,0],o.hair||"#5A3A22",head);
  g.userData={legL,legR,armL,armR,body,head};return g;
}

/* ---- Написи на гранях (канвас) ---- */
function textTexture(text,color,bg,w,h,font){
  const k=48,cv=document.createElement("canvas");cv.width=Math.max(16,Math.round(Math.min(w*k,1024)));cv.height=Math.max(16,Math.round(Math.min(h*k,512)));
  const x=cv.getContext("2d");if(bg){x.fillStyle=bg;x.fillRect(0,0,cv.width,cv.height)}
  const fam=font||'800 FS "Unbounded","Arial Black",sans-serif';let fs=cv.height*.62;const setF=()=>x.font=fam.replace("FS",fs+"px");setF();
  while(x.measureText(text).width>cv.width*.86&&fs>6){fs*=.92;setF()}
  x.fillStyle=color;x.textAlign="center";x.textBaseline="middle";x.fillText(text,cv.width/2,cv.height/2+fs*.04);
  const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;
}
// face: front(-Z) back(+Z) left(-X) right(+X) top(+Y)
function sign(mesh,face,text,color,bg){
  const s=mesh.geometry===boxGeo?mesh.scale:(()=>{mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox;return new THREE.Vector3(b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z)})();
  let w,h,rot=[0,0,0],n;
  if(face==="front"){w=s.x;h=s.y;rot=[0,Math.PI,0];n=[0,0,-.5]}else if(face==="back"){w=s.x;h=s.y;n=[0,0,.5]}
  else if(face==="left"){w=s.z;h=s.y;rot=[0,-Math.PI/2,0];n=[-.5,0,0]}else if(face==="right"){w=s.z;h=s.y;rot=[0,Math.PI/2,0];n=[.5,0,0]}
  else{w=s.x;h=s.z;rot=[-Math.PI/2,0,0];n=[0,.5,0]}
  const tex=textTexture(text,c(color),bg?c(bg):null,w,h);
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:tex,transparent:!bg}));
  const g=new THREE.Group();g.userData.noMerge=true;g.position.copy(mesh.position);g.rotation.copy(mesh.rotation);mesh.parent.add(g);
  pl.rotation.set(...rot);pl.scale.set(w,h,1);
  pl.position.set(n[0]*s.x+(n[0]?Math.sign(n[0])*.04:0),n[1]*s.y+(n[1]?.04:0),n[2]*s.z+(n[2]?Math.sign(n[2])*.04:0));
  g.add(pl);pl.userData.setText=(t,col)=>{pl.material.map.dispose();pl.material.map=textTexture(t,c(col||color),bg?c(bg):null,w,h);pl.material.needsUpdate=true};
  pl.userData.group=g;return pl;
}

/* ---- Небо й гори (панорама 360°) ---- */
function buildSky(){
  const g=new THREE.SphereGeometry(3600,32,16),cols=[],p=g.attributes.position,top=lin("#9FD3EE"),hor=lin("#EAF3E3");
  for(let i=0;i<p.count;i++){const y=p.getY(i)/3600;const t=smooth(-.05,.55,y);const col=hor.clone().lerp(top,t);cols.push(col.r,col.g,col.b)}
  g.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));
  const m=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false});
  const sky=new THREE.Mesh(g,m);sky.renderOrder=-10;scene.add(sky);return sky;
}
// Три шари «паперових» гір навколо світу — як аплікація з брендбуку
function buildMountains(){
  const layers=[
    {r:3000,base:-40,amp:620,seed:9,cols:["#9FB7C2","#B7CAD1"],snow:"#F5F1E0",snowAt:.62,freq:5},
    {r:2350,base:-40,amp:470,seed:4,cols:["#6E8F7A","#88A58F"],snow:"#F5F1E0",snowAt:.7,freq:7},
    {r:1700,base:-30,amp:330,seed:2,cols:["#2F7D32","#3E8A3F"],snow:null,freq:9},
    {r:1150,base:-30,amp:200,seed:7,cols:["#1E5A2B","#256733"],snow:null,freq:12},
  ];
  const grp=new THREE.Group();
  for(const L of layers){
    const N=360,pos=[],col=[],idx=[];const cA=lin(L.cols[0]),cB=lin(L.cols[1]),cS=L.snow?lin(L.snow):null;
    const ridge=a=>{const x=Math.cos(a),z=Math.sin(a);let h=0,f=L.freq,amp=1;for(let o=0;o<4;o++){h+=Math.abs(vnoise(x*f+L.seed*13,z*f-L.seed*7))*amp;f*=2.1;amp*=.48}return clamp(h*.85,0,1)};
    for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,h=ridge(a),x=Math.cos(a)*L.r,z=Math.sin(a)*L.r,top=L.base+40+h*L.amp;
      // три точки по вертикалі: низ, середина, верх (для кольору снігу)
      const ys=[L.base,L.base+(top-L.base)*.55,top];
      ys.forEach((y,k)=>{pos.push(x,y,z);let cc=(k===2&&cS&&h>L.snowAt)?cS:(i%2?cA:cB);if(k===0)cc=cA.clone().multiplyScalar(.85);col.push(cc.r,cc.g,cc.b)})}
    for(let i=0;i<N;i++){const a=i*3,b=(i+1)*3;for(let k=0;k<2;k++){idx.push(a+k,b+k,a+k+1,b+k,b+k+1,a+k+1)}}
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("color",new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
    const m=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,fog:false});
    const mesh=new THREE.Mesh(g,m);mesh.userData.noMerge=true;mesh.userData.mountain=true;grp.add(mesh);
  }
  grp.userData.noMerge=true;scene.add(grp);return grp;
}
function buildTerrain(){
  const S=HG.size,seg=340,g=new THREE.PlaneGeometry(S,S,seg,seg);g.rotateX(-Math.PI/2);
  const p=g.attributes.position,col=[];
  const cLow=lin("#B9D98C"),cMid=lin("#A8CB6E"),cHigh=lin("#7FB24E"),cPeak=lin("#5E9840"),cRoad=lin("#5E6B57"),cPath=lin("#E2C18A"),cForest=lin("#97C063"),cDirt=lin("#C9B07A"),tmp=new THREE.Color();
  const F=LAY.forest;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=terrainH(x,z);p.setY(i,h);
    const t=clamp((h+5)/45,0,1);tmp.copy(cLow).lerp(cMid,smooth(0,.3,t)).lerp(cHigh,smooth(.3,.7,t)).lerp(cPeak,smooth(.7,1,t));
    const n=fbm(x*.02,z*.02);tmp.lerp(cForest,clamp(n*.6+.2,0,.5)*(x>F.x1&&x<F.x2&&z>F.z1&&z<F.z2?1:.3));
    if(n>.38)tmp.lerp(cDirt,(n-.38)*1.2);
    const pw=pathColorW(x,z);if(pw.path>0)tmp.lerp(cPath,pw.path);if(pw.road>0)tmp.lerp(cRoad,pw.road);
    col.push(tmp.r,tmp.g,tmp.b)}
  g.setAttribute("color",new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true}));m.receiveShadow=true;m.userData.noMerge=true;scene.add(m);return m;
}

/* ---- Об'єднання статичних мешів (менше викликів малювання → вищий FPS) ---- */
function mergeStatic(root){
  const buckets=new Map(),victims=[];
  root.updateMatrixWorld(true);
  const walk=(o,skip)=>{if(o.userData&&o.userData.noMerge)skip=true;
    if(o.isMesh&&!skip&&!o.isInstancedMesh&&!o.userData.dyn&&o.visible&&o.material&&o.material.isMeshLambertMaterial&&!o.material.transparent){
      const key=o.material.uuid+"|"+(o.castShadow?1:0);if(!buckets.has(key))buckets.set(key,{m:o.material,cast:o.castShadow,list:[]});buckets.get(key).list.push(o);victims.push(o)}
    for(const ch of o.children.slice())walk(ch,skip)};
  walk(root,false);
  let merged=0;
  for(const b of buckets.values()){
    let total=0;const parts=[];
    for(const o of b.list){let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);parts.push(g);total+=g.attributes.position.count}
    const pos=new Float32Array(total*3),nor=new Float32Array(total*3),uv=new Float32Array(total*2);let off=0;
    for(const g of parts){pos.set(g.attributes.position.array,off*3);nor.set(g.attributes.normal.array,off*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,off*2);off+=g.attributes.position.count;g.dispose()}
    const mg=new THREE.BufferGeometry();mg.setAttribute("position",new THREE.BufferAttribute(pos,3));mg.setAttribute("normal",new THREE.BufferAttribute(nor,3));mg.setAttribute("uv",new THREE.BufferAttribute(uv,2));
    mg.computeBoundingSphere();const mesh=new THREE.Mesh(mg,b.m);mesh.castShadow=b.cast;mesh.receiveShadow=true;mesh.userData.noMerge=true;scene.add(mesh);merged++;
  }
  for(const o of victims)o.parent&&o.parent.remove(o);
  return {meshes:victims.length,merged};
}
