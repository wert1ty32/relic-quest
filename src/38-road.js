/* ================= Дорога й тунелі ================= */
function buildTunnel(s){
  const R=seeded(s>0?91:93),P=600*s,zc=100,dark="#5E5A52";
  const X=v=>P+s*v; // відстань углиб тунелю від порталу
  // асфальт і розмітка всередині
  box(scene,[200,.12,16],[X(100),.07,zc],"white",{tex:"asphalt",tile:10,shadow:false});
  for(let d=6;d<200;d+=12)box(scene,[5,.14,.6],[X(d),.11,zc],"cream",{shadow:false});
  // стіни тунелю з кладки, ребра склепіння, стеля
  for(const z of[zc-9.5,zc+9.5])box(scene,[200,17.4,3],[X(100),8.7,z],dark,{tex:"castleStone",tile:4,shadow:false});
  box(scene,[200,2,22],[X(100),17.4,zc],dark,{tex:"castleStone",tile:4,shadow:false});
  for(let d=10;d<200;d+=16){stoneArch(scene,X(d),zc,0,16,7.2,true,"castleStone",1.6);
    for(const z of[zc-7.6,zc+7.6])box(scene,[.6,.8,.6],[X(d+8),6.5,z],"#FFD9A0",{m:"neon"})}
  box(scene,[8,8,16],[X(196),4,zc],"#1B1A17");
  pointLight(X(14),8,zc,0xffc98a,1.1,46);
  // портал: фасадна стіна з кладки
  const pf=X(-1.5);
  for(const sd of[-1,1]){box(scene,[3,26,10],[pf,13,zc+sd*14],"white",{tex:"castleStone",tile:4,collide:true});box(scene,[3,18,10],[pf,9,zc+sd*24],"white",{tex:"castleStone",tile:4,collide:true});box(scene,[3,10,8],[pf,5,zc+sd*33],"white",{tex:"castleStone",tile:4,collide:true});
    box(scene,[3.6,1,10.4],[pf,26.4,zc+sd*14],"white",{tex:"stone",tile:3});box(scene,[3.6,1,10.4],[pf,18.4,zc+sd*24],"white",{tex:"stone",tile:3});box(scene,[3.6,1,8.4],[pf,10.4,zc+sd*33],"white",{tex:"stone",tile:3})}
  box(scene,[3,9,18],[pf,21.5,zc],"white",{tex:"castleStone",tile:4});
  box(scene,[3.6,1.2,19],[pf,26.4,zc],"white",{tex:"stone",tile:3});
  stoneArch(scene,X(-3.2),zc,0,16,7.2,true,"stone",3);
  for(const z of[zc-9.2,zc+9.2])box(scene,[3.6,7.2,2.6],[X(-3.2),3.6,z],"white",{tex:"stone",tile:2});
  const plate=box(scene,[.4,2.4,13],[X(-3.4),19.6,zc],"forestDeep");sign(plate,s>0?"left":"right","ТУНЕЛЬ «ЛИСЯЧА НОРА»","cream");
  for(const z of[zc-12,zc+12]){box(scene,[.6,6,.6],[X(-4.5),3,z],"ink");box(scene,[1.2,1.4,1.2],[X(-4.5),6.6,z],"tan",{m:"neon"})}
  // гора навколо порталу: брили, мох, кущі
  for(let i=0;i<16;i++){const zz=zc+(R()-.5)*90,sz=8+R()*14,inner=Math.abs(zz-zc)<16,bx=X(4+R()*14),gy=groundH(bx,zz),yy=inner?Math.max(gy,21)+sz*.3:gy+sz*.1;boulder(scene,bx,yy,zz,sz*1.2,sz,sz*1.3,R)}
  // брили та кущі обабіч порталу — фасад «вростає» в схил
  for(const side of[-1,1])for(let i=0;i<5;i++){const zz=zc+side*(31+i*5+R()*3),sz=7+R()*8,bx=X(-3+R()*5);boulder(scene,bx,groundH(bx,zz)+sz*.3,zz,sz*1.2,sz,sz,R,null,{collide:i<2})}
  for(const side of[-1,1])for(let i=0;i<3;i++)box(scene,[4+R()*2,3+R()*2,4+R()*2],[X(-6-R()*3),1.5,zc+side*(20+i*4)],["#2F7D32","#3E8A3F","#1E5A2B"][i],{m:"sway"});
  for(let i=0;i<6;i++)box(scene,[6+R()*4,.6,4],[pf+s*1.5,27.4,zc+(R()-.5)*50],"white",{tex:"moss",tile:3});
  for(let i=0;i<10;i++)box(scene,[.35,2+R()*3.5,.35],[X(-3.6),15-R()*2,zc-8+i*1.8],"#4F9A45",{m:"sway"});
  // гравець може зазирнути, але не пройти
  const blk=box(scene,[2,20,16],[X(8),10,zc],"forest",{collide:true});blk.visible=false;
}
function buildRoad(){
  box(scene,[1196,.12,16],[0,.06,100],"white",{tex:"asphalt",tile:10,shadow:false});
  for(let x=-594;x<=594;x+=12)box(scene,[5,.14,.6],[x,.1,100],"cream",{shadow:false});
  for(let i=-3;i<=3;i++)box(scene,[1.6,.15,14],[i*2.6,.11,100],"paper",{shadow:false});
  box(scene,[1196,.4,1.2],[0,.2,108.6],"white",{tex:"stone",tile:2,shadow:false});box(scene,[1196,.4,1.2],[0,.2,91.4],"white",{tex:"stone",tile:2,shadow:false});
  // стовпчики освітлення вздовж дороги
  for(let x=-560;x<=560;x+=80){if(Math.abs(x)<70)continue;box(scene,[.4,8,.4],[x,4,90.4],"ink");box(scene,[2.2,.3,.6],[x+.9,8,90.4],"ink");box(scene,[1,.4,.6],[x+1.6,7.8,90.6],"tan",{m:"neon"})}
  buildTunnel(1);buildTunnel(-1);
}
