// ============================================
// MenuMatrix — Menu Builder Page Logic
// ============================================

// === STATE ===
let currentMode = "package"; // 'package' or 'custom'
let selectedItems = new Map(); // id -> { item, qty }
let selectedPackage = null;
let activeCategory = "starters";
let eventDetails = null;
let functionData = null;
let cartOpen = false;

// === INIT ===
document.addEventListener("DOMContentLoaded", () => {
  loadEventData();
  populateEventSummary();
  renderPackages();
  renderCategoryTabs();
  renderCustomItems();
  updateCart();
});

// === LOAD DATA FROM LOCALSTORAGE ===
function loadEventData() {
  const fnStored = localStorage.getItem("menumatrix_function");
  const detailsStored = localStorage.getItem("menumatrix_details");

  if (!fnStored) {
    window.location.href = "function.html";
    return;
  }
  if (!detailsStored) {
    window.location.href = "details.html";
    return;
  }

  functionData = JSON.parse(fnStored);
  eventDetails = JSON.parse(detailsStored);
}

// === POPULATE EVENT SUMMARY BAR ===
function populateEventSummary() {
  if (!functionData || !eventDetails) return;

  document.getElementById("summaryEvent").textContent = functionData.name;

  // Format date
  if (eventDetails.date) {
    const d = new Date(eventDetails.date);
    const options = { day: "numeric", month: "short", year: "numeric" };
    document.getElementById("summaryDate").textContent = d.toLocaleDateString("en-IN", options);
  }

  document.getElementById("summaryGuests").textContent =
    (eventDetails.guestCount || 100) + " Guests";

  const prefMap = { veg: "Vegetarian", nonveg: "Non-Veg", both: "Veg + Non-Veg" };
  document.getElementById("summaryPref").textContent =
    prefMap[eventDetails.foodPreference] || "—";
}

// === MODE SWITCHING ===
function switchMode(mode) {
  currentMode = mode;

  document.getElementById("modePackage").classList.toggle("active", mode === "package");
  document.getElementById("modeCustom").classList.toggle("active", mode === "custom");

  document.getElementById("packageSection").style.display = mode === "package" ? "" : "none";
  document.getElementById("customSection").style.display = mode === "custom" ? "" : "none";

  // If switching to custom, clear package selection and refresh builder items
  if (mode === "custom") {
    selectedPackage = null;
    renderCategoryTabs();
    renderCustomItems();
  }
}

// ==========================================
// READY-MADE PACKAGES
// ==========================================

function renderPackages() {
  const eventId = functionData?.id || "wedding";
  let packages = getPackagesByEvent(eventId);

  // If no packages for this event, show all packages
  if (packages.length === 0) {
    packages = PACKAGES;
  }

  const grid = document.getElementById("packagesGrid");

  grid.innerHTML = packages.map((pkg, index) => {
    const items = pkg.items.map(id => getItemById(id)).filter(Boolean);
    const categoryGroups = groupByCategory(items);

    return `
      <div class="package-card reveal visible" style="transition-delay: ${index * 0.1}s;" id="pkg-${pkg.id}">
        <div class="package-header">
          <div class="package-badge">${pkg.event.charAt(0).toUpperCase() + pkg.event.slice(1)}</div>
          <h3 class="package-name">${pkg.name}</h3>
          <p class="package-desc">${pkg.desc}</p>
          <div class="package-price-row">
            <div class="package-price">
              <span class="price-currency">₹</span>
              <span class="price-amount">${pkg.price.toLocaleString("en-IN")}</span>
              <span class="price-per">/plate</span>
            </div>
            <div class="package-item-count">${items.length} items</div>
          </div>
        </div>
        <div class="package-items-list">
          ${Object.entries(categoryGroups).map(([catId, catItems]) => {
            const cat = CATEGORIES.find(c => c.id === catId);
            return `
              <div class="package-category">
                <div class="package-cat-label">${cat ? cat.name : catId}</div>
                <div class="package-cat-items">
                  ${catItems.map(item => `
                    <div class="package-item" id="pkg-item-${pkg.id}-${item.id}">
                      <img src="${item.image}" alt="${item.name}" loading="lazy">
                      <div class="package-item-info">
                        <span class="package-item-name">${item.name}</span>
                        <span class="package-item-price">₹${item.price}</span>
                      </div>
                      <button class="package-item-remove" onclick="event.stopPropagation(); togglePackageItem('${pkg.id}', ${item.id})" title="Remove item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  `).join("")}
                </div>
              </div>
            `;
          }).join("")}
        </div>
        <div class="package-add-section">
          <button class="package-add-item-btn" onclick="event.stopPropagation(); openAddItemModal('${pkg.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add More Items
          </button>
        </div>
        <div class="package-footer">
          <button class="btn-primary package-select-btn" onclick="selectPackage('${pkg.id}')">
            <span>Select This Package</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function groupByCategory(items) {
  const groups = {};
  items.forEach(item => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });
  return groups;
}

// Package item management
const packageModifications = {}; // pkgId -> { removed: Set, added: Set }

function getPackageModifications(pkgId) {
  if (!packageModifications[pkgId]) {
    packageModifications[pkgId] = { removed: new Set(), added: new Set() };
  }
  return packageModifications[pkgId];
}

function togglePackageItem(pkgId, itemId) {
  const pkg = PACKAGES.find(p => p.id === pkgId);
  if (!pkg) return;

  const mods = getPackageModifications(pkgId);
  const itemEl = document.getElementById(`pkg-item-${pkgId}-${itemId}`);

  if (pkg.items.includes(itemId)) {
    // Original item — toggle removal
    if (mods.removed.has(itemId)) {
      mods.removed.delete(itemId);
      if (itemEl) itemEl.classList.remove("removed");
      showToast("Item restored!");
    } else {
      mods.removed.add(itemId);
      if (itemEl) itemEl.classList.add("removed");
      showToast("Item removed!");
    }
  } else {
    // Added item — remove entirely
    mods.added.delete(itemId);
    if (itemEl) itemEl.remove();
    showToast("Item removed!");
  }

  updatePackagePrice(pkgId);
}

function updatePackagePrice(pkgId) {
  const pkg = PACKAGES.find(p => p.id === pkgId);
  if (!pkg) return;

  const mods = getPackageModifications(pkgId);
  let totalPrice = 0;

  // Original items minus removed
  pkg.items.forEach(id => {
    if (!mods.removed.has(id)) {
      const item = getItemById(id);
      if (item) totalPrice += item.price;
    }
  });

  // Added items
  mods.added.forEach(id => {
    const item = getItemById(id);
    if (item) totalPrice += item.price;
  });

  const priceEl = document.querySelector(`#pkg-${pkgId} .price-amount`);
  if (priceEl) priceEl.textContent = totalPrice.toLocaleString("en-IN");

  const countEl = document.querySelector(`#pkg-${pkgId} .package-item-count`);
  const itemCount = pkg.items.length - mods.removed.size + mods.added.size;
  if (countEl) countEl.textContent = `${itemCount} items`;
}

function selectPackage(pkgId) {
  const pkg = PACKAGES.find(p => p.id === pkgId);
  if (!pkg) return;

  selectedPackage = pkgId;
  selectedItems.clear();

  const mods = getPackageModifications(pkgId);

  // Add original items minus removed
  pkg.items.forEach(id => {
    if (!mods.removed.has(id)) {
      const item = getItemById(id);
      if (item) selectedItems.set(id, { item, qty: 1 });
    }
  });

  // Add added items
  mods.added.forEach(id => {
    const item = getItemById(id);
    if (item) selectedItems.set(id, { item, qty: 1 });
  });

  updateCart();
  showToast(`${pkg.name} selected!`);

  // Highlight selected package card
  document.querySelectorAll(".package-card").forEach(card => {
    card.classList.remove("selected");
  });
  document.getElementById(`pkg-${pkgId}`)?.classList.add("selected");
}

// Add Item Modal for packages
function openAddItemModal(pkgId) {
  const eventId = functionData?.id || "wedding";
  const pkg = PACKAGES.find(p => p.id === pkgId);
  if (!pkg) return;

  const mods = getPackageModifications(pkgId);
  const currentItems = new Set([
    ...pkg.items.filter(id => !mods.removed.has(id)),
    ...mods.added
  ]);

  const availableItems = getItemsByEvent(eventId).filter(item => !currentItems.has(item.id));

  if (availableItems.length === 0) {
    showToast("All available items are already in this package!");
    return;
  }

  // Create modal
  const modal = document.createElement("div");
  modal.className = "add-item-modal";
  modal.id = "addItemModal";
  modal.innerHTML = `
    <div class="add-item-modal-content">
      <div class="add-modal-header">
        <h3>Add Items to ${pkg.name}</h3>
        <button class="add-modal-close" onclick="closeAddItemModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="add-modal-body">
        ${CATEGORIES.map(cat => {
          const catItems = availableItems.filter(item => item.category === cat.id);
          if (catItems.length === 0) return "";
          return `
            <div class="add-modal-category">
              <h4 class="add-modal-cat-title">${cat.name}</h4>
              <div class="add-modal-items">
                ${catItems.map(item => `
                  <div class="add-modal-item" onclick="addItemToPackage('${pkgId}', ${item.id})">
                    <img src="${item.image}" alt="${item.name}" loading="lazy">
                    <div class="add-modal-item-info">
                      <span class="add-modal-item-name">${item.name}</span>
                      <span class="add-modal-item-desc">${item.desc}</span>
                    </div>
                    <span class="add-modal-item-price">₹${item.price}</span>
                    <div class="add-modal-item-plus">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("active"));
}

function addItemToPackage(pkgId, itemId) {
  const mods = getPackageModifications(pkgId);
  const item = getItemById(itemId);
  if (!item) return;

  mods.added.add(itemId);

  // Re-render package card items section
  closeAddItemModal();
  renderPackages();
  updatePackagePrice(pkgId);
  showToast(`${item.name} added!`);
}

function closeAddItemModal() {
  const modal = document.getElementById("addItemModal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => modal.remove(), 300);
  }
}

// ==========================================
// CUSTOM MENU BUILDER
// ==========================================

function renderCategoryTabs() {
  const eventId = functionData?.id || "wedding";
  const tabs = document.getElementById("categoryTabs");

  let firstCatSet = false;
  tabs.innerHTML = CATEGORIES.map((cat, i) => {
    const itemCount = getItemsByCategory(cat.id, eventId).length;
    if (itemCount === 0) return "";

    // Auto-select first available category
    if (!firstCatSet) {
      activeCategory = cat.id;
      firstCatSet = true;
    }

    return `
      <button class="category-tab ${cat.id === activeCategory ? 'active' : ''}" 
              data-cat="${cat.id}" 
              onclick="setActiveCategory('${cat.id}')">
        <span class="cat-tab-name">${cat.name}</span>
        <span class="cat-tab-count">${itemCount}</span>
      </button>
    `;
  }).join("");

  // Render items for whichever category is now active
  renderCustomItems();
}

function setActiveCategory(catId) {
  activeCategory = catId;

  document.querySelectorAll(".category-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.cat === catId);
  });

  renderCustomItems();
}

function renderCustomItems() {
  const eventId = functionData?.id || "wedding";
  const items = getItemsByCategory(activeCategory, eventId);
  const grid = document.getElementById("customItemsGrid");

  grid.innerHTML = items.map((item, index) => {
    const isSelected = selectedItems.has(item.id);
    const qty = isSelected ? selectedItems.get(item.id).qty : 0;

    return `
      <div class="custom-item-card ${isSelected ? 'selected' : ''}" 
           id="custom-item-${item.id}" 
           style="animation-delay: ${index * 0.05}s;">
        <div class="custom-item-img-wrapper">
          <img src="${item.image}" alt="${item.name}" loading="lazy">
          <div class="custom-item-price-tag">₹${item.price}</div>
          ${isSelected ? '<div class="custom-item-selected-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>' : ''}
        </div>
        <div class="custom-item-body">
          <h4 class="custom-item-name">${item.name}</h4>
          <p class="custom-item-desc">${item.desc}</p>
          <div class="custom-item-actions">
            ${isSelected ? `
              <div class="custom-qty-controls">
                <button class="qty-btn minus" onclick="adjustItemQty(${item.id}, -1)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <span class="qty-value">${qty}</span>
                <button class="qty-btn plus" onclick="adjustItemQty(${item.id}, 1)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
            ` : `
              <button class="custom-add-btn" onclick="addCustomItem(${item.id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function addCustomItem(itemId) {
  const item = getItemById(itemId);
  if (!item) return;

  selectedItems.set(itemId, { item, qty: 1 });
  selectedPackage = null;

  renderCustomItems();
  updateCart();
  showToast(`${item.name} added!`);
}

function adjustItemQty(itemId, delta) {
  if (!selectedItems.has(itemId)) return;

  const entry = selectedItems.get(itemId);
  entry.qty += delta;

  if (entry.qty <= 0) {
    selectedItems.delete(itemId);
    showToast(`${entry.item.name} removed`);
  }

  renderCustomItems();
  updateCart();
}

function removeItem(itemId) {
  if (selectedItems.has(itemId)) {
    const name = selectedItems.get(itemId).item.name;
    selectedItems.delete(itemId);
    renderCustomItems();
    updateCart();
    showToast(`${name} removed`);
  }
}

// ==========================================
// CART
// ==========================================

function updateCart() {
  const count = selectedItems.size;
  const guests = eventDetails?.guestCount || 100;

  // Calculate per-plate total
  let perPlate = 0;
  selectedItems.forEach(({ item, qty }) => {
    perPlate += item.price * qty;
  });

  const grandTotal = perPlate * guests;

  // Update floating cart visibility
  const floatingCart = document.getElementById("floatingCart");
  floatingCart.style.display = count > 0 ? "flex" : "none";

  // Update counts
  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartTotal").textContent = `₹${perPlate.toLocaleString("en-IN")}`;

  // Update drawer
  document.getElementById("cartItemsTotal").textContent = `₹${perPlate.toLocaleString("en-IN")}`;
  document.getElementById("cartGuestCount").textContent = guests.toLocaleString("en-IN");
  document.getElementById("cartPerPlateTotal").textContent = `₹${perPlate.toLocaleString("en-IN")}/plate`;
  document.getElementById("cartGrandTotal").textContent = `₹${grandTotal.toLocaleString("en-IN")}`;

  // Render cart items list
  const list = document.getElementById("cartItemsList");
  if (count === 0) {
    list.innerHTML = `<div class="cart-empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      <p>No items selected yet</p>
    </div>`;
    return;
  }

  const grouped = {};
  selectedItems.forEach(({ item, qty }) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push({ item, qty });
  });

  list.innerHTML = Object.entries(grouped).map(([catId, entries]) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    return `
      <div class="cart-category-group">
        <div class="cart-cat-label">${cat ? cat.name : catId}</div>
        ${entries.map(({ item, qty }) => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
              <span class="cart-item-name">${item.name}</span>
              <span class="cart-item-price">₹${item.price}${qty > 1 ? ` × ${qty}` : ''}</span>
            </div>
            <button class="cart-item-remove" onclick="removeItem(${item.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        `).join("")}
      </div>
    `;
  }).join("");
}

function toggleCartDrawer() {
  cartOpen = !cartOpen;
  const drawer = document.getElementById("cartDrawer");
  const backdrop = document.getElementById("cartBackdrop");
  const chevron = document.getElementById("cartChevron");

  drawer.classList.toggle("open", cartOpen);
  backdrop.classList.toggle("active", cartOpen);
  chevron.style.transform = cartOpen ? "rotate(180deg)" : "";
}

function clearCart() {
  selectedItems.clear();
  selectedPackage = null;

  document.querySelectorAll(".package-card").forEach(c => c.classList.remove("selected"));
  renderCustomItems();
  updateCart();

  if (cartOpen) toggleCartDrawer();
  showToast("Cart cleared");
}

function proceedToPayment() {
  if (selectedItems.size === 0) {
    showToast("Please select at least one item");
    return;
  }

  // Save menu data to localStorage
  const menuData = {
    items: Array.from(selectedItems.entries()).map(([id, { item, qty }]) => ({
      id, name: item.name, price: item.price, qty, category: item.category
    })),
    perPlate: Array.from(selectedItems.values()).reduce((sum, { item, qty }) => sum + item.price * qty, 0),
    guestCount: eventDetails?.guestCount || 100,
    packageId: selectedPackage
  };

  localStorage.setItem("menumatrix_menu", JSON.stringify(menuData));

  // Clear stale order data — menu changed, old order had different items/pricing
  ['mm_order_id', 'mm_order_code', 'mm_payment_done', 'mm_last_code', 'mm_last_oid', 'mm_order_submitting', 'mm_submission_id']
    .forEach(k => localStorage.removeItem(k));

  showToast("Menu saved! Proceeding to payment...");

  setTimeout(() => {
    window.location.href = "payment.html";
  }, 800);
}

// === TOAST ===
function showToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}
