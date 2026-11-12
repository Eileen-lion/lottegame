export const DANCE_DURATION=8600;
export function hipOffset(y,t,amplitude=16){
 // Head and boots stay anchored; displacement peaks at the belt/hips.
 if(t>=4400||y<=.46||y>=.96)return 0;
 const weight=y<.68?(y-.46)/.22:(.96-y)/.28;
 return Math.sin(t/1100*Math.PI*2)*amplitude*Math.sin(weight*Math.PI/2);
}
function load(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
export function sprite(image,crop,clearBackdrop=false){
 const c=document.createElement('canvas');c.width=crop[2];c.height=crop[3];const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,...crop,0,0,c.width,c.height);
 if(clearBackdrop){
  // Remove only edge-connected cream background at render time. Source stays unchanged.
  const data=ctx.getImageData(0,0,c.width,c.height),p=data.data,n=c.width*c.height,seen=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0;
  const visit=i=>{if(i<0||i>=n||seen[i])return;seen[i]=1;const k=i*4;if(p[k]>218&&p[k+1]>200&&p[k+2]>183){queue[tail++]=i;p[k+3]=0;}};
  for(let x=0;x<c.width;x++){visit(x);visit(n-c.width+x);}for(let y=0;y<c.height;y++){visit(y*c.width);visit(y*c.width+c.width-1);}
  while(head<tail){const i=queue[head++],x=i%c.width;if(x)visit(i-1);if(x<c.width-1)visit(i+1);visit(i-c.width);visit(i+c.width);}ctx.putImageData(data,0,0);
 }
 return c;
}
export function startDance(canvas,cue,{reduced=false,onEnd=()=>{}}={}){
 let stopped=false,frame=0;const ctx=canvas.getContext('2d');canvas.width=640;canvas.height=480;
 Promise.all([load('assets/santa-dance-original.png'),load('assets/hyva-xylitol.png')]).then(([boy,man])=>{
  if(stopped)return;
  const a=sprite(boy,[290,12,730,1230],true),b=sprite(man,[264,12,625,1225]);const start=performance.now();
  function drawCharacter(img,x,feet,height,t,scale=1){
   const width=height*img.width/img.height;ctx.save();ctx.translate(x,feet);ctx.scale(scale,scale);
   const bounce=t<4400&&!reduced?Math.pow(Math.sin(t/1100*Math.PI*2),2)*5:0;
   // Two-pixel strips articulate the waist continuously, avoiding disconnected body parts.
   for(let row=0;row<height;row+=2){const y=row/height;const shift=reduced?0:hipOffset(y,t,24);const bend=bounce*Math.sin(y*Math.PI);ctx.drawImage(img,0,y*img.height,img.width,Math.min(3,height-row)/height*img.height,-width/2+shift,-height+row+bend,width,3.2);}
   ctx.restore();
  }
  function draw(now){if(stopped)return;const t=Math.min(now-start,DANCE_DURATION);ctx.clearRect(0,0,640,480);ctx.imageSmoothingEnabled=false;
   const turning=t>=5200,angle=turning?Math.min(1,(t-5200)/2800)*Math.PI*2:0;
   const distance=t<4400?132:132-Math.min(1,(t-4400)/800)*36;
   const dx=reduced?distance:distance*Math.cos(angle),depth=reduced?0:Math.sin(angle)*18;
   const friends=[{im:a,x:320-dx,y:430-depth,h:344,scale:1-depth/160},{im:b,x:320+dx,y:430+depth,h:366,scale:1+depth/160}];
   friends.sort((u,v)=>u.y-v.y);
   if(t>=4400){ctx.strokeStyle='#f0c799';ctx.lineWidth=16;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(320-dx+55,330-depth);ctx.quadraticCurveTo(320,355,320+dx-55,330+depth);ctx.stroke();}
   for(const f of friends)drawCharacter(f.im,f.x,f.y,f.h,t,f.scale);
   const count=Math.min(4,Math.floor(t/1100)+1);const message=t<4400?`실룩실룩! ${count} / 4`:t<5200?'팔짱을 꼭 끼고…':t<8000?'함께 빙그르르, 한 바퀴!':'휘바휘바! 문이 열려요.';if(cue.textContent!==message)cue.textContent=message;
   if(t>=DANCE_DURATION){onEnd();return;}frame=requestAnimationFrame(draw);
  }
  frame=requestAnimationFrame(draw);
 }).catch(()=>{if(!stopped){cue.textContent='이미지를 불러오지 못했어요. 새로고침해주세요.';}});
 return ()=>{stopped=true;cancelAnimationFrame(frame);};
}
