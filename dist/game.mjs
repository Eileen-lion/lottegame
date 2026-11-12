export const STOPS = {22:'pepero',40:'cocoa',60:'burger',83:'cider',102:'xylitol'};
export const EVENT_TIME = Date.parse('2027-01-01T00:00:00+09:00');
export function initialState(){return {version:2,phase:'intro',taps:0,speed:1,token:false,wish:'',hotel:0,coupon:false};}
export function landing(s){const stop=Object.keys(STOPS).map(Number).find(f=>f>s.taps)||123;return Math.min(s.taps+(s.speed||1),stop);}
export function step(s,event){
 const n={...s};
 switch(event.type){
 case 'START': if(s.phase==='intro') n.phase='market'; break;
 case 'TO_TOWER':if(s.phase==='market')n.phase='entrance';break;
 case 'ENTER_TOWER':if(s.phase==='entrance'){n.phase='climb';n.taps=1;}break;
 case 'TAP':
  if(s.phase!=='climb'||s.taps>=123) return s;
  n.taps=landing(s);
  if(n.taps===123)n.phase='wish';
  else if(STOPS[n.taps])n.phase=n.taps===83?'cider':n.taps===102?'xylitol':'rest';
  break;
 case 'REST_DONE': if(s.phase==='rest'){n.speed={22:2,40:3,60:4}[s.taps]||1;n.phase='powerup';}break;
 case 'POWER_CONTINUE':if(s.phase==='powerup')n.phase='climb';break;
 case 'EAT_GUM':if(s.phase==='xylitol')n.phase='danceChoice';break;
 case 'DANCE_NO':if(s.phase==='danceChoice')n.phase='danceInsist';break;
 case 'DANCE':if(['danceChoice','danceInsist'].includes(s.phase))n.phase='dancing';break;
 case 'DANCE_END':if(s.phase==='dancing'){n.phase='gateOpen';n.speed=6;}break;
 case 'GATE_CONTINUE':if(s.phase==='gateOpen')n.phase='climb';break;
 case 'SHARE': if(s.phase==='cider')n.phase='sun'; break;
 case 'SOLO': if(s.phase==='cider')n.phase='solo'; break;
 case 'MEET_STAR':if(s.phase==='sun')n.phase='thanks';break;
 case 'COLLECT':if(s.phase==='thanks'){n.token=true;n.phase='token';}break;
 case 'CONTINUE':if(['token','solo'].includes(s.phase)){n.phase='powerup';n.speed=5;}break;
 case 'WISH':if(s.phase==='wish'){
  const wish=Array.from(String(event.value??'').trim()).slice(0,24).join('');
  if(!wish)return s;n.wish=wish;n.phase=s.token?'hotelChoice':'outdoor';
 }break;
 case 'HOTEL_YES':if(s.phase==='hotelChoice'&&s.token){n.phase='hotel';n.hotel=0;}break;
 case 'HOTEL_NO':if(s.phase==='hotelChoice')n.phase='outdoor';break;
 case 'SNOW':if(s.phase==='outdoor')n.phase='storm';break;
 case 'SNOW_END':if(s.phase==='storm')n.phase=s.token?'rescue':'snowman';break;
 case 'RESCUE':if(s.phase==='rescue'&&s.token){n.phase='hotel';n.hotel=0;}break;
 case 'NEXT_ROOM':if(s.phase==='hotel'){n.hotel=s.hotel+1;if(n.hotel>=3){n.hotel=3;n.phase='wait';}}break;
 case 'COUPON':if(['wait','fireworks'].includes(s.phase)&&s.token)n.coupon=true;break;
 case 'FIREWORKS':if(s.phase==='wait'&&s.token)n.phase='fireworks';break;
 case 'WAIT_AGAIN':if(s.phase==='fireworks')n.phase='wait';break;
 case 'NEW_JOURNEY':return {...initialState(),phase:'market'};
 case 'RESTART':return {...initialState(),phase:'climb',taps:1};
 default:return s;
 }
 return n;
}
export function restore(raw){
 try{const s=JSON.parse(raw); const phases=['market','entrance','powerup','xylitol','danceChoice','danceInsist','dancing','gateOpen','intro','climb','rest','cider','sun','thanks','token','solo','wish','hotelChoice','outdoor','storm','rescue','snowman','hotel','wait','fireworks'];
 if(![1,2].includes(s.version)||!phases.includes(s.phase)||!Number.isInteger(s.taps)||s.taps<0||s.taps>123||typeof s.token!=='boolean'||typeof s.coupon!=='boolean'||typeof s.wish!=='string'||Array.from(s.wish).length>24||!Number.isInteger(s.hotel)||s.hotel<0||s.hotel>3)return initialState();
 if(['hotel','wait','fireworks','rescue'].includes(s.phase)&&!s.token)return initialState();
 if(s.version===1){s.version=2;s.speed=1+[22,40,60,83,102].filter(f=>f<s.taps||(f===s.taps&&s.phase==='climb')).length;if(s.phase==='rest'&&s.taps===83)s.phase='cider';if(s.phase==='rest'&&s.taps===102)s.phase='xylitol';}
 if(s.phase==='climb'&&s.taps===0)s.taps=1;
 if(!Number.isInteger(s.speed)||s.speed<1||s.speed>6)return initialState();
 return s;
 }catch{return initialState();}
}
