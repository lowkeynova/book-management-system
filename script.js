const KEYS = { books: 'booknest_books', customers: 'booknest_customers', sales: 'booknest_sales' };

function loadData(key) {
  try { return JSON.parse(localStorage.getItem(KEYS[key])) || []; }
  catch (e) { return []; }
}
function saveData(key, value) { localStorage.setItem(KEYS[key], JSON.stringify(value)); }

let books = [], customers = [], sales = [], cart = [];

/* ---------------------- DEMO DATA ------------------------ */
function daysAgoISO(d, h = 11, m = 20) {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, m, 0, 0);
  return t.toISOString();
}

function demoBooks() {
  const now = new Date().toISOString();
  return [
    ['Atomic Habits', 'James Clear', 'Self Help', '9780735211292', 'Penguin Random House', 599, 24, 6],
    ['The Alchemist', 'Paulo Coelho', 'Fiction', '9780061122415', 'HarperCollins', 350, 4, 5],
    ['Rich Dad Poor Dad', 'Robert Kiyosaki', 'Finance', '9781612680194', 'Plata Publishing', 420, 15, 5],
    ['Ikigai', 'Hector Garcia', 'Self Help', '9781786330895', 'Hutchinson', 399, 0, 4],
    ["Harry Potter and the Philosopher's Stone", 'J.K. Rowling', 'Fantasy', '9780747532699', 'Bloomsbury', 750, 12, 4],
    ['The Psychology of Money', 'Morgan Housel', 'Finance', '9789390166268', 'Jaico', 299, 30, 8],
    ['Wings of Fire', 'A.P.J. Abdul Kalam', 'Biography', '9788173711466', 'Universities Press', 275, 3, 5],
    ['1984', 'George Orwell', 'Fiction', '9780451524935', 'Signet Classics', 320, 18, 6],
  ].map((b, i) => ({
    id: 'BK' + String(i + 1).padStart(3, '0'),
    title: b[0], author: b[1], category: b[2], isbn: b[3], publisher: b[4],
    price: b[5], qty: b[6], minStock: b[7], updated: now,
  }));
}

function demoCustomers() {
  return [
    ['Aarav Sharma', '9876543210', 'aarav.sharma@example.com'],
    ['Diya Patel', '9823456781', 'diya.patel@example.com'],
    ['Rohan Mehta', '9812345678', 'rohan.mehta@example.com'],
    ['Sneha Iyer', '9798765432', 'sneha.iyer@example.com'],
    ['Kabir Nair', '9765432109', 'kabir.nair@example.com'],
  ].map((c, i) => ({
    id: 'CUS' + String(i + 1).padStart(3, '0'),
    name: c[0], phone: c[1], email: c[2],
  }));
}

function demoSales(bookList, customerList) {
  const plan = [
    [0, 'CUS001', [['BK001', 2], ['BK006', 1]], 5, 'UPI'],
    [1, 'CUS003', [['BK005', 1]], 0, 'Card'],
    [2, 'CUS002', [['BK002', 2], ['BK008', 1]], 10, 'Cash'],
    [3, 'CUS004', [['BK004', 3]], 0, 'UPI'],
    [4, 'CUS001', [['BK003', 1], ['BK007', 2]], 0, 'Cash'],
    [6, 'CUS005', [['BK006', 2]], 20, 'Card'],
    [9, 'CUS002', [['BK001', 1], ['BK004', 2]], 0, 'UPI'],
    [13, 'CUS003', [['BK008', 2], ['BK007', 1]], 5, 'Cash'],
  ];
  return plan.map((p, i) => {
    const cust = customerList.find(c => c.id === p[1]);
    const items = p[2].map(([bid, qty]) => {
      const bk = bookList.find(b => b.id === bid);
      return { bookId: bk.id, title: bk.title, category: bk.category, price: bk.price, qty };
    });
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const discountAmt = +(subtotal * p[3] / 100).toFixed(2);
    return {
      id: 'INV' + String(i + 1).padStart(4, '0'),
      date: daysAgoISO(p[0], 10 + (i % 8), (i * 7) % 60),
      customerId: cust.id, customerName: cust.name,
      items, subtotal: +subtotal.toFixed(2), discountPct: p[3], discountAmt,
      total: +(subtotal - discountAmt).toFixed(2), payment: p[4],
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function seedIfEmpty(force) {
  if (force || !localStorage.getItem(KEYS.books)) saveData('books', demoBooks());
  if (force || !localStorage.getItem(KEYS.customers)) saveData('customers', demoCustomers());
  if (force || !localStorage.getItem(KEYS.sales)) {
    saveData('sales', demoSales(loadData('books'), loadData('customers')));
  }
}

/* ----------------------- HELPERS ------------------------- */
const $ = id => document.getElementById(id);
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = iso => new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function generateId(prefix, list) {
  let max = 0;
  list.forEach(o => {
    const n = parseInt(String(o.id).replace(prefix, ''), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return prefix + String(max + 1).padStart(prefix === 'INV' ? 4 : 3, '0');
}

function stockStatus(b) {
  if (b.qty === 0) return 'Out of Stock';
  if (b.qty <= b.minStock) return 'Low Stock';
  return 'In Stock';
}
function statusBadge(s) {
  const cls = s === 'In Stock' ? 'green' : s === 'Low Stock' ? 'amber' : 'red';
  return `<span class="badge ${cls}">${s}</span>`;
}
function getBook(id) { return books.find(b => b.id === id); }
function getCustomer(id) { return customers.find(c => c.id === id); }

function customerStats(id) {
  const mine = sales.filter(s => s.customerId === id);
  return { purchases: mine.length, spent: mine.reduce((t, s) => t + s.total, 0), history: mine };
}

function calculateTotals() {
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  let pct = parseFloat($('discount').value);
  if (isNaN(pct)) pct = 0;
  pct = Math.min(100, Math.max(0, pct));
  const discountAmt = +(subtotal * pct / 100).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), pct, discountAmt, total: +(subtotal - discountAmt).toFixed(2) };
}

function toast(msg, type) {
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = msg;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ------------------------ MODAL -------------------------- */
function openModal(title, html) {
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = html;
  $('modal').classList.add('show');
}
function closeModal() { $('modal').classList.remove('show'); $('modalBody').innerHTML = ''; }
$('modalClose').onclick = closeModal;
$('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function confirmDialog(message, onYes) {
  openModal('Please confirm', `
    <p>${message}</p>
    <div class="modal-foot">
      <button class="btn" id="cfNo">Cancel</button>
      <button class="btn danger" id="cfYes">Yes, continue</button>
    </div>`);
  $('cfNo').onclick = closeModal;
  $('cfYes').onclick = () => { closeModal(); onYes(); };
}

/* --------------------- NAVIGATION ------------------------ */
const TITLES = {
  dashboard: ['Dashboard', 'Overview of your bookstore'],
  books: ['Books', 'Manage your book catalogue'],
  inventory: ['Inventory', 'Track and adjust stock levels'],
  customers: ['Customers', 'Customer records and purchase history'],
  newsale: ['New Sale', 'Create a bill and generate an invoice'],
  sales: ['Sales History', 'All completed transactions'],
  reports: ['Reports', 'Sales performance at a glance'],
  advisor: ['Smart Stock Advisor', 'Rule-based restocking recommendations'],
};

function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sec = $('section-' + name);
  if (sec) sec.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.section === name));
  $('pageTitle').textContent = TITLES[name][0];
  $('pageSub').textContent = TITLES[name][1];
  $('sidebar').classList.remove('open');
  $('overlay').classList.remove('show');
  window.scrollTo(0, 0);
}

$('nav').addEventListener('click', e => {
  const btn = e.target.closest('.nav-item');
  if (btn) showSection(btn.dataset.section);
});
$('menuBtn').onclick = () => { $('sidebar').classList.add('open'); $('overlay').classList.add('show'); };
$('overlay').onclick = () => { $('sidebar').classList.remove('open'); $('overlay').classList.remove('show'); };

/* ------------------- RENDER: DASHBOARD ------------------- */
function updateDashboard() {
  const totalStock = books.reduce((t, b) => t + b.qty, 0);
  const revenue = sales.reduce((t, s) => t + s.total, 0);
  const low = books.filter(b => stockStatus(b) !== 'In Stock');

  $('statCards').innerHTML = [
    ['Total Books', books.length, ''],
    ['Total Stock', totalStock, ''],
    ['Total Customers', customers.length, ''],
    ['Total Sales', sales.length, ''],
    ['Total Revenue', money(revenue), 'accent'],
    ['Low Stock Items', low.length, low.length ? 'warn' : ''],
  ].map(s => `<div class="stat ${s[2]}"><span>${s[0]}</span><b>${s[1]}</b></div>`).join('');

  const pill = $('alertPill');
  pill.textContent = low.length ? `⚠ ${low.length} item${low.length > 1 ? 's' : ''} need restocking` : '✓ Stock healthy';
  pill.className = 'pill' + (low.length ? '' : ' ok');

  // Low stock alert list
  $('lowStockMsg').textContent = low.length
    ? `${low.length} book${low.length > 1 ? 's require' : ' requires'} restocking. Click one to open it.`
    : 'All books are well stocked.';
  $('lowStockList').innerHTML = low.map(b => `
    <li data-lowbook="${b.id}">
      <span>${esc(b.title)} <span class="muted small">· ${b.qty} left (min ${b.minStock})</span></span>
      ${statusBadge(stockStatus(b))}
    </li>`).join('');

  // 7-day bar chart of revenue
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    const total = sales.filter(s => { const t = new Date(s.date); return t >= d && t < next; })
      .reduce((t, s) => t + s.total, 0);
    days.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), total });
  }
  const max = Math.max(...days.map(d => d.total), 1);
  $('chart').innerHTML = days.map(d => `
    <div class="col" title="${money(d.total)}">
      <span class="val">${d.total ? Math.round(d.total) : ''}</span>
      <div class="bar" style="height:${Math.max(3, (d.total / max) * 100)}%"></div>
      <span class="lbl">${d.label}</span>
    </div>`).join('');

  // Recent sales
  const recent = sales.slice(0, 5);
  $('recentSales').innerHTML = recent.length ? recent.map(s => `
    <tr>
      <td><b>${s.id}</b></td><td>${fmtDate(s.date)}</td><td>${esc(s.customerName)}</td>
      <td>${s.items.reduce((t, i) => t + i.qty, 0)}</td><td>${money(s.total)}</td><td>${s.payment}</td>
    </tr>`).join('') : `<tr><td colspan="6" class="empty">No sales available.</td></tr>`;
}

$('lowStockList').addEventListener('click', e => {
  const li = e.target.closest('[data-lowbook]');
  if (li) { showSection('books'); viewBook(li.dataset.lowbook); }
});
document.querySelectorAll('[data-quick]').forEach(b => {
  b.onclick = () => {
    if (b.dataset.quick === 'book') { showSection('books'); bookForm(); }
    else if (b.dataset.quick === 'customer') { showSection('customers'); customerForm(); }
    else showSection('newsale');
  };
});

/* --------------------- RENDER: BOOKS --------------------- */
function renderBooks() {
  // category filter options
  const cats = [...new Set(books.map(b => b.category))].sort();
  const sel = $('bookCategory'), keep = sel.value;
  sel.innerHTML = '<option value="">All categories</option>' + cats.map(c => `<option>${esc(c)}</option>`).join('');
  sel.value = cats.includes(keep) ? keep : '';

  const q = $('bookSearch').value.trim().toLowerCase();
  const cat = sel.value, st = $('bookStatus').value, sort = $('bookSort').value;

  let list = books.filter(b => {
    const match = !q || [b.title, b.author, b.isbn, b.id, b.publisher].some(v => String(v).toLowerCase().includes(q));
    return match && (!cat || b.category === cat) && (!st || stockStatus(b) === st);
  });
  list.sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title);
    if (sort === 'price') return b.price - a.price;
    if (sort === 'stock') return a.qty - b.qty;
    return a.id.localeCompare(b.id);
  });

  $('booksBody').innerHTML = list.length ? list.map(b => `
    <tr>
      <td><b>${b.id}</b></td><td>${esc(b.title)}</td><td>${esc(b.author)}</td><td>${esc(b.category)}</td>
      <td>${esc(b.isbn)}</td><td>${money(b.price)}</td><td>${b.qty}</td><td>${statusBadge(stockStatus(b))}</td>
      <td class="actions">
        <button class="btn sm" data-view-book="${b.id}">View</button>
        <button class="btn sm" data-edit-book="${b.id}">Edit</button>
        <button class="btn sm" data-del-book="${b.id}">Delete</button>
      </td>
    </tr>`).join('') : `<tr><td colspan="9" class="empty">No books found.</td></tr>`;
}

['bookSearch', 'bookCategory', 'bookStatus', 'bookSort'].forEach(id => {
  $(id).addEventListener('input', renderBooks);
  $(id).addEventListener('change', renderBooks);
});

$('booksBody').addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.viewBook) viewBook(t.dataset.viewBook);
  if (t.dataset.editBook) bookForm(getBook(t.dataset.editBook));
  if (t.dataset.delBook) deleteBook(t.dataset.delBook);
});
$('btnAddBook').onclick = () => bookForm();

function bookForm(book) {
  const b = book || {};
  openModal(book ? 'Edit Book' : 'Add Book', `
    <form id="bookForm" novalidate>
      <div class="form-grid">
        <label class="field"><span>Title *</span><input id="f_title" value="${esc(b.title || '')}" /><small class="err" id="e_title"></small></label>
        <label class="field"><span>Author *</span><input id="f_author" value="${esc(b.author || '')}" /><small class="err" id="e_author"></small></label>
        <label class="field"><span>Category *</span><input id="f_category" value="${esc(b.category || '')}" list="catList" /><small class="err" id="e_category"></small></label>
        <label class="field"><span>ISBN *</span><input id="f_isbn" value="${esc(b.isbn || '')}" /><small class="err" id="e_isbn"></small></label>
        <label class="field"><span>Publisher</span><input id="f_publisher" value="${esc(b.publisher || '')}" /><small class="err"></small></label>
        <label class="field"><span>Price (₹) *</span><input type="number" step="0.01" id="f_price" value="${b.price != null ? b.price : ''}" /><small class="err" id="e_price"></small></label>
        <label class="field"><span>Quantity *</span><input type="number" id="f_qty" value="${b.qty != null ? b.qty : 0}" /><small class="err" id="e_qty"></small></label>
        <label class="field"><span>Minimum Stock Level *</span><input type="number" id="f_min" value="${b.minStock != null ? b.minStock : 5}" /><small class="err" id="e_min"></small></label>
      </div>
      <datalist id="catList">${[...new Set(books.map(x => x.category))].map(c => `<option>${esc(c)}</option>`).join('')}</datalist>
      <div class="modal-foot">
        <button type="button" class="btn" id="bfCancel">Cancel</button>
        <button type="submit" class="btn primary">${book ? 'Save Changes' : 'Add Book'}</button>
      </div>
    </form>`);
  $('bfCancel').onclick = closeModal;
  $('bookForm').onsubmit = ev => {
    ev.preventDefault();
    const data = {
      title: $('f_title').value.trim(), author: $('f_author').value.trim(),
      category: $('f_category').value.trim(), isbn: $('f_isbn').value.trim(),
      publisher: $('f_publisher').value.trim(),
      price: parseFloat($('f_price').value), qty: parseInt($('f_qty').value, 10),
      minStock: parseInt($('f_min').value, 10),
    };
    const errs = {};
    if (!data.title) errs.title = 'Title is required.';
    if (!data.author) errs.author = 'Author is required.';
    if (!data.category) errs.category = 'Category is required.';
    if (!data.isbn) errs.isbn = 'ISBN is required.';
    else if (books.some(x => x.isbn === data.isbn && x.id !== b.id)) errs.isbn = 'This ISBN already exists.';
    if (isNaN(data.price) || data.price <= 0) errs.price = 'Price must be greater than 0.';
    if (isNaN(data.qty) || data.qty < 0) errs.qty = 'Quantity must be 0 or more.';
    if (isNaN(data.minStock) || data.minStock < 0) errs.min = 'Minimum stock must be 0 or more.';

    ['title', 'author', 'category', 'isbn', 'price', 'qty', 'min'].forEach(k => { $('e_' + k).textContent = errs[k] || ''; });
    if (Object.keys(errs).length) return;

    if (book) {
      Object.assign(book, data, { updated: new Date().toISOString() });
      toast('Book updated successfully');
    } else {
      books.push(Object.assign({ id: generateId('BK', books) }, data, { updated: new Date().toISOString() }));
      toast('Book added successfully');
    }
    saveData('books', books);
    closeModal();
    renderAll();
  };
}

function viewBook(id) {
  const b = getBook(id);
  if (!b) return;
  const sold = sales.reduce((t, s) => t + s.items.filter(i => i.bookId === id).reduce((n, i) => n + i.qty, 0), 0);
  openModal('Book Details', `
    <div class="detail-grid">
      <div><span>Book ID</span><b>${b.id}</b></div>
      <div><span>Status</span><b>${statusBadge(stockStatus(b))}</b></div>
      <div><span>Title</span><b>${esc(b.title)}</b></div>
      <div><span>Author</span><b>${esc(b.author)}</b></div>
      <div><span>Category</span><b>${esc(b.category)}</b></div>
      <div><span>ISBN</span><b>${esc(b.isbn)}</b></div>
      <div><span>Publisher</span><b>${esc(b.publisher || '—')}</b></div>
      <div><span>Price</span><b>${money(b.price)}</b></div>
      <div><span>Current Stock</span><b>${b.qty}</b></div>
      <div><span>Minimum Stock</span><b>${b.minStock}</b></div>
      <div><span>Total Units Sold</span><b>${sold}</b></div>
      <div><span>Last Updated</span><b>${fmtDateTime(b.updated)}</b></div>
    </div>
    <div class="modal-foot">
      <button class="btn" id="vbClose">Close</button>
      <button class="btn primary" id="vbEdit">Edit Book</button>
    </div>`);
  $('vbClose').onclick = closeModal;
  $('vbEdit').onclick = () => bookForm(b);
}

function deleteBook(id) {
  const b = getBook(id);
  if (!b) return;
  const used = sales.some(s => s.items.some(i => i.bookId === id));
  if (used) {
    openModal('Cannot delete book', `
      <p>This book is associated with sales history and cannot be deleted.
      You may edit its information or set its stock to 0.</p>
      <div class="modal-foot"><button class="btn" id="okBtn">Understood</button></div>`);
    $('okBtn').onclick = closeModal;
    return;
  }
  confirmDialog(`Delete <b>${esc(b.title)}</b> permanently? This cannot be undone.`, () => {
    books = books.filter(x => x.id !== id);
    saveData('books', books);
    toast('Book deleted successfully');
    renderAll();
  });
}

/* ------------------- RENDER: INVENTORY ------------------- */
function renderInventory() {
  const totalUnits = books.reduce((t, b) => t + b.qty, 0);
  const low = books.filter(b => stockStatus(b) === 'Low Stock').length;
  const out = books.filter(b => stockStatus(b) === 'Out of Stock').length;
  $('invStats').innerHTML = `
    <div class="stat"><span>Total Units</span><b>${totalUnits}</b></div>
    <div class="stat warn"><span>Low Stock Items</span><b>${low}</b></div>
    <div class="stat bad"><span>Out of Stock Items</span><b>${out}</b></div>`;

  const q = $('invSearch').value.trim().toLowerCase();
  const list = books.filter(b => !q || (b.title + b.author + b.id).toLowerCase().includes(q));

  $('invBody').innerHTML = list.length ? list.map(b => {
    const st = stockStatus(b);
    const pct = b.minStock > 0 ? Math.min(100, (b.qty / (b.minStock * 2)) * 100) : (b.qty ? 100 : 0);
    const color = st === 'In Stock' ? 'var(--primary)' : st === 'Low Stock' ? 'var(--amber)' : 'var(--red)';
    return `<tr>
      <td><b>${esc(b.title)}</b><div class="muted small">${b.id} · ${esc(b.author)}</div></td>
      <td>
        <div class="score"><div class="track"><div class="fill" style="width:${pct}%;background:${color}"></div></div><b>${b.qty}</b></div>
      </td>
      <td>${b.minStock}</td>
      <td>${statusBadge(st)}</td>
      <td class="muted small">${fmtDateTime(b.updated)}</td>
      <td class="actions">
        <button class="btn sm" data-add-stock="${b.id}">Add Stock</button>
        <button class="btn sm" data-rem-stock="${b.id}">Remove Stock</button>
        <button class="btn sm" data-view-book2="${b.id}">View Book</button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" class="empty">No books found.</td></tr>`;
}
$('invSearch').addEventListener('input', renderInventory);
$('invBody').addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.addStock) stockForm(t.dataset.addStock, 'add');
  if (t.dataset.remStock) stockForm(t.dataset.remStock, 'remove');
  if (t.dataset.viewBook2) viewBook(t.dataset.viewBook2);
});

function stockForm(id, mode) {
  const b = getBook(id);
  openModal((mode === 'add' ? 'Add' : 'Remove') + ' Stock', `
    <p class="muted">${esc(b.title)} — current stock <b>${b.qty}</b></p>
    <form id="stockForm">
      <label class="field"><span>Quantity to ${mode}</span>
        <input type="number" id="s_qty" value="1" min="1" /><small class="err" id="e_sqty"></small></label>
      <div class="modal-foot">
        <button type="button" class="btn" id="stCancel">Cancel</button>
        <button type="submit" class="btn primary">Confirm</button>
      </div>
    </form>`);
  $('stCancel').onclick = closeModal;
  $('stockForm').onsubmit = ev => {
    ev.preventDefault();
    const n = parseInt($('s_qty').value, 10);
    if (isNaN(n) || n <= 0) { $('e_sqty').textContent = 'Enter a quantity greater than 0.'; return; }
    if (mode === 'remove' && n > b.qty) { $('e_sqty').textContent = 'Stock cannot become negative.'; return; }
    b.qty = mode === 'add' ? b.qty + n : b.qty - n;
    b.updated = new Date().toISOString();
    saveData('books', books);
    closeModal();
    toast('Stock updated successfully');
    if (stockStatus(b) !== 'In Stock') toast(`Low stock warning: ${b.title} (${b.qty} left)`, 'warn');
    renderAll();
  };
}

/* ------------------- RENDER: CUSTOMERS ------------------- */
function renderCustomers() {
  const q = $('custSearch').value.trim().toLowerCase();
  const list = customers.filter(c => !q || (c.name + c.phone + c.email + c.id).toLowerCase().includes(q));
  $('custBody').innerHTML = list.length ? list.map(c => {
    const st = customerStats(c.id);
    return `<tr>
      <td><b>${c.id}</b></td><td>${esc(c.name)}</td><td>${esc(c.phone)}</td><td>${esc(c.email)}</td>
      <td>${st.purchases}</td><td>${money(st.spent)}</td>
      <td class="actions">
        <button class="btn sm" data-view-cust="${c.id}">View</button>
        <button class="btn sm" data-edit-cust="${c.id}">Edit</button>
        <button class="btn sm" data-del-cust="${c.id}">Delete</button>
      </td></tr>`;
  }).join('') : `<tr><td colspan="7" class="empty">No customers found.</td></tr>`;
}
$('custSearch').addEventListener('input', renderCustomers);
$('btnAddCustomer').onclick = () => customerForm();
$('custBody').addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.viewCust) viewCustomer(t.dataset.viewCust);
  if (t.dataset.editCust) customerForm(getCustomer(t.dataset.editCust));
  if (t.dataset.delCust) deleteCustomer(t.dataset.delCust);
});

function customerForm(cust) {
  const c = cust || {};
  openModal(cust ? 'Edit Customer' : 'Add Customer', `
    <form id="custForm" novalidate>
      <div class="form-grid">
        <label class="field"><span>Full Name *</span><input id="c_name" value="${esc(c.name || '')}" /><small class="err" id="e_name"></small></label>
        <label class="field"><span>Phone *</span><input id="c_phone" value="${esc(c.phone || '')}" /><small class="err" id="e_phone"></small></label>
        <label class="field"><span>Email *</span><input id="c_email" value="${esc(c.email || '')}" /><small class="err" id="e_email"></small></label>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn" id="cfCancel">Cancel</button>
        <button type="submit" class="btn primary">${cust ? 'Save Changes' : 'Add Customer'}</button>
      </div>
    </form>`);
  $('cfCancel').onclick = closeModal;
  $('custForm').onsubmit = ev => {
    ev.preventDefault();
    const name = $('c_name').value.trim(), phone = $('c_phone').value.trim(), email = $('c_email').value.trim();
    const errs = {};
    if (!name) errs.name = 'Name is required.';
    if (!phone) errs.phone = 'Phone is required.';
    else if (!/^[0-9+\-\s]{7,15}$/.test(phone)) errs.phone = 'Enter a valid phone number.';
    if (!email) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errs.email = 'Enter a valid email address.';
    ['name', 'phone', 'email'].forEach(k => $('e_' + k).textContent = errs[k] || '');
    if (Object.keys(errs).length) return;

    if (cust) { Object.assign(cust, { name, phone, email }); toast('Customer updated successfully'); }
    else { customers.push({ id: generateId('CUS', customers), name, phone, email }); toast('Customer added successfully'); }
    saveData('customers', customers);
    closeModal();
    renderAll();
  };
}

function viewCustomer(id) {
  const c = getCustomer(id);
  const st = customerStats(id);
  openModal('Customer Details', `
    <div class="detail-grid">
      <div><span>Customer ID</span><b>${c.id}</b></div>
      <div><span>Name</span><b>${esc(c.name)}</b></div>
      <div><span>Phone</span><b>${esc(c.phone)}</b></div>
      <div><span>Email</span><b>${esc(c.email)}</b></div>
      <div><span>Purchases</span><b>${st.purchases}</b></div>
      <div><span>Total Spent</span><b>${money(st.spent)}</b></div>
    </div>
    <h4 style="margin-bottom:8px">Purchase History</h4>
    <div class="table-wrap">
      <table><thead><tr><th>Invoice</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th></tr></thead>
      <tbody>${st.history.length ? st.history.map(s => `<tr><td>${s.id}</td><td>${fmtDate(s.date)}</td>
        <td>${s.items.reduce((t, i) => t + i.qty, 0)}</td><td>${money(s.total)}</td><td>${s.payment}</td></tr>`).join('')
      : '<tr><td colspan="5" class="empty">No purchases yet.</td></tr>'}</tbody></table>
    </div>
    <div class="modal-foot"><button class="btn" id="vcClose">Close</button></div>`);
  $('vcClose').onclick = closeModal;
}

function deleteCustomer(id) {
  const c = getCustomer(id);
  confirmDialog(`Delete customer <b>${esc(c.name)}</b>? Past sales will be kept as walk-in records.`, () => {
    customers = customers.filter(x => x.id !== id);
    saveData('customers', customers);
    sales.forEach(s => { if (s.customerId === id) { s.customerId = null; s.customerName = s.customerName + ' (removed)'; } });
    saveData('sales', sales);
    toast('Customer deleted successfully');
    renderAll();
  });
}

/* --------------------- NEW SALE -------------------------- */
function renderSaleCustomers() {
  const sel = $('saleCustomer'), keep = sel.value;
  sel.innerHTML = '<option value="">Walk-in Customer</option>' +
    customers.map(c => `<option value="${c.id}">${esc(c.name)} (${c.id})</option>`).join('');
  if (customers.some(c => c.id === keep)) sel.value = keep;
}

function renderSalePicker() {
  const q = $('saleBookSearch').value.trim().toLowerCase();
  const list = books.filter(b => !q || (b.title + b.author + b.isbn).toLowerCase().includes(q));
  $('saleBookList').innerHTML = list.length ? list.map(b => `
    <div class="pick">
      <div class="info">
        <b>${esc(b.title)}</b>
        <span class="muted small">${esc(b.author)} · ${money(b.price)} · ${b.qty} in stock</span>
      </div>
      <div class="row gap">
        <input type="number" min="1" max="${b.qty}" value="1" data-qty="${b.id}" ${b.qty === 0 ? 'disabled' : ''} />
        <button class="btn sm primary" data-cart="${b.id}" ${b.qty === 0 ? 'disabled' : ''}>${b.qty === 0 ? 'Out of stock' : 'Add to Cart'}</button>
      </div>
    </div>`).join('') : `<p class="empty">No books found.</p>`;
}
$('saleBookSearch').addEventListener('input', renderSalePicker);
$('saleBookList').addEventListener('click', e => {
  const btn = e.target.closest('[data-cart]');
  if (!btn) return;
  const id = btn.dataset.cart, b = getBook(id);
  const qty = parseInt(document.querySelector(`[data-qty="${id}"]`).value, 10);
  if (isNaN(qty) || qty < 1) { toast('Enter a valid quantity', 'error'); return; }
  const existing = cart.find(i => i.bookId === id);
  const already = existing ? existing.qty : 0;
  if (qty + already > b.qty) { toast(`Only ${b.qty - already} more in stock for ${b.title}`, 'error'); return; }
  if (existing) existing.qty += qty;
  else cart.push({ bookId: id, title: b.title, category: b.category, price: b.price, qty });
  renderCart();
  toast('Added to cart');
});

function renderCart() {
  $('cartBody').innerHTML = cart.length ? cart.map(i => `
    <tr>
      <td>${esc(i.title)}</td><td>${money(i.price)}</td><td>${i.qty}</td>
      <td>${money(i.price * i.qty)}</td>
      <td><button class="btn sm" data-rm="${i.bookId}">✕</button></td>
    </tr>`).join('') : `<tr><td colspan="5" class="empty">Cart is empty.</td></tr>`;
  const t = calculateTotals();
  $('tSub').textContent = money(t.subtotal);
  $('tDisc').textContent = '−' + money(t.discountAmt);
  $('tTotal').textContent = money(t.total);
}
$('cartBody').addEventListener('click', e => {
  const btn = e.target.closest('[data-rm]');
  if (btn) { cart = cart.filter(i => i.bookId !== btn.dataset.rm); renderCart(); }
});
$('discount').addEventListener('input', () => {
  const v = parseFloat($('discount').value);
  $('err-discount').textContent = (isNaN(v) && $('discount').value !== '') || v < 0 || v > 100
    ? 'Discount must be between 0 and 100.' : '';
  renderCart();
});

$('btnCompleteSale').onclick = () => {
  if (!cart.length) { toast('Add at least one book to the cart', 'error'); return; }
  const d = parseFloat($('discount').value || '0');
  if (isNaN(d) || d < 0 || d > 100) { $('err-discount').textContent = 'Discount must be between 0 and 100.'; return; }
  for (const item of cart) {
    const b = getBook(item.bookId);
    if (!b || item.qty > b.qty) { toast(`Not enough stock for ${item.title}`, 'error'); return; }
  }
  const t = calculateTotals();
  const cid = $('saleCustomer').value;
  const cust = cid ? getCustomer(cid) : null;
  const sale = {
    id: generateId('INV', sales),
    date: new Date().toISOString(),
    customerId: cust ? cust.id : null,
    customerName: cust ? cust.name : 'Walk-in Customer',
    items: cart.map(i => ({ ...i })),
    subtotal: t.subtotal, discountPct: t.pct, discountAmt: t.discountAmt,
    total: t.total, payment: $('payment').value,
  };
  // reduce stock
  sale.items.forEach(i => {
    const b = getBook(i.bookId);
    b.qty -= i.qty;
    b.updated = new Date().toISOString();
    if (stockStatus(b) !== 'In Stock') toast(`Low stock warning: ${b.title} (${b.qty} left)`, 'warn');
  });
  sales.unshift(sale);
  saveData('sales', sales);
  saveData('books', books);

  cart = [];
  $('discount').value = 0;
  $('saleCustomer').value = '';
  toast('Sale completed successfully');
  renderAll();
  showInvoice(sale.id, true);
};

/* --------------------- INVOICE --------------------------- */
function invoiceHTML(s) {
  return `<div class="invoice" id="printArea">
    <div class="inv-head">
      <h2>BOOKNEST</h2>
      <p class="muted small">Bookstore Management System</p>
    </div>
    <div class="meta">
      <div><b>Invoice ID:</b> ${s.id}</div>
      <div><b>Date &amp; Time:</b> ${fmtDateTime(s.date)}</div>
      <div><b>Customer:</b> ${esc(s.customerName)}</div>
      <div><b>Payment Method:</b> ${s.payment}</div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Book</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
        <tbody>${s.items.map(i => `<tr><td>${esc(i.title)}</td><td>${i.qty}</td><td>${money(i.price)}</td><td>${money(i.price * i.qty)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <div style="margin-top:14px">
      <div class="kv"><span>Subtotal</span><span>${money(s.subtotal)}</span></div>
      <div class="kv"><span>Discount (${s.discountPct}%)</span><span>−${money(s.discountAmt)}</span></div>
      <div class="kv total"><span>Grand Total</span><span>${money(s.total)}</span></div>
    </div>
    <p class="thanks">Thank you for shopping at BookNest!</p>
  </div>`;
}

function showInvoice(id, isNew) {
  const s = sales.find(x => x.id === id);
  if (!s) return;
  openModal(isNew ? 'Sale Completed' : 'Invoice ' + s.id, invoiceHTML(s) + `
    <div class="modal-foot">
      <button class="btn" id="invPrint">Print Invoice</button>
      <button class="btn primary" id="invNew">${isNew ? 'New Sale' : 'Close'}</button>
    </div>`);
  $('invPrint').onclick = () => window.print();
  $('invNew').onclick = () => { closeModal(); if (isNew) showSection('newsale'); };
}

/* ------------------ RENDER: SALES HISTORY ---------------- */
function renderSales() {
  const q = $('salesSearch').value.trim().toLowerCase();
  const day = $('salesDate').value, pay = $('salesPayment').value;
  const list = sales
    .filter(s => {
      const okQ = !q || (s.id + s.customerName).toLowerCase().includes(q);
      const okD = !day || new Date(s.date).toLocaleDateString('en-CA') === day;
      return okQ && okD && (!pay || s.payment === pay);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  $('salesBody').innerHTML = list.length ? list.map(s => `
    <tr>
      <td><b>${s.id}</b></td><td>${fmtDateTime(s.date)}</td><td>${esc(s.customerName)}</td>
      <td>${s.items.reduce((t, i) => t + i.qty, 0)}</td>
      <td>${money(s.subtotal)}</td><td>${s.discountPct}%</td><td><b>${money(s.total)}</b></td><td>${s.payment}</td>
      <td class="actions">
        <button class="btn sm" data-view-inv="${s.id}">View</button>
        <button class="btn sm" data-print-inv="${s.id}">Print</button>
      </td>
    </tr>`).join('') : `<tr><td colspan="9" class="empty">No sales available.</td></tr>`;
}
['salesSearch', 'salesDate', 'salesPayment'].forEach(id => {
  $(id).addEventListener('input', renderSales);
  $(id).addEventListener('change', renderSales);
});
$('salesBody').addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.viewInv) showInvoice(t.dataset.viewInv);
  if (t.dataset.printInv) { showInvoice(t.dataset.printInv); setTimeout(() => window.print(), 150); }
});

/* -------------------- RENDER: REPORTS -------------------- */
function renderReports() {
  const revenue = sales.reduce((t, s) => t + s.total, 0);
  const unitsSold = sales.reduce((t, s) => t + s.items.reduce((n, i) => n + i.qty, 0), 0);
  const avg = sales.length ? revenue / sales.length : 0;
  $('reportStats').innerHTML = `
    <div class="stat accent"><span>Total Revenue</span><b>${money(revenue)}</b></div>
    <div class="stat"><span>Total Sales</span><b>${sales.length}</b></div>
    <div class="stat"><span>Average Sale Value</span><b>${money(avg)}</b></div>
    <div class="stat"><span>Total Books Sold</span><b>${unitsSold}</b></div>`;

  // Category performance
  const byCat = {};
  sales.forEach(s => s.items.forEach(i => {
    const cat = (getBook(i.bookId) || {}).category || i.category || 'Other';
    byCat[cat] = (byCat[cat] || 0) + i.qty;
  }));
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...cats.map(c => c[1]), 1);
  $('catPerf').innerHTML = cats.length ? cats.map(([c, n]) => `
    <div class="brow"><span>${esc(c)}</span>
      <div class="track"><div class="fill" style="width:${(n / maxCat) * 100}%"></div></div>
      <span class="num">${n}</span></div>`).join('')
    : '<p class="empty">No sales available.</p>';

  // Best sellers
  const byBook = {};
  sales.forEach(s => s.items.forEach(i => {
    const e = byBook[i.bookId] || (byBook[i.bookId] = { title: i.title, qty: 0, rev: 0 });
    e.qty += i.qty; e.rev += i.qty * i.price;
  }));
  const top = Object.values(byBook).sort((a, b) => b.qty - a.qty).slice(0, 8);
  $('bestBody').innerHTML = top.length ? top.map((b, i) => `
    <tr><td><b>#${i + 1}</b></td><td>${esc(b.title)}</td><td>${b.qty}</td><td>${money(b.rev)}</td></tr>`).join('')
    : `<tr><td colspan="4" class="empty">No sales available.</td></tr>`;
}

/* ---------------- RENDER: STOCK ADVISOR ------------------ */
function advisorRow(b) {
  let totalSold = 0, recent = 0;
  const cutoff = Date.now() - 30 * 864e5;
  sales.forEach(s => s.items.forEach(i => {
    if (i.bookId !== b.id) return;
    totalSold += i.qty;
    if (new Date(s.date).getTime() >= cutoff) recent += i.qty;
  }));
  const rate = +(recent / 30).toFixed(2);                 // units per day
  const daysCover = rate > 0 ? b.qty / rate : Infinity;   // days before empty
  const status = stockStatus(b);

  let rec;
  if (totalSold === 0 && recent === 0) rec = 'No Sales Data';
  else if (b.qty === 0) rec = 'Urgent Restock';
  else if (b.qty <= b.minStock) rec = recent > 0 ? 'Urgent Restock' : 'Restock Soon';
  else if (daysCover <= 14) rec = 'Consider Restocking';
  else rec = 'Stock Healthy';
  if (rec === 'No Sales Data' && b.qty === 0) rec = 'Urgent Restock';

  // Health score 0–100: stock cover vs minimum + sales pressure
  const ratio = b.minStock > 0 ? b.qty / b.minStock : (b.qty > 0 ? 2 : 0);
  let score = Math.min(100, Math.round((ratio / 2) * 100));
  if (rate > 0) score = Math.round(score * Math.min(1, Math.max(0.25, daysCover / 30)));
  score = Math.max(0, Math.min(100, score));

  return { book: b, totalSold, recent, rate, rec, score, status };
}

function renderStockAdvisor() {
  const rows = books.map(advisorRow);
  const count = k => rows.filter(r => r.rec === k).length;
  $('advStats').innerHTML = `
    <div class="stat accent"><span>Stock Healthy</span><b>${count('Stock Healthy')}</b></div>
    <div class="stat warn"><span>Restock Soon</span><b>${count('Restock Soon') + count('Consider Restocking')}</b></div>
    <div class="stat bad"><span>Urgent Restock</span><b>${count('Urgent Restock')}</b></div>
    <div class="stat"><span>No Sales Data</span><b>${count('No Sales Data')}</b></div>`;

  const order = { 'Urgent Restock': 0, 'Restock Soon': 1, 'Consider Restocking': 2, 'Stock Healthy': 3, 'No Sales Data': 4 };
  rows.sort((a, b) => order[a.rec] - order[b.rec] || a.score - b.score);

  const badgeFor = r => {
    const cls = r.rec === 'Urgent Restock' ? 'red'
      : (r.rec === 'Restock Soon' || r.rec === 'Consider Restocking') ? 'amber'
        : r.rec === 'Stock Healthy' ? 'green' : 'grey';
    return `<span class="badge ${cls}">${r.rec}</span>`;
  };

  $('advBody').innerHTML = rows.length ? rows.map(r => {
    const color = r.score >= 60 ? 'var(--primary)' : r.score >= 30 ? 'var(--amber)' : 'var(--red)';
    return `<tr>
      <td><b>${esc(r.book.title)}</b><div class="muted small">${r.book.id} · ${esc(r.book.category)}</div></td>
      <td>${r.book.qty}</td><td>${r.book.minStock}</td><td>${r.totalSold}</td><td>${r.recent}</td><td>${r.rate}</td>
      <td><div class="score"><div class="track"><div class="fill" style="width:${r.score}%;background:${color}"></div></div><b>${r.score}</b></div></td>
      <td>${badgeFor(r)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" class="empty">No books found.</td></tr>`;
}

/* ------------------ ABOUT / RESET ------------------------ */
$('btnAbout').onclick = () => openModal('About System', `
  <h4>BookNest – Bookstore Management System</h4>
  <p class="muted"><b>Purpose:</b> To simplify bookstore operations by managing books, inventory,
  customers, sales and reports in one system.</p>
  <p class="muted"><b>Innovation:</b> Smart Stock Advisor uses inventory levels and sales history to
  provide rule-based restocking recommendations.</p>
  <p class="muted small">Built with plain HTML, CSS and JavaScript. All data is stored in the browser
  using localStorage — no server, no installation.</p>
  <div class="modal-foot"><button class="btn primary" id="abClose">Close</button></div>`)
  || null;
document.addEventListener('click', e => { if (e.target && e.target.id === 'abClose') closeModal(); });

$('btnReset').onclick = () => confirmDialog(
  'Reset all BookNest data and reload the demo dataset? Your current records will be lost.',
  () => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    seedIfEmpty(true);
    cart = [];
    $('discount').value = 0;
    init(false);
    toast('Demo data restored');
    showSection('dashboard');
  });

/* --------------------- RENDER ALL ------------------------ */
function renderAll() {
  updateDashboard();
  renderBooks();
  renderInventory();
  renderCustomers();
  renderSaleCustomers();
  renderSalePicker();
  renderCart();
  renderSales();
  renderReports();
  renderStockAdvisor();
}

function init(greet) {
  seedIfEmpty(false);
  books = loadData('books');
  customers = loadData('customers');
  sales = loadData('sales');
  renderAll();
  const low = books.filter(b => stockStatus(b) !== 'In Stock').length;
  if (greet && low) setTimeout(() => toast(`Low stock warning: ${low} book(s) need restocking`, 'warn'), 700);
}

init(true);
