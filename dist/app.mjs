import {startDance} from './dance.mjs';
import {createClimber} from './climb.mjs';
import {createEventGate} from './interaction.mjs';
import {initialState,step,restore,landing,STOPS,EVENT_TIME} from './game.mjs';
const $=s=>document.querySelector(s);const game=$('#game'),content=$('#content'),art=$('#scene-art'),character=$('#character');
const KEY='lotte-wish-tower-v1';let state;try{state=restore(localStorage.getItem(KEY));}catch{state=initialState();}
let stopDance=()=>{};
let timers=[],tick,particles=[],lastBurst=0,lastSnow=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const gate=createEventGate();let pressStarted=-Infinity,climbing=false,queuedClimbs=0;const climber=createClimber($('#climb-canvas'),{reduced});
const previewMode=new URLSearchParams(location.search).get('preview');
const isolatedPreview=['climb','start','dance'].includes(previewMode);
if(previewMode==='start')state=initialState();
if(previewMode==='dance')state={...initialState(),phase:'dancing',taps:102,speed:5};
if(previewMode==='climb'){const f=Math.max(1,Math.min(122,Number(new URLSearchParams(location.search).get('floor'))||0));state={...initialState(),phase:'climb',taps:f,speed:1+[22,40,60,83,102].filter(n=>n<=f).length};}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(label,action,kind='primary')=>`<button class="${kind}" data-action="${action}">${label}</button>`;
const tokenPill=()=>state.token?'<span class="token-pill">☀ ✦ <span>함께한 온기</span></span>':'';
function card(inner){return `<section class="card">${inner}</section>`;}
function eyebrow(s){return `<p class="eyebrow">${s}</p>`;}
function arrivalPicture(entrance=false){return `<svg class="arrival-picture" viewBox="${entrance?900:20} 0 855 887" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${entrance?'롯데월드타워 입구 앞에 도착한 캐릭터':'크리스마스마켓 월드광장을 걸어가는 캐릭터'}"><image href="assets/arrival.png" width="1774" height="887" /></svg>`;}
function foodSVG(type){return `<img class="product-art ${type}" src="assets/${type==='cocoa'?'ghana':type}-pixel.png" alt="${{pepero:'롯데 빼빼로',cocoa:'Ghana 가나 마일드 핫초코',burger:'롯데리아 불고기버거'}[type]}">`;}
const hyva=()=>'<span class="hyva-sprite" role="img" aria-label="휘바휘바 아저씨"></span>';
const gum=()=>'<span class="gum-sprite" role="img" aria-label="롯데 자일리톨"></span>';
const greenStar=()=>'<span class="green-star" role="img" aria-label="칠성사이다 캔에서 나온 초록별"></span>';
function starMeeting(){return `<div class="star-meeting"><img class="source-can" src="assets/cider-pixel.png" alt="별이 나온 칠성사이다 캔"><img class="sun-art" src="assets/sun.png" alt="햇님"><div class="star-flight">${greenStar()}${Array.from({length:6},(_,i)=>`<span class="white-tail" style="--trail:${i+1}">★</span>`).join('')}</div></div>`;}
const sprites=['......rrrrrr....','.....rrrrrrrr...','.....rrrrrrrrw..','....wwwwwwwwww..','.....hhhsshhh...','.....hssssssh...','.....ssksksss...','......ssssss....','.....wwwwwwww...','....rrrrLrrrr...','...srrrrrrrrrs..','...srrrwwrrrrs..','....rrrkkrrrr...','.....rrrrrrr....','.....rrr.rrr....','.....www.www....','.....kkk.kkk....'];const palette={r:'#c92c42',w:'#fff0d6',h:'#533329',s:'#efbd88',k:'#28202b',L:'#f3cb72'};
character.innerHTML=`<svg class="pixel-santa" viewBox="0 0 16 19" aria-hidden="true" shape-rendering="crispEdges">${sprites.map((row,y)=>Array.from(row).map((c,x)=>c==='.'?'':`<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[c]}"/>`).join('')).join('')}</svg><div class="step-platform"></div>`;
function persist(){if(isolatedPreview)return;try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function dispatch(event){
 if(event.type==='TAP'&&state.phase==='climb'){
  if(climbing||climber.busy()){queuedClimbs=Math.min(queuedClimbs+1,123);climber.boost();return;}
  climbing=true;
  climber.jumpTo(landing(state),()=>{state=step(state,event);persist();climbing=false;if(state.phase==='climb'){updateClimb();if(queuedClimbs>0){queuedClimbs--;dispatch({type:'TAP'});}}else{queuedClimbs=0;render();}});return;
 }
 const old=state;state=step(state,event);if(old===state)return;persist();render();
}
function clearTimers(){stopDance();stopDance=()=>{};timers.forEach(clearTimeout);timers=[];clearInterval(tick);}
function later(type,ms){timers.push(setTimeout(()=>dispatch({type}),ms));}
function updateClimb(){const progress=content.querySelector('.progress');if(progress)progress.setAttribute('aria-valuenow',Math.max(1,state.taps));$('#status').textContent=`${Math.max(1,state.taps)}층. 등반 속도 ${state.speed}배.`;const button=content.querySelector('[data-action="TAP"]');if(button)button.innerHTML=`<span class="step-icon">↟</span> 연타해서 벽 오르기 · ×${state.speed}`;const instruction=content.querySelector('.climb-instruction');if(instruction)instruction.textContent=`등반 속도 ×${state.speed} · 연타할수록 힘차게 올라가요`; const f=$('#floor-number');if(f)f.innerHTML=`${state.taps||'1'}<small>${state.taps?'F':'층 입구'}</small>`;const p=$('#progress-fill');if(p)p.style.width=`${(Math.max(1,state.taps)-1)/122*100}%`;$('#steps-count').textContent=`${Math.max(1,state.taps)} / 123층`;const next=Object.keys(STOPS).map(Number).find(x=>x>state.taps)||123;$('#next-stop').textContent=next===123?'다음 목적지 · 정상':`다음 쉼터 · ${next}층`;game.style.setProperty('--ascent',`${(Math.max(1,state.taps)-1)/122*100}%`);document.querySelectorAll('[data-stop]').forEach(el=>el.classList.toggle('done',state.taps>=Number(el.dataset.stop)));}
function render(){
 clearTimers();queuedClimbs=0;climbing=false;gate.enter(performance.now());pressStarted=-Infinity;game.dataset.phase=state.phase;game.classList.toggle('event-screen',!['intro','market','entrance','climb','hotel','wait','fireworks','outdoor','storm'].includes(state.phase));if(state.phase==='climb')climber.show(state.taps);else climber.hide();particles=[];content.classList.remove('enter');void content.offsetWidth;content.classList.add('enter');
 const wish=esc(state.wish);let html='';
 switch(state.phase){
 case 'intro':html=`${arrivalPicture()}<div class="arrival-caption intro-caption">${eyebrow('LOTTE WORLD TOWER · 2027')}<h2>소망이 닿는 밤</h2><p>반짝이는 월드광장을 지나<br>당신만의 새해를 만나러 가요.</p>${btn('새해를 향해 올라가기 <span class="arrow">↗</span>','START')}<div class="hint">한 손으로 즐기는 123층 소망 여행</div></div>`;break;
 case 'market':case 'entrance':{const market=state.phase==='market';html=`${arrivalPicture(!market)}<div class="arrival-caption"><div class="hotel-dots" aria-label="입장 ${market?'1':'2'}단계"><i class="${market?'active':''}"></i><i class="${market?'':'active'}"></i></div>${eyebrow(market?'01 · WORLD PLAZA':'02 · LOTTE WORLD TOWER')}<h2>${market?'반짝이는 크리스마스마켓을 지나':'소망을 향한 등반을 시작해요'}</h2><p>${market?'월드광장을 걸어 타워 앞으로 이동해요.':'롯데월드타워 1층에 도착했어요.'}</p>${btn(market?'타워 앞으로 걸어가기 →':'1층에서 출발하기 ↟',market?'TO_TOWER':'ENTER_TOWER')}</div>`;break;}
 case 'powerup':html=card(`${eyebrow(`${state.taps}F · ENERGY UP`)}<div class="power-number">×${state.speed}</div><h2>먹고 나니 힘이 생겼어요!</h2><p>등반 속도가 ${state.speed}배가 되었어요.<br>다음 이벤트 층에서는 정확히 멈출게요.</p>${btn(`${state.speed}배 속도로 벽 오르기`,'POWER_CONTINUE')}`);break;
 case 'xylitol':html=card(`${eyebrow('102F · THE LAST DOOR')}<div class="hyva-welcome">${hyva()}${gum()}</div><h2>자일리톨로 상쾌하게!</h2><p>마지막 문 앞에서<br>휘바휘바 아저씨를 만났어요.</p>${btn('자일리톨 먹기','EAT_GUM')}`);break;
 case 'danceChoice':case 'danceInsist':html=card(`${eyebrow('휘바휘바!')}<div class="hyva-welcome">${hyva()}</div><h2>휘바휘바 춤을 추셔야<br>마지막 문이 열립니다.</h2><p>춤을 추시겠습니까?</p>${state.phase==='danceChoice'?btn('네, 함께 춤출래요','DANCE')+btn('아니요?','DANCE_NO','secondary'):btn('그래도 추셔야 합니다','DANCE')}`);break;
 case 'dancing':html=card(`${eyebrow('102F · 휘바휘바')}<h2>휘바휘바!</h2><canvas id="dance-canvas" role="img" aria-label="정면을 보는 주인공과 휘바휘바 아저씨가 엉덩이를 좌우로 네 번 실룩이고 함께 도는 춤"></canvas><p class="dance-cue" id="dance-cue">춤을 준비하고 있어요…</p><p>함께 춤추면 마지막 문이 열려요.</p>`);break;
 case 'gateOpen':html=card(`${eyebrow('THE LAST DOOR IS OPEN')}<div class="open-door">✧</div><h2>마지막 문이 열렸어요!</h2><p>휘바휘바! 이제 한 번에 6계단씩.<br>소망이 기다리는 123층으로 가요.</p>${btn('열린 문을 지나 올라가기','GATE_CONTINUE')}`);break;
 case 'climb':html=`<div class="floor-strip"><div id="floor-number" class="floor-number"></div>${tokenPill()}</div><div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="123" aria-label="123층까지의 진행 상황"><span id="progress-fill"></span></div><div class="milestones">${[1,...Object.keys(STOPS).map(Number),123].map(f=>`<span data-stop="${f}" style="--stop:${(f-1)/122*100}%">${f}F</span>`).join('')}</div><div class="climb-bottom"><p class="climb-instruction">양손으로 벽을 붙잡고 힘차게 올라가요</p>${btn('<span class="step-icon">↟</span> 한 층 올라가기','TAP','primary tap-button')}<div class="climb-stats"><span id="next-stop"></span><b id="steps-count"></b></div></div>`;break;
 case 'rest':{const type=STOPS[state.taps];const food={pepero:['빼빼로','달콤한 한 입으로<br>다음 발걸음에 힘을 더해요.'],cocoa:['가나 핫초코','따뜻한 초콜릿 한 모금.<br>꽁꽁 언 마음까지 사르르 녹아요.'],burger:['롯데리아 불고기버거','든든하게 채우고 나면<br>더 높이 올라갈 수 있을 거예요.']}[type];html=`<div class="floor-strip"><div class="floor-number">${state.taps}<small>F</small></div>${tokenPill()}</div>${card(`${eyebrow('A LITTLE BREAK')}<div class="food-icon product-display">${foodSVG(type)}</div><h2>${food[0]}와<br>잠깐 쉬어가요</h2><p>${food[1]}</p>${btn(type==='cocoa'?'따뜻하게 마시고 출발':'맛있게 먹고 출발','REST_DONE')}`)}<p class="rest-info">${state.taps}층 · 안전 구역에서 쉬어가는 시간</p>`;break;}
 case 'cider':html=card(`${eyebrow('83F · A SMALL CHOICE')}<div class="food-icon product-display"><img class="product-art cider" src="assets/cider-pixel.png" alt="칠성사이다 픽셀 캔"></div><h2>칠성사이다를 햇님과<br>나눠드시겠습니까?</h2><p>시원한 한 모금이<br>특별한 만남의 시작이 될지도 몰라요.</p>${btn('네, 함께 마실래요','SHARE')}${btn('아니요, 혼자 마실래요','SOLO','secondary')}`);break;
 case 'solo':html=card(`${eyebrow('A REFRESHING MOMENT')}<div class="food-icon product-display"><img class="product-art cider" src="assets/cider-pixel.png" alt="칠성사이다 픽셀 캔"></div><h2>시원하게 한 모금!</h2><p>칠성사이다를 혼자 마셨어요.<br>이제 다시 소망을 향해 올라가 볼까요?</p>${btn('등반 계속하기 ↟','CONTINUE')}`);break;
 case 'sun':html=card(`${eyebrow('NICE TO MEET YOU')}<div class="sharing-scene"><img class="sun-art" src="assets/sun.png" alt="햇님">${greenStar()}<img class="product-art cider" src="assets/cider-pixel.png" alt="함께 마시는 칠성사이다"></div><h2>함께 마시니<br>더 반가운 한 모금</h2><p>햇님과 칠성사이다를 나눠 마셨어요.<br>그 순간, 사이다 속 별이 반짝입니다.</p>${btn('반짝이는 별 바라보기 ✦','MEET_STAR')}`);break;
 case 'thanks':html=card(`${eyebrow('WHEN THE SUN MEETS A STAR')}${starMeeting()}<h2>기다리던 너를 만났어</h2><p class="quote">“사실 별님을 만나고 싶었어.<br>만나게 해줘서 고마워!”</p><p>초록별과 여섯 흰 별이 햇님 주위를 돌아<br>따뜻한 빛 속으로 사라져요.</p>${btn('두 친구의 선물 받기','COLLECT')}`);break;
 case 'token':html=card(`${eyebrow('A LITTLE WARMTH, FOR YOU')}<div class="token-large">☀ <span>✦</span></div><h2>햇님·별님 아이콘을<br>모았어요!</h2><p>함께 나눈 마음을 간직해요.<br>시그니엘에서 특별한 선물과 바꿀 수 있어요.</p>${btn('따뜻한 마음으로 계속 올라가기','CONTINUE')}`);break;
 case 'wish':html=`<div class="floor-strip"><div class="floor-number">123<small>F</small></div>${tokenPill()}</div>${card(`${eyebrow('YOU MADE IT · 123 / 123')}<h2>당신의 새해 소망은<br>무엇인가요?</h2><p>밤하늘에 띄우고 싶은 한마디를 남겨요.</p><form id="wish-form"><label class="sr-only" for="wish-input">새해 소망, 최대 24자</label><input class="wish-input" id="wish-input" autocomplete="off" placeholder="우리 가족 모두 건강하기" value="${wish}"><div class="input-count"><span id="wish-help">최대 24자 · 나에게만 보이는 소망</span><span id="char-count">${Array.from(state.wish).length} / 24</span></div><button class="primary" type="submit">이 소망을 밤하늘에 담기 ✦</button></form>`)}`;break;
 case 'hotelChoice':html=card(`${eyebrow('A WARM INVITATION')}<div class="token-large">☀ <span>✦</span></div><h2>2027년을<br>시그니엘에서 맞이하시죠.</h2><p>시그니엘로 입장하시겠습니까?<br>따뜻한 객실에서 당신의 불꽃을 기다려요.</p>${btn('네, 시그니엘로 들어갈래요','HOTEL_YES')}${btn('아니요, 밖에서 기다릴래요','HOTEL_NO','secondary')}`);break;
 case 'outdoor':html=`${eyebrow('WAITING UNDER THE WINTER SKY')}<h2 class="outdoor-title">나의 소망을 품고<br>밤하늘을 바라봅니다.</h2><p class="outdoor-sub">“${wish}”<br>그런데, 눈송이가 점점 굵어지네요…</p>`;later('SNOW',3500);break;
 case 'storm':html=`<div class="storm-message">갑자기 눈이<br>펑펑 내리기 시작했어요…</div>`;later('SNOW_END',4000);break;
 case 'rescue':html=card(`${eyebrow('THE WARMTH YOU SHARED')}<div class="token-large">☀ <span>✦</span></div><h2>함께 나눈 온기가<br>당신을 지켜줍니다.</h2><p>눈사람이 되기 전에,<br><strong>시그니엘로 이동하겠습니다.</strong></p>${btn('따뜻한 곳으로 이동 중…','RESCUE')}`);later('RESCUE',3000);break;
 case 'snowman':html=card(`${eyebrow('A VERY SNOWY ENDING')}<div class="snowman" aria-label="눈사람">☃</div><h2>앗, 눈사람이 됐어요!</h2><p>햇님의 기운이 필요해요.<br>다시 시작하시겠습니까?</p>${btn('1층부터 다시 시작하기','RESTART')}${btn('여기서 잠시 쉬어가기','STAY','text-button')}`);break;
 case 'hotel':{const titles=['시그니엘에 오신 것을 환영합니다.','반짝이는 거실을 지나','오늘 밤, 당신을 위한 객실'];const descriptions=['따뜻한 새해가 문 너머에서 기다려요.','겨울의 설렘을 가득 담은 공간','잠시 둘러본 뒤, 창가로 함께 가요.'];html=`<div class="hotel-bottom"><div class="hotel-dots">${[0,1,2,3].map(i=>`<i class="${i===state.hotel?'active':''}"></i>`).join('')}</div><h2>${titles[state.hotel]}</h2><p>${descriptions[state.hotel]}</p>${btn(state.hotel===2?'창가로 가기 →':'다음 공간으로 →','NEXT_ROOM','text-button')}</div>`;game.style.setProperty('--hotel-pos',`${state.hotel*100/3}%`);later('NEXT_ROOM',state.hotel===2?3500:3000);break;}
 case 'wait':html=`<div class="wait-header"><span class="wait-label">SIGNIEL · MY NEW YEAR</span>${tokenPill()}</div><div class="countdown"><span class="clock" id="clock">00 : 00 : 00</span><span class="clock-label" id="clock-label">2027년 1월 1일 00:00 · 한국 시간</span></div><div class="wait-bottom">${eyebrow('YOUR WISH, UNDER THE STARS')}<h2 class="waiting-wish">“${wish}”</h2><p>창밖의 한강이 반짝입니다.<br>당신의 소망이 피어날 순간을 함께 기다려요.</p>${btn(state.coupon?'나의 사진 출력 쿠폰 보기':'햇님·별님 아이콘으로 선물 받기','SHOW_COUPON')}${btn('✦ 소망 불꽃 미리 보기','FIREWORKS','text-button')}<div class="hint">자정이 되면 소망 불꽃이 자동으로 펼쳐져요.</div></div>`;game.style.setProperty('--hotel-pos','100%');break;
 case 'fireworks':html=`<div class="wait-header"><span class="wait-label">HAPPY NEW YEAR · 2027</span>${tokenPill()}</div><div class="wait-bottom">${eyebrow('MAY YOUR WISH COME TRUE')}<h2 class="wish-display">${wish}</h2><p>롯데가 나의 새해 소망을 함께 응원합니다.<br>함께 나눈 따뜻함으로, 새해 복 많이 받으세요.</p>${btn(state.coupon?'추억을 남길 쿠폰 보기':'사진 출력 쿠폰 받기','SHOW_COUPON')}${btn('객실에서 더 머무르기','WAIT_AGAIN','text-button')}</div>`;game.style.setProperty('--hotel-pos','100%');break;
 }
 content.innerHTML=html;
 if(state.phase==='dancing')stopDance=startDance($('#dance-canvas'),$('#dance-cue'),{reduced,onEnd:()=>dispatch({type:'DANCE_END'})});
 if(game.classList.contains('event-screen')){
  const buttons=[...content.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
  timers.push(setTimeout(()=>{buttons.forEach(b=>b.disabled=false);},state.phase==='thanks'?6500:1000));
 }

 if(state.phase==='climb')updateClimb();
 if(state.phase==='wish'){$('#wish-input').addEventListener('input',e=>{$('#char-count').textContent=`${Array.from(e.target.value).length} / 24`;$('#wish-help').classList.remove('error');});$('#wish-form').addEventListener('submit',e=>{e.preventDefault();if(!gate.allowed(performance.now(),pressStarted))return;const v=$('#wish-input').value.trim();if(!v||Array.from(v).length>24){$('#wish-help').textContent=!v?'소망을 한 글자 이상 입력해주세요.':'24자 이내로 입력해주세요.';$('#wish-help').classList.add('error');$('#wish-input').focus();return;}dispatch({type:'WISH',value:v});});}
 if(state.phase==='wait'){updateClock();tick=setInterval(updateClock,1000);}
 $('#status').textContent=state.phase==='climb'?`${state.taps||1}층. 등반을 계속할 수 있습니다.`:(content.querySelector('h2')?.textContent||'장면이 바뀌었습니다.');
}
let previewed=false;
function updateClock(){if(state.phase!=='wait')return;const delta=EVENT_TIME-Date.now();if(delta<=0){$('#clock').textContent='HAPPY 2027';$('#clock-label').textContent='당신의 소망을 응원합니다';if(!previewed)dispatch({type:'FIREWORKS'});return;}const days=Math.floor(delta/86400000),h=Math.floor(delta%86400000/3600000),m=Math.floor(delta%3600000/60000),s=Math.floor(delta%60000/1000);$('#clock').textContent=[h,m,s].map(n=>String(n).padStart(2,'0')).join(' : ');$('#clock-label').textContent=`${days?`${days}일 뒤 · `:''}2027년 1월 1일 00:00 · 한국 시간`;}
content.addEventListener('pointerdown',()=>{pressStarted=performance.now();});
content.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat)pressStarted=performance.now();});
content.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action;if(action!=='TAP'&&game.classList.contains('event-screen')&&!gate.allowed(performance.now(),pressStarted))return;if(action==='SHOW_COUPON'){dispatch({type:'COUPON'});$('#coupon-dialog').showModal();return;}if(action==='STAY'){b.textContent='눈사람과 잠시 쉬어가는 중 ☃';return;}if(action==='FIREWORKS')previewed=true;if(action==='RESTART')previewed=false;dispatch({type:action});});
$('#menu-button').onclick=()=>$('#info').showModal();document.querySelectorAll('.dialog-close,.dialog-close-text').forEach(b=>b.onclick=()=>b.closest('dialog').close());$('#restart').onclick=()=>{if(confirm('처음부터 다시 시작할까요? 현재 등반과 소망이 초기화됩니다.')){$('#info').close();previewed=false;dispatch({type:'NEW_JOURNEY'});}};
const canvas=$('#fx'),ctx=canvas.getContext('2d');let w=0,h=0;function resize(){const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);}new ResizeObserver(resize).observe(canvas);
const colors=['#ffe5a0','#f7a5b9','#a2d8ff','#e4c2ff','#fff3d6'];
function burst(){const x=w*(.17+Math.random()*.65),y=h*(.16+Math.random()*.3),color=colors[Math.floor(Math.random()*colors.length)];for(let i=0;i<65;i++){const a=i/65*Math.PI*2,speed=1+Math.random()*2.3;particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:1,color,type:'spark'});}}
let lastTime=0;
function animate(time){requestAnimationFrame(animate);if(time-lastTime<(reduced?130:30))return;const dt=Math.min((time-lastTime)/16.7,3);lastTime=time;ctx.clearRect(0,0,w,h);const fireworks=state.phase==='fireworks';const heavy=['storm','snowman'].includes(state.phase);const snow=heavy||['intro','climb','outdoor','rescue'].includes(state.phase);
 if(fireworks&&time-lastBurst>(reduced?2000:680)){burst();lastBurst=time;}
 if(snow&&time-lastSnow>(heavy?30:140)){for(let i=0;i<(heavy?7:1);i++)particles.push({x:Math.random()*w,y:-5,vx:heavy?1.5:.15,vy:heavy?3.5+Math.random()*4:.5+Math.random(),life:1,type:'snow',size:heavy?2+Math.random()*4:2});lastSnow=time;}
 particles=particles.filter(p=>p.life>0&&p.y<h+10);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.type==='spark'){p.life-=.012*dt;p.vy+=.015*dt;ctx.fillStyle=p.color;ctx.globalAlpha=Math.max(p.life,0);ctx.fillRect(Math.round(p.x),Math.round(p.y),3,3);}else{ctx.fillStyle='#f3f5ff';ctx.globalAlpha=heavy?.85:.65;ctx.fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size);}}ctx.globalAlpha=1;
 if(fireworks&&state.wish){const lines=[];let line='';ctx.font=`500 ${Math.min(w/15,27)}px Galmuri14,monospace`;for(const c of Array.from(state.wish)){if(ctx.measureText(line+c).width>w*.76&&line){lines.push(line);line=c;}else line+=c;}if(line)lines.push(line);ctx.textAlign='center';ctx.fillStyle='#fff0b2';ctx.shadowColor='#ffbd68';ctx.shadowBlur=18;lines.forEach((l,i)=>ctx.fillText(l,w/2,h*.30+i*36));ctx.shadowBlur=0;}
}
render();requestAnimationFrame(animate);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.phase==='wait')updateClock();});
