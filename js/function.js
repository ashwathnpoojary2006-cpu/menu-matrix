// ============================================
// MenuMatrix — Function Selection Page Logic
// ============================================

// === FUNCTION DATA (10 Indian Event Types) ===
const FUNCTIONS = [
  {
    id: "wedding",
    name: "Wedding",
    desc: "Grand and elegant menus fit for the most special day of your life. Multi-course feasts with royal presentation.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=500&h=350&fit=crop",
    tags: ["wedding", "shaadi", "marriage", "vivah", "kalyanam", "grand"],
    popular: true,
    dishCount: "50+ dishes"
  },
  {
    id: "engagement",
    name: "Engagement",
    desc: "Celebrate the beginning of a new journey with a beautifully curated feast for family and friends.",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=500&h=350&fit=crop",
    tags: ["engagement", "ring ceremony", "nischayam", "roka", "sagai"],
    popular: false,
    dishCount: "35+ dishes"
  },
  {
    id: "birthday",
    name: "Birthday",
    desc: "Fun and vibrant food spreads for celebrations of every age — from kids' parties to milestone birthdays.",
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&h=350&fit=crop",
    tags: ["birthday", "party", "celebration", "kids", "milestone"],
    popular: true,
    dishCount: "40+ dishes"
  },
  {
    id: "corporate",
    name: "Corporate Event",
    desc: "Professional dining that impresses clients, partners, and employees. From seminars to annual galas.",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=350&fit=crop",
    tags: ["corporate", "office", "business", "conference", "seminar", "meeting", "gala"],
    popular: true,
    dishCount: "45+ dishes"
  },
  {
    id: "festival",
    name: "Festival",
    desc: "Traditional festive flavors for Diwali, Pongal, Eid, Navratri, Onam, Christmas and more.",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=500&h=350&fit=crop",
    tags: ["festival", "diwali", "pongal", "eid", "navratri", "onam", "christmas", "holi", "ugadi"],
    popular: true,
    dishCount: "55+ dishes"
  },
  {
    id: "houseparty",
    name: "House Party",
    desc: "Casual yet delicious menus perfect for intimate home gatherings, get-togethers, and kitty parties.",
    image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=500&h=350&fit=crop",
    tags: ["house party", "home", "get together", "kitty party", "casual", "gathering"],
    popular: false,
    dishCount: "30+ dishes"
  },
  {
    id: "housewarming",
    name: "Housewarming",
    desc: "Griha Pravesh menus with traditional sweets, festive specialties, and auspicious dishes.",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&h=350&fit=crop",
    tags: ["housewarming", "griha pravesh", "new house", "vastu"],
    popular: false,
    dishCount: "35+ dishes"
  },
  {
    id: "babyshower",
    name: "Baby Shower",
    desc: "Joyful menus for naming ceremonies, seemantham, valaikappu, and baby shower celebrations.",
    image: "https://images.unsplash.com/photo-1544126592-807ade215a0b?w=500&h=350&fit=crop",
    tags: ["baby shower", "naming ceremony", "seemantham", "valaikappu", "cradle ceremony"],
    popular: false,
    dishCount: "30+ dishes"
  },
  {
    id: "anniversary",
    name: "Anniversary",
    desc: "Romantic and elegant menus to mark your years of togetherness — silver jubilee, golden jubilee and more.",
    image: "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?w=500&h=350&fit=crop",
    tags: ["anniversary", "silver jubilee", "golden jubilee", "couple", "romantic"],
    popular: false,
    dishCount: "40+ dishes"
  },
  {
    id: "religious",
    name: "Religious Function",
    desc: "Pure vegetarian menus for pooja, havan, satyanarayan katha, temple events, and spiritual gatherings.",
    image: "https://images.unsplash.com/photo-1567591370504-80c7e890e269?w=500&h=350&fit=crop",
    tags: ["religious", "pooja", "puja", "havan", "temple", "satyanarayan", "spiritual", "homam"],
    popular: false,
    dishCount: "35+ dishes"
  },
  {
    id: "reception",
    name: "Reception",
    desc: "Grand reception menus for post-wedding celebrations, sangeet nights, and cocktail dinners.",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500&h=350&fit=crop",
    tags: ["reception", "wedding reception", "cocktail", "dinner", "sangeet night"],
    popular: true,
    dishCount: "50+ dishes"
  },
  {
    id: "mehendi",
    name: "Mehendi / Sangeet",
    desc: "Colorful and lively menus for mehendi, haldi, sangeet ceremonies with chaat counters and live food stalls.",
    image: "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=500&h=350&fit=crop",
    tags: ["mehendi", "mehndi", "sangeet", "haldi", "chaat", "pre-wedding"],
    popular: false,
    dishCount: "40+ dishes"
  },
  {
    id: "retirement",
    name: "Retirement Party",
    desc: "Elegant farewell menus to honor years of dedicated service with a memorable culinary send-off.",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&h=350&fit=crop",
    tags: ["retirement", "farewell", "send off", "office party", "superannuation"],
    popular: false,
    dishCount: "35+ dishes"
  },
  {
    id: "threadceremony",
    name: "Thread Ceremony",
    desc: "Traditional pure veg menus for upanayanam, janeu, and sacred thread ceremonies.",
    image: "https://images.unsplash.com/photo-1606491048802-8342506d6471?w=500&h=350&fit=crop",
    tags: ["thread ceremony", "upanayanam", "janeu", "sacred thread", "brahmopadesam", "poonal"],
    popular: false,
    dishCount: "30+ dishes"
  },
  {
    id: "graduation",
    name: "Graduation Party",
    desc: "Celebratory menus for convocation parties, farewell dinners, and academic milestones.",
    image: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=500&h=350&fit=crop",
    tags: ["graduation", "convocation", "farewell", "college", "school", "university"],
    popular: false,
    dishCount: "30+ dishes"
  }
];

// === STATE ===
let searchQuery = "";

// === INIT ===
document.addEventListener("DOMContentLoaded", () => {
  renderFunctions(FUNCTIONS);
  initSearch();
});

// === RENDER FUNCTION CARDS ===
function renderFunctions(functions) {
  const grid = document.getElementById("functionGrid");
  const noResults = document.getElementById("noResults");
  const resultCount = document.getElementById("resultCount");

  if (functions.length === 0) {
    grid.style.display = "none";
    noResults.style.display = "flex";
    resultCount.textContent = "No results found";
    return;
  }

  grid.style.display = "grid";
  noResults.style.display = "none";

  if (searchQuery) {
    resultCount.textContent = `${functions.length} function${functions.length !== 1 ? 's' : ''} found`;
  } else {
    resultCount.textContent = "";
  }

  grid.innerHTML = functions.map((fn, index) => `
    <div class="function-card reveal visible" style="transition-delay: ${index * 0.05}s;" onclick="selectFunction('${fn.id}')">
      <div class="function-card-img-wrapper">
        <img class="function-card-img" src="${fn.image}" alt="${fn.name}" loading="lazy">
        ${fn.popular ? '<span class="function-badge">Popular</span>' : ''}
        <div class="function-card-overlay">
          <span class="function-select-text">Select This Function</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
      <div class="function-card-body">
        <h3 class="function-card-title">${fn.name}</h3>
        <p class="function-card-desc">${fn.desc}</p>
        <div class="function-card-footer">
          <span class="function-dish-count">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
            ${fn.dishCount}
          </span>
          <span class="function-card-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </div>
      </div>
    </div>
  `).join("");
}

// === SEARCH ===
function initSearch() {
  const input = document.getElementById("functionSearch");
  const clearBtn = document.getElementById("searchClear");

  input.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    clearBtn.style.display = searchQuery ? "flex" : "none";

    const filtered = FUNCTIONS.filter(fn => {
      const nameMatch = fn.name.toLowerCase().includes(searchQuery);
      const descMatch = fn.desc.toLowerCase().includes(searchQuery);
      const tagMatch = fn.tags.some(tag => tag.toLowerCase().includes(searchQuery));
      return nameMatch || descMatch || tagMatch;
    });

    renderFunctions(filtered);
  });

  // Focus search on page load
  setTimeout(() => input.focus(), 500);
}

function clearSearch() {
  const input = document.getElementById("functionSearch");
  input.value = "";
  searchQuery = "";
  document.getElementById("searchClear").style.display = "none";
  renderFunctions(FUNCTIONS);
  input.focus();
}

// === SELECT FUNCTION ===
function selectFunction(functionId) {
  const fn = FUNCTIONS.find(f => f.id === functionId);
  if (!fn) return;

  // Clear stale data from any previous booking flow
  ['mm_order_id', 'mm_order_code', 'mm_payment_done', 'mm_last_code', 'mm_last_oid',
   'menumatrix_details', 'menumatrix_menu'].forEach(k => localStorage.removeItem(k));

  // Save to localStorage
  localStorage.setItem("menumatrix_function", JSON.stringify({
    id: fn.id,
    name: fn.name,
    image: fn.image,
    dishCount: fn.dishCount
  }));

  // Show toast and navigate
  showToast(`${fn.name} selected!`);

  setTimeout(() => {
    window.location.href = "details.html";
  }, 600);
}

// === TOAST ===
function showToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}
