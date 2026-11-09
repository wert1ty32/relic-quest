/* ================= Будівельні блоки: природні скелі, кладка, дерева ================= */
const ROCK_COLS=["#8E8B7C","#9C9888","#7F7C6E","#A8A392","#857F70"];
// окрема брила
function boulder(par,x,y,z,sx,sy,sz,R,col,o={}){
  return box(par,[sx,sy,sz],[x,y,z],col||ROCK_COLS[Math.floor(R()*ROCK_COLS.length)],{shape:"rock",variant:Math.floor(R()*6),rot:[(R()-.5)*18,R()*360,(R()-.5)*18],collide:o.collide,shadow:o.shadow})
}
// Природна скельна стіна вздовж відрізка: різні брили, висоти, виступи, мох; один простий колайдер
function rockWall(par,x0,z0,x1,z1,h,R,o={}){
  const L=Math.hypot(x1-x0,z1-z0),dx=(x1-x0)/L,dz=(z1-z0)/L,nx=-dz,nz=dx,th=o.thick||6,y0=o.y0||0,cols=o.cols||ROCK_COLS;
  let t=0;
  while(t<L){const w=4+R()*5,hh=h*(.62+R()*.6),off=(R()-.5)*th*.5,cx=x0+dx*(t+w/2)+nx*off,cz=z0+dz*(t+w/2)+nz*off;
    boulder(par,cx,y0+hh*.45,cz,w*1.25,hh,th*(.8+R()*.5),R,cols[Math.floor(R()*cols.length)]);
    if(R()<.55)boulder(par,cx+nx*th*.45*(R()<.5?-1:1),y0+R()*2,cz+nz*th*.45,2+R()*3,2+R()*2.5,2+R()*3,R,"#7F7C6E");
    if(R()<.35&&!o.noMoss)box(par,[w*.8,.5,th*.7],[cx,y0+hh*.92,cz],"white",{tex:"moss",tile:3,rot:[0,R()*20,0]});
    t+=w*.72}
  if(o.collide!==false){const m=new THREE.Mesh(boxGeo);m.position.set((x0+x1)/2,y0+h*.5,(z0+z1)/2);m.scale.set(Math.abs(x1-x0)+(Math.abs(dz)>.5?th:0),h,Math.abs(z1-z0)+(Math.abs(dx)>.5?th:0));m.visible=false;par.add(m);addCollider(m,"rock")}
}
// Кладка з окремих секцій: цоколь, пілястри, різна висота/товщина, карниз; ruin — зруйновані верхи; crenel — зубці
function masonryWall(par,x0,x1,z0,z1,y0,h,R,o={}){
  const alongX=(x1-x0)>=(z1-z0),L=alongX?x1-x0:z1-z0,t=alongX?z1-z0:x1-x0,cx=(x0+x1)/2,cz=(z0+z1)/2,tex=o.tex||"castleStone";
  const at=(u,w,hh,yy,tt,col)=>alongX?box(par,[w,hh,tt],[x0+u,yy,cz],col||"white",{tex,tile:4,collide:o.collide!==false}):box(par,[tt,hh,w],[cx,yy,z0+u],col||"white",{tex,tile:4,collide:o.collide!==false});
  let u=0;
  while(u<L-.01){const w=Math.min(L-u,3+R()*3.5);let hh=h+(R()-.5)*1.2;if(o.ruin&&R()<.4)hh=h*(.35+R()*.5);
    at(u+w/2,w,hh,y0+hh/2,t+(R()<.3?.35:0));
    if(o.crenel&&hh>h*.8){for(let k=.6;k<w-.4;k+=2.4)at(u+k+.6,1.3,1.6,y0+hh+.8,t+.2)}
    u+=w}
  // цоколь і карниз
  const plinth=(alongX?box(par,[L+.4,1.4,t+1],[cx,y0+.7,cz],"white",{tex,tile:3}):box(par,[t+1,1.4,L+.4],[cx,y0+.7,cz],"white",{tex,tile:3}));
  if(!o.ruin&&!o.noCornice){alongX?box(par,[L+.6,.6,t+.9],[cx,y0+h-.3,cz],"white",{tex,tile:3}):box(par,[t+.9,.6,L+.6],[cx,y0+h-.3,cz],"white",{tex,tile:3})}
  // пілястри
  const step=o.pilaster||9;for(let p=step;p<L-1;p+=step){const ph=o.ruin?h*(.5+R()*.5):h+.4;alongX?box(par,[1.4,ph,t+1.2],[x0+p,y0+ph/2,cz],"white",{tex,tile:3}):box(par,[t+1.2,ph,1.4],[cx,y0+ph/2,z0+p],"white",{tex,tile:3})}
  if(o.ruin)for(let i=0;i<Math.floor(L/6);i++){const ox=alongX?x0+R()*L:cx+(R()-.5)*8,oz=alongX?cz+(R()-.5)*8:z0+R()*L;box(par,[1+R()*1.6,.8+R(),1+R()*1.4],[ox,y0+.5,oz],"white",{tex,tile:2,rot:[R()*20,R()*90,R()*20]})}
}
// кутові блоки (квадри), цоколь і карниз для будівель — щоб стіни не були суцільними. gaps: {z0:[a,b], x0:[a,b], x1:[a,b]} — прорізи дверей
function trimBuilding(par,x0,x1,z0,z1,y,h,tex,gaps={}){
  const T=tex||"stone";
  for(const [x,z] of[[x0,z0],[x1,z0],[x0,z1],[x1,z1]])for(let k=0;k<h/2.2-1;k++){const big=k%2===0;box(par,[big?2.6:2,2,big?2:2.6],[x,y+1.1+k*2.2,z],"white",{tex:T,tile:2})}
  const run=(a0,a1,gap,f)=>{if(!gap){f(a0,a1);return}if(gap[0]>a0)f(a0,gap[0]);if(gap[1]<a1)f(gap[1],a1)};
  run(x0,x1,gaps.z0,(a,b)=>box(par,[b-a,1.2,1],[(a+b)/2,y+.6,z0-.1],"white",{tex:T,tile:3}));
  run(x0,x1,gaps.z1,(a,b)=>box(par,[b-a,1.2,1],[(a+b)/2,y+.6,z1+.1],"white",{tex:T,tile:3}));
  run(z0,z1,gaps.x0,(a,b)=>box(par,[1,1.2,b-a],[x0-.1,y+.6,(a+b)/2],"white",{tex:T,tile:3}));
  run(z0,z1,gaps.x1,(a,b)=>box(par,[1,1.2,b-a],[x1+.1,y+.6,(a+b)/2],"white",{tex:T,tile:3}));
  // карниз-пояс посередині висоти
  box(par,[x1-x0+.8,.5,.6],[(x0+x1)/2,y+h*.62,z0-.2],"white",{tex:T,tile:3});box(par,[x1-x0+.8,.5,.6],[(x0+x1)/2,y+h*.62,z1+.2],"white",{tex:T,tile:3});
  box(par,[.6,.5,z1-z0+.8],[x0-.2,y+h*.62,(z0+z1)/2],"white",{tex:T,tile:3});box(par,[.6,.5,z1-z0+.8],[x1+.2,y+h*.62,(z0+z1)/2],"white",{tex:T,tile:3});
}
// Кам'яна арка з клинцями: alongZ — проліт уздовж осі Z (дивимось уздовж X)
function stoneArch(par,cx,cz,y0,w,hSide,alongZ,tex,depth){
  const r=w/2+.9,d=depth||3,N=9;
  for(let i=0;i<=N;i++){const a=Math.PI*i/N,u=Math.cos(a)*r,uy=y0+hSide+Math.sin(a)*r,key=i===Math.floor(N/2)||i===Math.ceil(N/2)&&N%2===0,phi=a/DEG+90;
    if(alongZ)box(par,[d+(key?.5:0),2.2,1.9],[cx,uy,cz+u],"white",{tex:tex||"stone",tile:2,rot:[-phi,0,0]});
    else box(par,[1.9,2.2,d+(key?.5:0)],[cx+u,uy,cz],"white",{tex:tex||"stone",tile:2,rot:[0,0,phi]})}
}

/* ---------- Дерева: шість видів, без повторів ---------- */
const LEAF=["#2F7D32","#1E5A2B","#3E8A3F","#25683A","#4F9A45","#356F2E"];
function oak(par,x,z,R,sc=1){const y=groundH(x,z),h=(7+R()*5)*sc,tw=(1.8+R()*.8)*sc;
  box(par,[tw,h,tw],[x,y+h/2,z],"white",{tex:"bark",tile:4,collide:true,rot:[0,R()*90,0]});
  // корені та гілки
  for(let i=0;i<3;i++){const a=R()*6.28;box(par,[tw*.5,tw*.4,tw*1.6],[x+Math.cos(a)*tw*.7,y+.3,z+Math.sin(a)*tw*.7],"white",{tex:"bark",tile:2,rot:[0,-a/DEG,0]})}
  const n=4+Math.floor(R()*4);for(let i=0;i<n;i++){const a=R()*6.28,r=R()*3.2*sc,s=(4+R()*4.5)*sc;
    box(par,[s,s*(.6+R()*.3),s],[x+Math.cos(a)*r,y+h+(R()-.2)*3*sc,z+Math.sin(a)*r],LEAF[Math.floor(R()*LEAF.length)],{m:"sway",rot:[0,R()*90,0]})}
}
function birch(par,x,z,R){const y=groundH(x,z),h=10+R()*6,lean=(R()-.5)*8;
  box(par,[1,h,1],[x,y+h/2,z],"white",{tex:"birch",tile:3,collide:true,rot:[lean,R()*90,0]});
  for(let i=0;i<4;i++){const s=2.4+R()*2;box(par,[s,s*1.2,s],[x+(R()-.5)*2.4,y+h*.62+i*h*.12,z+(R()-.5)*2.4],["#8CC04F","#9CCB5E","#6FA83A"][i%3],{m:"sway"})}
}
function spruce(par,x,z,R,sc=1){const y=groundH(x,z),h=(4+R()*3)*sc;box(par,[1.4*sc,h,1.4*sc],[x,y+h/2,z],"white",{tex:"bark",tile:4,collide:true});
  const tiers=4+Math.floor(R()*3);for(let i=0;i<tiers;i++){const s=(8-i*1.35)*sc*(.9+R()*.2);box(par,[s,2.6*sc,s],[x,y+h+i*2.1*sc,z],i%2?"#1E5A2B":"#25683A",{m:"sway",rot:[0,R()*90,0]})}
  box(par,[1.2*sc,2*sc,1.2*sc],[x,y+h+tiers*2.1*sc+.6,z],"#2F7D32",{m:"sway"})}
function giant(par,x,z,R){const y=groundH(x,z),h=15+R()*6;box(par,[3.6,h,3.6],[x,y+h/2,z],"white",{tex:"bark",tile:5,collide:true});
  for(let i=0;i<4;i++){const a=i*1.57+R(),L=5+R()*3;box(par,[L,1.2,1.2],[x+Math.cos(a)*L/2,y+h*.7+i*1.4,z+Math.sin(a)*L/2],"white",{tex:"bark",tile:2,rot:[0,-a/DEG,18]})}
  for(let i=0;i<9;i++){const a=R()*6.28,r=2+R()*6,s=6+R()*5;box(par,[s,s*.65,s],[x+Math.cos(a)*r,y+h+(R()-.3)*5,z+Math.sin(a)*r],LEAF[Math.floor(R()*LEAF.length)],{m:"sway",rot:[0,R()*90,0]})}
  for(let i=0;i<4;i++){const a=R()*6.28;box(par,[1.4,1.2,4],[x+Math.cos(a)*2.6,y+.5,z+Math.sin(a)*2.6],"white",{tex:"bark",tile:2,rot:[0,-a/DEG,0]})}}
function deadTree(par,x,z,R){const y=groundH(x,z),h=7+R()*4;box(par,[1.4,h,1.4],[x,y+h/2,z],"#6B4A2E",{collide:true,rot:[(R()-.5)*10,0,(R()-.5)*10]});
  for(let i=0;i<3;i++){const a=R()*6.28;box(par,[4,.6,.6],[x+Math.cos(a)*1.8,y+h*(.55+i*.15),z+Math.sin(a)*1.8],"#6B4A2E",{rot:[0,-a/DEG,25+R()*20]})}}
function forestDecor(par,x,z,R){const y=groundH(x,z),k=R();
  if(k<.3){const L=6+R()*6,a=R()*180;box(par,[L,1.6,1.6],[x,y+.8,z],"white",{tex:"bark",tile:3,rot:[0,a,90],collide:true});box(par,[L*.5,.3,1.6],[x,y+1.7,z],"white",{tex:"moss",tile:2,rot:[0,a,0]})}
  else if(k<.55){box(par,[2.2,1.4,2.2],[x,y+.7,z],"white",{tex:"bark",tile:2,collide:true});box(par,[1.8,.2,1.8],[x,y+1.45,z],"tan")}
  else if(k<.8){const s=3+R()*4;boulder(par,x,y+s*.3,z,s*1.3,s*.8,s,R,null,{collide:s>4});box(par,[s*.9,.4,s*.7],[x,y+s*.68,z],"white",{tex:"moss",tile:2})}
  else{for(let i=0;i<4;i++){const ox=x+(R()-.5)*3,oz=z+(R()-.5)*3,hh=.6+R()*.6;box(par,[.3,hh,.3],[ox,y+hh/2,oz],"paper");box(par,[1,.4,1],[ox,y+hh+.1,oz],i%2?"pin":"orange")}}
}
