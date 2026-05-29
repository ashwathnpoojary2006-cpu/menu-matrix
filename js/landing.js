// ============================================
// MenuMatrix — Landing Page Logic
// ============================================

// === GALLERY LIGHTBOX ===
function initGallery() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  if (!lightbox) return;

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.closest('.lightbox-close')) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// === TESTIMONIALS CAROUSEL ===
function initTestimonials() {
  const track = document.getElementById('testimonialTrack');
  const dotsContainer = document.getElementById('testimonialDots');
  if (!track) return;

  const cards = track.querySelectorAll('.testimonial-card');
  const totalCards = cards.length;
  let currentIndex = 0;
  let autoPlayTimer;

  // Calculate visible cards based on viewport
  function getVisibleCount() {
    if (window.innerWidth <= 480) return 1;
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function getMaxIndex() {
    return Math.max(0, totalCards - getVisibleCount());
  }

  // Create dots
  function createDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    const maxIdx = getMaxIndex();
    for (let i = 0; i <= maxIdx; i++) {
      const dot = document.createElement('button');
      dot.className = `testimonial-dot ${i === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    if (!dotsContainer) return;
    dotsContainer.querySelectorAll('.testimonial-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  function goTo(index) {
    const maxIdx = getMaxIndex();
    currentIndex = Math.max(0, Math.min(index, maxIdx));
    const cardWidth = cards[0].offsetWidth + 24; // gap
    track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    updateDots();
    resetAutoPlay();
  }

  function next() {
    goTo(currentIndex >= getMaxIndex() ? 0 : currentIndex + 1);
  }

  function prev() {
    goTo(currentIndex <= 0 ? getMaxIndex() : currentIndex - 1);
  }

  function resetAutoPlay() {
    clearInterval(autoPlayTimer);
    autoPlayTimer = setInterval(next, 5000);
  }

  // Button bindings
  const prevBtn = document.getElementById('testimonialPrev');
  const nextBtn = document.getElementById('testimonialNext');
  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  createDots();
  resetAutoPlay();

  // Recalculate on resize
  window.addEventListener('resize', () => {
    createDots();
    goTo(Math.min(currentIndex, getMaxIndex()));
  });
}

// === CONTACT FORM ===
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Simulate form submission
    const btn = form.querySelector('.btn-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Message Sent!';
    btn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '';
      form.reset();
    }, 3000);
  });
}

// === PARALLAX EFFECT ON HERO ===
function initHeroParallax() {
  const shapes = document.querySelectorAll('.hero-bg-shape');
  if (shapes.length === 0) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    shapes.forEach((shape, i) => {
      const speed = 0.15 + (i * 0.1);
      shape.style.transform = `translateY(${scrollY * speed}px)`;
    });
  });
}

// === SERVICES CAROUSEL (DRAG TO SCROLL) ===
function initServicesCarousel() {
  const carousel = document.getElementById('servicesCarousel');
  if (!carousel) return;

  let isDown = false;
  let startX;
  let scrollLeft;

  carousel.addEventListener('mousedown', (e) => {
    isDown = true;
    carousel.classList.add('active');
    startX = e.pageX - carousel.offsetLeft;
    scrollLeft = carousel.scrollLeft;
  });
  
  carousel.addEventListener('mouseleave', () => {
    isDown = false;
    carousel.classList.remove('active');
  });
  
  carousel.addEventListener('mouseup', () => {
    isDown = false;
    carousel.classList.remove('active');
  });
  
  carousel.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carousel.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast
    carousel.scrollLeft = scrollLeft - walk;
  });
}

// === INIT ALL LANDING ===
document.addEventListener("DOMContentLoaded", () => {
  initGallery();
  initTestimonials();
  initContactForm();
  initHeroParallax();
  initServicesCarousel();
});
