export const EVENT_DELAY=1000;
export function createEventGate(){
 let entered=0,blockedUntil=0;
 return {enter(now){entered=now;blockedUntil=now+EVENT_DELAY;},allowed(now,startedAt){return now>=blockedUntil&&Number.isFinite(startedAt)&&startedAt>=entered;},remaining(now){return Math.max(0,blockedUntil-now);}};
}
export function floorSide(floor){return floor===0?.5:floor%2===1?.24:.76;}
export function jumpPose(from,to,t){const progress=Math.max(0,Math.min(1,t));const ease=progress*progress*(3-2*progress);return {x:floorSide(from)+(floorSide(to)-floorSide(from))*ease,floor:from+(to-from)*ease,lift:Math.sin(Math.PI*progress)*.48,done:progress>=1};}
