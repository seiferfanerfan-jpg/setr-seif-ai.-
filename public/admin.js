const loginForm = document.querySelector('[data-admin-login]');
const loginMessage = document.querySelector('[data-admin-login-message]');
const loginButton = document.querySelector('[data-login-submit]');
const loginLabel = document.querySelector('[data-login-label]');
const adminPanel = document.querySelector('[data-admin-panel]');
const adminMessage = document.querySelector('[data-admin-message]');
const adminCount = document.querySelector('[data-admin-count]');
const recordsBody = document.querySelector('[data-admin-records]');

function setMessage(element, message, isError = true) {
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
  element.classList.toggle('is-error', isError);
  element.classList.toggle('is-success', !isError);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    ...options,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || 'تعذّر تنفيذ الطلب. حاول مرة تانية.');
    error.status = response.status;
    throw error;
  }
  return result;
}

function appendCell(row, text, className = '') {
  const cell = document.createElement('td');
  if (className) cell.className = className;
  cell.textContent = text;
  row.append(cell);
  return cell;
}

function renderRecords(records) {
  if (!recordsBody || !adminCount) return;
  recordsBody.replaceChildren();
  adminCount.textContent = `عدد الطلبات المعروضة: ${records.length}`;

  if (!records.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.className = 'admin-empty';
    cell.textContent = 'لسه مفيش طلبات مسجلة.';
    row.append(cell);
    recordsBody.append(row);
    return;
  }

  for (const record of records) {
    const row = document.createElement('tr');
    row.dataset.recordId = record.id;
    appendCell(row, record.fullName);
    appendCell(row, record.email, 'admin-email');
    appendCell(row, record.keyHint, 'admin-key-hint');
    appendCell(row, record.status === 'issued' ? 'مُصدَر' : 'ملغي');
    const date = new Date(record.createdAt);
    appendCell(row, Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('ar-EG'));

    const actionCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'admin-delete-button';
    deleteButton.textContent = 'حذف السجل';
    deleteButton.addEventListener('click', () => deleteRecord(record.id, row));
    actionCell.append(deleteButton);
    row.append(actionCell);
    recordsBody.append(row);
  }
}

async function loadRecords() {
  setMessage(adminMessage, '');
  if (adminCount) adminCount.textContent = 'جاري تحميل السجلات…';
  try {
    const result = await apiRequest('/api/admin/keys');
    adminPanel.hidden = false;
    if (loginForm) loginForm.hidden = true;
    renderRecords(Array.isArray(result.records) ? result.records : []);
  } catch (error) {
    if (error.status === 401) {
      if (adminPanel) adminPanel.hidden = true;
      if (loginForm) loginForm.hidden = false;
      return;
    }
    if (adminPanel) adminPanel.hidden = false;
    if (loginForm) loginForm.hidden = true;
    setMessage(adminMessage, error.message || 'تعذّر تحميل السجلات.');
    if (adminCount) adminCount.textContent = '';
  }
}

async function deleteRecord(id, row) {
  const confirmed = window.confirm('سيُحذف الاسم والبريد وبصمة المفتاح نهائيًا، ولا يمكن التراجع. هل تريد المتابعة؟');
  if (!confirmed) return;
  try {
    await apiRequest('/api/admin/keys', { method: 'DELETE', body: JSON.stringify({ id }) });
    row.remove();
    const visibleRows = recordsBody?.querySelectorAll('tr[data-record-id]').length || 0;
    if (adminCount) adminCount.textContent = `عدد الطلبات المعروضة: ${visibleRows}`;
    if (!visibleRows && recordsBody) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = 6;
      emptyCell.className = 'admin-empty';
      emptyCell.textContent = 'لسه مفيش طلبات مسجلة.';
      emptyRow.append(emptyCell);
      recordsBody.append(emptyRow);
    }
    setMessage(adminMessage, 'تم حذف سجل الطلب.', false);
  } catch (error) {
    setMessage(adminMessage, error.message || 'تعذّر حذف السجل.');
  }
}

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage(loginMessage, '');
  if (!loginForm.reportValidity()) return;
  const password = new FormData(loginForm).get('password');
  if (loginButton) loginButton.disabled = true;
  if (loginLabel) loginLabel.textContent = 'جاري التحقق…';
  try {
    await apiRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: String(password || '') }),
    });
    loginForm.reset();
    await loadRecords();
  } catch (error) {
    setMessage(loginMessage, error.message || 'تعذّر تسجيل الدخول.');
  } finally {
    if (loginButton) loginButton.disabled = false;
    if (loginLabel) loginLabel.textContent = 'دخول آمن';
  }
});

document.querySelector('[data-refresh-records]')?.addEventListener('click', loadRecords);
document.querySelector('[data-admin-logout]')?.addEventListener('click', async () => {
  try {
    await apiRequest('/api/admin/logout', { method: 'POST', body: '{}' });
  } catch (error) {
    setMessage(adminMessage, error.message || 'تعذّر تسجيل الخروج. حاول مرة تانية.');
    return;
  }
  if (adminPanel) adminPanel.hidden = true;
  if (loginForm) loginForm.hidden = false;
  setMessage(loginMessage, 'تم تسجيل الخروج.', false);
});

loadRecords();
