// ===== MY REVIEWS PAGE - MATCHING MY LISTINGS FUNCTIONALITY =====

document.addEventListener("DOMContentLoaded", () => {
  
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
      if (userDropdown) userDropdown.classList.remove('show');
    });
  }

  if (cancelLogout && logoutModal) {
    cancelLogout.addEventListener('click', () => {
      logoutModal.classList.remove('show');
    });
  }

  if (confirmLogout && logoutLink) {
    confirmLogout.addEventListener('click', () => {
      const logoutUrl = logoutLink.getAttribute('href');
      window.location.href = logoutUrl;
    });
  }

  // Close logout modal when clicking outside
  if (logoutModal) {
    logoutModal.addEventListener('click', (e) => {
      if (e.target === logoutModal) {
        logoutModal.classList.remove('show');
      }
    });
  }

  // Close dropdown / modal with ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (userDropdown && userDropdown.classList.contains('show')) {
        userDropdown.classList.remove('show');
      }
      if (logoutModal && logoutModal.classList.contains('show')) {
        logoutModal.classList.remove('show');
      }
    }
  });

  // ===== REVIEW CARD ANIMATIONS =====
  const reviewCards = document.querySelectorAll('.review-card');
  
  // Add entrance animation
  reviewCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      card.style.transition = 'all 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
  });

  // Smooth hover effects
  reviewCards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'all 0.3s ease';
    });
  });

  // ===== DELETE REVIEW MODAL =====
  const deleteReviewModal = document.getElementById('deleteReviewModal');
  const deleteReviewForm = document.getElementById('deleteReviewForm');
  const reviewSpotNameDisplay = document.getElementById('reviewSpotName');
  const cancelDeleteReview = document.getElementById('cancelDeleteReview');
  const deleteReviewButtons = document.querySelectorAll('.btn-delete-review');

  // Open delete modal
  deleteReviewButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const reviewId = btn.dataset.reviewId;
      const spotName = btn.dataset.spotName;

      if (!reviewId || !deleteReviewModal || !deleteReviewForm) return;

      reviewSpotNameDisplay.textContent = spotName || "";
      deleteReviewForm.action = `/delete-review/${reviewId}/`;

      deleteReviewModal.classList.add('show');
    });
  });

  // Close delete modal
  function closeDeleteReviewModal() {
    if (deleteReviewModal) {
      deleteReviewModal.classList.remove('show');
    }
  }

  if (cancelDeleteReview) {
    cancelDeleteReview.addEventListener('click', closeDeleteReviewModal);
  }

  if (deleteReviewModal) {
    deleteReviewModal.addEventListener('click', (e) => {
      if (e.target === deleteReviewModal) {
        closeDeleteReviewModal();
      }
    });
  }

  // ESC key handling
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (userDropdown && userDropdown.classList.contains('show')) {
        userDropdown.classList.remove('show');
      }
      if (logoutModal && logoutModal.classList.contains('show')) {
        logoutModal.classList.remove('show');
      }
      if (deleteReviewModal && deleteReviewModal.classList.contains('show')) {
        closeDeleteReviewModal();
      }
    }
  });

  // ===== SMOOTH SCROLL TO TOP ON PAGE LOAD =====
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

  console.log('My Reviews page initialized');
});