/* SEVEN KEYS — 공통 모듈: 감정 상수 · 저장소 · 실시간 라이브 룸 · 활동 렌더러 · 차트 · 도식 */
(function(){
'use strict';
const $ = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>[...el.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* 일곱 감정 — 색은 검증된 범주형 팔레트(인접 쌍 색각 분리 확인). 색만으로 구분하지 않도록 항상 이모지+이름을 함께 표시 */
const EMOS = [
  {k:'fear',      ko:'공포',   en:'Fear',      f:'😨', c:'#6250d6', soft:'#ece9fb'},
  {k:'sadness',   ko:'슬픔',   en:'Sadness',   f:'😢', c:'#1baf7a', soft:'#e1f5ed'},
  {k:'anger',     ko:'분노',   en:'Anger',     f:'😠', c:'#e34948', soft:'#fce6e6'},
  {k:'disgust',   ko:'혐오',   en:'Disgust',   f:'🤢', c:'#008300', soft:'#e0f1e0'},
  {k:'guilt',     ko:'죄책감', en:'Guilt',     f:'😔', c:'#e87ba4', soft:'#fceaf1'},
  {k:'shame',     ko:'수치심', en:'Shame',     f:'😳', c:'#2a78d6', soft:'#e5effb'},
  {k:'happiness', ko:'행복',   en:'Happiness', f:'😊', c:'#eda100', soft:'#fdf3d9'}
];
const EMO = Object.fromEntries(EMOS.map(e=>[e.k,e]));
const SERIES = ['#2a78d6','#eb6834','#1baf7a','#eda100','#e87ba4','#008300','#6250d6','#e34948'];
const GRID = '#e1e0d9', AXIS = '#898781';

/* ---------- 저장소 ---------- */
const store = {
  get(k,d){ try{ const v=localStorage.getItem('sk_'+k); return v==null?d:JSON.parse(v);}catch(e){return d;} },
  set(k,v){ try{ localStorage.setItem('sk_'+k,JSON.stringify(v)); }catch(e){} },
  keys(){ const o=[]; try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k.startsWith('sk_')) o.push(k.slice(3)); } }catch(e){} return o; }
};
function uid(){ return Math.random().toString(36).slice(2,10); }
function today(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

/* ---------- 차트 (Chart.js) ---------- */
const charts = new WeakMap();
function chart(canvas, cfg){
  if(!window.Chart || !canvas) return null;
  const old = charts.get(canvas); if(old) old.destroy();
  Chart.defaults.font.family = 'Pretendard, sans-serif';
  Chart.defaults.color = '#52514e';
  Chart.defaults.plugins.legend.labels.boxWidth = 10;
  Chart.defaults.plugins.legend.labels.boxHeight = 10;
  Chart.defaults.plugins.tooltip.backgroundColor = '#1c2036';
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.animation.duration = 300;
  const c = new Chart(canvas, cfg); charts.set(canvas,c); return c;
}
const gridOpt = {color:GRID, drawTicks:false};
function radarOpts(max=10, extra={}){
  return Object.assign({plugins:{legend:{display:false}},scales:{r:{min:0,max,ticks:{stepSize:max/5,backdropColor:'transparent',color:AXIS,font:{size:10}},grid:{color:GRID},angleLines:{color:GRID},pointLabels:{font:{size:13,weight:700},color:'#1c2036'}}}},extra);
}
function barOpts(o={}){
  const h = o.horizontal;
  const val = {beginAtZero:true,grid:gridOpt,border:{display:false},ticks:{precision:0}};
  if(o.max!=null) val.max=o.max;
  const cat = {grid:{display:false},border:{color:'#c3c2b7'},ticks:{font:{size:12,weight:600}}};
  return {indexAxis:h?'y':'x',plugins:{legend:{display:!!o.legend,position:'bottom'},tooltip:{callbacks:o.tip?{label:o.tip}:{}}},scales:h?{x:val,y:cat}:{y:val,x:cat}};
}

/* ---------- 토스트 ---------- */
function toast(msg){ const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2200); }

/* ---------- 실시간 라이브 룸 ----------
   강사가 만든 방 코드로 수강생 응답을 실시간 공유합니다.
   전송/수신: 공개 pub-sub 서비스 ntfy.sh (가입 불필요, 12시간 보관) + 같은 브라우저 탭끼리는 BroadcastChannel.
   개인 워크시트(경험 기록·생각 기록 등)는 전송하지 않고 각자 브라우저에만 저장합니다. */
const LIVE = {
  me: store.get('me', null) || (()=>{ const m={u:uid(),n:''}; store.set('me',m); return m; })(),
  room:'', msgs:[], seen:new Set(), subs:new Set(), es:null, bc:null, status:'off',
  topic(){ return 'dainedu-sevenkeys-'+this.room.toLowerCase(); },
  setRoom(code){ code=(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8); this.room=code; store.set('room',code); this.connect(); this.emit(); },
  setNick(n){ this.me.n=(n||'').trim().slice(0,16); store.set('me',this.me); this.emit(); },
  connect(){
    if(this.es){ this.es.close(); this.es=null; }
    if(this.bc){ this.bc.close(); this.bc=null; }
    this.msgs=[]; this.seen=new Set();
    if(!this.room){ this.status='off'; this.loadLocal(); return; }
    this.status='connecting';
    try{ this.bc=new BroadcastChannel('sk-'+this.room); this.bc.onmessage=e=>this.add(e.data); }catch(e){}
    this.loadLocal();
    try{
      const es=new EventSource('https://ntfy.sh/'+this.topic()+'/sse?since=all');
      es.onopen=()=>{ this.status='live'; this.emit(); };
      es.onerror=()=>{ this.status= es.readyState===2?'offline':'connecting'; this.emit(); };
      es.onmessage=e=>{ try{ const j=JSON.parse(e.data); if(j.event && j.event!=='message') return; if(!j.message) return; this.add(JSON.parse(j.message)); }catch(err){} };
      this.es=es;
    }catch(e){ this.status='offline'; }
    this.emit();
  },
  localKey(){ return 'sent_'+(this.room||'_solo'); },
  loadLocal(){ (store.get(this.localKey(),[])||[]).forEach(m=>this.add(m,true)); },
  add(m,silent){ if(!m||!m.mid||this.seen.has(m.mid)) return; this.seen.add(m.mid); this.msgs.push(m); silent?this.emit():this.emit(m); },
  send(activity,value){
    const m={mid:uid()+Date.now().toString(36),a:activity,u:this.me.u,n:this.me.n||'익명',v:value,t:Date.now()};
    const mine=store.get(this.localKey(),[]); mine.push(m); store.set(this.localKey(),mine.slice(-400));
    this.add(m);
    if(this.room){
      try{ this.bc&&this.bc.postMessage(m); }catch(e){}
      fetch('https://ntfy.sh/'+this.topic(),{method:'POST',body:JSON.stringify(m)}).catch(()=>{ this.status='offline'; this.emit(); });
    }
    return m;
  },
  of(a){ return this.msgs.filter(m=>m.a===a); },
  latestPerUser(a){ const o=new Map(); this.of(a).sort((x,y)=>x.t-y.t).forEach(m=>o.set(m.u,m)); return [...o.values()]; },
  mine(a){ return this.latestPerUser(a).find(m=>m.u===this.me.u); },
  people(){ const o=new Map(); this.msgs.forEach(m=>o.set(m.u,m.n)); return o; },
  on(fn){ this.subs.add(fn); return ()=>this.subs.delete(fn); },
  emit(m){ this.subs.forEach(fn=>{ try{fn(m);}catch(e){console.error(e);} }); }
};

/* ---------- 라이브 활동 렌더러 ----------
   type: choice | multi | scale | text | quiz | sliders | emo7 | scatter | zone */
function renderActivity(el, act, opts={}){
  const board=!!opts.board;
  el.classList.add('live');
  el.innerHTML=`<div class="live-head"><span class="tag">LIVE</span><span class="small muted">${esc(act.label||'함께 나누기')}</span><span class="cnt"></span></div>
    <div class="q">${esc(act.q)}</div>${act.hint&&!board?`<div class="small muted" style="margin:-6px 0 10px">${esc(act.hint)}</div>`:''}
    ${board?'':'<div class="input"></div>'}<div class="result"></div>`;
  const inp=$('.input',el), res=$('.result',el), cnt=$('.cnt',el);
  if(!board) buildInput(inp,act);
  const draw=()=>{
    const msgs = (act.type==='text'||act.type==='zone') ? LIVE.of(act.id).sort((a,b)=>a.t-b.t) : LIVE.latestPerUser(act.id);
    cnt.textContent=(LIVE.room?`방 ${LIVE.room} · `:'개인 모드 · ')+`응답 ${new Set(msgs.map(m=>m.u)).size}명`;
    drawResult(res,act,msgs,board);
  };
  draw(); const off=LIVE.on(m=>{ if(!el.isConnected){ off(); return; } if(!m||m.a===act.id) draw(); });
}
const sentNote='<span class="sent hidden">✓ 공유됨</span>';
function sliderLabels(act){ return act.type==='emo7' ? EMOS.map(e=>`${e.f} ${e.ko}`) : act.items; }
function buildInput(inp,act){
  const mine=LIVE.mine(act.id);
  const shown=()=>{ const s=$('.sent',inp); if(s) s.classList.remove('hidden'); };
  if(act.type==='choice'||act.type==='quiz'){
    inp.innerHTML=`<div class="opts">${act.options.map((o,i)=>`<button class="opt" data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
    const b=$$('.opt',inp); if(mine) b[mine.v]?.classList.add('sel');
    b.forEach(x=>x.onclick=()=>{ b.forEach(y=>y.classList.remove('sel')); x.classList.add('sel'); LIVE.send(act.id,+x.dataset.i); });
  } else if(act.type==='multi'){
    inp.innerHTML=`<div class="opts">${act.options.map((o,i)=>`<button class="opt" data-i="${i}">${esc(o)}</button>`).join('')}</div><div class="row" style="margin-top:10px"><button class="btn sm send">선택 공유하기</button>${sentNote}</div>`;
    const b=$$('.opt',inp); if(mine) mine.v.forEach(i=>b[i]?.classList.add('sel'));
    b.forEach(x=>x.onclick=()=>x.classList.toggle('sel'));
    $('.send',inp).onclick=()=>{ const v=b.filter(x=>x.classList.contains('sel')).map(x=>+x.dataset.i); if(!v.length) return toast('하나 이상 선택해 주세요'); LIVE.send(act.id,v); shown(); };
  } else if(act.type==='scale'){
    const mn=act.min??0,mx=act.max??10,v0=mine?mine.v:Math.round((mn+mx)/2);
    inp.innerHTML=`<div class="row"><span class="small">${esc(act.minLabel||mn)}</span><input type="range" min="${mn}" max="${mx}" value="${v0}" style="flex:1;min-width:140px"><span class="small">${esc(act.maxLabel||mx)}</span><b class="v" style="min-width:30px;text-align:center;font-size:1.3rem">${v0}</b><button class="btn sm send">공유</button>${sentNote}</div>`;
    const r=$('input',inp); r.oninput=()=>$('.v',inp).textContent=r.value;
    $('.send',inp).onclick=()=>{ LIVE.send(act.id,+r.value); shown(); };
  } else if(act.type==='sliders'||act.type==='emo7'){
    const labs=sliderLabels(act), mx=act.max??10, v0=mine?mine.v:labs.map(()=>Math.round(mx/2));
    inp.innerHTML=labs.map((l,i)=>`<div class="slrow"><span>${esc(l)}</span><input type="range" min="0" max="${mx}" value="${v0[i]??0}" data-i="${i}"><b>${v0[i]??0}</b></div>`).join('')+`<div class="row" style="margin-top:8px"><button class="btn sm send">공유하기</button>${sentNote}</div>`;
    $$('input',inp).forEach(r=>r.oninput=()=>r.nextElementSibling.textContent=r.value);
    $('.send',inp).onclick=()=>{ LIVE.send(act.id,$$('input',inp).map(r=>+r.value)); shown(); };
  } else if(act.type==='scatter'){
    const v0=mine?mine.v:[5,5];
    inp.innerHTML=[act.x,act.y].map((l,i)=>`<div class="slrow"><span>${esc(l)}</span><input type="range" min="0" max="10" value="${v0[i]}"><b>${v0[i]}</b></div>`).join('')+`<div class="row" style="margin-top:8px"><button class="btn sm send">공유하기</button>${sentNote}</div>`;
    $$('input',inp).forEach(r=>r.oninput=()=>r.nextElementSibling.textContent=r.value);
    $('.send',inp).onclick=()=>{ LIVE.send(act.id,$$('input',inp).map(r=>+r.value)); shown(); };
  } else if(act.type==='text'){
    inp.innerHTML=`<div class="row"><input maxlength="${act.max||120}" placeholder="${esc(act.ph||'여기에 입력하세요')}" style="flex:1;min-width:200px"><button class="btn sm send">붙이기</button></div>`;
    const i=$('input',inp), go=()=>{ const v=i.value.trim(); if(!v) return; LIVE.send(act.id,v); i.value=''; };
    $('.send',inp).onclick=go; i.onkeydown=e=>{ if(e.key==='Enter') go(); };
  } else if(act.type==='zone'){
    inp.innerHTML=`<div class="row"><input maxlength="60" placeholder="${esc(act.ph||'활동/상황')}" style="flex:1;min-width:180px"><select style="width:auto">${act.zones.map((z,i)=>`<option value="${i}">${esc(z)}</option>`).join('')}</select><button class="btn sm send">붙이기</button></div>`;
    const i=$('input',inp);
    $('.send',inp).onclick=()=>{ const v=i.value.trim(); if(!v) return; LIVE.send(act.id,{x:v,z:+$('select',inp).value}); i.value=''; };
  }
}
function empty(res,board){ res.innerHTML=`<div class="small muted">${board?'아직 응답이 없습니다. 수강생이 응답하면 바로 표시됩니다.':'첫 응답을 남겨 보세요. 같은 방 참여자의 응답이 실시간으로 여기에 모입니다.'}</div>`; }
function drawResult(res,act,msgs,board){
  if(!msgs.length) return empty(res,board);
  const H=board?320:240;
  if(act.type==='choice'||act.type==='multi'||act.type==='quiz'){
    const counts=act.options.map(()=>0);
    msgs.forEach(m=>(Array.isArray(m.v)?m.v:[m.v]).forEach(i=>{ if(counts[i]!=null) counts[i]++; }));
    let extra='';
    if(act.type==='quiz'){ const ok=msgs.filter(m=>m.v===act.answer).length; extra=`<div class="row" style="margin-bottom:8px"><span class="bigstat">${Math.round(ok/msgs.length*100)}%</span><span>정답률 (${ok}/${msgs.length}) · 정답 <b>✓ ${esc(act.options[act.answer])}</b></span></div>${act.explain?`<div class="callout small" style="margin-bottom:8px">${esc(act.explain)}</div>`:''}`; }
    const colors=act.options.map((o,i)=> act.type==='quiz' ? (i===act.answer?'#0ca30c':'#c3c2b7') : (act.colors?act.colors[i]:'#2a78d6'));
    res.innerHTML=extra+`<div style="height:${Math.max(130,act.options.length*(board?50:38)+30)}px"><canvas></canvas></div>`;
    chart($('canvas',res),{type:'bar',data:{labels:act.options.map(o=>o.length>34?o.slice(0,32)+'…':o),datasets:[{data:counts,backgroundColor:colors,borderRadius:4,barThickness:board?28:20}]},options:barOpts({horizontal:true,tip:c=>c.raw+'명'})});
  } else if(act.type==='scale'){
    const mn=act.min??0,mx=act.max??10,labels=[],counts=[];
    for(let i=mn;i<=mx;i++){ labels.push(String(i)); counts.push(0); }
    msgs.forEach(m=>counts[m.v-mn]++);
    const avg=msgs.reduce((s,m)=>s+m.v,0)/msgs.length, mine=LIVE.mine(act.id);
    res.innerHTML=`<div class="row"><span class="bigstat">${avg.toFixed(1)}</span><span class="muted">평균 (${msgs.length}명)${mine?` · 나: <b>${mine.v}</b>`:''}</span></div><div style="height:${H-60}px;margin-top:8px"><canvas></canvas></div>`;
    chart($('canvas',res),{type:'bar',data:{labels,datasets:[{data:counts,backgroundColor:labels.map(l=>mine&&+l===mine.v?'#1c2036':(act.color||'#6250d6')),borderRadius:4}]},options:barOpts({tip:c=>c.raw+'명'})});
  } else if(act.type==='sliders'||act.type==='emo7'){
    const labs=sliderLabels(act), mx=act.max??10;
    const avg=labs.map((_,i)=>msgs.reduce((s,m)=>s+(m.v[i]||0),0)/msgs.length);
    const mine=LIVE.mine(act.id);
    if(act.type==='emo7'){
      // 막대(평균) + 개인 점 — 색은 감정 정체성, 라벨로 항상 이름 표시
      res.innerHTML=`<div class="legend"><span><i style="background:#1c2036;border-radius:50%"></i>나</span><span>막대 = 참여자 평균 (${msgs.length}명)</span></div><div style="height:${H}px"><canvas></canvas></div>`;
      const ds=[{type:'bar',label:'평균',data:avg.map(v=>+v.toFixed(1)),backgroundColor:EMOS.map(e=>e.c),borderRadius:4,order:2}];
      if(mine) ds.push({type:'scatter',label:'나',data:mine.v.map((v,i)=>({x:labs[i],y:v})),backgroundColor:'#1c2036',borderColor:'#fff',borderWidth:2,pointRadius:6,order:1});
      chart($('canvas',res),{type:'bar',data:{labels:labs,datasets:ds},options:Object.assign(barOpts({max:mx}),{plugins:{legend:{display:false}}})});
    } else {
      res.innerHTML=`<div class="legend"><span><i style="background:#6250d6"></i>참여자 평균 (${msgs.length}명)</span>${mine?'<span><i style="background:#eb6834"></i>나</span>':''}</div><div style="height:${H+20}px"><canvas></canvas></div>`;
      const ds=[{label:'평균',data:avg.map(v=>+v.toFixed(1)),borderColor:'#6250d6',backgroundColor:'rgba(98,80,214,.18)',borderWidth:2,pointRadius:4,pointBackgroundColor:'#6250d6'}];
      if(mine) ds.push({label:'나',data:mine.v,borderColor:'#eb6834',backgroundColor:'rgba(235,104,52,.08)',borderWidth:2,borderDash:[5,4],pointRadius:4,pointBackgroundColor:'#eb6834'});
      chart($('canvas',res),{type:'radar',data:{labels:labs,datasets:ds},options:radarOpts(mx)});
    }
  } else if(act.type==='scatter'){
    const pts=msgs.map(m=>({x:m.v[0],y:m.v[1],n:m.n,me:m.u===LIVE.me.u}));
    res.innerHTML=`<div class="legend"><span><i style="background:#6250d6;border-radius:50%"></i>참여자</span><span><i style="background:#eb6834;border-radius:50%"></i>나</span>${act.quad?`<span class="muted">· ${esc(act.quad)}</span>`:''}</div><div style="height:${H+20}px"><canvas></canvas></div>`;
    chart($('canvas',res),{type:'scatter',data:{datasets:[{data:pts,backgroundColor:pts.map(p=>p.me?'#eb6834':'rgba(98,80,214,.75)'),borderColor:'#fff',borderWidth:2,pointRadius:board?9:7,pointHoverRadius:10}]},
      options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw.n}: (${c.raw.x}, ${c.raw.y})`}}},scales:{x:{min:0,max:10,title:{display:true,text:act.x,font:{weight:700}},grid:{color:c=>c.tick.value===5?'#c3c2b7':GRID},ticks:{stepSize:1}},y:{min:0,max:10,title:{display:true,text:act.y,font:{weight:700}},grid:{color:c=>c.tick.value===5?'#c3c2b7':GRID},ticks:{stepSize:1}}}}});
  } else if(act.type==='text'){
    const list=msgs.slice(-(board?80:40)).reverse();
    res.innerHTML=`<div class="notes">${list.map(m=>`<div class="note" ${board?'style="font-size:1.05rem;max-width:320px"':''}>${esc(m.v)}<b>— ${esc(m.n)}</b></div>`).join('')}</div>`;
  } else if(act.type==='zone'){
    const by=act.zones.map((_,z)=>msgs.filter(m=>m.v&&m.v.z===z));
    res.innerHTML=`<div class="grid2" style="align-items:center"><div>${zonesSVG(by.map(a=>a.length),act.zones)}</div><div>${act.zones.map((z,i)=>`<div style="margin-bottom:8px"><b class="small">${['🟢','🟡','🔴'][i]} ${esc(z)} (${by[i].length})</b><div class="notes" style="margin-top:4px">${by[i].slice(-12).reverse().map(m=>`<div class="note" data-z="${i}">${esc(m.v.x)}<b>— ${esc(m.n)}</b></div>`).join('')}</div></div>`).join('')}</div></div>`;
  }
}

/* ---------- 도식 (SVG) ---------- */
function wrapText(t,max){ const words=String(t||'').split(/\s+/); const lines=[]; let cur='';
  words.forEach(w=>{ if((cur+' '+w).trim().length>max && cur){ lines.push(cur); cur=w; } else cur=(cur+' '+w).trim(); }); if(cur) lines.push(cur); return lines.slice(0,4); }
function boxText(x,y,lines,size=14,weight=600,fill='#1c2036'){ const lh=size*1.3, y0=y-(lines.length-1)*lh/2; return lines.map((l,i)=>`<text x="${x}" y="${y0+i*lh}" text-anchor="middle" dominant-baseline="middle" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(l)}</text>`).join(''); }
/* 감정의 덫(악순환) — 노드들이 원형으로 연결 */
function trapSVG(nodes,color,center){
  const n=nodes.length, W=640, H=n>4?470:430, cx=W/2, cy=H/2, rx=225, ry=n>4?165:150;
  const pos=nodes.map((_,i)=>{ const a=-Math.PI/2+i*2*Math.PI/n; return [cx+rx*Math.cos(a), cy+ry*Math.sin(a)]; });
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img"><defs><marker id="ah${color.slice(1)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="${color}"/></marker></defs>`;
  s+=`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${color}" stroke-opacity=".25" stroke-width="2" stroke-dasharray="6 6"/>`;
  if(center) s+=boxText(cx,cy,wrapText(center,14),17,800,color);
  pos.forEach((p,i)=>{ const q=pos[(i+1)%n]; const dx=q[0]-p[0], dy=q[1]-p[1], L=Math.hypot(dx,dy), ux=dx/L, uy=dy/L, off=Math.min(78,L*0.33);
    s+=`<path d="M${p[0]+ux*off},${p[1]+uy*off} L${q[0]-ux*off},${q[1]-uy*off}" stroke="${color}" stroke-width="2.5" fill="none" marker-end="url(#ah${color.slice(1)})"/>`; });
  pos.forEach((p,i)=>{ const nd=nodes[i]; const lines=wrapText(nd.v||nd.ph||'',18); const bw=176, bh=34+lines.length*18;
    s+=`<rect x="${p[0]-bw/2}" y="${p[1]-bh/2}" width="${bw}" height="${bh}" rx="12" fill="#fff" stroke="${color}" stroke-width="2"/>`;
    s+=`<rect x="${p[0]-bw/2}" y="${p[1]-bh/2}" width="${bw}" height="22" rx="12" fill="${color}"/><rect x="${p[0]-bw/2}" y="${p[1]-bh/2+12}" width="${bw}" height="10" fill="${color}"/>`;
    s+=`<text x="${p[0]}" y="${p[1]-bh/2+12}" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="800" fill="#fff">${esc(nd.h)}</text>`;
    s+=boxText(p[0],p[1]+11,lines,12.5,nd.v?600:400,nd.v?'#1c2036':'#8a8c99'); });
  return s+'</svg>';
}
/* 감정 인내의 창 */
function windowSVG(){
  const W=640,H=300; let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s+=`<rect x="60" y="20" width="560" height="80" fill="#fde6e6"/><rect x="60" y="100" width="560" height="100" fill="#e7f6ee"/><rect x="60" y="200" width="560" height="80" fill="#e8ebf6"/>`;
  s+=`<text x="70" y="40" font-size="13" font-weight="800" fill="#a12727">과각성 — 압도·혼란 (파충류 뇌가 지휘)</text><text x="70" y="122" font-size="13" font-weight="800" fill="#0b6b0b">인내의 창 — 견디고, 도움 되는 반응</text><text x="70" y="270" font-size="13" font-weight="800" fill="#2e3360">저각성 — 무감각·단절·무거움</text>`;
  const ok='M60,150 C120,110 160,120 200,160 S280,130 320,150 S400,175 440,140 S540,120 620,150';
  const bad='M60,150 C110,60 140,20 190,30 S240,250 290,270 S350,40 400,25 S470,265 520,270 S590,120 620,150';
  s+=`<path d="${bad}" fill="none" stroke="#8a8c99" stroke-width="3" stroke-dasharray="7 5"/><path d="${ok}" fill="none" stroke="#1c2036" stroke-width="3"/>`;
  s+=`<text x="620" y="292" text-anchor="end" font-size="12" fill="#52514e">— 건강한 반응   - - 견디지 못한 반응</text><text x="20" y="150" font-size="12" fill="#52514e" transform="rotate(-90 20 150)" text-anchor="middle">감정 강도</text>`;
  return s+'</svg>';
}
/* 세 가지 원칙 */
function principlesSVG(){
  const W=640,H=250,items=[['🔍','이해하고 받아들이기','원인 · 5요소 · 기능'],['🌊','견디고 도움 되게 반응하기','인내의 창 넓히기'],['🗝️','감정의 덫에서 나오기','CBT 기반 탈출 기술']];
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  items.forEach((it,i)=>{ const x=110+i*210; s+=`<circle cx="${x}" cy="110" r="88" fill="${['#ece9fb','#e1f5ed','#fdf3d9'][i]}" stroke="${['#6250d6','#1baf7a','#eda100'][i]}" stroke-width="2.5"/><text x="${x}" y="72" text-anchor="middle" font-size="30">${it[0]}</text>${boxText(x,118,wrapText(it[1],10),15,800)}<text x="${x}" y="170" text-anchor="middle" font-size="12" fill="#52514e">${it[2]}</text>`;
    if(i<2) s+=`<path d="M${x+92},110 L${x+116},110" stroke="#1c2036" stroke-width="2.5" marker-end="url(#pa)"/>`; });
  s+=`<defs><marker id="pa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="#1c2036"/></marker></defs><text x="320" y="235" text-anchor="middle" font-size="13" fill="#52514e">세 능력은 서로를 받쳐 줍니다 — 7개 감정 챕터 모두 이 순서로 진행</text>`;
  return s+'</svg>';
}
/* 감정의 5요소 */
function elementsSVG(color='#2e3360'){
  const W=640,H=330,cx=320,cy=165, it=[['💭','느낌','의식적 경험'],['🫀','신체 반응','자율신경계'],['🙂','표정','얼굴의 신호'],['🧠','생각·해석','의미 부여'],['🏃','행동 충동','하고 싶은 것']];
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><circle cx="${cx}" cy="${cy}" r="62" fill="${color}"/>${boxText(cx,cy,['감정','경험'],17,800,'#fff')}`;
  it.forEach((t,i)=>{ const a=-Math.PI/2+i*2*Math.PI/5, x=cx+230*Math.cos(a)*0.95, y=cy+128*Math.sin(a);
    s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${color}" stroke-opacity=".35" stroke-width="2"/><rect x="${x-72}" y="${y-30}" width="144" height="60" rx="14" fill="#fff" stroke="${color}" stroke-width="2"/><text x="${x-48}" y="${y+2}" font-size="22" text-anchor="middle" dominant-baseline="middle">${t[0]}</text><text x="${x+14}" y="${y-8}" font-size="14" font-weight="800" text-anchor="middle" fill="#1c2036">${t[1]}</text><text x="${x+14}" y="${y+12}" font-size="11" text-anchor="middle" fill="#52514e">${t[2]}</text>`; });
  return s+'</svg>';
}
/* 편안·불편·공포 세 개의 원 */
function zonesSVG(counts,labels){
  labels=labels||['편안','불편하지만 해볼 만함','두려움']; counts=counts||null;
  const W=360,H=300,cx=180,cy=150; let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s+=`<rect x="4" y="4" width="352" height="292" rx="18" fill="#fde3e3"/><circle cx="${cx}" cy="${cy}" r="128" fill="#fff3d1" stroke="#fff" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="62" fill="#e2f5ea" stroke="#fff" stroke-width="3"/>`;
  s+=`<text x="${cx}" y="${cy-6}" text-anchor="middle" font-size="13" font-weight="800">🟢 ${esc(labels[0])}</text><text x="${cx}" y="${cy-92}" text-anchor="middle" font-size="12" font-weight="800">🟡 ${esc(labels[1])}</text><text x="20" y="28" font-size="12" font-weight="800">🔴 ${esc(labels[2])}</text>`;
  if(counts){ s+=`<text x="${cx}" y="${cy+18}" text-anchor="middle" font-size="20" font-weight="800">${counts[0]}</text><text x="${cx}" y="${cy+96}" text-anchor="middle" font-size="20" font-weight="800">${counts[1]}</text><text x="324" y="280" text-anchor="middle" font-size="20" font-weight="800">${counts[2]}</text>`; }
  return s+'</svg>';
}
/* 행복의 바퀴 */
function wheelSVG(vals){
  const W=420,H=380,cx=210,cy=190,R=150, sp=[['💛','감정'],['🤝','관계'],['🎯','의미·즐거움 활동'],['🌅','낙관적 시각']];
  let s=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><circle cx="${cx}" cy="${cy}" r="${R}" fill="#fdf3d9" stroke="#eda100" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="34" fill="#eda100"/><text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="800">행복</text>`;
  sp.forEach((t,i)=>{ const a=-Math.PI/2+i*Math.PI/2+Math.PI/4, x=cx+R*Math.cos(a), y=cy+R*Math.sin(a);
    s+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#eda100" stroke-width="3"/>`;
    const lx=cx+R*.62*Math.cos(a-Math.PI/4), ly=cy+R*.62*Math.sin(a-Math.PI/4);
    s+=`<text x="${lx}" y="${ly-10}" text-anchor="middle" font-size="24">${t[0]}</text><text x="${lx}" y="${ly+16}" text-anchor="middle" font-size="13" font-weight="800">${t[1]}</text>`;
    if(vals) s+=`<text x="${lx}" y="${ly+34}" text-anchor="middle" font-size="12" fill="#52514e">${vals[i]}/10</text>`; });
  return s+'</svg>';
}
function diagram(id,ctx={}){
  if(id==='window') return windowSVG();
  if(id==='principles') return principlesSVG();
  if(id==='elements') return elementsSVG(ctx.color);
  if(id==='zones') return zonesSVG();
  if(id==='wheel') return wheelSVG();
  if(id==='trap') return trapSVG(ctx.nodes,ctx.color,ctx.center);
  return '';
}

/* ---------- 상단바 & 방 참여 ---------- */
const KEYLOGO='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22264a" stroke-width="2.4" stroke-linecap="round"><circle cx="8" cy="8" r="4.5"/><path d="M11.3 11.3L20 20M16.5 16.5l2-2M18.5 18.5l2-2"/></svg>';
function topbar(active){
  const bar=document.createElement('header'); bar.className='topbar';
  bar.innerHTML=`<div class="wrap">
    <a class="brand" href="index.html"><span class="logo">${KEYLOGO}</span><span>SEVEN KEYS<small>세븐 키 · 감정조절 프로그램</small></span></a>
    <nav class="topnav">
      <a href="index.html" class="${active==='home'?'on':''}">홈</a>
      <a href="lesson.html?ch=0" class="${active==='lesson'?'on':''}">챕터 실습</a>
      <a href="journal.html" class="${active==='journal'?'on':''}">나의 감정 일지</a>
      <a href="board.html" class="${active==='board'?'on':''}">강사 보드</a>
      <button class="roomchip off" id="roomchip"><span class="dot"></span><span class="lbl">방 참여</span></button>
    </nav></div>`;
  document.body.prepend(bar);
  const chip=$('#roomchip');
  const upd=()=>{ chip.classList.toggle('off',!LIVE.room); $('.dot',chip).classList.toggle('live',LIVE.status==='live'); $('.lbl',chip).textContent=LIVE.room?`${LIVE.room} · ${LIVE.me.n||'닉네임?'}`:'방 참여'; };
  LIVE.on(upd); upd(); chip.onclick=()=>joinModal();
}
function joinModal(force){
  const m=document.createElement('div'); m.className='modal';
  m.innerHTML=`<div class="box"><div class="kicker">LIVE ROOM</div><h2>실시간 수업 참여</h2>
   <p class="small muted">강사가 알려준 방 코드와 닉네임을 입력하면 투표·척도·포스트잇 응답이 같은 방 참여자들과 실시간으로 공유됩니다. 개인 워크시트(경험 기록, 생각 기록 등)는 공유되지 않고 내 브라우저에만 저장됩니다.</p>
   <label>방 코드</label><input id="jr" placeholder="예: KEY7A" value="${esc(LIVE.room)}" style="text-transform:uppercase;margin:4px 0 10px">
   <label>닉네임 (실명 대신 별명 권장)</label><input id="jn" placeholder="예: 후안샘" value="${esc(LIVE.me.n)}" maxlength="16" style="margin:4px 0 16px">
   <div class="row"><button class="btn" id="jok">참여하기</button><button class="btn ghost" id="jsolo">혼자 실습 (개인 모드)</button></div></div>`;
  document.body.appendChild(m);
  $('#jok',m).onclick=()=>{ const r=$('#jr',m).value.trim(), n=$('#jn',m).value.trim(); if(!r||!n) return toast('방 코드와 닉네임을 입력해 주세요'); LIVE.setNick(n); LIVE.setRoom(r); m.remove(); toast(`방 ${LIVE.room}에 참여했습니다`); };
  $('#jsolo',m).onclick=()=>{ LIVE.setNick($('#jn',m).value.trim()); LIVE.setRoom(''); m.remove(); };
  if(!force) m.onclick=e=>{ if(e.target===m) m.remove(); };
}
function initRoomFromURL(){
  const r=new URLSearchParams(location.search).get('room');
  if(r){ LIVE.room=r.toUpperCase(); store.set('room',LIVE.room); } else LIVE.room=store.get('room','')||'';
  LIVE.connect();
  if(r && !LIVE.me.n) setTimeout(()=>joinModal(true),300);
}
const SAFETY='이 프로그램은 감정 이해와 자기관리를 위한 교육 과정이며 진단·치료를 대신하지 않습니다. 감정이 일상을 크게 흔들거나 스스로를 해치고 싶은 마음이 들면 혼자 견디지 말고 전문가와 이야기하세요 — 자살예방상담 109 · 정신건강위기상담 1577-0199 (24시간).';
function footer(){ const f=document.createElement('div'); f.innerHTML=`<p class="safety">${SAFETY}</p><div class="footer">SEVEN KEYS · 세븐 키 — 다인에듀(다인원격평생교육직업학원) HR 프로그램 · 교재: <i>Understanding Your 7 Emotions</i> (Lawrence Howells) 기반 재구성</div>`; document.body.appendChild(f); }

window.SK={$,$$,esc,EMOS,EMO,SERIES,GRID,AXIS,store,uid,today,chart,gridOpt,radarOpts,barOpts,toast,LIVE,renderActivity,topbar,joinModal,initRoomFromURL,footer,diagram,trapSVG,zonesSVG,wheelSVG,wrapText};
})();
