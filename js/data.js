// ============================================
// MenuMatrix — Food Data & Event Configurations
// ============================================

const EVENTS = [
  { id: "wedding", name: "Wedding", icon: "💒", color: "#e8b4b8", accent: "#c2185b" },
  { id: "birthday", name: "Birthday", icon: "🎂", color: "#b8d4e8", accent: "#1565c0" },
  { id: "corporate", name: "Corporate", icon: "🏢", color: "#b8e8c0", accent: "#2e7d32" },
  { id: "festival", name: "Festival", icon: "🎉", color: "#e8d4b8", accent: "#e65100" },
  { id: "houseparty", name: "House Party", icon: "🏠", color: "#d4b8e8", accent: "#6a1b9a" },
];

const CATEGORIES = [
  { id: "starters", name: "Starters", icon: "🥗" },
  { id: "maincourse", name: "Main Course", icon: "🍛" },
  { id: "breads", name: "Breads", icon: "🫓" },
  { id: "rice", name: "Rice", icon: "🍚" },
  { id: "desserts", name: "Desserts", icon: "🍮" },
  { id: "beverages", name: "Beverages", icon: "🥤" },
];

const MENU_ITEMS = [
  // === STARTERS ===
  { id: 1, name: "Paneer Tikka", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop", category: "starters", price: 60, events: ["wedding", "birthday", "corporate", "festival", "houseparty"], desc: "Marinated cottage cheese grilled to perfection" },
  { id: 2, name: "Veg Spring Rolls", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop", category: "starters", price: 70, events: ["birthday", "corporate", "houseparty"], desc: "Crispy rolls stuffed with fresh vegetables" },
  { id: 3, name: "Chicken Tikka", image: "assets/item_chicken_tikka_1778437266291.png", category: "starters", price: 65, events: ["wedding", "birthday", "corporate", "festival", "houseparty"], desc: "Tender chicken marinated in aromatic spices" },
  { id: 4, name: "Samosa Platter", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop", category: "starters", price: 85, events: ["festival", "houseparty", "birthday"], desc: "Golden crispy samosas with chutney" },
  { id: 5, name: "Fish Amritsari", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop", category: "starters", price: 85, events: ["wedding", "corporate", "festival"], desc: "Crispy battered fish with a tangy twist" },
  { id: 6, name: "Mushroom Galouti", image: "https://images.unsplash.com/photo-1625938146369-adc83368bda7?w=400&h=300&fit=crop", category: "starters", price: 70, events: ["wedding", "corporate"], desc: "Melt-in-mouth mushroom kebabs" },

  // === MAIN COURSE ===
  { id: 7, name: "Paneer Butter Masala", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop", category: "maincourse", price: 100, events: ["wedding", "birthday", "corporate", "festival", "houseparty"], desc: "Rich and creamy paneer in tomato gravy" },
  { id: 8, name: "Dal Makhani", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop", category: "maincourse", price: 100, events: ["wedding", "birthday", "corporate", "festival", "houseparty"], desc: "Slow-cooked black lentils in butter" },
  { id: 9, name: "Butter Chicken", image: "assets/item_butter_chicken_1778437304840.png", category: "maincourse", price: 105, events: ["wedding", "birthday", "corporate", "houseparty"], desc: "Classic creamy chicken curry" },
  { id: 10, name: "Mutton Rogan Josh", image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=400&h=300&fit=crop", category: "maincourse", price: 105, events: ["wedding", "festival"], desc: "Kashmiri-style slow-cooked mutton" },
  { id: 11, name: "Veg Kofta Curry", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop", category: "maincourse", price: 85, events: ["wedding", "birthday", "festival", "houseparty"], desc: "Veggie dumplings in rich gravy" },
  { id: 12, name: "Chole Masala", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop", category: "maincourse", price: 110, events: ["corporate", "festival", "houseparty"], desc: "Spiced chickpeas in tangy tomato sauce" },

  // === BREADS ===
  { id: 13, name: "Butter Naan", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&q=80", category: "breads", price: 30, events: ["wedding", "birthday", "corporate", "festival", "houseparty"], desc: "Soft bread brushed with butter" },
  { id: 14, name: "Garlic Naan", image: "https://images.unsplash.com/photo-1600628421060-939639517883?w=400&h=300&fit=crop", category: "breads", price: 25, events: ["wedding", "birthday", "corporate", "houseparty"], desc: "Naan infused with fresh garlic" },
  { id: 15, name: "Tandoori Roti", image: "https://images.unsplash.com/photo-1604152135912-04a022e23696?w=400&h=300&fit=crop", category: "breads", price: 20, events: ["wedding", "birthday", "corporate", "festival", "houseparty"], desc: "Whole wheat bread from the tandoor" },
  { id: 16, name: "Laccha Paratha", image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400&h=300&fit=crop", category: "breads", price: 35, events: ["wedding", "festival"], desc: "Layered flaky whole wheat bread" },

  // === RICE ===
  { id: 17, name: "Veg Biryani", image: "assets/item_veg_biryani_1778437331478.png", category: "rice", price: 65, events: ["wedding", "birthday", "corporate", "festival", "houseparty"], desc: "Fragrant basmati rice with vegetables" },
  { id: 18, name: "Chicken Biryani", image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=300&fit=crop", category: "rice", price: 75, events: ["wedding", "birthday", "corporate", "houseparty"], desc: "Aromatic rice layered with spiced chicken" },
  { id: 19, name: "Jeera Rice", image: "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=400&h=300&fit=crop", category: "rice", price: 80, events: ["wedding", "birthday", "corporate", "festival", "houseparty"], desc: "Cumin-tempered basmati rice" },
  { id: 20, name: "Mutton Biryani", image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400&h=300&fit=crop", category: "rice", price: 60, events: ["wedding", "festival"], desc: "Royal biryani with tender mutton pieces" },

  // === DESSERTS ===
  { id: 21, name: "Gulab Jamun", image: "assets/item_gulab_jamun_1778437430833.png", category: "desserts", price: 50, events: ["wedding", "birthday", "festival", "houseparty"], desc: "Soft milk dumplings in rose syrup" },
  { id: 22, name: "Rasmalai", image: "https://images.unsplash.com/photo-1571006776655-fdeef677a462?w=400&h=300&fit=crop", category: "desserts", price: 65, events: ["wedding", "birthday", "festival"], desc: "Creamy cottage cheese in saffron milk" },
  { id: 23, name: "Ice Cream Sundae", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop", category: "desserts", price: 50, events: ["birthday", "houseparty"], desc: "Premium ice cream with toppings" },
  { id: 24, name: "Kheer", image: "https://images.unsplash.com/photo-1631452180775-b07a6870be89?w=400&h=300&fit=crop", category: "desserts", price: 65, events: ["wedding", "festival", "corporate"], desc: "Traditional rice pudding" },

  // === BEVERAGES ===
  { id: 25, name: "Masala Chai", image: "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=400&h=300&fit=crop", category: "beverages", price: 30, events: ["corporate", "festival", "houseparty"], desc: "Spiced Indian tea" },
  { id: 26, name: "Fresh Lime Soda", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop", category: "beverages", price: 30, events: ["wedding", "birthday", "corporate", "houseparty"], desc: "Refreshing lime with soda" },
  { id: 27, name: "Mango Lassi", image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&h=300&fit=crop", category: "beverages", price: 35, events: ["wedding", "birthday", "festival", "houseparty"], desc: "Creamy mango yogurt drink" },
  { id: 28, name: "Cold Coffee", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop", category: "beverages", price: 30, events: ["birthday", "corporate", "houseparty"], desc: "Chilled blended coffee with cream" },
];

// Ready-Made Packages
const PACKAGES = [
  {
    id: "pkg1",
    name: "Royal Wedding Feast",
    event: "wedding",
    price: 999,
    perPlate: true,
    items: [1, 3, 7, 9, 14, 18, 21, 22, 27],
    desc: "A lavish selection fit for the grandest celebrations"
  },
  {
    id: "pkg2",
    name: "Birthday Bash",
    event: "birthday",
    price: 749,
    perPlate: true,
    items: [2, 1, 7, 9, 13, 17, 23, 28],
    desc: "Fun and delightful spread for birthday celebrations"
  },
  {
    id: "pkg3",
    name: "Corporate Elegance",
    event: "corporate",
    price: 499,
    perPlate: true,
    items: [6, 1, 8, 12, 14, 19, 24, 25],
    desc: "Professional yet impressive corporate dining"
  },
  {
    id: "pkg4",
    name: "Festival Special",
    event: "festival",
    price: 749,
    perPlate: true,
    items: [4, 5, 10, 11, 16, 20, 21, 22, 27],
    desc: "Traditional festive flavors for every celebration"
  },
  {
    id: "pkg5",
    name: "House Party Mix",
    event: "houseparty",
    price: 499,
    perPlate: true,
    items: [2, 4, 7, 12, 13, 17, 23, 26],
    desc: "Casual and tasty mix perfect for home gatherings"
  },
  {
    id: "pkg6",
    name: "Veg Delight Wedding",
    event: "wedding",
    price: 749,
    perPlate: true,
    items: [1, 6, 7, 8, 11, 14, 16, 17, 22, 24],
    desc: "Pure vegetarian royal wedding menu"
  },
  {
    id: "pkg7",
    name: "Kids Birthday Fun",
    event: "birthday",
    price: 499,
    perPlate: true,
    items: [2, 4, 13, 17, 23, 28],
    desc: "Kid-friendly favorites for a fun birthday"
  },
  {
    id: "pkg8",
    name: "Grand Celebration",
    event: "festival",
    price: 999,
    perPlate: true,
    items: [1, 3, 5, 10, 7, 9, 16, 20, 21, 22, 27],
    desc: "The ultimate festival feast with all the best"
  },
  {
    id: "pkg9",
    name: "Engagement Elegance",
    event: "engagement",
    price: 749,
    perPlate: true,
    items: [1, 3, 7, 8, 14, 17, 21, 27],
    desc: "A refined selection for engagement celebrations"
  },
  {
    id: "pkg10",
    name: "Ring Ceremony Delight",
    event: "engagement",
    price: 749,
    perPlate: true,
    items: [1, 6, 9, 7, 11, 16, 18, 22, 26],
    desc: "Premium feast for the ring ceremony"
  },
  {
    id: "pkg11",
    name: "Engagement Royal",
    event: "engagement",
    price: 999,
    perPlate: true,
    items: [1, 3, 5, 7, 9, 10, 14, 18, 21, 22, 27],
    desc: "Grand royal spread for an unforgettable engagement"
  },
  {
    id: "pkg12",
    name: "Housewarming Classic",
    event: "housewarming",
    price: 499,
    perPlate: true,
    items: [1, 4, 7, 8, 15, 17, 21, 24, 25],
    desc: "Traditional Griha Pravesh menu with auspicious dishes"
  },
  {
    id: "pkg13",
    name: "Griha Pravesh Grand",
    event: "housewarming",
    price: 749,
    perPlate: true,
    items: [1, 6, 7, 8, 11, 14, 16, 17, 21, 22, 24],
    desc: "Lavish housewarming feast with festive specialties"
  },
  {
    id: "pkg14",
    name: "Housewarming Premium",
    event: "housewarming",
    price: 999,
    perPlate: true,
    items: [1, 3, 6, 7, 9, 11, 14, 16, 18, 21, 22, 27],
    desc: "The ultimate housewarming celebration spread"
  },
  {
    id: "pkg15",
    name: "Baby Shower Joy",
    event: "babyshower",
    price: 499,
    perPlate: true,
    items: [1, 2, 7, 8, 13, 17, 23, 26],
    desc: "Joyful and colorful menu for baby celebrations"
  },
  {
    id: "pkg16",
    name: "Seemantham Special",
    event: "babyshower",
    price: 749,
    perPlate: true,
    items: [1, 4, 7, 8, 11, 15, 17, 21, 22, 27],
    desc: "Traditional menu for naming and cradle ceremonies"
  },
  {
    id: "pkg17",
    name: "Baby Shower Grand",
    event: "babyshower",
    price: 749,
    perPlate: true,
    items: [1, 6, 7, 9, 11, 14, 18, 21, 23, 26, 28],
    desc: "Premium baby shower celebration feast"
  },
  {
    id: "pkg18",
    name: "Anniversary Bliss",
    event: "anniversary",
    price: 749,
    perPlate: true,
    items: [1, 3, 7, 9, 14, 18, 22, 26],
    desc: "Romantic dinner for celebrating togetherness"
  },
  {
    id: "pkg19",
    name: "Silver Jubilee Feast",
    event: "anniversary",
    price: 999,
    perPlate: true,
    items: [1, 3, 6, 7, 9, 10, 14, 18, 21, 22, 27],
    desc: "Grand feast for milestone anniversary celebrations"
  },
  {
    id: "pkg20",
    name: "Golden Anniversary",
    event: "anniversary",
    price: 999,
    perPlate: true,
    items: [1, 3, 5, 6, 7, 9, 10, 14, 16, 18, 20, 21, 22, 27],
    desc: "The most lavish anniversary celebration spread"
  },
  {
    id: "pkg21",
    name: "Pure Veg Pooja Menu",
    event: "religious",
    price: 499,
    perPlate: true,
    items: [1, 4, 7, 8, 11, 15, 17, 21, 24, 25],
    desc: "Satvik pure vegetarian menu for religious events"
  },
  {
    id: "pkg22",
    name: "Temple Feast",
    event: "religious",
    price: 749,
    perPlate: true,
    items: [1, 6, 7, 8, 11, 14, 16, 17, 21, 22, 24, 27],
    desc: "Elaborate vegetarian feast for spiritual gatherings"
  },
  {
    id: "pkg23",
    name: "Havan Special",
    event: "religious",
    price: 749,
    perPlate: true,
    items: [1, 4, 6, 7, 8, 11, 12, 14, 16, 17, 19, 21, 22, 24, 25, 27],
    desc: "Complete satvik menu for havan and katha events"
  },
  {
    id: "pkg24",
    name: "Reception Classic",
    event: "reception",
    price: 749,
    perPlate: true,
    items: [1, 3, 7, 9, 14, 18, 21, 22, 26],
    desc: "Elegant post-wedding reception dinner"
  },
  {
    id: "pkg25",
    name: "Cocktail Reception",
    event: "reception",
    price: 999,
    perPlate: true,
    items: [1, 3, 5, 6, 7, 9, 14, 18, 22, 26, 28],
    desc: "Sophisticated cocktail night with premium bites"
  },
  {
    id: "pkg26",
    name: "Grand Reception",
    event: "reception",
    price: 999,
    perPlate: true,
    items: [1, 3, 5, 6, 7, 9, 10, 14, 16, 18, 20, 21, 22, 27],
    desc: "The ultimate grand reception feast"
  },
  {
    id: "pkg27",
    name: "Mehendi Chaat Party",
    event: "mehendi",
    price: 499,
    perPlate: true,
    items: [2, 4, 7, 12, 13, 17, 23, 27],
    desc: "Fun chaat and street food for mehendi nights"
  },
  {
    id: "pkg28",
    name: "Sangeet Night Special",
    event: "mehendi",
    price: 749,
    perPlate: true,
    items: [1, 2, 4, 7, 9, 13, 17, 21, 23, 26, 28],
    desc: "Vibrant spread for sangeet celebrations"
  },
  {
    id: "pkg29",
    name: "Haldi & Mehendi Grand",
    event: "mehendi",
    price: 999,
    perPlate: true,
    items: [1, 3, 4, 6, 7, 9, 11, 14, 18, 21, 22, 27],
    desc: "Complete pre-wedding ceremony feast"
  },
];

// Event ID mapping: maps function page IDs to data event IDs
const EVENT_ID_MAP = {
  wedding: "wedding",
  engagement: "wedding",
  birthday: "birthday",
  corporate: "corporate",
  festival: "festival",
  houseparty: "houseparty",
  housewarming: "houseparty",
  babyshower: "birthday",
  anniversary: "wedding",
  religious: "festival",
  reception: "wedding",
  mehendi: "wedding",
  retirement: "corporate",
  threadceremony: "festival",
  graduation: "birthday",
};

function mapEventId(id) {
  return EVENT_ID_MAP[id] || "wedding";
}

function getItemById(id) {
  return MENU_ITEMS.find(item => item.id === id);
}

function getItemsByEvent(eventId) {
  const mapped = mapEventId(eventId);
  return MENU_ITEMS.filter(item => item.events.includes(mapped));
}

function getPackagesByEvent(eventId) {
  // First, check if there are packages specifically for this event ID
  const specific = PACKAGES.filter(pkg => pkg.event === eventId);
  if (specific.length > 0) {
    return specific;
  }
  // Fall back to the mapped base event ID
  const mapped = mapEventId(eventId);
  return PACKAGES.filter(pkg => pkg.event === mapped);
}

function getItemsByCategory(categoryId, eventId) {
  const mapped = mapEventId(eventId);
  return MENU_ITEMS.filter(
    item => item.category === categoryId && item.events.includes(mapped)
  );
}
