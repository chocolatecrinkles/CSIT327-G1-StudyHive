// StudyHive Landing Page - Full Interactive Features

// ======================================
// SEARCH FUNCTIONALITY
// ======================================

const mainSearch = document.getElementById('mainSearch');
const spotCards = document.querySelectorAll('.spot-card');

if (mainSearch) {
  mainSearch.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    spotCards.forEach(card => {
      const spotName = card.querySelector('h3').textContent.toLowerCase();
      const location = card.querySelector('.card-location').textContent.toLowerCase();
      const description = card.querySelector('.card-desc').textContent.toLowerCase();
      
      const matchesSearch = 
        spotName.includes(searchTerm) || 
        location.includes(searchTerm) || 
        description.includes(searchTerm);
      
      if (matchesSearch || searchTerm === '') {
        card.style.display = 'block';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        }, 10);
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          card.style.display = 'none';
        }, 300);
      }
    });
  });
}

// Smooth scroll to listings when search button is clicked
document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.querySelector(".search-btn");
  const exploreSection = document.getElementById("exploreSection");
  const searchInput = document.getElementById("mainSearch");
  const heroSearchForm = document.querySelector('.hero-search');

  // Prevent form submission
  if (heroSearchForm) {
    heroSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  if (searchBtn && exploreSection) {
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Optional: clear search bar text
      if (searchInput) searchInput.blur();

      // Smooth scroll with easing effect
      const targetY = exploreSection.getBoundingClientRect().top + window.scrollY;
      const startY = window.scrollY;
      const distance = targetY - startY;
      const duration = 900;
      let startTime = null;

      function smoothStep(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const percent = Math.min(progress / duration, 1);
        const ease = percent < 0.5
          ? 4 * percent * percent * percent
          : 1 - Math.pow(-2 * percent + 2, 3) / 2;
        window.scrollTo(0, startY + distance * ease);

        if (progress < duration) requestAnimationFrame(smoothStep);
      }

      requestAnimationFrame(smoothStep);
    });
  }
});

// ======================================
// FILTER BUTTON MULTI-SELECT LOGIC
// ======================================

document.addEventListener("DOMContentLoaded", function () {
  const tags = document.querySelectorAll(".filter-tags .tag");
  let activeFilterSet = new Set(['all']);

  // Map filter names to data attribute names
  const filterToDatasetMap = {
    'wifi': 'wifi',
    'outlets': 'outlets',
    'ac': 'ac',
    'coffee': 'coffee',
    'pastries': 'pastries',
    'open24': 'open24',
    'trending': 'trending'
  };

  function applyFilters() {
    spotCards.forEach(card => {
      let isVisible = true;

      // If "all" is selected, show all cards
      if (activeFilterSet.has('all')) {
        isVisible = true;
      } else {
        // Check if card matches ALL active filters (AND logic)
        isVisible = Array.from(activeFilterSet).every(filter => {
          const dataAttr = filterToDatasetMap[filter];
          if (!dataAttr) return true;
          const value = card.getAttribute(`data-${dataAttr}`);
          return value === "true";
        });
      }

      if (isVisible) {
        card.style.display = 'block';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        }, 10);
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          card.style.display = 'none';
        }, 300);
      }
    });
  }

  // Use event delegation on the container to ensure handlers fire and avoid
  // multiple listeners. This is more robust and prevents issues where buttons
  // might behave like submit controls in some contexts.
  const tagsContainer = document.querySelector('.filter-tags');

  if (tagsContainer) {
    tagsContainer.addEventListener('click', (e) => {
      const tag = e.target.closest('.tag');
      if (!tag) return;

      // Defensive prevents to stop any form submission/navigation
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      const filter = tag.dataset.filter;
      console.log('[landing] filter click:', filter, 'current active:', Array.from(activeFilterSet));

      if (filter === 'all') {
        activeFilterSet.clear();
        activeFilterSet.add('all');
        tags.forEach(t => t.classList.toggle('active', t.dataset.filter === 'all'));
      } else {
        activeFilterSet.delete('all');

        if (activeFilterSet.has(filter)) {
          activeFilterSet.delete(filter);
          tag.classList.remove('active');
        } else {
          activeFilterSet.add(filter);
          tag.classList.add('active');
        }

        if (activeFilterSet.size === 0) {
          activeFilterSet.add('all');
          tags.forEach(t => t.classList.toggle('active', t.dataset.filter === 'all'));
        } else {
          const allBtn = document.querySelector('[data-filter="all"]');
          if (allBtn) allBtn.classList.remove('active');
        }
      }

      console.log('[landing] active filters after click:', Array.from(activeFilterSet));
      applyFilters();
    });
  }

  // Initialize with all visible
  applyFilters();
});

// ======================================
// SORT FUNCTIONALITY
// ======================================

const sortSelect = document.getElementById('sortSelect');
const cardsGrid = document.getElementById('cardsGrid');

if (sortSelect && cardsGrid) {
  sortSelect.addEventListener('change', (e) => {
    const sortValue = e.target.value;
    // Get fresh list of cards each time we sort
    const currentCards = document.querySelectorAll('.spot-card');
    const cardsArray = Array.from(currentCards);
    
    cardsArray.sort((a, b) => {
      switch(sortValue) {
        case 'name':
          const nameA = a.querySelector('h3').textContent;
          const nameB = b.querySelector('h3').textContent;
          return nameA.localeCompare(nameB);
          
        case 'rating':
          const ratingA = parseFloat(a.querySelector('.card-badge').textContent);
          const ratingB = parseFloat(b.querySelector('.card-badge').textContent);
          return ratingB - ratingA;
          
        case 'nearest':
          return 0;
          
        case 'popular':
          // Get trending status from data attribute
          const trendingA = a.getAttribute('data-trending') === 'true' ? 1 : 0;
          const trendingB = b.getAttribute('data-trending') === 'true' ? 1 : 0;
          return trendingB - trendingA;
          
        default:
          return 0;
      }
    });
    
    // Re-append sorted cards
    cardsArray.forEach(card => cardsGrid.appendChild(card));
    
    // Add animation
    cardsArray.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(() => {
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 50);
    });
  });
}

// ======================================
// VIEW TOGGLE (GRID/LIST)
// ======================================

const viewOptions = document.querySelectorAll('.view-opt');

viewOptions.forEach(option => {
  option.addEventListener('click', () => {
    viewOptions.forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');
    
    const view = option.dataset.view;
    
    if (view === 'list') {
      cardsGrid.classList.add('list-view');
    } else {
      cardsGrid.classList.remove('list-view');
    }
  });
});

// ======================================
// MOBILE MENU TOGGLE
// ======================================

const burgerBtn = document.querySelector('.burger-btn');
const navMenu = document.querySelector('.nav-menu');

if (burgerBtn && navMenu) {
  burgerBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    burgerBtn.classList.toggle('active');
  });
  
  document.addEventListener('click', (e) => {
    if (!burgerBtn.contains(e.target) && !navMenu.contains(e.target)) {
      navMenu.classList.remove('active');
      burgerBtn.classList.remove('active');
    }
  });
}

// ======================================
// SMOOTH SCROLL
// ======================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ======================================
// SCROLL ANIMATIONS
// ======================================

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

spotCards.forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = 'all 0.5s ease';
  observer.observe(card);
});

const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach((card, index) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = `all 0.5s ease ${index * 0.1}s`;
  observer.observe(card);
});

// ======================================
// HERO SEARCH FOCUS EFFECT
// ======================================

const heroSearch = document.querySelector('.hero-search');
if (heroSearch && mainSearch) {
  mainSearch.addEventListener('focus', () => {
    heroSearch.style.transform = 'scale(1.02)';
    heroSearch.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)';
  });
  
  mainSearch.addEventListener('blur', () => {
    heroSearch.style.transform = 'scale(1)';
    heroSearch.style.boxShadow = '0 8px 32px rgba(0,0,0,0.16)';
  });
}

// ======================================
// DYNAMIC STATS COUNTER
// ======================================

const statItems = document.querySelectorAll('.stat-item strong');

function animateCounter(element) {
  const target = element.textContent;
  const isNumber = /^\d+/.test(target);
  
  if (isNumber) {
    const finalNumber = parseInt(target);
    const duration = 2000;
    const steps = 50;
    const increment = finalNumber / steps;
    let current = 0;
    
    const counter = setInterval(() => {
      current += increment;
      if (current >= finalNumber) {
        element.textContent = target;
        clearInterval(counter);
      } else {
        element.textContent = Math.floor(current) + (target.includes('+') ? '+' : '');
      }
    }, duration / steps);
  }
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      statItems.forEach(item => animateCounter(item));
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  statsObserver.observe(heroStats);
}

// ======================================
// RESPONSIVE BEHAVIOR
// ======================================

function handleResponsive() {
  const width = window.innerWidth;
  
  if (width <= 768 && cardsGrid.classList.contains('list-view')) {
    cardsGrid.classList.remove('list-view');
    viewOptions.forEach(opt => {
      if (opt.dataset.view === 'grid') {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }
}

handleResponsive();

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(handleResponsive, 250);
});

// ======================================
// INITIALIZE
// ======================================

console.log('StudyHive Landing page initialized');
console.log(`Loaded ${spotCards.length} study spots`);

document.body.classList.add('loaded');

const images = document.querySelectorAll('img[data-src]');
images.forEach(img => {
  img.src = img.dataset.src;
  img.removeAttribute('data-src');
});