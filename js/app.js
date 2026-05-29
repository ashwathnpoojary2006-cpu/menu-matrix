// ============================================
// MenuMatrix — App Logic
// ============================================

// === STATE ===
let selectedEvent = null;
let selectedCategory = "all";
let cart = [];
let cartOpen = false;

// === INIT ===
document.addEventListener("DOMContentLoaded", () => {
  renderEvents();
  initNavScroll();
});

// === NAVBAR SCROLL ===
function initNavScroll() {
  const navbar = document.getElementById("navbar");
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 60);
  });
}

// === EVENTS ===
function renderEvents() {
  const grid = document.getElementById("eventsGrid");
  grid.innerHTML = EVENTS.map(ev => {
    const count = getItemsByEvent(ev.id).length;
    return `
      <div class="event-card" id="event-${ev.id}" onclick="selectEvent('${ev.id}')"
           style="--card-color: ${ev.color}; --card-accent: ${ev.accent};">
        <span class="event-icon">${ev.icon}</span>
        <div class="event-name">${ev.name}</div>
        <div class="event-count">${count} dishes available</div>
      </div>
    `;
  }).join("");
}

function selectEvent(eventId) {
  selectedEvent = eventId;
  selectedCategory = "all";

  // Update active state
  document.querySelectorAll(".event-card").forEach(c => c.classList.remove("active"));
  document.getElementById(`event-${eventId}`).classList.add("active");

  const ev = EVENTS.find(e => e.id === eventId);

  // Show menu & packages
  const menuSection = document.getElementById("menu");
  const pkgSection = document.getElementById("packages");
  menuSection.style.display = "block";
  pkgSection.style.display = "block";

  // Update tag
  document.getElementById("menuEventTag").textContent = `${ev.name} Menu`;

  renderCategoryTabs();
  renderMenu();
  renderPackages();

  // Smooth scroll to menu
  setTimeout(() => {
    menuSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

// === CATEGORIES ===
function renderCategoryTabs() {
  const tabs = document.getElementById("categoryTabs");
  const eventItems = getItemsByEvent(selectedEvent);
  const availableCategories = [...new Set(eventItems.map(i => i.category))];

  let html = `<button class="cat-tab ${selectedCategory === 'all' ? 'active' : ''}" onclick="filterCategory('all')">All</button>`;

  CATEGORIES.forEach(cat => {
    if (availableCategories.includes(cat.id)) {
      html += `<button class="cat-tab ${selectedCategory === cat.id ? 'active' : ''}" onclick="filterCategory('${cat.id}')">${cat.icon} ${cat.name}</button>`;
    }
  });

  tabs.innerHTML = html;
}

function filterCategory(catId) {
  selectedCategory = catId;
  renderCategoryTabs();
  renderMenu();
}

// === MENU ===
function renderMenu() {
  const grid = document.getElementById("menuGrid");
  let items = getItemsByEvent(selectedEvent);

  if (selectedCategory !== "all") {
    items = items.filter(i => i.category === selectedCategory);
  }

  grid.innerHTML = items.map(item => {
    const inCart = cart.find(c => c.id === item.id);
    return `
      <div class="menu-card ${inCart ? 'in-cart' : ''}" id="card-${item.id}" onclick="toggleItem(${item.id})">
        <div class="menu-card-img-wrapper">
          <img class="menu-card-img" src="${item.image}" alt="${item.name}" loading="lazy">
          <div class="menu-card-badge">✓ Added</div>
        </div>
        <div class="menu-card-body">
          <div class="menu-card-name">${item.name}</div>
          <div class="menu-card-desc">${item.desc}</div>
          <div class="menu-card-footer">
            <span class="menu-card-price">₹${item.price}</span>
            <button class="menu-card-add">${inCart ? '✓' : '+'}</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// === CART LOGIC ===
function toggleItem(itemId) {
  const existing = cart.find(c => c.id === itemId);
  if (existing) {
    cart = cart.filter(c => c.id !== itemId);
    showToast("Item removed");
  } else {
    cart.push({ id: itemId, qty: 1 });
    showToast("Item added! 🎉");
  }
  updateCartUI();
  renderMenu();
}

function changeQty(itemId, delta) {
  const item = cart.find(c => c.id === itemId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.id !== itemId);
  }
  updateCartUI();
  renderMenu();
}

function clearCart() {
  cart = [];
  updateCartUI();
  renderMenu();
  showToast("Cart cleared");
}

function toggleCart() {
  cartOpen = !cartOpen;
  document.getElementById("cartSidebar").classList.toggle("open", cartOpen);
  document.getElementById("cartOverlay").classList.toggle("open", cartOpen);
  document.body.style.overflow = cartOpen ? "hidden" : "";
}

function updateCartUI() {
  const countEl = document.getElementById("cartCount");
  const total = cart.reduce((sum, c) => sum + c.qty, 0);
  countEl.textContent = total;
  countEl.classList.toggle("visible", total > 0);

  const itemsEl = document.getElementById("cartItems");
  const emptyEl = document.getElementById("cartEmpty");
  const footerEl = document.getElementById("cartFooter");

  if (cart.length === 0) {
    emptyEl.style.display = "block";
    footerEl.style.display = "none";
    itemsEl.innerHTML = emptyEl.outerHTML;
    return;
  }

  footerEl.style.display = "block";
  let totalPrice = 0;

  itemsEl.innerHTML = cart.map(ci => {
    const item = getItemById(ci.id);
    totalPrice += item.price * ci.qty;
    return `
      <div class="cart-item">
        <img class="cart-item-img" src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">₹${item.price * ci.qty}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="event.stopPropagation(); changeQty(${ci.id}, -1)">−</button>
          <span class="qty-num">${ci.qty}</span>
          <button class="qty-btn" onclick="event.stopPropagation(); changeQty(${ci.id}, 1)">+</button>
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("cartTotal").textContent = `₹${totalPrice.toLocaleString('en-IN')}`;
}

// === PACKAGES ===
function renderPackages() {
  const grid = document.getElementById("packagesGrid");
  const pkgs = getPackagesByEvent(selectedEvent);

  if (pkgs.length === 0) {
    grid.innerHTML = `<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">No packages available for this event.</p>`;
    return;
  }

  grid.innerHTML = pkgs.map(pkg => {
    const items = pkg.items.map(id => getItemById(id)).filter(Boolean);
    return `
      <div class="pkg-card" onclick="addPackageToCart('${pkg.id}')">
        <div class="pkg-card-header">
          <div class="pkg-card-name">${pkg.name}</div>
          <div class="pkg-card-price">
            ₹${pkg.price.toLocaleString('en-IN')}
            <span class="pkg-card-price-label">${pkg.perPlate ? 'per plate' : ''}</span>
          </div>
        </div>
        <div class="pkg-card-desc">${pkg.desc}</div>
        <div class="pkg-card-items">
          ${items.map(i => `<span class="pkg-item-chip">${i.name}</span>`).join("")}
        </div>
        <button class="pkg-card-btn">Add All to Selection →</button>
      </div>
    `;
  }).join("");
}

function addPackageToCart(pkgId) {
  const pkg = PACKAGES.find(p => p.id === pkgId);
  if (!pkg) return;

  let added = 0;
  pkg.items.forEach(itemId => {
    if (!cart.find(c => c.id === itemId)) {
      cart.push({ id: itemId, qty: 1 });
      added++;
    }
  });

  updateCartUI();
  renderMenu();
  showToast(added > 0 ? `Added ${added} items from "${pkg.name}"` : "All items already in cart!");
}

// === TOAST ===
function showToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

// === CHECKOUT ===
function handleCheckout() {
  if (cart.length === 0) return;
  const totalPrice = cart.reduce((sum, c) => {
    const item = getItemById(c.id);
    return sum + item.price * c.qty;
  }, 0);
  const itemCount = cart.reduce((sum, c) => sum + c.qty, 0);
  showToast(`Quote: ${itemCount} items — ₹${totalPrice.toLocaleString('en-IN')} total`);
}
