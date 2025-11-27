/* ============================================================
   MY LISTINGS - DELETE MODAL FUNCTIONALITY + CAROUSEL
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ============================================================
       ELEMENTS
  ============================================================ */
  const deleteModal = document.getElementById("deleteModal");
  const deleteForm = document.getElementById("deleteForm");
  const listingNameDisplay = document.getElementById("listingNameDisplay");
  const cancelDeleteBtn = document.getElementById("cancelDelete");
  const deleteButtons = document.querySelectorAll(".btn-delete, .delete-btn");

  /* ============================================================
       OPEN DELETE MODAL
  ============================================================ */
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      const listingId = btn.dataset.listingId;
      const listingName = btn.dataset.listingName;

      if (!listingId) return;

      // Update modal content
      listingNameDisplay.textContent = listingName || "";

      // Set form action to delete URL
      deleteForm.action = `/delete-listing/${listingId}/`;

      // Show modal
      deleteModal.classList.add("active");
    });
  });

  /* ============================================================
       CLOSE DELETE MODAL
  ============================================================ */
  function closeModal() {
    deleteModal.classList.remove("active");
  }

  // Close on cancel button
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", closeModal);
  }

  // Close on overlay click
  if (deleteModal) {
    const overlay = deleteModal.querySelector(".modal-overlay");
    if (overlay) {
      overlay.addEventListener("click", closeModal);
    }
  }

  // Close on ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && deleteModal.classList.contains("active")) {
      closeModal();
    }
  });

  /* ============================================================
       LISTING IMAGE CAROUSELS (auto if more than 1 image)
  ============================================================ */
  function initListingCarousels() {
    const carousels = document.querySelectorAll(".listing-image-carousel");

    carousels.forEach((carousel) => {
      const images = carousel.querySelectorAll(".listing-carousel-image");
      if (images.length <= 1) return; // only apply when > 1 image

      let currentIndex = 0;

      // ensure only first is active initially
      images.forEach((img, idx) => {
        img.classList.toggle("active", idx === 0);
      });

      function showImage(newIndex) {
        images[currentIndex].classList.remove("active");
        currentIndex = (newIndex + images.length) % images.length;
        images[currentIndex].classList.add("active");
      }

      // simple auto-rotate, no arrows / buttons
      setInterval(() => {
        showImage(currentIndex + 1);
      }, 4000);
    });
  }

  initListingCarousels();

  /* ============================================================
       CARD HOVER (just smooth transition)
  ============================================================ */
  const listingCards = document.querySelectorAll(".listing-card");

  listingCards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transition = "all 0.3s ease";
    });
  });
});
