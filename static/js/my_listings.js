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


// ===== MY LISTINGS - DELETE MODAL + CAROUSEL =====
document.addEventListener("DOMContentLoaded", () => {
  const deleteModal = document.getElementById("deleteModal");
  const deleteForm = document.getElementById("deleteForm");
  const listingNameDisplay = document.getElementById("listingNameDisplay");
  const cancelDeleteBtn = document.getElementById("cancelDelete");
  const deleteButtons = document.querySelectorAll(".btn-delete, .delete-btn");

  // ---------- OPEN DELETE MODAL ----------
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      const listingId = btn.dataset.listingId;
      const listingName = btn.dataset.listingName;

      if (!listingId || !deleteModal || !deleteForm) return;

      listingNameDisplay.textContent = listingName || "";
      deleteForm.action = `/delete-listing/${listingId}/`;

      deleteModal.classList.add("show");   // use 'show' to match CSS
    });
  });

  // ---------- CLOSE DELETE MODAL ----------
  function closeDeleteModal() {
    if (deleteModal) {
      deleteModal.classList.remove("show");
    }
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  }

  if (deleteModal) {
    deleteModal.addEventListener("click", (e) => {
      if (e.target === deleteModal) {
        closeDeleteModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && deleteModal && deleteModal.classList.contains("show")) {
      closeDeleteModal();
    }
  });

  // ---------- LISTING IMAGE CAROUSELS ----------
  function initListingCarousels() {
    const carousels = document.querySelectorAll(".listing-image-carousel");

    carousels.forEach((carousel) => {
      const images = carousel.querySelectorAll(".listing-carousel-image");
      if (images.length <= 1) return;

      let currentIndex = 0;

      images.forEach((img, idx) => {
        img.classList.toggle("active", idx === 0);
      });

      function showImage(newIndex) {
        images[currentIndex].classList.remove("active");
        currentIndex = (newIndex + images.length) % images.length;
        images[currentIndex].classList.add("active");
      }

      setInterval(() => {
        showImage(currentIndex + 1);
      }, 4000);
    });
  }

  initListingCarousels();

  // ---------- CARD HOVER ----------
  const listingCards = document.querySelectorAll(".listing-card");
  listingCards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transition = "all 0.3s ease";
    });
  });
});
