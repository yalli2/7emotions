/* SEVEN KEYS — 챕터 페이지 렌더러 */
(function(){
const {$,$$,esc,EMOS,EMO,store,renderActivity,topbar,initRoomFromURL,footer,diagram} = SK;
topbar('lesson'); initRoomFromURL();
const p=new URLSearchParams(location.search);
let no=Math.max(0,Math.min(CHAPTERS.length-1,+(p.get('ch')||0)));
const ch=CHAPTERS[no];
document.title=`${no===0?'서론':no===8?'종합':no+'장'} ${ch.title} · SEVEN KEYS`;
document.documentElement.style.setProperty('--emo',ch.color);
document.documentElement.style.setProperty('--emo-soft',ch.soft);
let sec=Math.max(0,Math.min(ch.sections.length-1,+(p.get('s')||store.get('sec_'+no,0))));
const label=c=>c.no===0?'서론':c.no===8?'종합':`${c.no}장`;
const app=$('#app');
app.innerHTML=`<div class="chhead"><div class="wrap">
  <div class="row" style="justify-content:space-between"><div class="kicker">${label(ch)} · ${EMO[ch.key]?EMO[ch.key].en.toUpperCase():ch.key==='intro'?'INTRODUCTION':'WRAP-UP'}</div>
  <select id="chsel" style="width:auto;background:rgba(255,255,255,.95);padding:6px 10px">${CHAPTERS.map(c=>`<option value="${c.no}" ${c.no===no?'selected':''}>${label(c)} ${c.face} ${c.title}</option>`).join('')}</select></div>
  <h1>${ch.face} ${esc(ch.title)}</h1><div style="opacity:.92;font-weight:600">${esc(ch.sub)}</div>
  <p style="opacity:.85;max-width:760px;margin:.6em 0 0" class="small">🎯 ${esc(ch.goal)}</p></div></div>
  <div class="wrap"><div class="chnav" id="nav"></div><div id="body"></div><div class="sec-foot"><button class="btn ghost" id="prev">← 이전</button><button class="btn" id="next">다음 →</button></div></div>`;
$('#chsel').onchange=e=>location.href='lesson.html?ch='+e.target.value;
const nav=$('#nav');
nav.innerHTML=ch.sections.map((s,i)=>`<button data-i="${i}"><span class="n">${i+1}</span>${esc(s.title)}</button>`).join('');
$$('button',nav).forEach(b=>b.onclick=()=>go(+b.dataset.i));

function block(b){
  const d=document.createElement('div');
  if(b.t==='p'){ d.innerHTML=(b.h?`<h3 style="margin-top:22px">${esc(b.h)}</h3>`:'')+`<p>${b.x}</p>`; }
  else if(b.t==='key'){ d.className='keymsg'; d.textContent='🔑 '+b.x; }
  else if(b.t==='callout'){ d.className='callout small'; d.style.margin='12px 0'; d.innerHTML=b.x; }
  else if(b.t==='cards'){ d.className='blk-cards'; d.innerHTML=b.items.map(i=>`<div class="it"><div class="ic">${i.i}</div><h4>${esc(i.h)}</h4><p>${esc(i.x)}</p></div>`).join(''); }
  else if(b.t==='table'){ d.innerHTML=`<div style="overflow-x:auto"><table class="tbl"><tr>${b.head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${b.rows.map(r=>`<tr>${r.map((c,i)=>`<td>${i===0?'<b>'+esc(c)+'</b>':esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>`; }
  else if(b.t==='steps'){ d.innerHTML=`<ol class="steps">${b.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`; }
  else if(b.t==='qs'){ d.innerHTML=`<div class="qs">${b.items.map(x=>`<div>${esc(x)}</div>`).join('')}</div>`; }
  else if(b.t==='case'){ d.className='case'; d.innerHTML=`<b>📖 ${esc(b.h)}</b><div>${esc(b.x)}</div>`; }
  else if(b.t==='emogrid'){ d.className='grid4'; d.style.margin='12px 0'; d.innerHTML=EMOS.map((e,i)=>`<a class="emocard" style="--c:${e.c}" href="lesson.html?ch=${i+1}"><div class="face">${e.f}</div><h3>${e.ko}</h3><div class="small muted">${e.en} · ${i+1}장</div></a>`).join('')+`<div class="emocard" style="--c:#c3c2b7;background:var(--bg);box-shadow:none"><div class="small">각 감정 카드를 누르면 해당 챕터로 이동합니다. 색은 감정을 구분하는 보조 표시이며, 항상 이모지와 이름이 함께 붙습니다.</div></div>`; }
  else if(b.t==='diagram'){ d.className='diagram';
    let ctx={color:ch.color};
    if(b.id==='trap'){ const e=EMO[b.emo], tr=TRAPS[b.emo]; ctx={color:e.c,center:tr.center,nodes:tr.nodes.map(n=>({h:n.h,ph:'',v:n.ph.replace(/^예: /,'')}))}; }
    d.innerHTML=diagram(b.id,ctx)+`<div class="cap">${esc(b.cap||(b.id==='trap'?`${EMO[b.emo].ko}의 덫 — 예시로 본 악순환 (아래에서 나만의 덫을 그려 보세요)`:''))}</div>`; }
  else if(b.t==='tool'){ if(window.TOOLS[b.id]) window.TOOLS[b.id](d,{emo:b.emo}); }
  else if(b.t==='live'){ renderActivity(d,b.act); }
  return d;
}
function go(i){
  sec=i; store.set('sec_'+no,i);
  $$('button',nav).forEach((b,j)=>b.classList.toggle('on',j===i));
  const body=$('#body'); body.innerHTML='';
  const s=ch.sections[i]; const h=document.createElement('h2'); h.style.marginTop='24px'; h.textContent=`${i+1}. ${s.title}`; body.appendChild(h);
  s.blocks.forEach(b=>body.appendChild(block(b)));
  $('#prev').style.visibility=(i===0&&no===0)?'hidden':'visible';
  $('#prev').textContent= i===0?`← ${label(CHAPTERS[no-1]||ch)} ${CHAPTERS[no-1]?.title||''}`:'← 이전';
  $('#next').textContent= i===ch.sections.length-1 ? (CHAPTERS[no+1]?`다음 챕터: ${CHAPTERS[no+1].face} ${CHAPTERS[no+1].title} →`:'🏁 처음으로') : '다음 →';
  const u=new URL(location); u.searchParams.set('ch',no); u.searchParams.set('s',i); history.replaceState(null,'',u);
  const btn=$$('button',nav)[i]; btn&&btn.scrollIntoView({inline:'center',block:'nearest'});
}
$('#prev').onclick=()=>{ if(sec>0){ go(sec-1); scrollTo(0,0); } else if(no>0) location.href=`lesson.html?ch=${no-1}&s=${CHAPTERS[no-1].sections.length-1}`; };
$('#next').onclick=()=>{ if(sec<ch.sections.length-1){ go(sec+1); scrollTo({top:document.querySelector('.chnav').offsetTop-58,behavior:'smooth'}); } else location.href= CHAPTERS[no+1]?`lesson.html?ch=${no+1}&s=0`:'index.html'; };
go(sec); footer();
})();
