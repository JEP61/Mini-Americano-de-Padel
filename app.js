// --- Helpers ---
const $ = (id) => document.getElementById(id);

const PAIRS = ['p1','p2','p3','p4'];
const MATCHES = [
  // Turno 1
  {a:['p1','p2'], b:['p3','p4'], ids:['t1a_s1','t1a_s2','t1b_s1','t1b_s2']},
  // Turno 2
  {a:['p1','p3'], b:['p2','p4'], ids:['t2a_s1','t2a_s2','t2b_s1','t2b_s2']},
  // Turno 3
  {a:['p1','p4'], b:['p2','p3'], ids:['t3a_s1','t3a_s2','t3b_s1','t3b_s2']},
];

// map match name spans to pair fields so labels update live
const LABEL_MAP = [
  ['t1a_n1','p1'],['t1a_n2','p2'],['t1b_n1','p3'],['t1b_n2','p4'],
  ['t2a_n1','p1'],['t2a_n2','p3'],['t2b_n1','p2'],['t2b_n2','p4'],
  ['t3a_n1','p1'],['t3a_n2','p4'],['t3b_n1','p2'],['t3b_n2','p3'],
];

const STORAGE_KEY = 'mini_americano_state_v2';

function getState(){
  const st = localStorage.getItem(STORAGE_KEY);
  if(!st) return {names: ["Pareja 1","Pareja 2","Pareja 3","Pareja 4"], scores: {}};
  try { return JSON.parse(st); } catch(e){ return {names: ["Pareja 1","Pareja 2","Pareja 3","Pareja 4"], scores:{}}; }
}

function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readUI(){
  const names = PAIRS.map(id => $(id).value.trim() || $(id).placeholder);
  const scores = {};
  [...document.querySelectorAll('input.score')].forEach(inp => {
    scores[inp.id] = inp.value.trim();
  });
  return {names, scores};
}

function writeUI(state){
  // names
  PAIRS.forEach((id, idx) => {
    $(id).value = state.names[idx] || '';
  });
  // labels
  LABEL_MAP.forEach(([lbl, pid])=>{
    const idx = PAIRS.indexOf(pid);
    const name = state.names[idx] || $(pid).placeholder;
    $(lbl).textContent = name;
  });
  // scores
  [...document.querySelectorAll('input.score')].forEach(inp => {
    inp.value = state.scores[inp.id] ?? '';
  });
}

function recalc(){
  const state = readUI();
  saveState(state);

  // initialize stats for 4 pairs
  const stats = [0,1,2,3].map(()=>({PJ:0,JG:0,JP:0, Dif:0, Puntos:0, Nombre:''}));
  state.names.forEach((n,i)=> stats[i].Nombre = n || `Pareja ${i+1}`);

  function addResult(pairIdx, gamesWon, gamesLost){
    stats[pairIdx].PJ += 1;
    stats[pairIdx].JG += gamesWon;
    stats[pairIdx].JP += gamesLost;
    stats[pairIdx].Puntos += gamesWon; // Puntos = JG
    stats[pairIdx].Dif = stats[pairIdx].JG - stats[pairIdx].JP;
  }

  // helper: parse score input to int (empty -> null)
  const toInt = (v)=>{
    if(v==='' || v==null) return null;
    const n = parseInt(v,10);
    return isNaN(n) ? null : n;
  };

  // go over each match (6 matches: 3 turnos x 2 partidos)
  const schedule = [
    ['p1','p2','t1a_s1','t1a_s2'],
    ['p3','p4','t1b_s1','t1b_s2'],
    ['p1','p3','t2a_s1','t2a_s2'],
    ['p2','p4','t2b_s1','t2b_s2'],
    ['p1','p4','t3a_s1','t3a_s2'],
    ['p2','p3','t3b_s1','t3b_s2'],
  ];

  schedule.forEach(([pa,pb,s1,s2])=>{
    const aIdx = PAIRS.indexOf(pa);
    const bIdx = PAIRS.indexOf(pb);
    const a = toInt($(s1).value);
    const b = toInt($(s2).value);
    if(a==null || b==null) return; // ignore incomplete match
    addResult(aIdx, a, b);
    addResult(bIdx, b, a);
  });

  // sort standings
  const sorted = stats
    .map((s,i)=>({...s, idx:i}))
    .sort((x,y)=>{
      if(y.Puntos!==x.Puntos) return y.Puntos - x.Puntos;
      if(y.Dif!==x.Dif) return y.Dif - x.Dif;
      return (y.JG - x.JG);
    });

  const tbody = document.querySelector('#table tbody');
  tbody.innerHTML = '';
  sorted.forEach((s,rank)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${rank+1}</td>
      <td>${s.Nombre}</td>
      <td>${s.PJ}</td>
      <td>${s.JG}</td>
      <td>${s.JP}</td>
      <td>${s.Dif}</td>
      <td>${s.Puntos}</td>`;
    tbody.appendChild(tr);
  });
}

function downloadCSV(){
  const state = readUI();
  // ensure last edits saved
  saveState(state);
  // Recalculate to be safe
  recalc();

  const rows = [['Pareja','PJ','JG','JP','Dif','Puntos']];
  const tableRows = document.querySelectorAll('#table tbody tr');
  tableRows.forEach(tr=>{
    const tds = [...tr.querySelectorAll('td')].map(td=>td.textContent);
    // skip rank column
    rows.push([tds[1], tds[2], tds[3], tds[4], tds[5], tds[6]]);
  });

  const csv = rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mini_americano.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function resetAll(){
  // clear scores only
  document.querySelectorAll('input.score').forEach(i=>i.value='');
  recalc();
}
function clearAll(){
  // names + scores
  PAIRS.forEach((id,i)=>$(id).value='');
  document.querySelectorAll('input.score').forEach(i=>i.value='');
  localStorage.removeItem(STORAGE_KEY);
  recalc();
}

// wire up
window.addEventListener('DOMContentLoaded', () => {
  const state = getState();
  writeUI(state);

  // live labels for names
  PAIRS.forEach((pid, idx)=>{
    $(pid).addEventListener('input', ()=>{
      const st = readUI();
      LABEL_MAP.forEach(([lbl, p])=>{
        const pidx = PAIRS.indexOf(p);
        const nm = st.names[pidx] || `Pareja ${pidx+1}`;
        $(lbl).textContent = nm;
      });
      saveState(st);
    });
  });

  // scores change -> recalc + save
  document.querySelectorAll('input.score').forEach(inp=>{
    inp.addEventListener('input', recalc);
  });

  $('recalcBtn').addEventListener('click', recalc);
  $('csvBtn').addEventListener('click', downloadCSV);
  $('resetBtn').addEventListener('click', resetAll);
  $('clearBtn').addEventListener('click', clearAll);

  recalc();
});
