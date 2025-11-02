
const STORAGE_KEY = 'mini_americano_state_v4'; // new version

function getState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return {refNames:["","","",""],scores:{}};
  try{ return JSON.parse(raw); }catch(e){ return {refNames:["","","",""],scores:{}}; }
}
function saveState(st){ localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); }

function readUI(){
  const refNames = ['r1','r2','r3','r4'].map(id => (document.getElementById(id).value||'').trim());
  const scores = {}; document.querySelectorAll('input.score').forEach(inp => scores[inp.id]=inp.value.trim());
  return {refNames,scores};
}
function writeUI(st){
  ['r1','r2','r3','r4'].forEach((id,i)=>document.getElementById(id).value = st.refNames?.[i] ?? '');
  document.querySelectorAll('input.score').forEach(inp => inp.value = st.scores?.[inp.id] ?? '');
}

function toInt(v){ if(v===''||v==null) return null; const n=parseInt(v,10); return Number.isFinite(n)?Math.max(0,n):null; }

function recalc(){
  const st = readUI(); saveState(st);
  const stats = Array.from({length:4},(_,i)=>({name:`Pareja ${i+1}`,PJ:0,JG:0,JP:0,Dif:0,Puntos:0}));

  const schedule = [
    ['t1a_s1','t1a_s2',0,1],['t1b_s1','t1b_s2',2,3],
    ['t2a_s1','t2a_s2',0,2],['t2b_s1','t2b_s2',1,3],
    ['t3a_s1','t3a_s2',0,3],['t3b_s1','t3b_s2',1,2]
  ];

  schedule.forEach(([aId,bId,ai,bi])=>{
    const a = toInt(document.getElementById(aId).value);
    const b = toInt(document.getElementById(bId).value);
    if(a==null || b==null) return;
    stats[ai].PJ++; stats[bi].PJ++;
    stats[ai].JG+=a; stats[ai].JP+=b;
    stats[bi].JG+=b; stats[bi].JP+=a;
  });

  stats.forEach(s=>{ s.Dif=s.JG-s.JP; s.Puntos=s.JG; });
  stats.sort((x,y)=> y.Puntos-x.Puntos || y.Dif-x.Dif || y.JG-x.JG );

  const tbody = document.querySelector('#table tbody');
  tbody.innerHTML = stats.map((s,i)=>`<tr>
    <td>${i+1}</td><td>${s.name}</td><td>${s.PJ}</td><td>${s.JG}</td><td>${s.JP}</td><td>${s.Dif}</td><td>${s.Puntos}</td>
  </tr>`).join('');
}

function downloadCSV(){
  recalc();
  const rows = [...document.querySelectorAll('#table tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent));
  const header = ["#","Pareja","PJ","JG","JP","Dif","Puntos"];
  const csv = [header, ...rows].map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mini_americano.csv'; a.click();
}

function resetAll(){ // clear scores AND names
  document.querySelectorAll('input.score').forEach(i=>i.value='');
  ['r1','r2','r3','r4'].forEach(id=>document.getElementById(id).value='');
  saveState({refNames:["","","",""],scores:{}}); recalc();
}
function clearAll(){ resetAll(); }

window.addEventListener('DOMContentLoaded', ()=>{
  writeUI(getState());
  ['r1','r2','r3','r4'].forEach(id=>document.getElementById(id).addEventListener('input', ()=>saveState(readUI())));
  document.querySelectorAll('input.score').forEach(inp=>inp.addEventListener('input', recalc));
  document.getElementById('recalcBtn').addEventListener('click', recalc);
  document.getElementById('csvBtn').addEventListener('click', downloadCSV);
  document.getElementById('resetBtn').addEventListener('click', resetAll);
  document.getElementById('clearBtn').addEventListener('click', clearAll);
  recalc();
});
