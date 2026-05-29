// ============================================
// MenuMatrix — Payment Page
// ============================================

const API = 'http://127.0.0.1:5000/api';

let functionData     = null;
let eventDetails     = null;
let menuData         = null;
let grandTotal       = 0;
let currentOrderId   = null;
let currentOrderCode = null;
let orderStatus      = 'pending';
let pollTimer        = null;
let paymentDone      = false;
let orderSubmitting  = false;   // guard against duplicate submissions

// ============================================
// BOOT
// ============================================
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Already paid this session — just show the confirmation screen
  if (localStorage.getItem('mm_payment_done') === 'true') {
    renderDoneScreen(
      localStorage.getItem('mm_last_code') || 'MM-000000',
      localStorage.getItem('mm_last_oid')  || null
    );
    return;
  }

  const hasPriorOrder = !!localStorage.getItem('mm_order_id');
  const fnRaw   = localStorage.getItem('menumatrix_function');
  const detRaw  = localStorage.getItem('menumatrix_details');
  const menuRaw = localStorage.getItem('menumatrix_menu');

  // Redirect only when no prior order AND booking data missing
  if (!hasPriorOrder) {
    if (!fnRaw)   { window.location.replace('function.html'); return; }
    if (!detRaw)  { window.location.replace('details.html');  return; }
    if (!menuRaw) { window.location.replace('menu.html');     return; }
  }

  // Safe parse
  try { functionData = fnRaw   ? JSON.parse(fnRaw)   : null; } catch(e) { functionData = null; }
  try { eventDetails = detRaw  ? JSON.parse(detRaw)  : null; } catch(e) { eventDetails = null; }
  try { menuData     = menuRaw ? JSON.parse(menuRaw) : null; } catch(e) { menuData = null; }

  // If returning user with prior order — fetch pricing from backend
  if (hasPriorOrder && !menuData) {
    currentOrderId   = parseInt(localStorage.getItem('mm_order_id'));
    currentOrderCode = localStorage.getItem('mm_order_code') || '';
    await fetchOrderAndRender();
    return;
  }

  // Normal flow
  renderEventInfo();
  renderMenuItems();
  calculatePricing();
  updatePayButton();
  initPaymentForms();
  document.querySelectorAll('input[name="payType"]').forEach(r =>
    r.addEventListener('change', updatePayButton)
  );
  await startOrderFlow();
}

// Fetch order details from backend (for returning users who lost localStorage)
async function fetchOrderAndRender() {
  try {
    const res  = await fetch(`${API}/orders/${currentOrderId}/status`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();

    // Get full order details
    const res2  = await fetch(`${API}/orders/${currentOrderId}`);
    if (!res2.ok) throw new Error(`Order fetch status ${res2.status}`);
    const order = await res2.json();

    // Restore pricing from backend
    grandTotal = order.grand_total || 0;
    setText('payGrand', `₹${grandTotal.toLocaleString('en-IN')}`);
    setText('advanceAmount', `₹${Math.round(grandTotal * 0.5).toLocaleString('en-IN')}`);
    setText('fullAmount',    `₹${grandTotal.toLocaleString('en-IN')}`);

    // Set functionData, eventDetails, menuData from fetched order so details are populated in UI
    functionData = { name: order.event_type || '' };
    eventDetails = {
      date: order.event_date || '',
      time: order.event_time || '',
      venueName: order.venue_name || '',
      venueAddress: order.venue_address || '',
      guestCount: order.guest_count || 100,
      foodPreference: order.food_preference || '',
      specialNotes: order.special_notes || ''
    };
    menuData = {
      items: order.menu_items || [],
      perPlate: order.per_plate || 0,
      guestCount: order.guest_count || 100,
      packageId: order.package_id || null
    };

    // Render elements
    renderEventInfo();
    renderMenuItems();

    document.querySelectorAll('input[name="payType"]').forEach(r =>
      r.addEventListener('change', updatePayButton)
    );
    updatePayButton();
    showStatus(data.status);
    if (data.status === 'pending') startPolling();
  } catch (err) {
    console.error('[PAYMENT] fetchOrderAndRender failed:', err.message);
    // Clear stale order reference and redirect to start fresh
    localStorage.removeItem('mm_order_id');
    localStorage.removeItem('mm_order_code');
    showError('Could not load your order. The server may be offline. Please try again.');
  }
}

// ============================================
// ORDER FLOW
// ============================================
async function startOrderFlow() {
  const existingId = localStorage.getItem('mm_order_id');
  if (existingId) {
    currentOrderId   = parseInt(existingId);
    currentOrderCode = localStorage.getItem('mm_order_code') || '';
    await checkAndShowStatus();
  } else {
    await submitNewOrder();
  }
}

async function submitNewOrder() {
  // ── GUARD 1: in-memory flag (same page load) ──
  if (orderSubmitting) return;

  // ── GUARD 2: localStorage flag (survives page reloads) ──
  // If a previous page load already started submitting but was killed before
  // the response came back, this flag is still set.
  const submittingTs = parseInt(localStorage.getItem('mm_order_submitting') || '0');
  if (submittingTs && (Date.now() - submittingTs < 30000)) {
    // Submission in progress from a previous page load (< 30 s ago)
    console.warn('[PAYMENT] Submission already in progress — waiting for it');
    // Show a "processing" state instead of firing another POST
    const card  = document.getElementById('statusCard');
    const title = document.getElementById('statusTitle');
    if (title) title.textContent = 'Processing Your Order…';
    show('statePending');
    // Poll briefly to see if the order appeared
    setTimeout(async () => {
      // Try to find our order by checking the customer's bookings
      try {
        const token = localStorage.getItem('menumatrix_token');
        if (token) {
          const res = await fetch(`${API}/my-orders`, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (res.ok) {
            const orders = await res.json();
            if (orders.length > 0) {
              const latest = orders[0]; // most recent
              currentOrderId   = latest.id;
              currentOrderCode = latest.order_id;
              localStorage.setItem('mm_order_id',   currentOrderId);
              localStorage.setItem('mm_order_code', currentOrderCode);
              localStorage.removeItem('mm_order_submitting');
              showStatus(latest.status);
              return;
            }
          }
        }
      } catch(e) { /* ignore */ }
      // If we still couldn't find the order after 30s, clear the flag and allow retry
      if (Date.now() - submittingTs > 25000) {
        localStorage.removeItem('mm_order_submitting');
      }
    }, 3000);
    return;
  }

  orderSubmitting = true;

  // ── Set the guard BEFORE the fetch so reloads during flight won't re-submit ──
  localStorage.setItem('mm_order_submitting', Date.now().toString());

  // Generate an idempotency key so the backend can deduplicate
  let submissionId = localStorage.getItem('mm_submission_id');
  if (!submissionId) {
    submissionId = 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('mm_submission_id', submissionId);
  }

  const name  = str(eventDetails, ['customerName',  'name'])  || 'Guest';
  const email = str(eventDetails, ['customerEmail', 'email']) || 'guest@menumatrix.com';
  const phone = str(eventDetails, ['customerPhone', 'phone']) || '';

  // Use guestCount from menuData first (matches pricing), then eventDetails
  const guestCount = (menuData && menuData.guestCount) ? menuData.guestCount : num(eventDetails, 'guestCount', 100);

  const body = {
    name, email, phone,
    submission_id:   submissionId,
    event_type:      str(functionData, ['name']),
    event_date:      str(eventDetails, ['date']),
    event_time:      str(eventDetails, ['time']),
    venue_name:      str(eventDetails, ['venueName']),
    venue_address:   str(eventDetails, ['venueAddress']),
    guest_count:     guestCount,
    food_preference: str(eventDetails, ['foodPreference']),
    special_notes:   str(eventDetails, ['specialNotes']),
    menu_items:      menuData ? (menuData.items || []) : [],
    per_plate:       menuData ? (menuData.perPlate || 0) : 0,
    package_id:      menuData ? (menuData.packageId || null) : null,
  };

  try {
    const res  = await fetch(`${API}/orders`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok && data.order) {
      currentOrderId   = data.order.id;
      currentOrderCode = data.order.order_id;
      // Save immediately so refreshes don't create duplicates
      localStorage.setItem('mm_order_id',   currentOrderId);
      localStorage.setItem('mm_order_code', currentOrderCode);
      localStorage.removeItem('mm_order_submitting');
      localStorage.removeItem('mm_submission_id');
      showStatus(data.order.status);
      if (data.order.status === 'pending') startPolling();
    } else {
      console.error('[PAYMENT] Order API error:', data);
      localStorage.removeItem('mm_order_submitting');
      showError(data.error || 'Failed to submit order. Please try again.');
    }
  } catch (err) {
    console.error('[PAYMENT] Submit failed:', err.message);
    localStorage.removeItem('mm_order_submitting');
    showError('Cannot connect to server. Please make sure the backend is running.');
  } finally {
    orderSubmitting = false;
  }
}

async function checkAndShowStatus() {
  try {
    const res  = await fetch(`${API}/orders/${currentOrderId}/status`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();

    // Also update grand total from backend in case menuData is missing
    if (data.grand_total && grandTotal === 0) {
      grandTotal = data.grand_total;
      setText('payGrand',      `₹${grandTotal.toLocaleString('en-IN')}`);
      setText('advanceAmount', `₹${Math.round(grandTotal * 0.5).toLocaleString('en-IN')}`);
      setText('fullAmount',    `₹${grandTotal.toLocaleString('en-IN')}`);
      updatePayButton();
    }

    showStatus(data.status);
    if (data.status === 'pending') startPolling();
  } catch (err) {
    console.error('[PAYMENT] Status check failed:', err.message);
    showError('Could not check order status. The server may be offline.');
  }
}

// ============================================
// POLLING
// ============================================
function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    if (!currentOrderId || paymentDone) { stopPolling(); return; }
    try {
      const res  = await fetch(`${API}/orders/${currentOrderId}/status`);
      const data = await res.json();
      if (data.status !== orderStatus) {
        showStatus(data.status);
        if (data.status !== 'pending') stopPolling();
      }
    } catch (e) { /* silent */ }
  }, 5000);
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

// ============================================
// STATUS DISPLAY
// ============================================
function showStatus(status) {
  orderStatus = status;
  ['statePending','stateApproved','stateRejected','stateSuccess'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  const card  = document.getElementById('statusCard');
  const icon  = document.getElementById('statusIcon');
  const title = document.getElementById('statusTitle');
  if (!card || !icon || !title) return;

  card.className = 'pay-card pay-status-card reveal stagger-3';
  icon.className = 'pay-card-icon status-icon';

  if (status === 'pending') {
    show('statePending');
    title.textContent = 'Waiting for Approval';

  } else if (status === 'approved') {
    show('stateApproved');
    icon.classList.add('approved');
    title.textContent = 'Approved — Complete Payment';
    card.classList.add('approved-card');
    updatePayButton();

  } else if (status === 'rejected') {
    show('stateRejected');
    icon.classList.add('rejected');
    title.textContent = 'Date Not Available';
    card.classList.add('rejected-card');
    stopPolling();

  } else if (status === 'confirmed' || status === 'success') {
    stopPolling();
    renderSuccessInPage(currentOrderCode || 'MM-000000', currentOrderId);
  }
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = '';
}

// ============================================
// RENDER HELPERS
// ============================================
function renderEventInfo() {
  const el = document.getElementById('eventInfoGrid');
  if (!el) return;

  const prefMap = { veg: 'Pure Vegetarian', nonveg: 'Non-Vegetarian', both: 'Veg + Non-Veg' };
  let dateStr = '—';
  try {
    const rawDate = eventDetails && eventDetails.date;
    if (rawDate) dateStr = new Date(rawDate + 'T00:00:00').toLocaleDateString('en-IN',
      { day: 'numeric', month: 'long', year: 'numeric' });
  } catch(e) {}

  el.innerHTML = `
    <div class="pay-info-item"><span class="pay-info-label">Event Type</span><span class="pay-info-value">${str(functionData,['name']) || '—'}</span></div>
    <div class="pay-info-item"><span class="pay-info-label">Date</span><span class="pay-info-value">${dateStr}</span></div>
    <div class="pay-info-item"><span class="pay-info-label">Time</span><span class="pay-info-value">${str(eventDetails,['time']) || '—'}</span></div>
    <div class="pay-info-item"><span class="pay-info-label">Venue</span><span class="pay-info-value">${str(eventDetails,['venueName']) || '—'}</span></div>
    <div class="pay-info-item"><span class="pay-info-label">Guests</span><span class="pay-info-value">${num(eventDetails,'guestCount',100).toLocaleString('en-IN')}</span></div>
    <div class="pay-info-item"><span class="pay-info-label">Food Preference</span><span class="pay-info-value">${prefMap[str(eventDetails,['foodPreference'])] || '—'}</span></div>
  `;
}

function renderMenuItems() {
  const el = document.getElementById('payMenuList');
  if (!el || !menuData) return;

  const CATS = { starters:'Starters', maincourse:'Main Course', breads:'Breads',
                  rice:'Rice', desserts:'Desserts', beverages:'Beverages' };
  const grouped = {};
  (menuData.items || []).forEach(item => {
    const cat = item.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  el.innerHTML = Object.entries(grouped).map(([catId, items]) => `
    <div class="pay-menu-cat">
      <div class="pay-menu-cat-label">${CATS[catId] || catId}</div>
      ${items.map(item => {
        const price = parseFloat(item.price || 0);
        const qty   = parseInt(item.qty || 1);
        return `<div class="pay-menu-item">
          <span class="pay-menu-item-name">${item.name}${qty > 1 ? ` × ${qty}` : ''}</span>
          <span class="pay-menu-item-price">₹${(price * qty).toLocaleString('en-IN')}</span>
        </div>`;
      }).join('')}
    </div>
  `).join('');
}

function calculatePricing() {
  if (!menuData) return;
  const perPlate = parseFloat(menuData.perPlate || 0);
  const guests   = parseInt(menuData.guestCount || 100);
  const subtotal = perPlate * guests;
  const service  = Math.round(subtotal * 0.05);
  const gst      = Math.round(subtotal * 0.18);
  grandTotal     = subtotal + service + gst;

  setText('payPerPlate',   `₹${perPlate.toLocaleString('en-IN')}`);
  setText('payGuests',     guests.toLocaleString('en-IN'));
  setText('paySubtotal',   `₹${subtotal.toLocaleString('en-IN')}`);
  setText('payService',    `₹${service.toLocaleString('en-IN')}`);
  setText('payGST',        `₹${gst.toLocaleString('en-IN')}`);
  setText('payGrand',      `₹${grandTotal.toLocaleString('en-IN')}`);
  setText('advanceAmount', `₹${Math.round(grandTotal * 0.5).toLocaleString('en-IN')}`);
  setText('fullAmount',    `₹${grandTotal.toLocaleString('en-IN')}`);
}

function updatePayButton() {
  if (grandTotal === 0) return;
  const type = document.querySelector('input[name="payType"]:checked');
  if (!type) return;
  const amount = type.value === 'advance' ? Math.round(grandTotal * 0.5) : grandTotal;
  setText('payBtnText', `Pay ₹${amount.toLocaleString('en-IN')} Now`);
}

// ============================================
// PAYMENT FORM SWITCHING & VALIDATION
// ============================================
function initPaymentForms() {
  // Switch payment method forms
  document.querySelectorAll('input[name="payMethod"]').forEach(r => {
    r.addEventListener('change', switchPaymentForm);
  });

  // Card number formatting (auto-add spaces)
  const cardInput = document.getElementById('cardNumber');
  if (cardInput) {
    cardInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
      e.target.value = val;
    });
  }

  // Expiry date formatting
  const expiryInput = document.getElementById('cardExpiry');
  if (expiryInput) {
    expiryInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 3) val = val.substring(0, 2) + '/' + val.substring(2);
      e.target.value = val;
    });
  }

  // Clear error on focus
  document.querySelectorAll('.pay-form-input').forEach(input => {
    input.addEventListener('focus', () => {
      input.classList.remove('error');
      const errEl = input.closest('.pay-form-group')?.querySelector('.pay-form-error');
      if (errEl) errEl.remove();
    });
  });
}

function switchPaymentForm() {
  const method = (document.querySelector('input[name="payMethod"]:checked') || {}).value || 'upi';
  const forms = { upi: 'upiForm', card: 'cardForm', netbanking: 'netbankingForm' };
  Object.entries(forms).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = key === method ? '' : 'none';
  });
}

function validatePaymentForm() {
  const method = (document.querySelector('input[name="payMethod"]:checked') || {}).value || 'upi';
  let valid = true;

  // Clear previous errors
  document.querySelectorAll('.pay-form-input.error').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.pay-form-error').forEach(el => el.remove());

  if (method === 'upi') {
    const upi = document.getElementById('upiId');
    if (upi && (!upi.value.trim() || !upi.value.includes('@'))) {
      showFieldError(upi, 'Please enter a valid UPI ID (e.g., name@upi)');
      valid = false;
    }
  } else if (method === 'card') {
    const cardNum = document.getElementById('cardNumber');
    const expiry  = document.getElementById('cardExpiry');
    const cvv     = document.getElementById('cardCvv');
    const name    = document.getElementById('cardName');

    if (cardNum && cardNum.value.replace(/\s/g, '').length < 16) {
      showFieldError(cardNum, 'Please enter a valid 16-digit card number');
      valid = false;
    }
    if (expiry && (!expiry.value || expiry.value.length < 5)) {
      showFieldError(expiry, 'Enter valid expiry (MM/YY)');
      valid = false;
    }
    if (cvv && (!cvv.value || cvv.value.length < 3)) {
      showFieldError(cvv, 'Enter a valid CVV');
      valid = false;
    }
    if (name && !name.value.trim()) {
      showFieldError(name, 'Enter cardholder name');
      valid = false;
    }
  } else if (method === 'netbanking') {
    const bank = document.getElementById('bankSelect');
    if (bank && !bank.value) {
      showFieldError(bank, 'Please select your bank');
      valid = false;
    }
  }

  return valid;
}

function showFieldError(inputEl, msg) {
  inputEl.classList.add('error');
  const errSpan = document.createElement('span');
  errSpan.className = 'pay-form-error';
  errSpan.textContent = msg;
  inputEl.closest('.pay-form-group')?.appendChild(errSpan);
}

// ============================================
// PROCESS PAYMENT
// ============================================
async function processPayment() {
  if (paymentDone) return;

  // Validate payment form fields first
  if (!validatePaymentForm()) {
    showToast('Please fill in your payment details correctly.');
    return;
  }

  const btn     = document.getElementById('payNowBtn');
  const btnText = document.getElementById('payBtnText');
  if (!btn || btn.disabled) return;  // prevent double-click
  btn.disabled = true;
  btn.style.opacity = '0.7';
  if (btnText) btnText.textContent = 'Processing…';

  const payType   = (document.querySelector('input[name="payType"]:checked')   || {}).value || 'advance';
  const payMethod = (document.querySelector('input[name="payMethod"]:checked') || {}).value || 'upi';
  const paid      = payType === 'advance' ? Math.round(grandTotal * 0.5) : grandTotal;
  const balance   = Math.max(0, grandTotal - paid);

  let txnId = 'TXN' + Date.now().toString().slice(-7);
  let paymentSuccess = false;

  if (currentOrderId) {
    try {
      const res  = await fetch(`${API}/payments`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          order_id:       currentOrderId,
          payment_type:   payType,
          payment_method: payMethod,
          amount_paid:    paid,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        txnId = data.transaction_id || txnId;
        paymentSuccess = true;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Payment failed with status ${res.status}`);
      }
    } catch (err) {
      console.error('[PAYMENT] Backend payment failed:', err.message);
      // Re-enable button so user can retry
      if (btn)     { btn.disabled = false; btn.style.opacity = '1'; }
      if (btnText) btnText.textContent = `Pay ₹${paid.toLocaleString('en-IN')} Now`;
      showToast('Payment failed — please try again.');
      return;
    }
  } else {
    // No order ID — cannot process payment
    if (btn)     { btn.disabled = false; btn.style.opacity = '1'; }
    if (btnText) btnText.textContent = `Pay ₹${paid.toLocaleString('en-IN')} Now`;
    showToast('Order not found. Please go back and try again.');
    return;
  }

  setTimeout(() => {
    paymentDone = true;
    stopPolling();

    const code = currentOrderCode || ('MM-' + Date.now().toString().slice(-6));
    setText('orderId',       code);
    setText('successPaid',   `₹${paid.toLocaleString('en-IN')}`);
    setText('successMethod', ({upi:'UPI', card:'Credit/Debit Card', netbanking:'Net Banking'})[payMethod] || payMethod);

    if (balance > 0) {
      const balRow = document.getElementById('balanceRow');
      if (balRow) balRow.style.display = '';
      setText('successBalance', `₹${balance.toLocaleString('en-IN')}`);
    }

    // Persist done state
    localStorage.setItem('mm_payment_done', 'true');
    localStorage.setItem('mm_last_code',    code);
    localStorage.setItem('mm_last_oid',     currentOrderId || '');

    // Clear booking session
    ['mm_order_id','mm_order_code',
     'menumatrix_function','menumatrix_details','menumatrix_menu'].forEach(k =>
      localStorage.removeItem(k)
    );

    renderSuccessInPage(code, currentOrderId);
    showToast('Payment successful! Booking confirmed.');
  }, 2000);
}

// ============================================
// SUCCESS SCREEN
// ============================================
function renderSuccessInPage(code, orderId) {
  const icon  = document.getElementById('statusIcon');
  const title = document.getElementById('statusTitle');
  const card  = document.getElementById('statusCard');

  if (icon) {
    icon.className = 'pay-card-icon status-icon success';
    icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
  }
  if (title) title.textContent = 'Booking Confirmed!';
  if (card)  card.className = 'pay-card pay-status-card reveal visible stagger-3 success-card';

  ['statePending','stateApproved','stateRejected'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  show('stateSuccess');

  const back = document.getElementById('backToMenuBtn');
  if (back) back.style.display = 'none';

  setText('orderId', code);

  const homeBtn = document.querySelector('.success-home-btn');
  if (homeBtn) {
    homeBtn.href = 'index.html';
    homeBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
      <span>Explore More</span>`;
  }

  if (!document.getElementById('payActionBtns')) {
    const area = document.querySelector('#stateSuccess .success-details');
    if (area) {
      area.insertAdjacentHTML('afterend', `
        <div id="payActionBtns" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:16px 0;">
          ${orderId ? `<a href="${API}/orders/${orderId}/invoice" class="btn-secondary" style="padding:10px 20px;font-size:.85rem" target="_blank">Download Invoice</a>` : ''}
          <a href="bookings.html" class="btn-secondary" style="padding:10px 20px;font-size:.85rem">View My Bookings</a>
        </div>`);
    }
  }

  launchConfetti();
}

function renderDoneScreen(code, orderId) {
  currentOrderCode = code;
  currentOrderId   = orderId ? parseInt(orderId) : null;
  renderSuccessInPage(code, currentOrderId);
}

// ============================================
// UTILS
// ============================================
function str(obj, keys) {
  if (!obj) return '';
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return String(obj[k]);
  }
  return '';
}

function num(obj, key, fallback) {
  try { return parseInt((obj || {})[key] || fallback); } catch(e) { return fallback; }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
}

function launchConfetti() {
  const c = document.getElementById('confetti');
  if (!c) return;
  c.innerHTML = '';
  const colors = ['#7c3aed','#f59e0b','#10b981','#a78bfa','#fbbf24','#6d28d9'];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${(Math.random()*.5).toFixed(2)}s;animation-duration:${(1+Math.random()*1.5).toFixed(2)}s`;
    c.appendChild(p);
  }
  setTimeout(() => { c.innerHTML = ''; }, 3000);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  const m = document.getElementById('toastMsg');
  if (!t || !m) return;
  m.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// Show a user-friendly error instead of silently falling back to 'approved'
function showError(msg) {
  ['statePending','stateApproved','stateRejected','stateSuccess'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  const card  = document.getElementById('statusCard');
  const icon  = document.getElementById('statusIcon');
  const title = document.getElementById('statusTitle');
  if (icon)  icon.className = 'pay-card-icon status-icon rejected';
  if (title) title.textContent = 'Something Went Wrong';
  if (card)  card.className = 'pay-card pay-status-card reveal visible stagger-3 rejected-card';

  const pending = document.getElementById('statePending');
  if (pending) {
    pending.style.display = '';
    pending.innerHTML = `
      <div class="status-rejected-anim">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h4 class="status-heading rejected">Connection Error</h4>
      <p class="status-text">${msg}</p>
      <div class="rejected-actions" style="margin-top:16px">
        <button class="btn-primary" onclick="location.reload()"><span>Retry</span></button>
        <a href="index.html" class="btn-secondary">Back to Home</a>
      </div>`;
  }
}
