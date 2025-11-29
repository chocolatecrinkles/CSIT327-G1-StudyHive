// StudyHive Settings Page - Interactive Features

document.addEventListener('DOMContentLoaded', function() {

  // ======================================
  // SECTION NAVIGATION
  // ======================================

  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.settings-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetSection = item.dataset.section;

      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Show target section with animation
      sections.forEach(section => {
        section.classList.remove('active');
      });

      const targetElement = document.getElementById(`${targetSection}-section`);
      if (targetElement) {
        targetElement.classList.add('active');

        // Smooth scroll to top of content
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  });

  // ======================================
  // PROFILE PICTURE PREVIEW
  // ======================================

  const profilePictureInput = document.getElementById('profilePicture');
  const profilePreview = document.getElementById('profilePreview');

  if (profilePictureInput && profilePreview) {
    profilePictureInput.addEventListener('change', (e) => {
      const file = e.target.files[0];

      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file');
          return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size must be less than 5MB');
          return;
        }

        // Preview image
        const reader = new FileReader();
        reader.onload = (event) => {
          profilePreview.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // ======================================
  // BIO CHARACTER COUNTER
  // ======================================

  const bioTextarea = document.getElementById('bio');
  const charCount = document.querySelector('.char-count');

  if (bioTextarea && charCount) {
    const maxLength = 500;

    function updateCharCount() {
      const currentLength = bioTextarea.value.length;
      charCount.textContent = `${currentLength} / ${maxLength}`;

      if (currentLength > maxLength * 0.9) {
        charCount.style.color = '#ef4444';
      } else {
        charCount.style.color = '';
      }
    }

    // Initialize
    updateCharCount();

    // Update on input
    bioTextarea.addEventListener('input', updateCharCount);

    // Enforce max length
    bioTextarea.addEventListener('input', () => {
      if (bioTextarea.value.length > maxLength) {
        bioTextarea.value = bioTextarea.value.substring(0, maxLength);
        updateCharCount();
      }
    });
  }

  // ======================================
  // PASSWORD VALIDATION
  // ======================================

  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');

  if (newPassword && confirmPassword) {
    function validatePasswords() {
      if (newPassword.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Passwords do not match');
      } else {
        confirmPassword.setCustomValidity('');
      }
    }

    newPassword.addEventListener('input', validatePasswords);
    confirmPassword.addEventListener('input', validatePasswords);
  }

  // ======================================
  // ALERT CLOSE BUTTONS
  // ======================================

  const closeAlertButtons = document.querySelectorAll('.close-alert');

  closeAlertButtons.forEach(button => {
    button.addEventListener('click', () => {
      const alert = button.closest('.alert');
      if (alert) {
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          alert.remove();
        }, 300);
      }
    });
  });

  // Auto-dismiss alerts after 5 seconds
  setTimeout(() => {
    closeAlertButtons.forEach(button => {
      button.click();
    });
  }, 5000);

  // ======================================
  // FORM VALIDATION
  // ======================================

  const forms = document.querySelectorAll('.settings-form');

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const requiredInputs = form.querySelectorAll('[required]');
      let isValid = true;

      requiredInputs.forEach(input => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = '#ef4444';

          setTimeout(() => {
            input.style.borderColor = '';
          }, 2000);
        }
      });

      if (!isValid) {
        e.preventDefault();

        // Show error message
        const firstInvalidInput = form.querySelector('[required]:invalid, [required][value=""]');
        if (firstInvalidInput) {
          firstInvalidInput.focus();
          firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  });

  // ======================================
  // TOGGLE SWITCHES ANIMATION
  // ======================================

  const toggleSwitches = document.querySelectorAll('.toggle-switch input');

  toggleSwitches.forEach(toggle => {
    toggle.addEventListener('change', () => {
      const slider = toggle.nextElementSibling;

      // Add a little bounce animation
      slider.style.transform = 'scale(1.1)';
      setTimeout(() => {
        slider.style.transform = 'scale(1)';
      }, 200);
    });
  });

  // ======================================
  // UNSAVED CHANGES WARNING
  // ======================================

  let hasUnsavedChanges = false;

  const formInputs = document.querySelectorAll('input, textarea, select');

  formInputs.forEach(input => {
    input.addEventListener('change', () => {
      hasUnsavedChanges = true;
    });
  });

  // Reset on form submit
  forms.forEach(form => {
    form.addEventListener('submit', () => {
      hasUnsavedChanges = false;
    });
  });

  // Warn before leaving page
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  });

  // Don't warn when navigating between settings sections
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Allow navigation without warning
    });
  });

  // ======================================
  // SMOOTH ANIMATIONS
  // ======================================

  // Fade in elements on scroll
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

  const animatedElements = document.querySelectorAll('.preference-group, .notification-group, .privacy-group');

  animatedElements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'all 0.5s ease';
    observer.observe(element);
  });

  // ======================================
  // KEYBOARD SHORTCUTS
  // ======================================

  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save (prevent default and trigger first form submit)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const activeSection = document.querySelector('.settings-section.active');
      const form = activeSection ? activeSection.querySelector('form') : null;
      if (form) {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.click();
        }
      }
    }

    // ESC to close modal
    if (e.key === 'Escape') {
      hideDeleteModal();
    }
  });

  console.log('StudyHive Settings page initialized');
});

// ======================================
// DELETE ACCOUNT MODAL
// ======================================

function showDeleteModal() {
  const modal = document.getElementById('deleteModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus on input
    setTimeout(() => {
      const input = modal.querySelector('input[name="confirm_delete"]');
      if (input) {
        input.focus();
      }
    }, 100);
  }
}

function hideDeleteModal() {
  const modal = document.getElementById('deleteModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Clear input
    const input = modal.querySelector('input[name="confirm_delete"]');
    if (input) {
      input.value = '';
    }
  }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('deleteModal');
  if (modal && e.target === modal) {
    hideDeleteModal();
  }
});

// ======================================
// PREFERENCE PERSISTENCE (OPTIONAL)
// ======================================

// Save scroll position
window.addEventListener('scroll', () => {
  localStorage.setItem('settingsScrollPosition', window.scrollY);
});

// Restore scroll position
window.addEventListener('load', () => {
  const scrollPosition = localStorage.getItem('settingsScrollPosition');
  if (scrollPosition) {
    window.scrollTo(0, parseInt(scrollPosition));
  }
});

// Remember last active section
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    localStorage.setItem('lastActiveSection', item.dataset.section);
  });
});

// Restore last active section on page load
window.addEventListener('load', () => {
  const lastSection = localStorage.getItem('lastActiveSection');
  if (lastSection) {
    const targetNav = document.querySelector(`[data-section="${lastSection}"]`);
    if (targetNav) {
      targetNav.click();
    }
  }
});
