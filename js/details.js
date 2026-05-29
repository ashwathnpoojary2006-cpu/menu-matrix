// ============================================
// MenuMatrix — Event Details Page Logic
// ============================================

// === STATE ===
let selectedFunction = null;

// === INIT ===
document.addEventListener("DOMContentLoaded", () => {
  loadSelectedFunction();
  setMinDate();
  initForm();
  fetchCapacity();
  initClock();
});

// === LOAD SELECTED FUNCTION ===
function loadSelectedFunction() {
  const stored = localStorage.getItem("menumatrix_function");
  if (!stored) {
    // No function selected, redirect back
    window.location.href = "function.html";
    return;
  }

  selectedFunction = JSON.parse(stored);

  // Update the selected function badge
  const img = document.getElementById("selectedFnImg");
  const name = document.getElementById("selectedFnName");

  img.src = selectedFunction.image;
  img.alt = selectedFunction.name;
  name.textContent = selectedFunction.name;
}

// === SET MINIMUM DATE (handled by custom calendar) ===
function setMinDate() {
  // No longer needed — the custom calendar blocks past dates visually
}

// === GUEST COUNTER ===
function checkGuestApprovalWarning(value) {
  if (value >= 3000) {
    showToast("Large events (3,000+ guests) require manual caterer approval.");
  }
}

function adjustGuests(delta) {
  const input = document.getElementById("guestCount");
  let value = parseInt(input.value) || 100;
  value = Math.max(10, Math.min(5000, value + delta));
  input.value = value;
  highlightActivePreset(value);
  checkGuestApprovalWarning(value);
}

function setGuests(count) {
  const input = document.getElementById("guestCount");
  input.value = count;
  highlightActivePreset(count);
  checkGuestApprovalWarning(count);
}

function highlightActivePreset(count) {
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.textContent) === count);
  });
}

// === FORM SUBMISSION ===
function initForm() {
  const form = document.getElementById("detailsForm");

  // Highlight default preset
  highlightActivePreset(100);

  // Guest count input change
  document.getElementById("guestCount").addEventListener("input", (e) => {
    const val = parseInt(e.target.value) || 0;
    highlightActivePreset(val);
    checkGuestApprovalWarning(val);
  });

  // Pre-fill fields from logged-in user or stored details
  const user = typeof getUser === 'function' ? getUser() : null;
  const storedDetailsRaw = localStorage.getItem("menumatrix_details");
  let storedDetails = null;
  try { storedDetails = storedDetailsRaw ? JSON.parse(storedDetailsRaw) : null; } catch(e) {}

  if (storedDetails) {
    document.getElementById("customerName").value = storedDetails.customerName || "";
    document.getElementById("customerEmail").value = storedDetails.customerEmail || "";
    document.getElementById("customerPhone").value = storedDetails.customerPhone || "";
    document.getElementById("venueName").value = storedDetails.venueName || "";
    document.getElementById("venueAddress").value = storedDetails.venueAddress || "";
    document.getElementById("guestCount").value = storedDetails.guestCount || 100;
    highlightActivePreset(storedDetails.guestCount || 100);
    if (storedDetails.date) {
      selectedDateStr = storedDetails.date;
      document.getElementById("eventDate").value = storedDetails.date;
    }
    if (storedDetails.time) {
      document.getElementById("eventTime").value = storedDetails.time;
      const parts = storedDetails.time.split(":");
      if (parts.length === 2) {
        let h = parseInt(parts[0]);
        let m = parseInt(parts[1]);
        selectedAMPM = h >= 12 ? "PM" : "AM";
        selectedHour = h % 12;
        if (selectedHour === 0) selectedHour = 12;
        selectedMinute = m;
        // We'll update the clock controls once initClock runs
        setTimeout(() => {
          updateTimeDisplay();
          updateClockSelection();
          if (selectedAMPM === "PM") {
            const pmBtn = document.getElementById("timePM");
            const amBtn = document.getElementById("timeAM");
            if (pmBtn && amBtn) {
              pmBtn.classList.add("active");
              amBtn.classList.remove("active");
            }
          } else {
            const pmBtn = document.getElementById("timePM");
            const amBtn = document.getElementById("timeAM");
            if (pmBtn && amBtn) {
              amBtn.classList.add("active");
              pmBtn.classList.remove("active");
            }
          }
        }, 100);
      }
    }
    if (storedDetails.foodPreference) {
      const radio = document.querySelector(`input[name="foodPref"][value="${storedDetails.foodPreference}"]`);
      if (radio) radio.checked = true;
    }
    document.getElementById("specialNotes").value = storedDetails.specialNotes || "";
  } else if (user) {
    document.getElementById("customerName").value = user.name || "";
    document.getElementById("customerEmail").value = user.email || "";
    document.getElementById("customerPhone").value = user.phone || "";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Validate
    const customerName = document.getElementById("customerName").value.trim();
    const customerEmail = document.getElementById("customerEmail").value.trim();
    const customerPhone = document.getElementById("customerPhone").value.trim();
    const eventDate = document.getElementById("eventDate").value;
    const eventTime = document.getElementById("eventTime").value;
    const venueName = document.getElementById("venueName").value.trim();
    const venueAddress = document.getElementById("venueAddress").value.trim();
    const guestCount = parseInt(document.getElementById("guestCount").value);
    const foodPref = document.querySelector('input[name="foodPref"]:checked').value;
    const specialNotes = document.getElementById("specialNotes").value.trim();

    if (!customerName) {
      showToast("Please enter your full name");
      return;
    }
    if (!customerEmail) {
      showToast("Please enter your email address");
      return;
    }
    if (!customerPhone) {
      showToast("Please enter your phone number");
      return;
    }
    if (!eventDate) {
      showToast("Please select an event date");
      return;
    }
    if (!eventTime) {
      showToast("Please select an event time");
      return;
    }
    if (!venueName) {
      showToast("Please enter a venue name");
      return;
    }
    if (guestCount < 10) {
      showToast("Minimum 10 guests required");
      return;
    }

    // Save to localStorage
    const eventDetails = {
      customerName: customerName,
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      date: eventDate,
      time: eventTime,
      venueName: venueName,
      venueAddress: venueAddress,
      guestCount: guestCount,
      foodPreference: foodPref,
      specialNotes: specialNotes,
      functionId: selectedFunction?.id,
      functionName: selectedFunction?.name
    };

    localStorage.setItem("menumatrix_details", JSON.stringify(eventDetails));

    // Clear any stale order data — details may have changed, old order is invalid
    ['mm_order_id', 'mm_order_code', 'mm_payment_done', 'mm_last_code', 'mm_last_oid',
     'menumatrix_menu'].forEach(k => localStorage.removeItem(k));

    showToast("Event details saved!");

    setTimeout(() => {
      window.location.href = "menu.html";
    }, 600);
  });
}

// === TOAST ===
function showToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

// === CUSTOM CALENDAR ===
let currentDate = new Date();
let selectedDateStr = "";
let capacityData = {};

async function fetchCapacity() {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/capacity');
    capacityData = await res.json();
    renderCalendar();
  } catch(e) {
    console.error("Failed to fetch capacity", e);
    renderCalendar();
  }
}

function changeMonth(delta) {
  currentDate.setMonth(currentDate.getMonth() + delta);
  renderCalendar();
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const headerEl = document.getElementById("calMonthYear");
  if (!headerEl) return;
  headerEl.textContent = `${monthNames[month]} ${year}`;
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let html = '';
  // Empty slots before 1st
  for (let i = 0; i < firstDay; i++) {
    html += `<div></div>`;
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    // YYYY-MM-DD
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
    
    let isPast = d < today;
    let cap = capacityData[dateStr] || {lunch: 0, dinner: 0};
    
    // We get the time input to check lunch vs dinner
    let timeInput = document.getElementById("eventTime").value;
    let isLunch = true;
    if (timeInput) {
       const hr = parseInt(timeInput.split(":")[0]);
       isLunch = (hr < 16);
    }
    
    let currentCap = isLunch ? cap.lunch : cap.dinner;
    
    let colorClass = 'green';
    if (currentCap >= 3000) colorClass = 'red';
    else if (currentCap >= 2000) colorClass = 'orange';
    
    let classes = ['cal-day'];
    if (isPast) {
      classes.push('disabled');
    } else {
      classes.push(colorClass);
    }
    
    if (dateStr === selectedDateStr) classes.push('selected');
    
    if (isPast) {
      html += `<div class="${classes.join(' ')}">${i}</div>`;
    } else {
      html += `<div class="${classes.join(' ')}" onclick="selectDate('${dateStr}')">${i}</div>`;
    }
  }
  
  document.getElementById("calendarDays").innerHTML = html;
}

function selectDate(dateStr) {
  let cap = capacityData[dateStr] || {lunch: 0, dinner: 0};
  let timeInput = document.getElementById("eventTime").value;
  let isLunch = true;
  if (timeInput) {
     const hr = parseInt(timeInput.split(":")[0]);
     isLunch = (hr < 16);
  }
  let currentCap = isLunch ? cap.lunch : cap.dinner;
  
  const guestCount = parseInt(document.getElementById("guestCount").value) || 100;
  if (guestCount >= 3000) {
     showToast("Large events (3,000+ guests) require manual caterer approval.");
  } else if (currentCap >= 3000) {
     showToast("Busy slot! Bookings under 3,000 guests are still auto-approved.");
  } else {
     showToast("Date selected! Under 3,000 guests are auto-approved.");
  }

  selectedDateStr = dateStr;
  document.getElementById("eventDate").value = dateStr;
  renderCalendar();
}

document.getElementById("eventTime").addEventListener("change", renderCalendar);

// === CUSTOM CLOCK ===
let currentClockMode = 'hours';
let selectedHour = 10;
let selectedMinute = 0;
let selectedAMPM = 'AM';
let isDraggingClock = false;

function initClock() {
  const amBtn = document.getElementById('timeAM');
  const pmBtn = document.getElementById('timePM');
  if (!amBtn) return;
  
  amBtn.onclick = () => { selectedAMPM = 'AM'; amBtn.classList.add('active'); pmBtn.classList.remove('active'); updateHiddenInput(); };
  pmBtn.onclick = () => { selectedAMPM = 'PM'; pmBtn.classList.add('active'); amBtn.classList.remove('active'); updateHiddenInput(); };
  
  document.getElementById('timeHourDisp').onclick = () => setClockMode('hours');
  document.getElementById('timeMinDisp').onclick = () => setClockMode('minutes');
  
  const clockContainer = document.querySelector('.clock-container');
  
  function handleDrag(e) {
    if (!isDraggingClock) return;
    
    const rect = clockContainer.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    
    const dx = clientX - cx;
    const cy_adjusted = cy; 
    const dy = clientY - cy_adjusted;
    
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    angle = angle + 90;
    if (angle < 0) angle += 360;
    
    // Smoothly update stick rotation
    document.getElementById('clockHand').style.transform = `rotate(${angle}deg)`;
    
    let step = 30;
    let index = Math.round(angle / step);
    if (index === 12) index = 0;
    
    if (currentClockMode === 'hours') {
      let val = index === 0 ? 12 : index;
      if (val !== selectedHour) {
        selectedHour = val;
        updateTimeDisplay();
        updateNumberSelection();
      }
    } else {
      let val = index * 5;
      if (val === 60) val = 0;
      if (val !== selectedMinute) {
        selectedMinute = val;
        updateTimeDisplay();
        updateNumberSelection();
      }
    }
  }

  clockContainer.addEventListener('mousedown', (e) => {
    isDraggingClock = true;
    document.getElementById('clockHand').classList.add('dragging');
    handleDrag(e);
  });
  window.addEventListener('mousemove', handleDrag);
  window.addEventListener('mouseup', () => {
    if (isDraggingClock) {
      isDraggingClock = false;
      document.getElementById('clockHand').classList.remove('dragging');
      updateClockSelection(); // Snap stick to exact value
      if (currentClockMode === 'hours') {
        setClockMode('minutes');
      }
      updateHiddenInput();
    }
  });

  clockContainer.addEventListener('touchstart', (e) => {
    isDraggingClock = true;
    document.getElementById('clockHand').classList.add('dragging');
    handleDrag(e);
    if (e.target.closest('.clock-container')) {
      e.preventDefault();
    }
  }, { passive: false });
  window.addEventListener('touchmove', handleDrag, { passive: false });
  window.addEventListener('touchend', () => {
    if (isDraggingClock) {
      isDraggingClock = false;
      document.getElementById('clockHand').classList.remove('dragging');
      updateClockSelection(); // Snap stick to exact value
      if (currentClockMode === 'hours') {
        setClockMode('minutes');
      }
      updateHiddenInput();
    }
  });

  updateTimeDisplay();
  setClockMode('hours');
  updateHiddenInput();
}

function renderClock(mode) {
  const clockNumbers = document.getElementById('clockNumbers');
  if (!clockNumbers) return;
  clockNumbers.innerHTML = '';
  
  const radius = 85;
  const cx = 110;
  const cy = 110;
  
  let values = [];
  if (mode === 'hours') {
    values = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  } else {
    values = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  }

  values.forEach((val, index) => {
    const angle = (index * 30) * (Math.PI / 180);
    const x = cx + radius * Math.sin(angle);
    const y = cy - radius * Math.cos(angle);
    
    const div = document.createElement('div');
    div.className = 'clock-number';
    div.setAttribute('data-val', val);
    
    let displayVal = val;
    if (mode === 'minutes' && val === 0) displayVal = '00';
    else if (mode === 'minutes' && val < 10) displayVal = '0' + val;
    
    div.textContent = displayVal;
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;
    
    clockNumbers.appendChild(div);
  });
  
  updateClockSelection();
}

function updateNumberSelection() {
  const numbers = document.querySelectorAll('.clock-number');
  numbers.forEach((numDiv) => {
    const val = parseInt(numDiv.getAttribute('data-val'));
    if (currentClockMode === 'hours' && val === selectedHour) {
      numDiv.classList.add('selected');
    } else if (currentClockMode === 'minutes' && val === selectedMinute) {
      numDiv.classList.add('selected');
    } else {
      numDiv.classList.remove('selected');
    }
  });
}

function updateClockSelection() {
  const rotation = currentClockMode === 'hours' 
    ? (selectedHour === 12 ? 0 : selectedHour * 30)
    : (selectedMinute / 5 * 30);
    
  document.getElementById('clockHand').style.transform = `rotate(${rotation}deg)`;
  updateNumberSelection();
}

function setClockMode(mode) {
  currentClockMode = mode;
  if (mode === 'hours') {
    document.getElementById('timeHourDisp').classList.add('active');
    document.getElementById('timeMinDisp').classList.remove('active');
  } else {
    document.getElementById('timeHourDisp').classList.remove('active');
    document.getElementById('timeMinDisp').classList.add('active');
  }
  renderClock(mode);
}

function updateTimeDisplay() {
  document.getElementById('timeHourDisp').textContent = selectedHour === 0 ? 12 : selectedHour;
  document.getElementById('timeMinDisp').textContent = selectedMinute < 10 ? '0' + selectedMinute : selectedMinute;
}

function updateHiddenInput() {
  let h = selectedHour;
  if (selectedAMPM === 'PM' && h < 12) h += 12;
  if (selectedAMPM === 'AM' && h === 12) h = 0;
  const hStr = h < 10 ? '0' + h : h;
  const mStr = selectedMinute < 10 ? '0' + selectedMinute : selectedMinute;
  document.getElementById('eventTime').value = `${hStr}:${mStr}`;
  // Trigger change for calendar capacity update
  document.getElementById('eventTime').dispatchEvent(new Event('change'));
}
