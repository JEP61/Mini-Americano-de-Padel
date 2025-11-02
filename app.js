const teamsInputs = document.querySelectorAll('#teams input');
const matchesDiv = document.getElementById('matches');
const tableBody = document.querySelector('#table tbody');
const btnDownload = document.getElementById('download');

const matchups = [
  [0,1], [2,3],
  [0,2], [1,3],
  [0,3], [1,2]
];

function saveData() {
  const data = {
    teams: Array.from(teamsInputs).map(i => i.value),
    scores: Array.from(document.querySelectorAll('.score')).map(s => s.value)
  };
  localStorage.setItem('miniAmericanoData', JSON.stringify(data));
}

function loadData() {
  const saved = localStorage.getItem('miniAmericanoData');
  if (!saved) return;
  const data = JSON.parse(saved);
  teamsInputs.forEach((i, idx) => i.value = data.teams?.[idx] || '');
  const scores = document.querySelectorAll('.score');
  scores.forEach((s, idx) => s.value = data.scores?.[idx] || '');
}

function buildMatches() {
  matchesDiv.innerHTML = '';
  matchups.forEach(([a,b], i) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <strong>Match ${i+1}</strong><br>
      ${(teamsInputs[a].value||'Pareja '+(a+1))}
      <input class="score" type="number" min="0" max="7" inputmode="numeric"> vs 
      <input class="score" type="number" min="0" max="7" inputmode="numeric">
      ${(teamsInputs[b].value||'Pareja '+(b+1))}
    `;
    matchesDiv.appendChild(div);
  });
  document.querySelectorAll('.score').forEach(s => s.addEventListener('input', saveData));
}

function calculate() {
  const teams = Array.from(teamsInputs).map((i,idx) => i.value || 'Pareja ' + (idx+1));
  const stats = teams.map(() => ({PJ:0, GF:0, GC:0, Pts:0}));
  const scores = Array.from(document.querySelectorAll('.score'))
    .map(s => s.value === '' ? null : parseInt(s.value,10));

  for (let i=0; i<matchups.length; i++) {
    const [a,b] = matchups[i];
    const g1 = scores[i*2], g2 = scores[i*2+1];
    if (g1===null || g2===null) continue; // game no contable si no está completo
    stats[a].PJ++; stats[b].PJ++;
    stats[a].GF+=g1; stats[a].GC+=g2;
    stats[b].GF+=g2; stats[b].GC+=g1;
    if (g1>g2) stats[a].Pts+=g1;
    else if (g2>g1) stats[b].Pts+=g2;
    else { /* 6-6 con TB registrar 7-6 o 6-7 manualmente */ }
  }

  const rows = stats.map((s,i)=>{
    const dif = s.GF - s.GC;
    return {name: teams[i], ...s, Dif: dif};
  }).sort((a,b)=> b.Pts - a.Pts || b.Dif - a.Dif || b.GF - a.GF);

  tableBody.innerHTML = '';
  rows.forEach((r,idx)=>{
    const tr = `<tr><td>${idx+1}</td><td>${r.name}</td><td>${r.PJ}</td><td>${r.GF}</td><td>${r.GC}</td><td>${r.Dif}</td><td>${r.Pts}</td></tr>`;
    tableBody.insertAdjacentHTML('beforeend', tr);
  });
}

function downloadCSV() {
  const th = ['Pareja','PJ','GF','GC','Dif','Puntos'];
  const data = Array.from(tableBody.querySelectorAll('tr')).map(tr => 
    Array.from(tr.children).slice(1).map(td => td.textContent)
  );
  const rows = [th, ...data];
  const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mini_americano_resultados.csv';
  document.body.appendChild(a); a.click(); a.remove();
}

document.getElementById('recalculate').onclick = ()=>{ calculate(); saveData(); };
document.getElementById('reset').onclick = ()=>{ localStorage.clear(); location.reload(); };
document.getElementById('clear').onclick = ()=>{ localStorage.removeItem('miniAmericanoData'); location.reload(); };
btnDownload.addEventListener('click', downloadCSV);

window.addEventListener('load', ()=>{ buildMatches(); loadData(); calculate(); });
teamsInputs.forEach(i=> i.addEventListener('input', ()=>{ buildMatches(); saveData(); }));