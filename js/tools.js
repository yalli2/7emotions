/* SEVEN KEYS — 개인 실습 도구 (모든 기록은 각자 브라우저 localStorage 에만 저장) */
(function(){
'use strict';
const {$,$$,esc,EMOS,EMO,store,chart,radarOpts,barOpts,toast,trapSVG,wheelSVG,zonesSVG,today,GRID,LIVE} = SK;

function frame(el,title,desc,ctx={}){
  el.className='tool';
  el.innerHTML=`<div class="tool-head"><span class="tag">MY WORK</span><h3>${esc(title)}</h3><span class="saved hidden" style="margin-left:auto">✓ 저장됨</span></div>${desc?`<p class="small muted" style="margin-top:0">${desc}</p>`:''}<div class="tb"></div>`;
  return $('.tb',el);
}
function flash(el){ const s=$('.saved',el); if(!s) return; s.classList.remove('hidden'); clearTimeout(s._t); s._t=setTimeout(()=>s.classList.add('hidden'),1400); }
/* data-k 가 붙은 입력을 key 에 자동 저장 */
function bind(root,key,onChange){
  const st=store.get(key,{});
  $$('[data-k]',root).forEach(i=>{
    const k=i.dataset.k;
    if(st[k]!=null){ if(i.type==='checkbox') i.checked=!!st[k]; else i.value=st[k]; }
    const out=i.type==='range'?root.querySelector(`[data-o="${k}"]`):null; if(out) out.textContent=i.value;
    i.addEventListener('input',()=>{ const s=store.get(key,{}); s[i.dataset.k]= i.type==='checkbox'?i.checked:(i.type==='range'||i.type==='number'?+i.value:i.value); s._t=Date.now(); store.set(key,s); if(out) out.textContent=i.value; flash(root.closest('.tool')); onChange&&onChange(s); });
  });
  onChange&&onChange(st); return st;
}
const fld=(k,label,ph,ta)=>`<div class="field"><label>${label}</label>${ta?`<textarea data-k="${k}" placeholder="${esc(ph||'')}"></textarea>`:`<input data-k="${k}" placeholder="${esc(ph||'')}">`}</div>`;
const rng=(k,label,min=0,max=10,v)=>`<div class="slrow"><span>${label}</span><input type="range" min="${min}" max="${max}" value="${v??Math.round((min+max)/2)}" data-k="${k}"><b data-o="${k}"></b></div>`;
function listTool(key){ return {get:()=>store.get(key,[]), set:v=>store.set(key,v)}; }

const T = {};

/* ---------- 경험 기록 (각 감정 Exercise x.1) ---------- */
T.exp = (el,ctx)=>{
  const e=EMO[ctx.emo], key='exp_'+ctx.emo;
  const b=frame(el,`${e.f} 최근 ${e.ko}을(를) 느꼈던 경험`,`최근 ${e.ko}을(를) 강하게 느꼈던 때를 하나 떠올려 기록하세요. 그 감정이 맞는지(다른 감정과 헷갈리지 않는지)도 확인해 보세요.`);
  b.innerHTML=`<div class="grid2"><div>
    ${fld('desc','어떤 경험이었나요? 어떻게 묘사할 수 있을까요?','',1)}
    ${fld('notice','무엇을 가장 먼저 알아차렸나요?','몸, 생각, 표정, 행동…')}
    ${fld('cause',`무엇 때문에 ${e.ko}을(를) 느꼈나요?`,'')}
    ${fld('resp','어떻게 반응했나요? 무엇을 했나요?','')}
    ${fld('after','그 뒤에 어떻게 되었나요?','')}
   </div><div>
    <label>다섯 요소별 강도 (0~10)</label>
    ${rng('i0','💭 느낌')}${rng('i1','🫀 신체')}${rng('i2','🙂 표정')}${rng('i3','🧠 생각')}${rng('i4','🏃 행동충동')}
    <div class="chart sm" style="margin-top:8px"><canvas></canvas></div>
    <div class="small muted" style="text-align:center">나의 ${e.ko} — 다섯 요소 프로필</div>
   </div></div>`;
  bind(b,key,s=>{ const v=[0,1,2,3,4].map(i=>s['i'+i]??5);
    chart($('canvas',b),{type:'radar',data:{labels:['느낌','신체','표정','생각','행동'],datasets:[{data:v,borderColor:e.c,backgroundColor:e.c+'33',borderWidth:2,pointBackgroundColor:e.c,pointRadius:4}]},options:radarOpts(10)}); });
};

/* ---------- 해석 실험 (서론) ---------- */
T.interpret = el=>{
  const key='interpret';
  const b=frame(el,'🧠 같은 상황, 다른 해석','최근 겪은 애매한 상황 하나를 적고, 가능한 해석 네 가지와 각 해석이 불러올 감정을 골라 보세요.');
  const opt=`<option value="">감정 선택</option>${EMOS.map(e=>`<option value="${e.k}">${e.f} ${e.ko}</option>`).join('')}<option value="neutral">😐 덤덤</option>`;
  b.innerHTML=fld('sit','상황','예: 팀장님이 내 보고서를 보고 아무 말 없이 나갔다')+[0,1,2,3].map(i=>`<div class="lst"><div class="r"><input data-k="t${i}" placeholder="해석 ${i+1}"><select data-k="e${i}">${opt}</select><span></span></div></div>`).join('')+`<div class="result-box small" id="ires"></div>`;
  bind(b,key,s=>{ const out=[0,1,2,3].filter(i=>s['t'+i]&&s['e'+i]).map(i=>{ const e=EMO[s['e'+i]]; return `<div>“${esc(s['t'+i])}” → <b class="emo" style="--c:${e?e.c:'#8a8c99'}"><i></i>${e?e.f+' '+e.ko:'😐 덤덤'}</b></div>`; });
    $('#ires',b).innerHTML=out.length?`<b>하나의 상황에서 ${new Set([0,1,2,3].map(i=>s['e'+i]).filter(Boolean)).size}가지 감정이 나올 수 있습니다.</b>${out.join('')}`:'해석과 감정을 채우면 여기에 정리됩니다.'; });
};

/* ---------- 소중한 사람과 감정 (Exercise 0.2) ---------- */
T.person = el=>{
  const key='person';
  const b=frame(el,'💌 소중한 사람과 나의 감정','소중한 사람 한 명을 떠올리고, 그 사람과 관련해 느껴 본 감정을 모두 체크한 뒤 이유를 적어 보세요.');
  b.innerHTML=fld('name','소중한 사람 (이니셜·별명)','예: J')+`<div class="opts" style="margin:8px 0">${EMOS.map(e=>`<label class="opt" style="display:inline-flex;gap:6px;align-items:center;font-weight:600"><input type="checkbox" data-k="c_${e.k}">${e.f} ${e.ko}</label>`).join('')}</div>`+EMOS.map(e=>`<div class="field pr-${e.k} hidden"><label>${e.f} ${e.ko}을(를) 느낀 이유</label><input data-k="w_${e.k}"></div>`).join('')+`<div class="callout small" id="pmsg"></div>`;
  bind(b,key,s=>{ let n=0; EMOS.forEach(e=>{ const on=!!s['c_'+e.k]; if(on)n++; $('.pr-'+e.k,b).classList.toggle('hidden',!on); });
    $('#pmsg',b).innerHTML= n? `<b>${n}가지 감정</b>을 느꼈네요. 그중 불편한 감정들도 결국 이 사람이 나에게 소중하다는 사실과 연결되어 있지 않나요?` : '느껴 본 감정을 체크해 보세요.'; });
};

/* ---------- 나의 하루 인내의 창 ---------- */
T.window = el=>{
  const key='window', slots=['기상','출근','오전','점심','오후','퇴근','저녁','잠들기 전'];
  const b=frame(el,'🌊 나의 하루, 인내의 창','평소 하루의 감정 각성 수준을 시간대별로 표시하세요 (0=완전히 가라앉음, 10=압도됨). 초록 띠가 나의 인내의 창입니다.');
  b.innerHTML=`<div class="grid2"><div>${slots.map((s,i)=>rng('s'+i,s,0,10,5)).join('')}<div class="row small" style="margin-top:8px">창의 아래 경계 <input type="number" min="0" max="10" data-k="lo" style="width:70px" placeholder="3"> 위 경계 <input type="number" min="0" max="10" data-k="hi" style="width:70px" placeholder="7"></div></div><div><div class="chart"><canvas></canvas></div><div class="small" id="wmsg" style="margin-top:6px"></div></div></div>`;
  bind(b,key,s=>{ const v=slots.map((_,i)=>s['s'+i]??5), lo=s.lo??3, hi=s.hi??7;
    const over=v.filter(x=>x>hi).length, under=v.filter(x=>x<lo).length;
    chart($('canvas',b),{type:'line',data:{labels:slots,datasets:[
      {label:'창 위',data:slots.map(()=>hi),borderColor:'transparent',pointRadius:0,fill:'+1',backgroundColor:'rgba(27,175,122,.15)'},
      {label:'창 아래',data:slots.map(()=>lo),borderColor:'transparent',pointRadius:0,fill:false},
      {label:'나의 각성',data:v,borderColor:'#1c2036',borderWidth:2,pointRadius:5,pointBackgroundColor:v.map(x=>x>hi?'#e34948':x<lo?'#2a78d6':'#1baf7a'),tension:.35}]},
      options:{plugins:{legend:{display:false},tooltip:{filter:i=>i.datasetIndex===2}},scales:{y:{min:0,max:10,grid:{color:GRID},ticks:{stepSize:2}},x:{grid:{display:false}}}}});
    $('#wmsg',b).innerHTML=`창 밖 시간대: <span class="badge bad">▲ 과각성 ${over}</span> <span class="badge warn" style="background:#e5effb;color:#1c4f9a">▼ 저각성 ${under}</span> <span class="badge good">● 창 안 ${8-over-under}</span>`; });
};

/* ---------- Top 5 두려움 ---------- */
T.fearlist = el=>{
  const key='fearlist', cats=['대인 관계','죽음·부상·질병','동물','광장·공간','기타'];
  const b=frame(el,'😨 나의 Top 5 두려움','나를 가장 두렵게 만드는 다섯 가지를 적고 범주와 강도를 매겨 보세요.');
  b.innerHTML=[0,1,2,3,4].map(i=>`<div class="lst"><div class="r c4"><input data-k="f${i}" placeholder="두려움 ${i+1}"><select data-k="c${i}">${cats.map((c,j)=>`<option value="${j}">${c}</option>`).join('')}</select><input type="number" min="0" max="10" data-k="v${i}" placeholder="강도 0~10"><span></span></div></div>`).join('')+`<div class="grid2" style="margin-top:10px"><div class="chart sm"><canvas class="a"></canvas></div><div class="chart sm"><canvas class="b"></canvas></div></div>`;
  bind(b,key,s=>{ const it=[0,1,2,3,4].filter(i=>s['f'+i]).map(i=>({n:s['f'+i],c:+(s['c'+i]||0),v:+(s['v'+i]||0)}));
    const cnt=cats.map((_,j)=>it.filter(x=>x.c===j).length);
    chart($('canvas.a',b),{type:'bar',data:{labels:it.map(x=>x.n.slice(0,12)),datasets:[{data:it.map(x=>x.v),backgroundColor:'#6250d6',borderRadius:4}]},options:barOpts({horizontal:true,max:10})});
    chart($('canvas.b',b),{type:'doughnut',data:{labels:cats,datasets:[{data:cnt,backgroundColor:['#6250d6','#e34948','#008300','#2a78d6','#c3c2b7'],borderColor:'#fff',borderWidth:2}]},options:{cutout:'58%',plugins:{legend:{position:'right'}}}}); });
};

/* ---------- 호흡 ---------- */
T.breath = el=>{
  const b=frame(el,'🫁 상자 호흡 (4-4-4-4)','들이쉬기 4초 → 멈춤 4초 → 내쉬기 4초 → 멈춤 4초. 몸의 브레이크(부교감신경)를 밟는 연습입니다. 3분이면 충분합니다.');
  b.innerHTML=`<div class="breath"><div class="ball">시작</div></div><div class="row" style="justify-content:center"><button class="btn sm go">▶ 시작</button><button class="btn ghost sm stop">■ 멈춤</button><span class="small muted cyc">0회</span></div>`;
  let t=null, n=0; const ball=$('.ball',b), ph=[['들이쉬기',1.9],['멈춤',1.9],['내쉬기',1],['멈춤',1]];
  const step=i=>{ ball.textContent=ph[i%4][0]; ball.style.transform=`scale(${ph[i%4][1]})`; if(i%4===3){ n++; $('.cyc',b).textContent=n+'회'; } t=setTimeout(()=>step(i+1),4000); };
  $('.go',b).onclick=()=>{ clearTimeout(t); n=0; step(0); };
  $('.stop',b).onclick=()=>{ clearTimeout(t); ball.textContent='잘했어요'; ball.style.transform='scale(1)'; const h=store.get('breathlog',[]); if(n) { h.push({d:today(),n}); store.set('breathlog',h); } };
};

/* ---------- 주의 훈련 ---------- */
T.attention = el=>{
  const key='attention', steps=['왼쪽 어깨의 근육과 뼈, 피부에 주의를 둡니다','이제 오른발 발가락으로 옮깁니다','들리는 소리 세 가지를 찾아봅니다','눈에 보이는 파란색 물건 세 가지를 찾습니다','손바닥의 온도를 느껴 봅니다','숨이 코끝을 지나는 감각에 머뭅니다'];
  const b=frame(el,'🔦 주의의 스포트라이트 옮기기','주의는 손전등과 같습니다. 원하는 곳으로 옮길 수 있다는 것을 경험해 보세요. 각 단계에 20초씩 머뭅니다.');
  b.innerHTML=`<div class="result-box" style="text-align:center;font-size:1.15rem;font-weight:700;min-height:70px;display:grid;place-items:center" id="ast">버튼을 눌러 시작하세요</div><div class="row" style="justify-content:center;margin-top:10px"><button class="btn sm" id="ago">▶ 20초씩 안내</button></div>${rng('ease','해 보니, 주의를 옮기기가 얼마나 쉬웠나요?',0,10,5)}`;
  let t; $('#ago',b).onclick=()=>{ clearTimeout(t); let i=0; const go=()=>{ if(i>=steps.length){ $('#ast',b).textContent='끝! 주의는 내가 옮길 수 있습니다 🙌'; return; } $('#ast',b).textContent=`${i+1}/${steps.length} · ${steps[i]}`; i++; t=setTimeout(go,20000); }; go(); };
  bind(b,key);
};

/* ---------- 공포 → 설렘 리프레이밍 ---------- */
T.reframe = el=>{
  const key='reframe';
  const b=frame(el,'⚡ 공포를 설렘으로','긴장되는 일을 하나 적고, 몸의 신호를 “준비”의 신호로 다시 이름 붙여 보세요.');
  b.innerHTML=fld('ev','다가오는 긴장되는 일','예: 다음 주 임원 보고')+fld('body','지금 몸의 신호','심장 두근, 손에 땀')+fld('fear','공포 문장','예: 망치면 끝장이야')+fld('ex','설렘 문장으로 바꾸면','예: 내 몸이 최고의 성과를 위해 시동을 거는 중이다')+rng('b','바꾼 뒤 기대감 (0~10)')+`<div class="result-box" id="rf"></div>`;
  bind(b,key,s=>{ $('#rf',b).innerHTML= s.ex? `<div style="font-size:1.1rem">📣 “${esc(s.ex)}”</div><div class="small muted">긴장될 때 소리 내어 말해 보세요.</div>`:'설렘 문장을 만들면 카드로 보여 드립니다.'; });
};

/* ---------- 덫 자가점검 ---------- */
T.trapcheck = (el,ctx)=>{
  const e=EMO[ctx.emo], items=TRAPCHECK[ctx.emo], key='tc_'+ctx.emo;
  const b=frame(el,`${e.f} ${e.ko}의 덫 자가점검`,'최근 한 달을 기준으로 각 문항이 얼마나 해당하는지 고르세요. 진단 도구가 아니라 패턴을 알아차리기 위한 점검입니다.');
  const lv=['전혀','가끔','자주','거의 항상'];
  b.innerHTML=items.map((q,i)=>`<div class="field"><label style="font-weight:600;color:var(--ink)">${i+1}. ${esc(q)}</label><div class="opts">${lv.map((l,j)=>`<button class="opt" data-q="${i}" data-v="${j}">${l}</button>`).join('')}</div></div>`).join('')+`<div class="result-box"><div class="row"><span class="bigstat sc">0</span><span class="muted">/ ${items.length*3}</span><span class="lvl"></span></div><div class="gauge" style="margin-top:8px"><span style="width:0%"></span></div><div class="small msg" style="margin-top:8px"></div></div>`;
  const st=store.get(key,{});
  const draw=()=>{ const s=store.get(key,{}); let sum=0, n=0; items.forEach((_,i)=>{ if(s['q'+i]!=null){ sum+=s['q'+i]; n++; } });
    $$('.opt',b).forEach(x=>x.classList.toggle('sel',s['q'+x.dataset.q]===+x.dataset.v));
    const pct=sum/(items.length*3)*100; $('.sc',b).textContent=sum; $('.gauge span',b).style.width=pct+'%';
    const [cls,txt]= pct<34?['good','낮음 — 덫의 패턴이 적어요']:pct<67?['warn','중간 — 일부 패턴이 보여요']:['bad','높음 — 덫에 걸려 있을 가능성'];
    $('.lvl',b).innerHTML=n?`<span class="badge ${cls}">${cls==='good'?'●':cls==='warn'?'▲':'■'} ${txt}</span>`:'';
    $('.msg',b).textContent= n<items.length?`${items.length-n}문항 남음`: (pct>=34?'아래 “나의 덫 그리기”로 나만의 악순환을 그려 보고, 이 챕터의 탈출 기술을 적용해 보세요.':'좋아요. 이 감정이 올 때 지금처럼 반응하는 방법을 유지하세요.'); };
  $$('.opt',b).forEach(x=>x.onclick=()=>{ const s=store.get(key,{}); s['q'+x.dataset.q]=+x.dataset.v; s._t=Date.now(); store.set(key,s); flash(el); draw(); });
  draw();
};

/* ---------- 나의 덫 그리기 ---------- */
T.trap = (el,ctx)=>{
  const e=EMO[ctx.emo], tr=TRAPS[ctx.emo], key='trap_'+ctx.emo;
  const b=frame(el,`${e.f} 나의 ${e.ko}의 덫 그리기`,'최근 비슷한 감정을 느낀 세 번의 상황을 떠올리며 각 칸을 채우면 나만의 악순환 도식이 완성됩니다. 마지막 칸에는 덫을 끊을 “다른 반응”을 적으세요.');
  b.innerHTML=`<div class="grid2"><div>${tr.nodes.map((n,i)=>fld('n'+i,`${i+1}. ${n.h}`,n.ph)).join('')}${fld('out','🗝️ 덫을 끊을 다른 반응','이 순환의 어느 지점에서, 무엇을 다르게 할까요?',1)}<button class="btn ghost sm" id="trp">🖨️ 도식 인쇄</button></div><div class="diagram" id="tsvg" style="margin:0"></div></div>`;
  bind(b,key,s=>{ const nodes=tr.nodes.map((n,i)=>({h:n.h,ph:n.ph.replace(/^예: /,''),v:s['n'+i]||''}));
    $('#tsvg',b).innerHTML=trapSVG(nodes,e.c,tr.center)+(s.out?`<div class="callout" style="text-align:left;margin-top:8px">🗝️ <b>탈출 반응:</b> ${esc(s.out)}</div>`:''); });
  $('#trp',b).onclick=()=>{ const w=window.open('','_blank'); w.document.write(`<title>${e.ko}의 덫</title><body style="font-family:sans-serif;padding:20px">${$('#tsvg',b).innerHTML}</body>`); w.document.close(); setTimeout(()=>w.print(),400); };
};

/* ---------- 노출 사다리 / 세 개의 원 ---------- */
T.ladder = (el,ctx)=>{
  const e=EMO[ctx.emo], L=listTool('ladder_'+ctx.emo);
  const b=frame(el,`🪜 나의 다가가기 사다리 (${e.ko})`,'두려운 대상과 관련된 활동을 쉬운 것부터 적고 불편 점수(0~100)를 매기세요. 해낸 단계는 체크! 30점 미만은 편안, 30~70은 해볼 만한 영역, 70 이상은 두려움 영역에 표시됩니다.');
  b.innerHTML=`<div class="row"><input id="ln" placeholder="${ctx.emo==='disgust'?'예: 주사기 사진 10초 보기':'예: 엘리베이터 앞에 1분 서 있기'}" style="flex:1;min-width:200px"><input id="lv" type="number" min="0" max="100" placeholder="0~100" style="width:100px"><button class="btn sm" id="ladd">추가</button></div><div class="lst" id="lls"></div><div class="grid2" style="margin-top:8px;align-items:center"><div class="chart"><canvas></canvas></div><div id="lz"></div></div>`;
  const draw=()=>{ const it=L.get().sort((a,b)=>a.v-b.v);
    $('#lls',b).innerHTML=it.map((x,i)=>`<div class="r" style="grid-template-columns:auto 1fr 70px auto"><input type="checkbox" data-i="${x.id}" ${x.done?'checked':''}><span style="${x.done?'text-decoration:line-through;color:var(--muted)':''}">${esc(x.n)}</span><b>${x.v}</b><button class="x" data-d="${x.id}">×</button></div>`).join('')||'<div class="small muted">아직 단계가 없습니다.</div>';
    const z=v=>v<30?0:v<70?1:2, cols=['#1baf7a','#eda100','#e34948'];
    chart($('canvas',b),{type:'bar',data:{labels:it.map(x=>x.n.slice(0,14)),datasets:[{data:it.map(x=>x.v),backgroundColor:it.map(x=>x.done?'#1c2036':cols[z(x.v)]),borderRadius:4}]},options:barOpts({max:100,tip:c=>`불편 점수 ${c.raw}${it[c.dataIndex].done?' · ✓ 완료':''}`})});
    const cnt=[0,1,2].map(k=>it.filter(x=>z(x.v)===k).length), done=it.filter(x=>x.done).length;
    $('#lz',b).innerHTML=zonesSVG(cnt)+`<div class="small" style="text-align:center">완료 ${done}/${it.length} 단계 · 막대: 🟢 편안 🟡 해볼 만함 🔴 두려움 ⬛ 완료</div>`;
    $$('[data-i]',b).forEach(c=>c.onchange=()=>{ const a=L.get(); const x=a.find(y=>y.id===c.dataset.i); x.done=c.checked; L.set(a); flash(el); draw(); });
    $$('[data-d]',b).forEach(c=>c.onclick=()=>{ L.set(L.get().filter(y=>y.id!==c.dataset.d)); draw(); }); };
  $('#ladd',b).onclick=()=>{ const n=$('#ln',b).value.trim(), v=Math.max(0,Math.min(100,+$('#lv',b).value||0)); if(!n) return; const a=L.get(); a.push({id:SK.uid(),n,v,done:false}); L.set(a); $('#ln',b).value=''; $('#lv',b).value=''; flash(el); draw(); };
  draw();
};

/* ---------- 슬픔 vs 분노 (Exercise 2.2) ---------- */
T.sadvsanger = el=>{
  const key='sadvsanger';
  const b=frame(el,'🧩 슬픔일까, 분노일까?','아끼는 물건 하나를 떠올려 보세요. 그 물건이 아래 상황이 되면 어떤 감정이 더 클까요?');
  const sc=[['실수로 내가 떨어뜨려 망가졌다',''],['누군가 일부러 망가뜨렸다',''],['오래되어 저절로 낡아 못 쓰게 됐다',''],['친구가 빌려 가서 잃어버렸다','']];
  b.innerHTML=fld('obj','아끼는 물건','예: 할머니가 주신 시계')+sc.map((x,i)=>`<div class="field"><label style="color:var(--ink)">${x[0]}</label><div class="slrow" style="grid-template-columns:70px 1fr 70px"><span style="color:#1baf7a">😢 슬픔</span><input type="range" min="0" max="10" value="5" data-k="s${i}"><span style="color:#e34948;text-align:right">분노 😠</span></div></div>`).join('')+`<div class="callout small">💡 <b>누군가의 의도</b>(위협)가 느껴질수록 분노가, <b>그저 잃었다</b>는 느낌일수록 슬픔이 커집니다. 같은 상실이라도 해석이 감정을 가릅니다.</div>`;
  bind(b,key);
};

/* ---------- 슬픔에 반응하는 질문 ---------- */
T.sadq = el=>{
  const key='sadq';
  const qs=[['감정 탐색','지금 나는 무엇을 느끼고 있나? 무엇을 잃었거나 무엇에 막혀 있나?'],['잠기지 않기','더 큰 그림이 있나? 잘 되고 있는 것, 내가 잘하고 있는 것은?'],['연결','누구와 이야기할 수 있을까? 누가 도와줄 수 있을까?'],['행동','지금 할 수 있는 일이 있나? 이 과정에 도움이 필요한가?']];
  const b=frame(el,'🌧️ 슬플 때 스스로에게 묻기','최근 슬펐던 일을 떠올리며 네 가지 질문에 답해 보세요.');
  b.innerHTML=qs.map((q,i)=>fld('a'+i,`${['💭','🔭','🤝','👣'][i]} ${q[0]} — ${q[1]}`,'',1)).join('');
  bind(b,key);
};

/* ---------- 활동 계획 (더 하기) ---------- */
T.activity = el=>{
  const L=listTool('activity'), days=['월','화','수','목','금','토','일'], types=[['ach','🏆 성취','#2a78d6'],['con','🤝 연결','#eb6834'],['fun','🎈 즐거움','#eda100']];
  const b=frame(el,'📅 더 하기: 이번 주 활동 계획표','작은 활동을 요일별로 계획하고, 한 뒤에는 기분(0~10)을 기록하세요. 성취·연결·즐거움이 고루 들어가도록!');
  b.innerHTML=`<div class="row"><select id="ad" style="width:auto">${days.map(d=>`<option>${d}</option>`).join('')}</select><input id="an" placeholder="예: 동료와 점심 산책 15분" style="flex:1;min-width:180px"><select id="at" style="width:auto">${types.map(t=>`<option value="${t[0]}">${t[1]}</option>`).join('')}</select><button class="btn sm" id="aadd">추가</button></div><div class="lst" id="als"></div><div class="grid2" style="margin-top:8px"><div><div class="chart sm"><canvas class="a"></canvas></div><div class="small muted" style="text-align:center">요일별 활동 수</div></div><div><div class="chart sm"><canvas class="b"></canvas></div><div class="small muted" style="text-align:center">활동 균형</div></div></div><div class="small" id="amsg"></div>`;
  const draw=()=>{ const it=L.get();
    $('#als',b).innerHTML=it.sort((x,y)=>days.indexOf(x.d)-days.indexOf(y.d)).map(x=>{ const t=types.find(t=>t[0]===x.t); return `<div class="r c4"><span><b>${x.d}</b> · ${esc(x.n)} <span class="pill">${t[1]}</span></span><label class="small" style="font-weight:600"><input type="checkbox" data-c="${x.id}" ${x.done?'checked':''}> 했어요</label><input type="number" min="0" max="10" placeholder="기분" data-m="${x.id}" value="${x.m??''}"><button class="x" data-d="${x.id}">×</button></div>`; }).join('')||'<div class="small muted">활동을 추가해 보세요.</div>';
    chart($('canvas.a',b),{type:'bar',data:{labels:days,datasets:types.map(t=>({label:t[1],data:days.map(d=>it.filter(x=>x.d===d&&x.t===t[0]).length),backgroundColor:t[2],borderColor:'#fff',borderWidth:{top:2},borderRadius:3}))},options:Object.assign(barOpts({legend:true}),{scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,beginAtZero:true,ticks:{precision:0},grid:{color:GRID},border:{display:false}}}})});
    chart($('canvas.b',b),{type:'doughnut',data:{labels:types.map(t=>t[1]),datasets:[{data:types.map(t=>it.filter(x=>x.t===t[0]).length),backgroundColor:types.map(t=>t[2]),borderColor:'#fff',borderWidth:2}]},options:{cutout:'58%',plugins:{legend:{position:'right'}}}});
    const done=it.filter(x=>x.done), mood=done.filter(x=>x.m!=null&&x.m!=='');
    $('#amsg',b).innerHTML=`완료 <b>${done.length}/${it.length}</b>${mood.length?` · 활동 후 평균 기분 <b>${(mood.reduce((s,x)=>s+ +x.m,0)/mood.length).toFixed(1)}</b>/10`:''}`;
    $$('[data-c]',b).forEach(c=>c.onchange=()=>{ const a=L.get(); a.find(y=>y.id===c.dataset.c).done=c.checked; L.set(a); flash(el); draw(); });
    $$('[data-m]',b).forEach(c=>c.onchange=()=>{ const a=L.get(); a.find(y=>y.id===c.dataset.m).m=c.value===''?null:+c.value; L.set(a); flash(el); draw(); });
    $$('[data-d]',b).forEach(c=>c.onclick=()=>{ L.set(L.get().filter(y=>y.id!==c.dataset.d)); draw(); }); };
  $('#aadd',b).onclick=()=>{ const n=$('#an',b).value.trim(); if(!n) return; const a=L.get(); a.push({id:SK.uid(),d:$('#ad',b).value,n,t:$('#at',b).value,done:false,m:null}); L.set(a); $('#an',b).value=''; flash(el); draw(); };
  draw();
};

/* ---------- 생각 기록 ---------- */
const STYLES=['흑백 사고','과잉 일반화','정신적 여과','긍정 깎아내리기','성급한 결론','과장','감정적 추론','당위 진술','낙인찍기','개인화'];
T.thought = (el,ctx)=>{
  const e=EMO[ctx.emo], key='thought_'+ctx.emo, shame=ctx.emo==='shame';
  const b=frame(el, shame?'🪞 자기상 도전 기록':'📝 생각 기록 — 증거로 점검하기', shame?'나를 향한 부정적인 평가 하나를 골라 질문으로 점검하고, 바라는 자기상을 적어 보세요.':'괴로운 생각 하나를 골라 증거를 따져 보고 새로운 생각을 만들어 보세요.');
  b.innerHTML=`<div class="grid2"><div>${fld('sit','상황','')}${fld('th',shame?'나에 대한 생각':'떠오른 생각',shame?'예: 나는 쓸모없어':'예: 나는 아무것도 제대로 못 해')}${rng('b0','이 생각을 얼마나 믿나요? (%)',0,100,80)}
   <div class="field"><label>사고 스타일</label><select data-k="st"><option value="">선택</option>${STYLES.map(s=>`<option>${s}</option>`).join('')}</select></div>
   ${fld('ev1','이 생각을 지지하는 증거','',1)}${fld('ev2',shame?'항상 그런가? 반대 증거 / 다른 사람의 관점':'지지하지 않는 증거 / 다른 사람도 동의할까?','',1)}</div><div>
   ${shame?fld('dbl','같은 상황의 친구에게라면 뭐라고 말할까? (이중 잣대)','',1):fld('mean','나에게 너무 가혹하지 않나? 이렇게 생각하면 어떤 영향이 있나?','',1)}
   ${fld('nw',shame?'바라는 자기상 / 균형 잡힌 자기 평가':'새로운 생각','',1)}${rng('b1','새로운 관점에서 처음 생각을 얼마나 믿나요? (%)',0,100,50)}
   <div class="chart sm"><canvas></canvas></div></div></div>`;
  bind(b,key,s=>{ chart($('canvas',b),{type:'bar',data:{labels:['기록 전','기록 후'],datasets:[{data:[s.b0??80,s.b1??50],backgroundColor:['#c3c2b7',e.c],borderRadius:4,barThickness:56}]},options:barOpts({max:100,tip:c=>'믿음 '+c.raw+'%'})}); });
};

/* ---------- 정의·확인·해결 ---------- */
T.threat = el=>{
  const key='threat';
  const b=frame(el,'🛡️ 정의 → 확인 → 해결','최근 화가 났던 상황 하나로 3단계를 밟아 보세요.');
  b.innerHTML=`<div class="grid3"><div><span class="pill" style="background:#fce6e6;color:#a12727">1 정의하기</span>${fld('who','누구에게 화가 났나?','')}${fld('int','그 행동을 어떻게 해석했나?','')}${fld('thr','위협은 ___ 이다','예: 내가 존중받지 못한다')}${rng('t0','위협 크기 (처음)',0,10,8)}</div>
  <div><span class="pill" style="background:#fff3d6;color:#8a5a00">2 확인하기</span>${fld('alt','다른 설명은 없을까?','',1)}${fld('ask','누구에게 확인해 볼 수 있나?','')}<label class="small" style="font-weight:600"><input type="checkbox" data-k="little"> “작은 어른 가정”을 하고 있진 않았다</label>${rng('t1','확인 후 위협 크기',0,10,5)}</div>
  <div><span class="pill" style="background:#e3f6e3;color:#0b6b0b">3 해결하기</span>${fld('res','위협이 실제라면 무엇을 할까?','예: 1:1로 단호하게 말하기',1)}${fld('when','언제·어떻게?','')}<div class="chart sm"><canvas></canvas></div></div></div>`;
  bind(b,key,s=>{ chart($('canvas',b),{type:'bar',data:{labels:['처음','확인 후'],datasets:[{data:[s.t0??8,s.t1??5],backgroundColor:['#e34948','#c3c2b7'],borderRadius:4,barThickness:46}]},options:barOpts({max:10,tip:c=>'위협 '+c.raw+'/10'})}); });
};

/* ---------- 폭발 vs 억누름 ---------- */
T.explode = el=>{
  const key='explode', ex=['소리를 높인다','물건·문에 화풀이','비난·빈정거림','즉시 맞받아친다'], bt=['아무 말 없이 삼킨다','괜찮은 척 웃는다','속으로 곱씹는다','피하고 연락을 끊는다'];
  const b=frame(el,'⚖️ 폭발 ↔ 억누름 균형','화가 날 때 각 행동을 얼마나 자주 하나요? (0~10) 한쪽만이 아니라 두 쪽 모두 높다면 “참다가 터지는” 덫일 수 있습니다.');
  b.innerHTML=`<div class="grid2"><div><b style="color:#e34948">💥 폭발</b>${ex.map((x,i)=>rng('e'+i,x,0,10,3)).join('')}<b style="color:#2a78d6;display:block;margin-top:10px">🫙 억누름</b>${bt.map((x,i)=>rng('b'+i,x,0,10,3)).join('')}</div><div><div class="chart"><canvas></canvas></div><div class="result-box small" id="exm"></div></div></div>`;
  bind(b,key,s=>{ const E=ex.map((_,i)=>s['e'+i]??3), B=bt.map((_,i)=>s['b'+i]??3), se=E.reduce((a,c)=>a+c,0), sb=B.reduce((a,c)=>a+c,0);
    chart($('canvas',b),{type:'bar',data:{labels:['폭발','억누름'],datasets:[{data:[se,sb],backgroundColor:['#e34948','#2a78d6'],borderRadius:4,barThickness:60}]},options:barOpts({max:40})});
    $('#exm',b).innerHTML= se>=20&&sb>=20?'<span class="badge bad">■ 참다가 터지는 패턴</span> 두 악순환이 맞물려 있어요. 억누르지 말고 작을 때 단호하게 표현하는 연습이 핵심입니다.': se>=20?'<span class="badge warn">▲ 폭발 쪽</span> 몸 반응 다루기(호흡·잠시 멈춤)와 위협 확인하기를 먼저 연습해 보세요.': sb>=20?'<span class="badge warn">▲ 억누름 쪽</span> 쌓이기 전에 “나 전달법”으로 작게, 자주 표현해 보세요.':'<span class="badge good">● 균형</span> 지금의 표현 방식을 유지하세요.'; });
};

/* ---------- 단호한 문장 만들기 ---------- */
T.assert = el=>{
  const key='assert';
  const b=frame(el,'💬 단호한 문장 만들기','상황 → 나의 느낌 → 바라는 것 → (필요하면) 결과 순서로 적으면 공격적이지도 수동적이지도 않은 문장이 됩니다.');
  b.innerHTML=`<div class="grid2"><div>${fld('w','~할 때 (사실만, 판단 없이)','예: 회의 중에 내 말이 중간에 끊기면')}${fld('f','나는 ~하게 느껴요','예: 의견이 전달되지 않은 것 같아 아쉬워요')}${fld('n','~해 주면 좋겠어요','예: 끝까지 들은 뒤 의견을 주시면 좋겠어요')}${fld('r','그러면 ~ (선택)','예: 그러면 더 좋은 결론을 함께 낼 수 있을 것 같아요')}</div><div><div class="result-box" style="font-size:1.08rem;min-height:120px" id="aso"></div><div class="row" style="margin-top:8px"><button class="btn sm" id="ascp">문장 복사</button></div><div class="small muted" style="margin-top:10px">✋ 체크: “너는 항상/절대” 같은 말이 없나요? 목소리 톤은 차분하게, 눈을 맞추고, 한 번에 한 가지 요청만.</div></div></div>`;
  const sent=s=>[s.w,s.f,s.n,s.r].filter(Boolean).map(x=>x.trim().replace(/[.。]$/,'')).join(', ')+'.';
  bind(b,key,s=>{ $('#aso',b).innerHTML=(s.w||s.f||s.n)?`🗣️ “${esc(sent(s))}”`:'<span class="muted">칸을 채우면 문장이 완성됩니다.</span>'; });
  $('#ascp',b).onclick=()=>{ navigator.clipboard?.writeText(sent(store.get(key,{}))).then(()=>toast('복사했습니다')); };
};

/* ---------- 혐오 민감도 ---------- */
T.disgust6 = el=>{
  const key='disgust6', cats=['비위생','작은 생물','성적 위반','비전형적 외모','상처','음식','도덕적 위반'];
  const b=frame(el,'🤢 나의 혐오 프로필','각 범주에 대한 혐오 민감도를 매겨 보세요(0~10). “비전형적 외모”가 높다면, 그것이 편견으로 이어지고 있지 않은지 성찰해 보는 계기로 삼으세요.');
  b.innerHTML=`<div class="grid2"><div>${cats.map((c,i)=>rng('d'+i,c,0,10,5)).join('')}</div><div class="chart"><canvas></canvas></div></div>`;
  bind(b,key,s=>{ chart($('canvas',b),{type:'radar',data:{labels:cats,datasets:[{data:cats.map((_,i)=>s['d'+i]??5),borderColor:'#008300',backgroundColor:'rgba(0,131,0,.15)',borderWidth:2,pointBackgroundColor:'#008300',pointRadius:4}]},options:radarOpts(10)}); });
};

/* ---------- 기준과 가치 ---------- */
T.standards = el=>{
  const L=listTool('standards');
  const b=frame(el,'📐 나의 “~해야 한다” 기준','삶에서 중요하게 여기는 기준을 “나는 ~해야 한다” 문장으로 적고, 얼마나 극단적인지·얼마나 도움이 되는지 매겨 보세요.');
  b.innerHTML=`<div class="row"><input id="sn" placeholder="예: 나는 부탁을 절대 거절하면 안 된다" style="flex:1;min-width:200px"><button class="btn sm" id="sadd">추가</button></div><div class="lst" id="sls"></div><div class="chart" style="margin-top:8px"><canvas></canvas></div><div class="small muted" style="text-align:center">오른쪽 아래(극단적이지만 도움이 덜 되는 기준)가 다듬기 1순위입니다</div>`;
  const draw=()=>{ const it=L.get();
    $('#sls',b).innerHTML=it.map(x=>`<div class="r" style="grid-template-columns:1fr 150px 150px auto"><span>${esc(x.n)}</span><label class="tiny">극단성 <input type="range" min="0" max="10" value="${x.e}" data-e="${x.id}"></label><label class="tiny">도움 <input type="range" min="0" max="10" value="${x.h}" data-h="${x.id}"></label><button class="x" data-d="${x.id}">×</button></div>`).join('')||'<div class="small muted">기준을 추가해 보세요.</div>';
    chart($('canvas',b),{type:'scatter',data:{datasets:[{data:it.map(x=>({x:x.e,y:x.h,n:x.n})),backgroundColor:it.map(x=>x.e>=6&&x.h<=4?'#e34948':'#e87ba4'),borderColor:'#fff',borderWidth:2,pointRadius:8}]},options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.raw.n}}},scales:{x:{min:0,max:10,title:{display:true,text:'극단성 →'},grid:{color:GRID}},y:{min:0,max:10,title:{display:true,text:'도움 정도 →'},grid:{color:GRID}}}}});
    const upd=(attr,f)=>$$(`[data-${attr}]`,b).forEach(r=>r.onchange=()=>{ const a=L.get(); a.find(y=>y.id===r.dataset[attr])[f]=+r.value; L.set(a); flash(el); draw(); });
    upd('e','e'); upd('h','h');
    $$('[data-d]',b).forEach(c=>c.onclick=()=>{ L.set(L.get().filter(y=>y.id!==c.dataset.d)); draw(); }); };
  $('#sadd',b).onclick=()=>{ const n=$('#sn',b).value.trim(); if(!n) return; const a=L.get(); a.push({id:SK.uid(),n,e:5,h:5}); L.set(a); $('#sn',b).value=''; flash(el); draw(); };
  draw();
};

/* ---------- 죄책감 두 질문 ---------- */
T.guilt2 = el=>{
  const key='guilt2';
  const b=frame(el,'❓❓ 죄책감에 묻는 두 가지 질문','최근 죄책감을 느낀 일로 답해 보세요. 할 수 있는 일이 있다면 — 지금 하세요!');
  b.innerHTML=`<div class="grid2"><div><h4>① 내가 무엇을 했나?</h4>${fld('what','무엇에 죄책감을 느끼나?','')}${fld('std','어떤 기준을 어겼다고 느끼나? (나는 ~해야 했다)','')}${fld('agree','다른 사람들도 내가 잘못했다고 동의할까?','')}</div><div><h4>② 지금 무엇을 할 수 있나?</h4>${fld('can','바로잡거나 사과할 수 있는 일은?','',1)}${fld('when','언제 할까?','')}<label style="font-size:1rem;margin-top:8px"><input type="checkbox" data-k="done"> ✅ NOW DO IT! — 실행했어요</label><div class="result-box small" id="g2"></div></div></div>`;
  bind(b,key,s=>{ $('#g2',b).innerHTML= s.done?'<span class="badge good">● 완료</span> 할 수 있는 일을 했다면 이제 죄책감이 할 일은 끝났습니다. 계속 곱씹는다면 “책임 과대평가”를 점검해 보세요.': s.can?'<span class="badge warn">▲ 대기 중</span> 계획한 행동을 실행하면 체크하세요.':'할 수 있는 일이 정말 없다면, 아래 책임 파이로 내 몫을 점검해 보세요.'; });
};

/* ---------- 기준 점검 질문 ---------- */
T.stdq = el=>{
  const key='stdq', qs=['이 기준은 어디에서 왔나? (부모, 학교, 직장, 문화…)','이 기준은 얼마나 도움이 되나? 장점은?','단점은? 이 기준이 전혀 안 맞는 때는?','내가 존경하는 사람들은 어떤 기준을 가지고 있나?','수정할 점이 있다면? 이 기준이 적용되지 않는 때는?','새 기준으로 무엇을 다르게 해 볼까? 어떻게 기억하고 지킬까?'];
  const b=frame(el,'🔧 극단적 기준 다듬기','가장 마음에 걸리는 기준 하나를 골라 질문에 답해 보세요.');
  b.innerHTML=fld('s','다듬을 기준','예: 나는 항상 완벽해야 한다')+qs.map((q,i)=>fld('q'+i,`${i+1}. ${q}`,'')).join('')+fld('new','✨ 새로운 기준','예: 중요한 일에는 최선을, 나머지는 충분히 좋으면 된다')+`<div class="result-box" id="sq"></div>`;
  bind(b,key,s=>{ $('#sq',b).innerHTML=(s.s&&s.new)?`<div class="small muted">이전</div><div style="text-decoration:line-through;color:var(--muted)">${esc(s.s)}</div><div class="small muted" style="margin-top:6px">새 기준</div><div style="font-weight:800;font-size:1.08rem">${esc(s.new)}</div>`:'기준과 새 기준을 적으면 비교 카드가 만들어집니다.'; });
};

/* ---------- 책임 파이 ---------- */
T.pie = el=>{
  const key='pie';
  const b=frame(el,'🥧 책임 파이','① 처음 느낀 내 책임(%)을 매기고 ② 영향을 준 다른 요인들과 몫을 먼저 채운 뒤 ③ 남은 부분이 내 몫입니다.');
  b.innerHTML=`<div class="grid2"><div>${fld('ev','사건','예: 프로젝트 마감을 놓쳤다')}${rng('first','① 처음 느낀 내 책임 (%)',0,100,90)}<label style="margin-top:10px">② 다른 요인들</label>${[0,1,2,3,4].map(i=>`<div class="lst"><div class="r"><input data-k="f${i}" placeholder="${['예: 갑작스러운 요구 변경','예: 인력 부족','예: 다른 팀의 지연','예: 당시 몰랐던 정보','기타'][i]}"><input type="number" min="0" max="100" data-k="p${i}" placeholder="%"><span></span></div></div>`).join('')}</div><div><div class="chart"><canvas class="a"></canvas></div><div class="chart sm" style="margin-top:8px"><canvas class="b"></canvas></div><div class="small" id="pm"></div></div></div>`;
  const cols=['#2a78d6','#1baf7a','#eda100','#6250d6','#c3c2b7'];
  bind(b,key,s=>{ const fs=[0,1,2,3,4].filter(i=>s['f'+i]&&+s['p'+i]>0).map(i=>({n:s['f'+i],p:+s['p'+i],c:cols[i]}));
    let other=fs.reduce((a,x)=>a+x.p,0), scale=other>100?100/other:1; fs.forEach(x=>x.p=Math.round(x.p*scale)); other=fs.reduce((a,x)=>a+x.p,0);
    const me=Math.max(0,100-other);
    chart($('canvas.a',b),{type:'pie',data:{labels:[...fs.map(x=>x.n),'③ 내 몫'],datasets:[{data:[...fs.map(x=>x.p),me],backgroundColor:[...fs.map(x=>x.c),'#e87ba4'],borderColor:'#fff',borderWidth:2}]},options:{plugins:{legend:{position:'right'},tooltip:{callbacks:{label:c=>c.label+' '+c.raw+'%'}}}}});
    chart($('canvas.b',b),{type:'bar',data:{labels:['처음 느낀 내 책임','파이 후 내 몫'],datasets:[{data:[s.first??90,me],backgroundColor:['#c3c2b7','#e87ba4'],borderRadius:4}]},options:barOpts({horizontal:true,max:100,tip:c=>c.raw+'%'})});
    $('#pm',b).innerHTML=`내 몫: <b>${s.first??90}% → ${me}%</b> (${(s.first??90)-me>=0?'−':'+'}${Math.abs((s.first??90)-me)}%p)`; });
};

/* ---------- 나에 대한 생각 (Exercise 6.2) ---------- */
T.selfthink = el=>{
  const key='selfthink', groups={'실패':['나는 서툴러','나는 무능해','나는 멍청해','나는 실패자야'],'미움':['나는 재미없어','나는 매력이 없어','나는 사랑받을 수 없어'],'노출·배제':['나는 이상해','나는 어울리지 못해','다 내 탓이야']};
  const b=frame(el,'🪞 가끔 나는 나를 이렇게 생각한다','수치심이 올 때 떠오르는 자기 평가를 모두 고르세요. 이것들은 “사실”이 아니라 수치심이 만드는 전체적 평가입니다.');
  b.innerHTML=Object.entries(groups).map(([g,a])=>`<div class="field"><label>${g}</label><div class="opts">${a.map(x=>`<label class="opt" style="display:inline-flex;gap:6px;font-weight:600"><input type="checkbox" data-k="${x}">${x}</label>`).join('')}</div></div>`).join('')+`<div class="chart sm"><canvas></canvas></div>`;
  bind(b,key,s=>{ const G=Object.keys(groups); chart($('canvas',b),{type:'bar',data:{labels:G,datasets:[{data:G.map(g=>groups[g].filter(x=>s[x]).length),backgroundColor:'#2a78d6',borderRadius:4,barThickness:28}]},options:barOpts({horizontal:true,tip:c=>c.raw+'개 선택'})}); });
};

/* ---------- 다른 관점 ---------- */
T.perspective = el=>{
  const key='perspective';
  const b=frame(el,'🔭 다른 관점 끌어오기','최근 수치심을 느낀 일을 다른 사람들의 눈으로 다시 보세요.');
  b.innerHTML=`<div class="grid2"><div>${fld('ev','상황','')}${fld('me','내가 나를 본 방식','예: 다들 내가 한심하다고 생각했을 거야')}${rng('h0','그 장면을 떠올릴 때 수치심 강도',0,10,8)}</div><div>${fld('friend','가까운 친구라면 어떻게 볼까?','')}${fld('stranger','그 자리에 있던 다른 사람은 얼마나 기억할까?','')}${fld('big','5년 뒤의 나는 이 일을 어떻게 볼까?','')}${rng('h1','다른 관점을 본 뒤 수치심 강도',0,10,5)}</div></div><div class="chart sm"><canvas></canvas></div>`;
  bind(b,key,s=>{ chart($('canvas',b),{type:'bar',data:{labels:['처음','관점 바꾼 뒤'],datasets:[{data:[s.h0??8,s.h1??5],backgroundColor:['#c3c2b7','#2a78d6'],borderRadius:4,barThickness:48}]},options:barOpts({max:10})}); });
};

/* ---------- 회복 계획 ---------- */
T.repair = el=>{
  const key='repair', L=listTool('repair_goals');
  const b=frame(el,'🌱 회복 계획','장기 방향 → 단기 목표 → 미끄러질 때 대비. 단기 목표는 이번 주에 할 수 있을 만큼 작게!');
  b.innerHTML=`<div class="grid2"><div>${fld('dir','장기적 방향 (어떤 사람이 되고 싶나?)','예: 내 일에 자신감을 가진 사람',1)}${fld('slip','미끄러질 때의 계획','예: 하루 못 했다고 포기하지 않고 다음 날 가장 작은 목표 하나만')}${fld('who','응원해 줄 사람','')}</div><div><label>단기 목표</label><div class="row"><input id="gn" placeholder="예: 이력서 첫 문단 쓰기" style="flex:1"><button class="btn sm" id="gadd">추가</button></div><div class="lst" id="gls"></div><div class="row" style="margin-top:8px"><span class="bigstat" id="gp">0%</span><div class="gauge" style="flex:1"><span id="gg" style="width:0"></span></div></div></div></div>`;
  bind(b,key);
  const draw=()=>{ const it=L.get(), d=it.filter(x=>x.done).length, p=it.length?Math.round(d/it.length*100):0;
    $('#gls',b).innerHTML=it.map(x=>`<div class="r" style="grid-template-columns:auto 1fr auto"><input type="checkbox" data-c="${x.id}" ${x.done?'checked':''}><span style="${x.done?'text-decoration:line-through;color:var(--muted)':''}">${esc(x.n)}</span><button class="x" data-d="${x.id}">×</button></div>`).join('');
    $('#gp',b).textContent=p+'%'; $('#gg',b).style.width=p+'%';
    $$('[data-c]',b).forEach(c=>c.onchange=()=>{ const a=L.get(); a.find(y=>y.id===c.dataset.c).done=c.checked; L.set(a); flash(el); draw(); });
    $$('[data-d]',b).forEach(c=>c.onclick=()=>{ L.set(L.get().filter(y=>y.id!==c.dataset.d)); draw(); }); };
  $('#gadd',b).onclick=()=>{ const n=$('#gn',b).value.trim(); if(!n) return; const a=L.get(); a.push({id:SK.uid(),n,done:false}); L.set(a); $('#gn',b).value=''; flash(el); draw(); };
  draw();
};

/* ---------- 행복의 바퀴 ---------- */
T.wheel = el=>{
  const key='wheel', sp=['💛 감정','🤝 관계','🎯 의미·즐거움 활동','🌅 낙관'];
  const b=frame(el,'🎡 나의 행복의 바퀴 (Exercise 7.2)','네 바큇살의 현재 상태를 매기고, 가장 낮은 바큇살을 키울 작은 행동 하나를 정하세요.');
  b.innerHTML=`<div class="grid2"><div>${sp.map((x,i)=>rng('w'+i,x,0,10,5)).join('')}${fld('act','가장 낮은 바큇살을 위한 이번 주 행동','')}<div class="result-box small" id="wm"></div></div><div><div class="chart"><canvas></canvas></div></div></div>`;
  bind(b,key,s=>{ const v=sp.map((_,i)=>s['w'+i]??5), lo=v.indexOf(Math.min(...v));
    chart($('canvas',b),{type:'radar',data:{labels:sp,datasets:[{data:v,borderColor:'#eda100',backgroundColor:'rgba(237,161,0,.2)',borderWidth:2,pointBackgroundColor:v.map((x,i)=>i===lo?'#e34948':'#eda100'),pointRadius:5}]},options:radarOpts(10)});
    $('#wm',b).innerHTML=`가장 낮은 바큇살: <b>${sp[lo]} (${v[lo]}/10)</b> — 바퀴는 가장 짧은 살 때문에 덜컹거립니다.`; });
};

/* ---------- 관계 지도 ---------- */
T.relmap = el=>{
  const L=listTool('relmap');
  const b=frame(el,'🫂 나의 관계 지도 (Exercise 7.3)','내 삶의 사람들을 적고 친밀도와 함께 보내는 시간을 매기세요. 가깝지만 시간을 못 쓰는 관계가 보이나요? (이니셜·별명 권장)');
  b.innerHTML=`<div class="row"><input id="rn" placeholder="예: 엄마, J, 팀장님" style="flex:1;min-width:150px"><select id="rt" style="width:auto"><option>가족</option><option>친구</option><option>동료</option><option>연인·배우자</option><option>기타</option></select><button class="btn sm" id="radd">추가</button></div><div class="lst" id="rls"></div><div class="chart lg"><canvas></canvas></div><div class="small muted" style="text-align:center">왼쪽 위 = 가깝지만 함께하는 시간이 적은 관계 → 시간을 늘릴 후보</div>`;
  const cols={'가족':'#eb6834','친구':'#2a78d6','동료':'#1baf7a','연인·배우자':'#e87ba4','기타':'#8a8c99'};
  const draw=()=>{ const it=L.get();
    $('#rls',b).innerHTML=it.map(x=>`<div class="r" style="grid-template-columns:1fr 150px 150px auto"><span><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${cols[x.t]}"></i> ${esc(x.n)} <span class="pill">${x.t}</span></span><label class="tiny">친밀도 <input type="range" min="0" max="10" value="${x.c}" data-c="${x.id}"></label><label class="tiny">함께하는 시간 <input type="range" min="0" max="10" value="${x.h}" data-h="${x.id}"></label><button class="x" data-d="${x.id}">×</button></div>`).join('')||'<div class="small muted">사람을 추가해 보세요.</div>';
    const types=[...new Set(it.map(x=>x.t))];
    chart($('canvas',b),{type:'scatter',data:{datasets:types.map(t=>({label:t,data:it.filter(x=>x.t===t).map(x=>({x:x.h,y:x.c,n:x.n})),backgroundColor:cols[t],borderColor:'#fff',borderWidth:2,pointRadius:9}))},options:{plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:c=>c.raw.n}}},scales:{x:{min:0,max:10,title:{display:true,text:'함께하는 시간 →'},grid:{color:GRID}},y:{min:0,max:10,title:{display:true,text:'친밀도 →'},grid:{color:GRID}}}}});
    const upd=(a,f)=>$$(`[data-${a}]`,b).forEach(r=>r.onchange=()=>{ const l=L.get(); l.find(y=>y.id===r.dataset[a])[f]=+r.value; L.set(l); flash(el); draw(); });
    upd('c','c'); upd('h','h');
    $$('[data-d]',b).forEach(c=>c.onclick=()=>{ L.set(L.get().filter(y=>y.id!==c.dataset.d)); draw(); }); };
  $('#radd',b).onclick=()=>{ const n=$('#rn',b).value.trim(); if(!n) return; const a=L.get(); a.push({id:SK.uid(),n,t:$('#rt',b).value,c:5,h:5}); L.set(a); $('#rn',b).value=''; flash(el); draw(); };
  draw();
};

/* ---------- 가치와 시간 (Exercise 7.4) ---------- */
T.values = el=>{
  const key='values', V=['가족','일·성장','건강','우정','취미·놀이','배움','봉사·기여','휴식'];
  const b=frame(el,'🧭 가치 vs 실제 시간 (Exercise 7.4)','각 영역이 나에게 얼마나 중요한지와, 실제로 얼마나 시간을 쓰는지 매겨 보세요. 차이가 큰 곳이 행복을 늘릴 기회입니다.');
  b.innerHTML=`<div class="grid2"><div><table class="tbl"><tr><th>영역</th><th>중요도</th><th>실제 시간</th></tr>${V.map((v,i)=>`<tr><td>${v}</td><td><input type="range" min="0" max="10" value="5" data-k="i${i}"></td><td><input type="range" min="0" max="10" value="5" data-k="t${i}"></td></tr>`).join('')}</table></div><div><div class="chart lg"><canvas></canvas></div><div class="small" id="vm"></div></div></div>`;
  bind(b,key,s=>{ const I=V.map((_,i)=>s['i'+i]??5), Tt=V.map((_,i)=>s['t'+i]??5);
    chart($('canvas',b),{type:'bar',data:{labels:V,datasets:[{label:'중요도',data:I,backgroundColor:'#eda100',borderRadius:4},{label:'실제 시간',data:Tt,backgroundColor:'#2a78d6',borderRadius:4}]},options:barOpts({horizontal:true,max:10,legend:true})});
    const gap=V.map((v,i)=>({v,g:I[i]-Tt[i]})).sort((a,b)=>b.g-a.g)[0];
    $('#vm',b).innerHTML=gap.g>0?`가장 큰 차이: <b>${gap.v}</b> (중요도가 시간보다 ${gap.g}점 높음) — 이번 주 이 영역에 시간을 조금 더 써 보세요.`:'중요한 만큼 시간을 쓰고 있어요 👍'; });
};

/* ---------- 친절 빙고 ---------- */
T.kindness = el=>{
  const key='kindness', K=['먼저 인사하기','동료 커피 사기','진심 담은 칭찬','도움 요청 먼저 받아주기','감사 메시지 보내기','가족에게 전화','양보하기','누군가의 이야기 끝까지 듣기','작은 선물'];
  const b=frame(el,'🎁 친절 빙고','일주일 중 하루를 “친절의 날”로 정해 여러 번의 친절을 실천해 보세요. 한 줄 완성을 목표로!');
  b.innerHTML=`<div class="bingo">${K.map((k,i)=>`<button data-i="${i}">${k}</button>`).join('')}</div><div class="row" style="margin-top:10px"><span class="bigstat" id="kb">0</span><span class="muted">/ 9 · 빙고 줄 <b id="kl">0</b></span></div>`;
  const draw=()=>{ const s=store.get(key,{}); $$('.bingo button',b).forEach(x=>x.classList.toggle('on',!!s[x.dataset.i]));
    const on=i=>!!s[i], lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].filter(l=>l.every(on)).length;
    $('#kb',b).textContent=K.filter((_,i)=>on(i)).length; $('#kl',b).textContent=lines; };
  $$('.bingo button',b).forEach(x=>x.onclick=()=>{ const s=store.get(key,{}); s[x.dataset.i]=!s[x.dataset.i]; s._t=Date.now(); store.set(key,s); flash(el); draw(); });
  draw();
};

/* ---------- 감사 세기 ---------- */
T.blessings = el=>{
  const L=listTool('blessings');
  const b=frame(el,'🙏 감사 세기 일지','감사한 일 세 가지를 적어 보세요. 일주일에 한 번 정도가 가장 효과적이라고 합니다.');
  b.innerHTML=`<div class="grid3">${[0,1,2].map(i=>`<input class="bi" placeholder="감사한 일 ${i+1}">`).join('')}</div><div class="row" style="margin-top:8px"><button class="btn sm" id="badd">오늘 기록 저장</button></div><div class="chart sm" style="margin-top:8px"><canvas></canvas></div><div id="bls" class="notes" style="margin-top:8px"></div>`;
  const draw=()=>{ const it=L.get(); const by={}; it.forEach(x=>by[x.d]=(by[x.d]||0)+x.a.length); const ks=Object.keys(by).sort().slice(-12);
    chart($('canvas',b),{type:'bar',data:{labels:ks,datasets:[{data:ks.map(k=>by[k]),backgroundColor:'#eda100',borderRadius:4}]},options:barOpts({tip:c=>c.raw+'개의 감사'})});
    $('#bls',b).innerHTML=it.slice(-6).reverse().map(x=>`<div class="note">${x.a.map(esc).join('<br>')}<b>${x.d}</b></div>`).join(''); };
  $('#badd',b).onclick=()=>{ const a=$$('.bi',b).map(i=>i.value.trim()).filter(Boolean); if(!a.length) return toast('하나 이상 적어 주세요'); const l=L.get(); l.push({d:today(),a}); L.set(l); $$('.bi',b).forEach(i=>i.value=''); flash(el); draw(); };
  draw();
};

/* ---------- 종합 리포트 ---------- */
T.report = el=>{
  const b=frame(el,'📊 나의 일곱 감정 리포트','각 챕터의 자가점검·체크인·경험 기록에서 자동으로 모은 결과입니다.');
  const trapE=['fear','sadness','anger','disgust','guilt','shame'];
  const tc=trapE.map(k=>{ const s=store.get('tc_'+k,{}); const n=TRAPCHECK[k].length; let sum=0,c=0; for(let i=0;i<n;i++) if(s['q'+i]!=null){sum+=s['q'+i];c++;} return {k,pct:c?Math.round(sum/(n*3)*100):null}; });
  const sent=[]; Object.keys(localStorage).filter(k=>k.startsWith('sk_sent_')).forEach(k=>{ try{ JSON.parse(localStorage.getItem(k)).forEach(m=>sent.push(m)); }catch(e){} });
  const ck=sent.filter(m=>/^c\d-checkin$/.test(m.a)).sort((a,b)=>a.t-b.t);
  const exp=EMOS.map(e=>!!store.get('exp_'+e.k,null));
  const wheel=store.get('wheel',null);
  b.innerHTML=`<div class="grid2"><div><h4>🗝️ 감정의 덫 자가점검 (%)</h4><div class="chart"><canvas class="a"></canvas></div><div class="small muted">점검하지 않은 감정은 회색으로 표시됩니다.</div></div>
   <div><h4>📈 챕터별 체크인 흐름</h4><div class="chart"><canvas class="b"></canvas></div><div class="small muted">${ck.length?`체크인 ${ck.length}회 기록`:'라이브 체크인에 응답하면 여기에 흐름이 그려집니다.'}</div></div></div>
   <div class="grid2" style="margin-top:10px"><div><h4>✍️ 경험 기록 완료</h4><div class="row">${EMOS.map((e,i)=>`<span class="badge ${exp[i]?'good':''}" style="${exp[i]?'':'background:#f1f0eb;color:#8a8c99'}">${exp[i]?'✓':'○'} ${e.f} ${e.ko}</span>`).join('')}</div></div>
   <div><h4>🎯 가장 신경 쓸 열쇠</h4><div id="rk" class="result-box"></div></div></div>`;
  chart($('canvas.a',b),{type:'bar',data:{labels:trapE.map(k=>EMO[k].f+' '+EMO[k].ko),datasets:[{data:tc.map(x=>x.pct??0),backgroundColor:tc.map(x=>x.pct==null?'#e1e0d9':EMO[x.k].c),borderRadius:4}]},options:barOpts({horizontal:true,max:100,tip:c=>tc[c.dataIndex].pct==null?'미점검':c.raw+'%'})});
  const chs=[...new Set(ck.map(m=>m.a))].sort();
  const lastPer=chs.map(a=>ck.filter(m=>m.a===a).pop());
  chart($('canvas.b',b),{type:'line',data:{labels:chs.map(a=>a.replace(/^c(\d)-checkin$/,(_,n)=>n==='0'?'서론':n==='8'?'종합':n+'장')),datasets:EMOS.map((e,i)=>({label:e.f+' '+e.ko,data:lastPer.map(m=>m.v[i]),borderColor:e.c,backgroundColor:e.c,borderWidth:2,pointRadius:4,tension:.3}))},options:{plugins:{legend:{position:'bottom',labels:{font:{size:11}}}},scales:{y:{min:0,max:10,grid:{color:GRID}},x:{grid:{display:false}}}}});
  const top=tc.filter(x=>x.pct!=null).sort((a,b)=>b.pct-a.pct)[0];
  const tips={fear:'세 개의 원으로 회피 줄이기 (1장)',sadness:'“더 하기” 활동 계획과 생각 기록 (2장)',anger:'정의·확인·해결과 단호한 문장 (3장)',disgust:'다가가기 사다리 + 주의 조정 (4장)',guilt:'기준 다듬기와 책임 파이 (5장)',shame:'관점 바꾸기와 회복 계획 (6장)'};
  $('#rk',b).innerHTML= top? `<b>${EMO[top.k].f} ${EMO[top.k].ko}의 덫 (${top.pct}%)</b><br><span class="small">추천 열쇠: ${tips[top.k]}</span>${wheel?`<br><span class="small">행복의 바퀴 평균 ${(([0,1,2,3].reduce((s,i)=>s+(wheel['w'+i]??5),0))/4).toFixed(1)}/10</span>`:''}` : '각 챕터의 “덫 자가점검”을 하면 추천이 나타납니다.';
};

/* ---------- 실천 계획 ---------- */
T.plan = el=>{
  const key='plan';
  const b=frame(el,'🗺️ 나의 일곱 열쇠 실천 계획','과정을 마치며 앞으로 3개월 동안 지킬 계획을 세워 보세요.');
  b.innerHTML=`<div class="grid2"><div><div class="field"><label>가장 집중할 감정</label><select data-k="emo"><option value="">선택</option>${EMOS.map(e=>`<option value="${e.k}">${e.f} ${e.ko}</option>`).join('')}</select></div>${fld('trap','나의 주된 덫 패턴','예: 불편한 회의를 피함 → 자신감 하락')}${fld('key','사용할 열쇠(기술)','예: 세 개의 원, 단호한 문장')}</div><div>${fld('week','매주 할 행동','예: 매주 한 번 회의에서 먼저 발언하기')}${fld('sign','덫에 다시 빠지는 신호','예: 핑계를 대며 일정을 취소할 때')}${fld('help','도움을 청할 사람·자원','')}</div></div>`;
  bind(b,key);
};

/* ---------- 수료증 ---------- */
T.cert = el=>{
  const b=frame(el,'🏅 수료증','이름을 입력하고 인쇄(또는 PDF로 저장)하세요.');
  b.innerHTML=`<div class="row no-print"><input id="cn" placeholder="이름" style="max-width:220px" value="${esc(store.get('certname',LIVE.me.n||''))}"><button class="btn sm" id="cp">🖨️ 인쇄 / PDF 저장</button></div><div class="cert" style="margin-top:14px"><div class="kicker">CERTIFICATE OF COMPLETION</div><div style="font-size:2rem;margin:8px 0">${EMOS.map(e=>e.f).join(' ')}</div><h2 style="margin:.2em 0">SEVEN KEYS · 감정조절 프로그램</h2><p>위 사람은 일곱 가지 감정을 이해하고 받아들이며, 견디고, 감정의 덫에서 나오는 열쇠를 익히는 과정을 성실히 마쳤기에 이 증서를 드립니다.</p><div style="font-size:1.6rem;font-weight:800;margin:14px 0" id="cname">______</div><div class="small muted">${today()} · 다인에듀(다인원격평생교육직업학원)</div></div>`;
  const upd=()=>{ const v=$('#cn',b).value.trim(); $('#cname',b).textContent=v||'______'; store.set('certname',v); };
  $('#cn',b).oninput=upd; upd(); $('#cp',b).onclick=()=>window.print();
};

window.TOOLS=T;
})();
