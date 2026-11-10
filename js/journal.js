/* SEVEN KEYS — 감정 일지 & 대시보드 */
(function(){
const {$,$$,esc,EMOS,store,chart,radarOpts,barOpts,toast,topbar,initRoomFromURL,footer,today,GRID}=SK;
topbar('journal'); initRoomFromURL();
const get=()=>store.get('journal',[]), set=v=>store.set('journal',v);
const SKd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const WIN=[['above','▲ 창 위 (압도·긴장)','#e34948'],['inside','● 창 안 (차분)','#1baf7a'],['below','▼ 창 아래 (멍함·처짐)','#2a78d6']];
const J=$('#j');
J.innerHTML=`<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">오늘의 기록</h2><input type="date" id="jd" style="width:auto"></div>
  <div class="grid2" style="margin-top:10px"><div>${EMOS.map((e,i)=>`<div class="slrow"><span><span class="emo" style="--c:${e.c}"><i></i>${e.f} ${e.ko}</span></span><input type="range" min="0" max="10" value="0" data-i="${i}"><b>0</b></div>`).join('')}</div>
  <div><label>지금 나는 인내의 창…</label><div class="opts" id="jw" style="margin:6px 0 12px">${WIN.map(w=>`<button class="opt" data-w="${w[0]}">${w[1]}</button>`).join('')}</div>
  <label>무슨 일이 있었나요? (선택)</label><textarea id="jn" placeholder="촉발 상황, 나의 반응, 써 본 열쇠…"></textarea>
  <label style="margin-top:8px">오늘 써 본 열쇠</label><div class="opts" id="jk">${['호흡','세 개의 원','더 하기','생각 기록','정의·확인·해결','단호한 말','책임 파이','관점 바꾸기','감사 세기','친절'].map(k=>`<button class="opt" data-k="${k}">${k}</button>`).join('')}</div>
  <div class="row" style="margin-top:12px"><button class="btn" id="jsave">💾 기록 저장</button><span class="small muted" id="jmsg"></span></div></div></div></div>
  <div class="grid4" id="kpi"></div>
  <div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">감정 흐름</h3><div class="opts" id="flt"></div></div><div class="chart lg" style="margin-top:10px"><canvas id="c1"></canvas></div></div>
  <div class="grid2"><div class="card"><h3>평균 감정 프로필</h3><div class="chart"><canvas id="c2"></canvas></div></div>
  <div class="card"><h3>인내의 창 위치</h3><div class="chart"><canvas id="c3"></canvas></div></div></div>
  <div class="grid2"><div class="card"><h3>가장 강했던 감정 달력 (최근 5주)</h3><div class="cal" id="cal"></div><div class="legend" style="margin-top:8px">${EMOS.map(e=>`<span><i style="background:${e.c}"></i>${e.f} ${e.ko}</span>`).join('')}</div></div>
  <div class="card"><h3>자주 쓴 열쇠</h3><div class="chart"><canvas id="c4"></canvas></div></div></div>
  <div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">기록 목록</h3><div class="row"><button class="btn ghost sm" id="exp">⬇ 내보내기(JSON)</button><label class="btn ghost sm" style="margin:0">⬆ 가져오기<input type="file" id="imp" accept=".json" class="hidden"></label><a class="btn sm" href="lesson.html?ch=8">📊 종합 리포트</a></div></div><div id="list" style="margin-top:10px"></div></div>`;
let win=null, keys=new Set(), shown=new Set(EMOS.map(e=>e.k));
$('#jd').value=today();
const sliders=$$('[data-i]',J);
sliders.forEach(r=>r.oninput=()=>r.nextElementSibling.textContent=r.value);
$$('#jw .opt').forEach(b=>b.onclick=()=>{ win=b.dataset.w; $$('#jw .opt').forEach(x=>x.classList.toggle('sel',x===b)); });
$$('#jk .opt').forEach(b=>b.onclick=()=>{ b.classList.toggle('sel'); b.classList.contains('sel')?keys.add(b.dataset.k):keys.delete(b.dataset.k); });
function load(d){ const e=get().find(x=>x.d===d); sliders.forEach((r,i)=>{ r.value=e?e.v[i]:0; r.nextElementSibling.textContent=r.value; }); win=e?e.w:null; $$('#jw .opt').forEach(x=>x.classList.toggle('sel',x.dataset.w===win)); keys=new Set(e?e.k:[]); $$('#jk .opt').forEach(x=>x.classList.toggle('sel',keys.has(x.dataset.k))); $('#jn').value=e?e.n:''; $('#jmsg').textContent=e?'이 날의 기록을 수정합니다':''; }
$('#jd').onchange=()=>load($('#jd').value);
$('#jsave').onclick=()=>{ const d=$('#jd').value||today(); const a=get().filter(x=>x.d!==d); a.push({d,v:sliders.map(r=>+r.value),w:win,n:$('#jn').value.trim(),k:[...keys]}); a.sort((x,y)=>x.d<y.d?-1:1); set(a); toast('저장했습니다'); $('#jmsg').textContent='저장됨 ✓'; draw(); };
$('#flt').innerHTML=EMOS.map(e=>`<button class="opt sel" data-e="${e.k}" style="padding:5px 10px;font-size:.8rem">${e.f} ${e.ko}</button>`).join('');
$$('#flt .opt').forEach(b=>b.onclick=()=>{ b.classList.toggle('sel'); b.classList.contains('sel')?shown.add(b.dataset.e):shown.delete(b.dataset.e); draw(); });
function draw(){
  const a=get();
  const avg=EMOS.map((_,i)=>a.length?a.reduce((s,x)=>s+x.v[i],0)/a.length:0);
  const top=a.length?EMOS[avg.indexOf(Math.max(...avg))]:null, inside=a.filter(x=>x.w==='inside').length;
  let streak=0; { const d=new Date(); const has=new Set(a.map(x=>x.d)); while(has.has(SKd(d))){ streak++; d.setDate(d.getDate()-1); } }
  $('#kpi').innerHTML=[['기록한 날',a.length+'일'],['연속 기록',streak+'일'],['가장 자주 강한 감정',top?`${top.f} ${top.ko}`:'—'],['창 안에 있던 날',a.length?Math.round(inside/a.length*100)+'%':'—']].map(k=>`<div class="card" style="margin:8px 0"><div class="small muted">${k[0]}</div><div class="bigstat" style="font-size:1.5rem">${k[1]}</div></div>`).join('');
  const last=a.slice(-30);
  chart($('#c1'),{type:'line',data:{labels:last.map(x=>x.d.slice(5)),datasets:EMOS.map((e,i)=>({label:e.f+' '+e.ko,data:last.map(x=>x.v[i]),borderColor:e.c,backgroundColor:e.c,borderWidth:2,pointRadius:3,tension:.3,hidden:!shown.has(e.k)}))},options:{interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom'}},scales:{y:{min:0,max:10,grid:{color:GRID}},x:{grid:{display:false}}}}});
  chart($('#c2'),{type:'radar',data:{labels:EMOS.map(e=>e.f+' '+e.ko),datasets:[{data:avg.map(v=>+v.toFixed(1)),borderColor:'#22264a',backgroundColor:'rgba(34,38,74,.15)',borderWidth:2,pointBackgroundColor:EMOS.map(e=>e.c),pointRadius:5}]},options:radarOpts(10)});
  chart($('#c3'),{type:'doughnut',data:{labels:WIN.map(w=>w[1]),datasets:[{data:WIN.map(w=>a.filter(x=>x.w===w[0]).length),backgroundColor:WIN.map(w=>w[2]),borderColor:'#fff',borderWidth:2}]},options:{cutout:'58%',plugins:{legend:{position:'right'}}}});
  const kc={}; a.forEach(x=>(x.k||[]).forEach(k=>kc[k]=(kc[k]||0)+1)); const ks=Object.keys(kc).sort((x,y)=>kc[y]-kc[x]);
  chart($('#c4'),{type:'bar',data:{labels:ks,datasets:[{data:ks.map(k=>kc[k]),backgroundColor:'#f3c34a',borderRadius:4}]},options:barOpts({horizontal:true,tip:c=>c.raw+'회'})});
  // 달력
  const by=Object.fromEntries(a.map(x=>[x.d,x])); const cells=['월','화','수','목','금','토','일'].map(d=>`<div class="h">${d}</div>`);
  const fmtD=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const now=new Date(); now.setHours(12); const start=new Date(now); start.setDate(now.getDate()-34); start.setDate(start.getDate()-((start.getDay()+6)%7));
  for(let d=new Date(start); d<=now; d.setDate(d.getDate()+1)){ const ds=fmtD(d), e=by[ds];
    if(e){ const mx=Math.max(...e.v); const em=EMOS[e.v.indexOf(mx)]; cells.push(`<div class="has" style="background:${mx?em.c:'#c3c2b7'}" title="${ds} · ${em.ko} ${mx}">${mx?em.f:d.getDate()}</div>`); } else cells.push(`<div title="${ds}">${d.getDate()}</div>`); }
  $('#cal').innerHTML=cells.join('');
  $('#list').innerHTML=a.slice().reverse().slice(0,40).map(x=>{ const w=WIN.find(y=>y[0]===x.w); return `<div style="border-bottom:1px solid var(--line-2);padding:8px 0"><b>${x.d}</b> ${w?`<span class="pill">${w[1]}</span>`:''} <span class="small">${EMOS.map((e,i)=>x.v[i]?`${e.f}${x.v[i]}`:'').filter(Boolean).join(' ')}</span>${x.n?`<div class="small muted">${esc(x.n)}</div>`:''}${(x.k||[]).length?`<div class="tiny">🗝️ ${x.k.map(esc).join(', ')}</div>`:''}</div>`; }).join('')||'<div class="muted small">아직 기록이 없습니다. 위에서 오늘의 감정을 기록해 보세요.</div>';
}
$('#exp').onclick=()=>{ const all={}; store.keys().forEach(k=>{ if(!k.startsWith('sent_')) all[k]=store.get(k); }); const blob=new Blob([JSON.stringify(all,null,1)],{type:'application/json'}); const u=URL.createObjectURL(blob); const l=document.createElement('a'); l.href=u; l.download='sevenkeys-backup-'+today()+'.json'; l.click(); };
$('#imp').onchange=e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(t=>{ try{ const o=JSON.parse(t); Object.entries(o).forEach(([k,v])=>store.set(k,v)); toast('가져왔습니다'); load($('#jd').value); draw(); }catch(err){ toast('파일을 읽을 수 없습니다'); } }); };
load(today()); draw(); footer();
})();
