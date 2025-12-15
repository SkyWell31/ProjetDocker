const W=900,H=520,cvs=document.getElementById('game'),ctx=cvs.getContext('2d');
const scoreEl=document.getElementById('score'),bestEl=document.getElementById('best'),hpEl=document.getElementById('hp'),logEl=document.getElementById('api-out');
let running=false,last=0,t=0,keys=new Set(),score=0,best=+localStorage.getItem('goat_best')||0,hp=3;bestEl.textContent=best;
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const player={x:W/2,y:H/2,r:11,vx:0,vy:0,sp:240,dash:0},orbs=[],foes=[];
function spawnOrb(){orbs.push({x:rand(30,W-30),y:rand(30,H-30),r:6+Math.random()*6,t:0});}
function spawnFoe(){const s=60+Math.min(220,t*0.02);let e=Math.floor(Math.random()*4),x,y,vx,vy;
 if(e===0){x=rand(0,W);y=-10;vx=rand(-1,1)*s;vy=rand(80,140)}
 if(e===1){x=W+10;y=rand(0,H);vx=-rand(80,140);vy=rand(-1,1)*s}
 if(e===2){x=rand(0,W);y=H+10;vx=rand(-1,1)*s;vy=-rand(80,140)}
 if(e===3){x=-10;y=rand(0,H);vx=rand(80,140);vy=rand(-1,1)*s}
 foes.push({x,y,vx,vy,s:14+rand(-4,6)})}
function reset(){score=0;hp=3;t=0;player.x=W/2;player.y=H/2;player.vx=player.vy=0;player.dash=0;foes.length=0;orbs.length=0;for(let i=0;i<6;i++)spawnOrb();}
function update(dt){t+=dt;const accel=player.dash>0?2.5:1,sp=player.sp*(player.dash>0?2.5:1);
 player.vx+=((keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('q')?1:0))*1400*accel*dt;
 player.vy+=((keys.has('ArrowDown')||keys.has('s')?1:0)-(keys.has('ArrowUp')||keys.has('z')?1:0))*1400*accel*dt;
 const damp=.9;player.vx*=damp;player.vy*=damp;const spd=Math.hypot(player.vx,player.vy); if(spd>sp){const k=sp/spd;player.vx*=k;player.vy*=k;}
 player.x=clamp(player.x+player.vx*dt,10,W-10); player.y=clamp(player.y+player.vy*dt,10,H-10); if(player.dash>0)player.dash-=dt;
 if(Math.random()<.8*dt)spawnOrb(); if(Math.random()<(0.8+Math.min(1.2,t/40))*dt)spawnFoe();
 for(let f of foes){f.x+=f.vx*dt;f.y+=f.vy*dt}
 for(let i=foes.length-1;i>=0;i--){const f=foes[i]; if(f.x<-50||f.x>W+50||f.y<-50||f.y>H+50)foes.splice(i,1)}
 for(let i=orbs.length-1;i>=0;i--){const o=orbs[i];o.t+=dt; if(Math.hypot(o.x-player.x,o.y-player.y)<o.r+player.r){orbs.splice(i,1);score+=10;scoreEl.textContent=score; if(score>best){best=score;bestEl.textContent=best;localStorage.setItem('goat_best',best)}}}
 for(let i=foes.length-1;i>=0;i--){const f=foes[i]; if(Math.hypot(f.x-player.x,f.y-player.y)<f.s+player.r){foes.splice(i,1);hp--;hpEl.textContent=hp; if(hp<=0){running=false}}}}
function draw(){ctx.clearRect(0,0,W,H);ctx.globalAlpha=.07;ctx.strokeStyle="#9fe";ctx.beginPath();
 for(let x=0;x<=W;x+=30){ctx.moveTo(x,0);ctx.lineTo(x,H)} for(let y=0;y<=H;y+=30){ctx.moveTo(0,y);ctx.lineTo(W,y)} ctx.stroke();ctx.globalAlpha=1;
 for(let o of orbs){ctx.fillStyle="rgba(160,255,180,.9)";ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill()}
 for(let f of foes){ctx.fillStyle="rgba(255,255,120,.9)";ctx.beginPath();ctx.rect(f.x-f.s,f.y-f.s,f.s*2,f.s*2);ctx.fill()}
 ctx.shadowBlur=16;ctx.shadowColor="#6cf";ctx.fillStyle="#6cf";ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
function loop(ts){if(!running){draw();return} const dt=Math.min(.033,(ts-last)/1000||0);last=ts;update(dt);draw();requestAnimationFrame(loop)}
document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys.add(k);if(k===' '){if(player.dash<=0){player.dash=.25}e.preventDefault()}});document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
async function apiPostItem(){const r=await fetch('/api/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'orb_'+Date.now()})}); logEl.textContent='POST /api/items → '+r.status+' '+await r.text()}
async function apiList(){const r=await fetch('/api/items'); logEl.textContent='GET /api/items → '+r.status+' '+await r.text()}
document.getElementById('btn-start').onclick=()=>startGame(); function startGame(){reset();running=true;last=performance.now();requestAnimationFrame(loop)}
draw(); setTimeout(startGame,300);
