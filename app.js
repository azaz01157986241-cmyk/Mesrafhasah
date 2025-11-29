const $ = id => document.getElementById(id);
const nowISODate = () => new Date().toISOString().slice(0,10);

const state = { expenses: [], filter: 'الكل' };

// Generate unique ID
function uid(){ return 'id'+Math.random().toString(36).slice(2,9); }

// Load & Save
function load(){
  try{
    const raw = localStorage.getItem('masrafha_expenses');
    state.expenses = raw ? JSON.parse(raw) : [];
  }catch(e){ state.expenses = []; }
}
function save(){ localStorage.setItem('masrafha_expenses', JSON.stringify(state.expenses)); }

$('datePicker').value = nowISODate();

// Sounds
const soundCoin = new Audio('coin.mp3');       // إضافة مصروف
const soundTrash = new Audio('trash.mp3');     // مسح مصروف فردي
const soundTrashAll = new Audio('trash-all.mp3'); // مسح الكل
const soundEdit = new Audio('edit.mp3');       // تعديل مصروف
const soundExport = new Audio('export.mp3');   // حفظ Export
const soundHover = new Audio('hover.mp3');     // Hover على عناصر
const soundClick = new Audio('click.mp3');     // Click على أي زر

// Show section
function showSection(sec){
  $('addCard').style.display = (sec==='add')?'block':'none';
  $('listCard').style.display = (sec==='list')?'block':'none';
  $('statsCard').style.display = (sec==='stats')?'block':'none';
}

// Add expense
function addExpense(name, amount, category, date){
  const aNum = Number(amount)||0;
  if(!name || aNum<=0){ alert('عاوز تكتب اسم ومبلغ يا معلم 😂'); return false; }
  const ex = {id:uid(), name, amount:aNum, category, date};
  state.expenses.push(ex); 
  save(); renderList(state.filter); renderStats(); 
  soundCoin.play(); // صوت الإضافة
  return true;
}

// Escape HTML
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }

// Render list
function renderList(filter='الكل'){
  const listEl = $('expensesList'); 
  listEl.innerHTML=''; 
  let filtered = state.expenses.slice().reverse();
  if(filter!=='الكل'){ filtered = filtered.filter(e=>e.category===filter); }
  let total=0;
  filtered.forEach(item=>{
    total += item.amount;
    const el = document.createElement('div'); 
    el.className = 'list-item';
    el.innerHTML = `
      <div>
        <div style="font-weight:800">${escapeHtml(item.name)}</div>
        <div class="muted" style="font-size:13px">${item.date} • <span class="cat-badge">${item.category}</span></div>
      </div>
      <div style="text-align:right">
        <div class="amount">${item.amount} ج.</div>
        <div style="margin-top:8px;display:flex;gap:6px;justify-content:flex-end">
          <button class="btn" style="padding:6px 8px;background:#fff;border:1px solid #ffd66b" data-id="${item.id}" data-act="edit">تعديل</button>
          <button class="btn" style="padding:6px 8px;background:#FF6B6B;color:#fff" data-id="${item.id}" data-act="del">امسح</button>
        </div>
      </div>`;
    listEl.appendChild(el);
  });
  $('totalLabel').textContent = 'إجمالي: '+total+' ج.';
}

// Delete single expense
function deleteExpense(id){
  const idx = state.expenses.findIndex(x=>x.id===id);
  if(idx>=0 && confirm('متأكد؟ امسح المصروف دا… 😏😂')){
    state.expenses.splice(idx,1);
    save(); renderList(state.filter); renderStats();
    soundTrash.play(); // صوت المسح
  }
}

// Edit expense
function editExpense(id){
  const ex = state.expenses.find(x=>x.id===id); if(!ex) return;
  const newName = prompt('عدّل اسم المصروف', ex.name) || ex.name;
  const newAmount = prompt('عدّل المبلغ (جنيه)', ex.amount) || ex.amount;
  const newCategory = prompt('عدّل التصنيف (أكل، مواصلات، كافيهات، تسالي، أخرى)', ex.category) || ex.category;
  ex.name = newName; ex.amount = Number(newAmount)||ex.amount; ex.category = newCategory;
  save(); renderList(state.filter); renderStats();
  soundEdit.play(); // صوت التعديل
}

// Render stats
function renderStats(){
  const total = state.expenses.reduce((s,e)=>s+e.amount,0);
  const perCat = {};
  state.expenses.forEach(e=>{ perCat[e.category]=(perCat[e.category]||0)+e.amount; });
  const verdictEl = $('statVerdict');
  if(total<100) verdictEl.textContent='عاش يا نجم! اقتصادي…';
  else if(total<300) verdictEl.textContent='تمام… مصروفات محترمة 😌';
  else verdictEl.textContent='إيييه يا معلم! إنت فاتح مطعم؟ 😂🔥';

  const canvas = $('chartCanvas'); 
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const cats = Object.keys(perCat); 
  const max = Math.max(1,...Object.values(perCat));
  const pad=20; const w=canvas.width-pad*2; const h=canvas.height-30;
  const barW = (w/Math.max(1,cats.length))-12;
  cats.forEach((c,i)=>{
    const val = perCat[c]; 
    const x = pad + i*(barW+12); 
    const barH = (val/max)*(h-30);
    ctx.fillStyle='#FFD66B'; ctx.fillRect(x,canvas.height-pad-barH,barW,barH);
    ctx.fillStyle='#333'; ctx.font='12px sans-serif';
    ctx.fillText(c,x,canvas.height-pad+14); 
    ctx.fillText(val+' ج.',x,canvas.height-pad-barH-6);
  });

  const perCatEl = $('perCat');
  if(cats.length===0) perCatEl.textContent='مفيش مصاريف لحد دلوقتي — يلا سجّل حاجة 😄';
  else perCatEl.textContent='تفصيل المصروفات: '+cats.map(c=>`${c}: ${perCat[c]} ج.`).join(' • ');
}

// Export
function exportData(){
  const data = JSON.stringify(state.expenses,null,2); 
  const blob = new Blob([data],{type:'application/json'});
  const url = URL.createObjectURL(blob); 
  const a = document.createElement('a'); 
  a.href = url; a.download='masrafha_expenses.json'; 
  a.click(); 
  URL.revokeObjectURL(url);
  soundExport.play(); // صوت الحفظ
}

// Clear all
function clearAll(){ 
  if(confirm('عايز تمسح كل المصاريف فعلاً؟')){
    state.expenses=[]; save(); renderList(); renderStats();
    soundTrashAll.play(); // صوت المسح الكلي
  } 
}

// DOM events
document.addEventListener('DOMContentLoaded',()=>{
  load(); renderList(); renderStats();
  
  $('btnAdd').addEventListener('click',()=>{ showSection('add'); soundClick.play(); });
  $('btnView').addEventListener('click',()=>{ showSection('list'); soundClick.play(); });
  $('saveBtn').addEventListener('click',()=>{
    const n = $('expenseName').value;
    const a = $('amount').value;
    const c = $('category').value;
    const d = $('datePicker').value;
    if(addExpense(n,a,c,d)){
      $('expenseName').value=''; $('amount').value=''; $('category').value='أكل';
      $('datePicker').value = nowISODate();
    }
  });
  $('clearBtn').addEventListener('click',()=>{
    $('expenseName').value=''; $('amount').value=''; $('category').value='أكل';
    $('datePicker').value = nowISODate();
    soundTrash.play();
  });

  $('btnExport').addEventListener('click', exportData);
  $('btnClearAll').addEventListener('click', clearAll);

  // Filter chips
  ['All','Food','Trans','Cafe','Save'].forEach((f,i)=>{
    const chip = $('filterAll');
    ['filterAll','filterFood','filterTrans','filterCafe','filterSave'].forEach(id=>{
      $(id).addEventListener('click',()=>{
        let fil = id==='filterAll'?'الكل':id==='filterFood'?'أكل':id==='filterTrans'?'مواصلات':id==='filterCafe'?'كافيهات':'التوفير 🎯';
        state.filter = fil; renderList(fil); soundClick.play();
      });
    });
  });

  // Edit/Delete buttons
  document.getElementById('expensesList').addEventListener('click',e=>{
    const act = e.target.dataset.act;
    const id = e.target.dataset.id;
    if(act==='del') deleteExpense(id);
    if(act==='edit') editExpense(id);
  });

  // Hover sounds
  document.querySelectorAll('.btn, .list-item, .chip').forEach(el=>{
    el.addEventListener('mouseenter',()=>soundHover.play());
    el.addEventListener('click',()=>soundClick.play());
  });
});
