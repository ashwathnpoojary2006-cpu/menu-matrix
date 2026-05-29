// ============================================
// MenuMatrix — Admin Dashboard
// ============================================

const API_BASE = 'http://127.0.0.1:5000/api';

// Current messaging state
let msgCurrentOrderId   = null;
let msgCurrentOrderCode = '';
let allOrders           = [];

function authHeaders() {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (!user || !user.is_admin) {
    window.location.href = 'index.html';
    return;
  }
  fetchOrders();
  fetchAdminCapacity();

  // Auto-resize message textarea
  const ta = document.getElementById('msgTextarea');
  if (ta) {
    ta.addEventListener('input', () => {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
    });
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});

// ===== FETCH ORDERS =====
async function fetchOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;">Loading orders…</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/orders`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    allOrders = await res.json();
    renderOrders(allOrders);
    updateStats(allOrders);
  } catch (err) {
    console.error('[ADMIN] fetchOrders error:', err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#ef4444;padding:24px;">
      Failed to load orders: ${err.message}. Make sure the server is running.
    </td></tr>`;
  }
}

// ===== STATS =====
function updateStats(orders) {
  const total     = orders.length;
  const pending   = orders.filter(o => o.status === 'pending').length;
  const approved  = orders.filter(o => o.status === 'approved').length;
  const confirmed = orders.filter(o => o.status === 'confirmed').length;
  const revenue   = orders
    .filter(o => o.status === 'confirmed')
    .reduce((s, o) => s + (o.grand_total || 0), 0);

  setEl('statTotal',     total);
  setEl('statPending',   pending + approved);
  setEl('statConfirmed', confirmed);
  setEl('statRevenue',   '₹' + revenue.toLocaleString('en-IN'));
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ===== RENDER TABLE =====
function renderOrders(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;">No orders yet.</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const statusBadge = `<span class="badge ${o.status}">${o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span>`;
    const date = o.event_date
      ? new Date(o.event_date + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
      : 'N/A';

    // Payment status badge
    const payStatus = o.payment_status || 'unpaid';
    let payBadgeClass = 'unpaid';
    let payLabel = 'Unpaid';
    if (payStatus === '50%') {
      payBadgeClass = 'half';
      payLabel = '50% Paid';
    } else if (payStatus === 'full') {
      payBadgeClass = 'full';
      payLabel = 'Fully Paid';
    }

    const payBadge = o.status === 'confirmed'
      ? `<span class="pay-badge ${payBadgeClass}"><span class="pay-badge-dot"></span>${payLabel}</span>
         ${o.amount_paid > 0 ? `<div style="font-size:.72rem;color:var(--text-muted);margin-top:3px">₹${(o.amount_paid||0).toLocaleString('en-IN')}</div>` : ''}`
      : `<span class="pay-badge unpaid"><span class="pay-badge-dot"></span>—</span>`;

    // Message count indicator
    const msgCount = o.message_count || 0;
    const msgBadge = msgCount > 0
      ? `<span style="position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:50%;background:#7c3aed;color:white;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center">${msgCount}</span>`
      : '';

    let actionBtns = '';
    if (o.status === 'pending') {
      actionBtns = `
        <button class="btn-icon btn-approve" title="Approve" onclick="updateOrderStatus(${o.id},'approve')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <button class="btn-icon btn-reject" title="Reject" onclick="updateOrderStatus(${o.id},'reject')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>`;
    }

    return `<tr>
      <td style="font-family:monospace;color:var(--yellow);font-weight:600">${o.order_id}</td>
      <td>
        <div style="font-weight:500">${o.customer_name || 'Guest'}</div>
        <div style="font-size:.78rem;color:var(--text-muted)">${o.customer_email || ''}</div>
      </td>
      <td>${date}</td>
      <td>${(o.guest_count || 0).toLocaleString('en-IN')}</td>
      <td style="font-weight:600">₹${(o.grand_total || 0).toLocaleString('en-IN')}</td>
      <td>${statusBadge}</td>
      <td>${payBadge}</td>
      <td>
        <div class="action-btns">
          ${actionBtns}
          <button class="btn-icon" style="background:rgba(124,58,237,.15);color:#a78bfa;position:relative" title="Message Customer" onclick="openMsgModal(${o.id})">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            ${msgBadge}
          </button>
          <button class="btn-icon" style="background:rgba(234,179,8,.15);color:#fbbf24" title="Send Email Update" onclick="sendOrderUpdate(${o.id})">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </button>
          <a class="btn-icon btn-download" title="Download Invoice" href="${API_BASE}/orders/${o.id}/invoice" target="_blank">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </a>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ===== APPROVE / REJECT =====
async function updateOrderStatus(orderId, action) {
  if (!confirm(`Are you sure you want to ${action} this order?`)) return;

  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/${action}`, {
      method:  'PATCH',
      headers: authHeaders(),
    });
    if (res.ok) {
      showToast(`Order ${action}d successfully`);
      fetchOrders(); // always refresh after action
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || `Failed to ${action} order`);
    }
  } catch (err) {
    console.error('[ADMIN] updateOrderStatus error:', err);
    showToast('Network error — check server is running');
  }
}

// ===== SEND EMAIL UPDATE =====
async function sendOrderUpdate(orderId) {
  const message = prompt('Enter the update message to email to the customer:');
  if (!message || !message.trim()) return;

  showToast('Sending email…');
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/update`, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify({ message: message.trim() }),
    });
    if (res.ok) {
      showToast('Email update sent!');
    } else {
      showToast('Failed to send email');
    }
  } catch (err) {
    console.error('[ADMIN] sendOrderUpdate error:', err);
    showToast('Network error');
  }
}

// ===== MESSAGE MODAL =====
async function openMsgModal(orderId) {
  msgCurrentOrderId = orderId;
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;

  msgCurrentOrderCode = order.order_id;

  // Update modal header
  setEl('msgOrderCode', order.order_id);
  setEl('msgCustomerName', order.customer_name || 'Guest');
  setEl('msgCustomerEmail', order.customer_email || '');
  const avatarEl = document.getElementById('msgAvatar');
  if (avatarEl) avatarEl.textContent = (order.customer_name || 'G').charAt(0).toUpperCase();

  // Show modal
  const overlay = document.getElementById('msgOverlay');
  if (overlay) overlay.classList.add('open');

  // Clear textarea
  const ta = document.getElementById('msgTextarea');
  if (ta) { ta.value = ''; ta.style.height = 'auto'; }

  // Load message history
  await loadMessages(orderId);
}

function closeMsgModal() {
  const overlay = document.getElementById('msgOverlay');
  if (overlay) overlay.classList.remove('open');
  msgCurrentOrderId = null;
}

async function loadMessages(orderId) {
  const history = document.getElementById('msgHistory');
  if (!history) return;

  history.innerHTML = '<div class="msg-empty" style="opacity:.6">Loading messages…</div>';

  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/messages`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const msgs = await res.json();

    if (!msgs.length) {
      history.innerHTML = '<div class="msg-empty">No messages yet. Start the conversation!</div>';
      return;
    }

    history.innerHTML = msgs.map(m => {
      const isAdmin = m.sent_by === 'admin';
      const time = m.sent_at
        ? new Date(m.sent_at).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'numeric', minute:'2-digit', hour12:true })
        : '';
      return `<div class="msg-bubble ${isAdmin ? 'admin' : 'customer'}">
        ${escHtml(m.message)}
        <span class="msg-bubble-time">${time}</span>
      </div>`;
    }).join('');

    // Scroll to bottom
    history.scrollTop = history.scrollHeight;
  } catch (err) {
    console.error('[ADMIN] loadMessages error:', err);
    history.innerHTML = '<div class="msg-empty" style="color:#ef4444">Failed to load messages</div>';
  }
}

async function sendMessage() {
  if (!msgCurrentOrderId) return;

  const ta = document.getElementById('msgTextarea');
  const btn = document.getElementById('msgSendBtn');
  const msg = (ta?.value || '').trim();
  if (!msg) return;

  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/orders/${msgCurrentOrderId}/messages`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ message: msg }),
    });

    if (res.ok) {
      ta.value = '';
      ta.style.height = 'auto';
      await loadMessages(msgCurrentOrderId);
      showToast('Message sent to customer!');
      // Refresh orders to update message count
      fetchOrders();
    } else {
      const errData = await res.json().catch(() => ({}));
      showToast(errData.error || 'Failed to send message');
    }
  } catch (err) {
    console.error('[ADMIN] sendMessage error:', err);
    showToast('Network error — check server');
  } finally {
    btn.disabled = false;
  }
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== TOAST =====
function showToast(msg) {
  const toast    = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== CAPACITY CALENDAR =====
let adminCurrentDate  = new Date();
let adminCapacityData = {};

async function fetchAdminCapacity() {
  try {
    const res = await fetch(`${API_BASE}/capacity`, { headers: authHeaders() });
    if (res.ok) adminCapacityData = await res.json();
  } catch (e) {
    console.error('[ADMIN] fetchCapacity error:', e);
  }
  renderAdminCalendar();
}

function changeAdminMonth(delta) {
  adminCurrentDate = new Date(adminCurrentDate.getFullYear(), adminCurrentDate.getMonth() + delta, 1);
  renderAdminCalendar();
}

function renderAdminCalendar() {
  const header = document.getElementById('adminCalMonthYear');
  const grid   = document.getElementById('adminCalendarDays');
  if (!header || !grid) return;

  const year  = adminCurrentDate.getFullYear();
  const month = adminCurrentDate.getMonth();
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  header.textContent = `${MONTHS[month]} ${year}`;

  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today      = new Date(); today.setHours(0, 0, 0, 0);

  let html = '';
  for (let i = 0; i < firstDay; i++) html += '<div></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const thisDate = new Date(year, month, d);
    const key      = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cap      = adminCapacityData[key] || { lunch: 0, dinner: 0 };
    const max      = Math.max(cap.lunch, cap.dinner);

    let cls = 'cal-day';
    if (thisDate < today) {
      cls += ' disabled';
    } else if (max >= 3000) {
      cls += ' red';
    } else if (max >= 2000) {
      cls += ' orange';
    } else {
      cls += ' green';
    }

    html += `<div class="${cls}" title="Lunch: ${cap.lunch}/3000 | Dinner: ${cap.dinner}/3000">${d}</div>`;
  }

  grid.innerHTML = html;
}
