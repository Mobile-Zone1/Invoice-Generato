// عناصر DOM
const itemsBody = document.getElementById('items-body');
const addItemBtn = document.getElementById('add-item');
const resetBtn = document.getElementById('reset-items');
const subTotalEl = document.getElementById('sub-total');
const totalEl = document.getElementById('total');
const discountEl = document.getElementById('discount');
const generatePdfBtn = document.getElementById('generate-pdf');
const previewBtn = document.getElementById('preview-btn');
const saveInvoiceBtn = document.getElementById('save-invoice');
const exportCsvBtn = document.getElementById('export-csv');

const invNumberInput = document.getElementById('invoice-number');
const invDateInput = document.getElementById('invoice-date');

const previewInvNumber = document.getElementById('preview-inv-number');
const previewDate = document.getElementById('preview-date');
const previewCustomer = document.getElementById('preview-customer');
const invoiceItemsPreview = document.getElementById('invoice-items-preview');
const previewSubtotal = document.getElementById('preview-subtotal');
const previewDiscount = document.getElementById('preview-discount');
const previewTotal = document.getElementById('preview-total');

const customerNameInput = document.getElementById('customer-name');
const customerPhoneInput = document.getElementById('customer-phone');
const notesInput = document.getElementById('invoice-notes');

const savedListEl = document.getElementById('saved-list');
const searchSaved = document.getElementById('search-saved');
const clearStorageBtn = document.getElementById('clear-storage');

// توليد رقم وتاريخ الفاتورة
function pad(n){ return n.toString().padStart(2,'0'); }
function initInvoiceMeta(){
  const d = new Date();
  const num = 'MZ'+d.getFullYear().toString().slice(-2)+pad(d.getMonth()+1)+pad(d.getDate())+Math.floor(Math.random()*900+100);
  invNumberInput.value = num;
  invDateInput.value = d.toLocaleDateString('ar-EG');
  previewInvNumber.textContent = 'فاتورة #' + num;
  previewDate.textContent = d.toLocaleDateString('ar-EG');
}
initInvoiceMeta();

// إضافة صف عنصر
function addItem(name='',qty=1,price=0){
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="item-name" value="${name}" placeholder="مثال: سلك شاحن" /></td>
    <td><input type="number" class="item-qty" min="1" value="${qty}" style="width:80px" /></td>
    <td><input type="number" class="item-price" min="0" value="${price}" style="width:120px" /></td>
    <td class="item-total">0.00</td>
    <td><button class="btn-ghost btn-remove" type="button">حذف</button></td>
  `;
  itemsBody.appendChild(tr);
  bindRowEvents(tr);
  recalcTotals();
}
function bindRowEvents(row){
  const qty = row.querySelector('.item-qty');
  const price = row.querySelector('.item-price');
  const remove = row.querySelector('.btn-remove');
  function change(){
    const q = Number(qty.value||0);
    const p = Number(price.value||0);
    const tot = (q*p);
    row.querySelector('.item-total').textContent = tot.toFixed(2);
    recalcTotals();
  }
  qty.addEventListener('input', change);
  price.addEventListener('input', change);
  row.querySelector('.item-name').addEventListener('input', recalcTotals);
  remove.addEventListener('click', ()=>{ row.remove(); recalcTotals(); });
  change();
}

function recalcTotals(){
  const rows = Array.from(itemsBody.querySelectorAll('tr'));
  let subtotal = 0;
  rows.forEach(r=>{
    const q = Number(r.querySelector('.item-qty').value||0);
    const p = Number(r.querySelector('.item-price').value||0);
    subtotal += q*p;
  });
  const discountPct = Number(discountEl.textContent||0);
  const discounted = subtotal * (1 - discountPct/100);

  subTotalEl.textContent = subtotal.toFixed(2) + ' ج.م';
  totalEl.textContent = discounted.toFixed(2) + ' ج.م';

  previewSubtotal.textContent = subtotal.toFixed(2) + ' ج.م';
  previewDiscount.textContent = discountPct + '%';
  previewTotal.textContent = discounted.toFixed(2) + ' ج.م';

  invoiceItemsPreview.innerHTML = '';
  rows.forEach(r=>{
    const nm = r.querySelector('.item-name').value || '-';
    const q = Number(r.querySelector('.item-qty').value||0);
    const p = Number(r.querySelector('.item-price').value||0);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(nm)}</td><td>${q}</td><td>${p.toFixed(2)}</td><td>${(q*p).toFixed(2)}</td>`;
    invoiceItemsPreview.appendChild(tr);
  });

  previewCustomer.textContent = 'العميل: ' + (customerNameInput.value || '-');
}

function escapeHtml(text){
  const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":"&#039;" };
  return String(text).replace(/[&<>\"']/g, (m)=> map[m]);
}

addItemBtn.addEventListener('click', (e)=>{ e.preventDefault(); addItem(); });
resetBtn.addEventListener('click', (e)=>{ e.preventDefault(); itemsBody.innerHTML = ''; addItem('شاحن سريع',1,250); addItem('واقي شاشة',2,80); recalcTotals(); });

discountEl.parentElement.addEventListener('dblclick', ()=>{
  const val = prompt('أدخل نسبة الخصم (%)', discountEl.textContent||0);
  const n = Number(val);
  if(!isNaN(n) && n>=0){ discountEl.textContent = n; recalcTotals(); }
});
previewBtn.addEventListener('click', ()=>{ recalcTotals(); document.getElementById('invoice-preview').scrollIntoView({behavior:'smooth'}); });

generatePdfBtn.addEventListener('click', async ()=>{
  recalcTotals();
  if(itemsBody.querySelectorAll('tr').length === 0){ alert('أضف عنصرًا واحدًا على الأقل'); return; }
  const customer = customerNameInput.value.trim();
  if(!customer){ alert('ادخل اسم العميل'); customerNameInput.focus(); return; }

  const preview = document.getElementById('invoice-preview');
  const opt = { margin:[0.4,0.4,0.4,0.4], filename: invNumberInput.value + '.pdf', image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2,useCORS:true}, jsPDF:{unit:'in',format:'a4',orientation:'portrait'} };

  generatePdfBtn.disabled = true;
  const prevText = generatePdfBtn.textContent;
  generatePdfBtn.textContent = 'جاري الإنشاء...';
  try{
    await html2pdf().set(opt).from(preview).save();
  }catch(err){
    console.error(err);
    alert('حدث خطأ أثناء توليد الPDF');
  }finally{
    generatePdfBtn.disabled = false;
    generatePdfBtn.textContent = prevText || 'إنشاء PDF';
  }
});

// LocalStorage: save/load list of invoices
function getSaved(){ try{ return JSON.parse(localStorage.getItem('mz_invoices') || '[]'); }catch(e){ return []; } }
function saveAll(list){ localStorage.setItem('mz_invoices', JSON.stringify(list)); }

saveInvoiceBtn.addEventListener('click', ()=>{
  recalcTotals();
  if(itemsBody.querySelectorAll('tr').length === 0){ alert('أضف عنصرًا واحدًا على الأقل'); return; }
  const invoice = collectInvoice();
  const all = getSaved();
  all.unshift(invoice);
  saveAll(all);
  renderSavedList();
  alert('تم حفظ الفاتورة محليًا');
});

function collectInvoice(){
  const items = Array.from(itemsBody.querySelectorAll('tr')).map(r => ({ name: r.querySelector('.item-name').value, qty: Number(r.querySelector('.item-qty').value), price: Number(r.querySelector('.item-price').value) }));
  return {
    id: invNumberInput.value,
    date: invDateInput.value,
    customer: customerNameInput.value,
    phone: customerPhoneInput.value,
    notes: notesInput.value,
    items: items,
    subtotal: subTotalEl.textContent,
    total: totalEl.textContent,
    discount: discountEl.textContent
  };
}

function renderSavedList(filter=''){
  const list = getSaved();
  savedListEl.innerHTML = '';
  list.filter(inv => ( (inv.customer || '') + ' ' + (inv.id || '') ).toLowerCase().includes((filter||'').toLowerCase())).forEach(inv => {
    const div = document.createElement('div');
    div.className = 'saved-item';
    div.innerHTML = `
      <div style="flex:1">
        <strong>${escapeHtml(inv.customer || '-')}</strong>
        <div class="small">${escapeHtml(inv.id || '')} • ${escapeHtml(inv.date || '')}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn-ghost btn-load" type="button">عرض</button>
        <button class="btn-danger btn-delete" type="button">حذف</button>
      </div>
    `;
    div.querySelector('.btn-load').addEventListener('click', ()=>{ loadInvoice(inv.id); });
    div.querySelector('.btn-delete').addEventListener('click', ()=>{ if(confirm('حذف الفاتورة؟')){ deleteInvoice(inv.id); } });
    savedListEl.appendChild(div);
  });
}

function loadInvoice(id){
  const list = getSaved();
  const inv = list.find(x => x.id === id);
  if(!inv) return;
  itemsBody.innerHTML = '';
  (inv.items || []).forEach(it => addItem(it.name, it.qty, it.price));
  customerNameInput.value = inv.customer || '';
  customerPhoneInput.value = inv.phone || '';
  notesInput.value = inv.notes || '';
  discountEl.textContent = inv.discount || 0;
  invNumberInput.value = inv.id;
  invDateInput.value = inv.date;
  recalcTotals();
}

function deleteInvoice(id){
  let list = getSaved();
  list = list.filter(x => x.id !== id);
  saveAll(list);
  renderSavedList();
}

clearStorageBtn.addEventListener('click', ()=>{
  if(confirm('مسح جميع الفواتير المحفوظة؟')){
    localStorage.removeItem('mz_invoices');
    renderSavedList();
  }
});

searchSaved.addEventListener('input', ()=>{ renderSavedList(searchSaved.value); });

// CSV export
exportCsvBtn.addEventListener('click', ()=>{
  const list = getSaved();
  if(!list || list.length === 0){ alert('لا توجد فواتير محفوظة للتصدير'); return; }
  const rows = [];
  list.forEach(inv => {
    (inv.items || []).forEach(it => {
      rows.push({ id: inv.id, date: inv.date, customer: inv.customer, phone: inv.phone, product: it.name, qty: it.qty, price: it.price, subtotal: (inv.subtotal || '').replace(/[^0-9.]/g, ''), total: (inv.total || '').replace(/[^0-9.]/g, '') });
    });
  });
  const headers = ['Invoice ID','Date','Customer','Phone','Product','Qty','Unit Price','Subtotal','Total'];
  const csv = [headers.join(',')].concat(rows.map(r => [r.id, r.date, `"${(r.customer||'').replace(/"/g,'""')}"`, r.phone, `"${(r.product||'').replace(/"/g,'""')}"`, r.qty, r.price, r.subtotal, r.total].join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mobilezone_invoices.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// بداية افتراضية
addItem('شاحن سريع',1,250);
addItem('واقي شاشة',2,80);
recalcTotals();
renderSavedList();
