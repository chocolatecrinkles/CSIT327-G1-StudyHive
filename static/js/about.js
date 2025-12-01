// ===== USER DROPDOWN FUNCTIONALITY =====
const dropdownBtn = document.getElementById('dropdownBtn');
const userDropdown = document.getElementById('userDropdown');

if (dropdownBtn && userDropdown) {
  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!userDropdown.contains(e.target) && !dropdownBtn.contains(e.target)) {
      userDropdown.classList.remove('show');
    }
  });
}

// ===== LOGOUT MODAL FUNCTIONALITY =====
const logoutLink = document.getElementById('logoutLink');
const logoutModal = document.getElementById('logoutModal');
const cancelLogout = document.getElementById('cancelLogout');
const confirmLogout = document.getElementById('confirmLogout');

if (logoutLink && logoutModal) {
  logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    logoutModal.classList.add('show');
    userDropdown.classList.remove('show');
  });
}

if (cancelLogout && logoutModal) {
  cancelLogout.addEventListener('click', () => {
    logoutModal.classList.remove('show');
  });
}

if (confirmLogout) {
  confirmLogout.addEventListener('click', () => {
    const logoutUrl = logoutLink.getAttribute('href');
    window.location.href = logoutUrl;
  });
}

// Close modal when clicking outside
if (logoutModal) {
  logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
      logoutModal.classList.remove('show');
    }
  });
}

// ===== SMOOTH SCROLLING FOR ANCHOR LINKS =====
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

// ===== ANIMATE STATS ON SCROLL =====
const observerOptions = {
  threshold: 0.5,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      
      // Animate numbers
      const numberElement = entry.target.querySelector('.stat-number');
      if (numberElement && !numberElement.classList.contains('animated')) {
        animateNumber(numberElement);
        numberElement.classList.add('animated');
      }
    }
  });
}, observerOptions);

// Observe all stat items
document.querySelectorAll('.stat-item').forEach(item => {
  observer.observe(item);
});

// ===== ANIMATE NUMBERS =====
function animateNumber(element) {
  const text = element.textContent;
  const number = parseInt(text.replace(/[^0-9]/g, ''));
  const suffix = text.replace(/[0-9,]/g, '');
  const duration = 2000;
  const steps = 60;
  const increment = number / steps;
  let current = 0;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    current += increment;
    
    if (step >= steps) {
      current = number;
      clearInterval(timer);
    }

    // Format number with commas
    const formatted = Math.floor(current).toLocaleString();
    element.textContent = formatted + suffix;
  }, duration / steps);
}

// ===== FEATURE CARDS HOVER ANIMATION =====
document.querySelectorAll('.feature-card').forEach(card => {
  const icon = card.querySelector('.feature-icon');
  
  card.addEventListener('mouseenter', function() {
    if (icon) {
      icon.style.transform = 'scale(1.1) rotate(5deg)';
    }
  });
  
  card.addEventListener('mouseleave', function() {
    if (icon) {
      icon.style.transform = 'scale(1) rotate(0deg)';
    }
  });
});

// ===== TEAM CARD ANIMATIONS =====
const teamObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, index * 100);
    }
  });
}, {
  threshold: 0.1
});

document.querySelectorAll('.team-card').forEach((card, index) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  teamObserver.observe(card);
});

// ===== PARALLAX EFFECT ON SCROLL =====
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const heroSection = document.querySelector('.hero-section');
  
  if (heroSection) {
    const offset = scrollTop * 0.5;
    heroSection.style.transform = `translateY(${offset}px)`;
    heroSection.style.opacity = 1 - (scrollTop / 500);
  }
  
  lastScrollTop = scrollTop;
});

// ===== FEATURE CARDS STAGGERED ANIMATION =====
const featureObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, index * 100);
    }
  });
}, {
  threshold: 0.1
});

document.querySelectorAll('.feature-card').forEach((card, index) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  featureObserver.observe(card);
});

// ===== MISSION BOX ANIMATION =====
const missionBox = document.querySelector('.mission-box');
if (missionBox) {
  const missionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'scale(1)';
      }
    });
  }, {
    threshold: 0.3
  });

  missionBox.style.opacity = '0';
  missionBox.style.transform = 'scale(0.95)';
  missionBox.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  missionObserver.observe(missionBox);
}

// ===== CTA BUTTON ANIMATION =====
const ctaButton = document.querySelector('.cta-button');
if (ctaButton) {
  ctaButton.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-3px) scale(1.05)';
  });
  
  ctaButton.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
  });
}

// ===== SOCIAL LINKS HOVER EFFECT =====
document.querySelectorAll('.social-link').forEach(link => {
  link.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-5px) rotate(10deg)';
  });
  
  link.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) rotate(0deg)';
  });
});

// ===== KEYBOARD ACCESSIBILITY =====
document.addEventListener('keydown', (e) => {
  // Close modal with Escape key
  if (e.key === 'Escape') {
    if (logoutModal && logoutModal.classList.contains('show')) {
      logoutModal.classList.remove('show');
    }
    if (userDropdown && userDropdown.classList.contains('show')) {
      userDropdown.classList.remove('show');
    }
  }
});


window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 100);
});

console.log('StudyHive About Page Loaded 🐝');