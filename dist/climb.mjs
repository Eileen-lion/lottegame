export function createClimber(canvas,{reduced=false}={}){
 const ctx=canvas.getContext('2d');let w=0,h=0,floor=0,motion=null,frame=0,active=false,rig=null,stroke=0;
 const facade=new Image(),santa=new Image();facade.src='assets/facade.png';santa.src='assets/santa-climb-back.png';
 const resize=()=>{const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw(performance.now());};new ResizeObserver(resize).observe(canvas);
 facade.onload=()=>draw(performance.now());santa.onload=()=>{rig=santa;draw(performance.now());};
 function draw(now){if(!w||!h)return;ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=false;
  const progress=motion?Math.min(1,(now-motion.start)/motion.duration):1;
  const f=motion?motion.from+(motion.to-motion.from)*progress:floor;
  const gap=Math.min(88,h*.20),base=h*.55,cam=(Math.max(1,f)-1)*gap;
  ctx.fillStyle='#102649';ctx.fillRect(0,0,w,h);
  if(facade.complete&&facade.naturalWidth){const sw=facade.naturalWidth*.54,sx=facade.naturalWidth*.38,sh=facade.naturalHeight*.40,tileH=w*sh/sw,offset=((cam%tileH)+tileH)%tileH;for(let y=offset-tileH;y<h;y+=tileH){ctx.drawImage(facade,sx,0,sw,sh,0,y,w,tileH+1);ctx.fillStyle='#142e57';ctx.fillRect(0,y,w,5);}}
  // Floor markers are painted on the wall; there are no standing platforms.
  for(let n=Math.max(1,Math.floor(f)-4);n<=Math.min(123,Math.ceil(f)+5);n++){const y=base-(n-1)*gap+cam;if(y<-20||y>h+20)continue;const event=[22,40,60,83,102,123].includes(n);ctx.fillStyle=event?'#efd095':'#a8c2df';ctx.font='12px Galmuri11, monospace';ctx.textAlign='left';ctx.fillText(`${n}F`,16,y);ctx.fillStyle=event?'#efd09588':'#acc6df40';ctx.fillRect(48,y-4,w-65,1);}
  if(rig){
   const cycle=motion&&!reduced?(stroke+progress)*Math.PI:stroke*Math.PI,sway=Math.sin(cycle);
   const height=Math.min(156,h*.38),scale=height/rig.naturalHeight;
   const width=rig.naturalWidth,heightPx=rig.naturalHeight,cell=24;
   ctx.save();ctx.translate(w*.5-width*scale/2,base+43-height);ctx.scale(scale,scale);
   // Back-facing wall grip: alternate opposite hands and knees. Keep hat/head stable.
   for(let y=0;y<heightPx;y+=cell){for(let x=0;x<width;x+=cell){
    const nx=(x+cell/2)/width,ny=(y+cell/2)/heightPx;
    const side=nx<.5?-1:1;
    const arm=ny>.35&&ny<.62?Math.sin((ny-.35)/.27*Math.PI)*Math.max(0,Math.min(1,(Math.abs(nx-.5)-.10)/.14)):0;
    const leg=ny>.65?Math.min(1,(ny-.65)/.17):0;
    const dy=side*sway*(arm*58-leg*65),dx=sway*leg*side*10;
    const cw=Math.min(cell,width-x),ch=Math.min(cell,heightPx-y);
    ctx.drawImage(rig,x,y,cw,ch,x+dx,y+dy,cw+2,ch+3);
   }}ctx.restore();
  }
  if(motion&&progress>=1){const done=motion.done;floor=motion.to;stroke++;motion=null;done();return;}
  if(active&&motion){cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);}
 }
 return {show(value){active=true;floor=value;motion=null;canvas.hidden=false;resize();},hide(){active=false;cancelAnimationFrame(frame);motion=null;canvas.hidden=true;},busy(){return !!motion;},boost(){if(motion)motion.duration=Math.max(60,motion.duration-45);},jumpTo(value,done){if(motion)return false;motion={from:floor,to:value,start:performance.now(),duration:reduced?100:200,done};draw(performance.now());return true;}};
}
