// StudyHive Map View - Enhanced with Detail Sidebar
document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // 1. DOM ELEMENTS
  // =========================
  const mapSidebar = document.getElementById("mapSidebar");
  const menuBtn = document.getElementById("menuBtn");

  const dropdownBtn = document.getElementById("dropdownBtn");
  const userDropdown = document.getElementById("userDropdown");

  const logoutLink = document.getElementById("logoutLink");
  const logoutModal = document.getElementById("logoutModal");
  const cancelLogout = document.getElementById("cancelLogout");
  const confirmLogout = document.getElementById("confirmLogout");

  const filterBtn = document.getElementById("filterBtn");
  const filterPopup = document.getElementById("filterPopup");
  const closeFilterBtn = document.getElementById("closeFilterBtn");
  const applyFiltersBtn = document.getElementById("applyFiltersBtn");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");

  const menuDots = document.getElementById("menuDots");
  const dropdownMenu = document.getElementById("dropdownMenu");

  const zoomInBtn = document.getElementById("zoomIn");
  const zoomOutBtn = document.getElementById("zoomOut");
  const searchAsMove = document.getElementById("searchAsMove");

  const distanceSlider = document.getElementById("distanceSlider");
  const distanceValue = document.getElementById("distanceValue");

  const spotCards = document.querySelectorAll(".map-card-link");

  const mapPreviewCard = document.getElementById("mapPreviewCard");
  const previewCloseBtn = mapPreviewCard?.querySelector(".preview-close");

  const searchSpot = document.getElementById("searchSpot");
  const searchTriggerBtn = document.getElementById("searchTriggerBtn");

  const previewImage = document.querySelector(".preview-spot-image");
  const previewTitle = document.querySelector(".preview-spot-title");
  const previewRatingValue = document.querySelector(".preview-rating-value");
  const previewRatingStars = document.querySelector(".preview-rating-stars");
  const previewLocationText = document.querySelector(".preview-location-text");
  const previewStatusBadge = document.querySelector(".preview-status-badge");
  const previewTagsContainer = document.querySelector(".preview-spot-tags");
  const viewDetailsBtn = document.querySelector(".preview-view-btn");

  const locationBtn = document.getElementById("locationBtn");

  const ownerControlsContainers = document.querySelectorAll(".card-controls");

  // =========================
  // 2. GLOBAL STATE
  // =========================
  const spotDataMap = new Map();
  const leafletMarkers = [];
  const favorites = new Set();

  let studyMap = null;
  let locationMarker = null;
  let highlightedMarker = null;

  let currentPreviewSpotId = null;
  let currentPreviewDetailUrl = null;

  let highlightedSpotId = null;

  let sidebarMode = "list"; // 'list' or 'detail'
  let currentDetailSpotId = null;

  // which spot has exclusive marker visible (null = show all)
  let exclusiveSpotId = null;

  let userLatLng = null;
  let activeRouteLine = null;
  let activeRoutePopup = null;

  let activeFilters = {
    amenities: [],
    hours: "any",
    price: "1",
    rating: 4.5,
    distance: 5,
  };

  const amenityDefinitions = {
    wifi: { label: "Wi-Fi", icon: "fa-wifi" },
    open24: { label: "24/7", icon: "fa-clock" },
    outlets: { label: "Outlets", icon: "fa-plug" },
    coffee: { label: "Coffee", icon: "fa-mug-hot" },
    ac: { label: "AC", icon: "fa-snowflake" },
    pastries: { label: "Pastries", icon: "fa-bread-slice" },
    trending: { label: "Trending", icon: "fa-fire" },
  };

  // =========================
  // 3. UTILITIES
  // =========================
  function datasetToBool(value) {
    if (typeof value === "boolean") return value;
    if (value === undefined || value === null) return false;
    const normalized = String(value).toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  function getCustomIcon(isOpen, isHighlighted = false) {
    const sizeMultiplier = isHighlighted ? 2 : 1;
    const baseSize = 32 * sizeMultiplier;

    const html = `
      <div class="marker-pin ${isOpen ? "open" : "closed"} ${
      isHighlighted ? "highlighted" : ""
    }">
        <div class="marker-inner">
          <i class="fas fa-book-open"></i>
        </div>
      </div>
    `;

    return L.divIcon({
      className: "custom-map-marker-div",
      html,
      iconSize: [baseSize, baseSize + 10],
      iconAnchor: [baseSize / 2, baseSize / 2 + 5],
      popupAnchor: [0, -baseSize / 2],
    });
  }

  function getUserLocationIcon() {
    const ICON_SIZE = 40;
    const CIRCLE_SIZE = 30;
    const BORDER_SIZE = 2;
    const TRIANGLE_SIZE = 15;
    const BLUE_COLOR = "#347AF0";

    const html = `
      <div class="user-location-pin-rotatable" style="
        position: relative;
        width: ${ICON_SIZE}px;
        height: ${ICON_SIZE + TRIANGLE_SIZE}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
      ">
        <div style="
          width: 0;
          height: 0;
          border-left: ${TRIANGLE_SIZE / 2}px solid transparent;
          border-right: ${TRIANGLE_SIZE / 2}px solid transparent;
          border-bottom: ${TRIANGLE_SIZE}px solid ${BLUE_COLOR};
          margin-bottom: -5px;
        "></div>
        <div style="
          width: ${CIRCLE_SIZE}px;
          height: ${CIRCLE_SIZE}px;
          background-color: ${BLUE_COLOR};
          border: ${BORDER_SIZE}px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
      </div>
    `;

    return L.divIcon({
      className: "user-location-marker-div-pin",
      html,
      iconSize: [ICON_SIZE, ICON_SIZE + TRIANGLE_SIZE],
      iconAnchor: [ICON_SIZE / 2, ICON_SIZE + TRIANGLE_SIZE],
      popupAnchor: [0, -(ICON_SIZE + TRIANGLE_SIZE - 5)],
    });
  }

  // =========================
  // 4. OPEN/CLOSE STATUS LOGIC
  // =========================
  function computeOpenStatus(opening, closing, open24) {
    if (open24 === true || open24 === "true" || open24 === "True") {
      return "open";
    }

    if (!opening || !closing) {
      return "closed";
    }

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const [oh, om] = opening.split(":").map(Number);
    const [ch, cm] = closing.split(":").map(Number);

    const openMinutes = oh * 60 + om;
    const closeMinutes = ch * 60 + cm;

    // Overnight (e.g. 18:00 - 02:00)
    if (closeMinutes < openMinutes) {
      if (nowMinutes >= 0 && nowMinutes < closeMinutes) return "open";
      if (nowMinutes >= openMinutes && nowMinutes <= 1439) return "open";
      return "closed";
    }

    return nowMinutes >= openMinutes && nowMinutes <= closeMinutes
      ? "open"
      : "closed";
  }

  function formatTime24To12(timeStr) {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
  }

  // =========================
  // 5. SPOT DATA REGISTRATION
  // =========================
  function registerSpotDataFromCard(card) {
    const data = card.dataset;
    const spotId = data.spotId;
    if (!spotId) return;

    const ratingValue = Number.parseFloat(data.rating);
    const detailUrl = data.detailUrl || card.getAttribute("href") || "";
    const spotName =
      data.name ||
      card.querySelector("h3")?.textContent?.trim() ||
      "Untitled Spot";

    const spotLocation =
      data.location ||
      card.querySelector(".spot-location span")?.textContent?.trim() ||
      "";

    const dynamicStatus = computeOpenStatus(
      data.opening,
      data.closing,
      datasetToBool(data.open24)
    );

    const badge = card.querySelector(".map-status-badge");
    if (badge) {
      const label = dynamicStatus === "open" ? "Open" : "Closed";
      badge.setAttribute("data-label", label);
      badge.classList.remove("status-init", "open", "closed");
      badge.classList.add(dynamicStatus);
    }

    const image = data.image || previewImage?.dataset?.placeholder || "";

    const amenityFlags = {
      wifi: datasetToBool(data.wifi),
      open24: datasetToBool(data.open24),
      outlets: datasetToBool(data.outlets),
      coffee: datasetToBool(data.coffee),
      ac: datasetToBool(data.ac),
      pastries: datasetToBool(data.pastries),
      trending: datasetToBool(data.trending),
    };

    const amenityTags = Object.entries(amenityFlags)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);

    // Parse active users data
    let activeUsers = [];
    try {
      const activeUsersData = card.dataset.activeUsers;
      activeUsers = activeUsersData ? JSON.parse(activeUsersData) : [];
    } catch (e) {
      console.error("Failed to parse active users:", e);
      activeUsers = [];
    }

    spotDataMap.set(spotId, {
      id: spotId,
      name: spotName,
      location: spotLocation,
      rating: Number.isFinite(ratingValue) ? ratingValue : 0,
      status: dynamicStatus,
      opening: data.opening,
      closing: data.closing,
      image,
      detailUrl,
      amenities: amenityFlags,
      tags: amenityTags,
      activeUsers: activeUsers,
      card: card,
      marker: null,
    });
  }

  // =========================
  // 6. EXCLUSIVE MARKER LOGIC
  // =========================
  function setExclusiveMarker(spotIdOrNull) {
    // We no longer hide other markers when one is selected.
    // Keep all markers visible and only use the "highlight" style.
    exclusiveSpotId = null;
    updateMarkerVisibility();
  }

  // =========================
  // 7. SIDEBAR DETAIL VIEW
  // =========================
  function createDetailSidebar(spotId) {
    const spot = spotDataMap.get(spotId);
    if (!spot) return;

    const sidebarHeader = mapSidebar.querySelector(".sidebar-header");
    const sidebarSearch = mapSidebar.querySelector(".sidebar-search");
    const chipFilters = mapSidebar.querySelector(".chip-filters");
    const spotList = mapSidebar.querySelector(".spot-list");
    const existingDetail = mapSidebar.querySelector(".spot-detail-view");

    if (existingDetail) existingDetail.remove();

    sidebarSearch.style.display = "none";
    chipFilters.style.display = "none";
    spotList.style.display = "none";

    sidebarHeader.innerHTML = `
      <button id="backToListBtn" class="icon-btn">
        <i class="fas fa-arrow-left"></i>
      </button>
      <div class="sidebar-title">
        <h2>Study Spot Details</h2>
        <p>View information</p>
      </div>
    `;

    // 👉 only show hours if NOT 24/7 and both times exist
    const hasHours = !spot.amenities.open24 && spot.opening && spot.closing;

    const hoursMarkup = hasHours
      ? `
        <div class="detail-hours">
          <i class="fas fa-clock"></i>
          <span>${formatTime24To12(spot.opening)} – ${formatTime24To12(
          spot.closing
        )}</span>
        </div>
      `
      : "";

    // Helper function to format time ago
    function formatTimeAgo(date) {
      if (!(date instanceof Date) || isNaN(date.getTime())) return "";
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "just now";
      if (diffMins < 60)
        return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
      if (diffHours < 24)
        return `${diffHours} hr${diffHours !== 1 ? "s" : ""} ago`;
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    }

    // Function to display checked-in users
    function displayCheckedInUsers(spot) {
      const checkedInSection = document.getElementById("detailCheckedIn");
      const checkedInCount = document.querySelector(".checkin-count-detail");
      const usersGrid = document.getElementById("detailUsersGrid");

      if (!checkedInSection || !usersGrid) return;

      const activeUsers = spot.activeUsers || [];
      const count = activeUsers.length;

      if (count > 0) {
        checkedInSection.style.display = "block";
        checkedInCount.textContent = count;

        usersGrid.innerHTML = "";

        activeUsers.forEach((user) => {
          const dateObj = new Date(user.check_in_time);
          const timeAgo = formatTimeAgo(dateObj);

          const userCard = document.createElement("div");
          userCard.className = "detail-user-card";
          userCard.innerHTML = `
            <img src="${user.avatar_url}"
                 alt="${user.username}"
                 class="detail-user-avatar"
                 onerror="this.src='/static/imgs/avatar_placeholder.jpg'">
            <div class="detail-user-info">
              <span class="detail-user-name">${user.username}</span>
              <small class="detail-user-time">
                <i class="fas fa-clock"></i> ${timeAgo}
              </small>
            </div>
          `;
          usersGrid.appendChild(userCard);
        });
      } else {
        checkedInSection.style.display = "none";
      }
    }

    const detailView = document.createElement("div");
    detailView.className = "spot-detail-view";
    detailView.innerHTML = `
      <div class="detail-image-container">
        <div class="detail-carousel-slot"></div>

        <span class="detail-status-badge ${spot.status}">
          ${spot.status === "open" ? "Open" : "Closed"}
        </span>
        ${
          spot.amenities.trending
            ? '<span class="detail-trending-badge"><i class="fas fa-fire"></i> Trending</span>'
            : ""
        }
      </div>

      <div class="detail-content">
        <h2 class="detail-title">${spot.name}</h2>

        <div class="detail-rating">
          <span class="detail-rating-value">${spot.rating.toFixed(1)}</span>
          <div class="detail-rating-stars"></div>
        </div>

        <div class="detail-location">
          <i class="fas fa-map-marker-alt"></i>
          <span>${spot.location}</span>
        </div>

        ${hoursMarkup}

        <div class="detail-amenities">
          <h3>Amenities</h3>
          <div class="detail-tags">
            ${spot.tags
              .map((tagKey) => {
                const def = amenityDefinitions[tagKey];
                return def
                  ? `<span><i class="fas ${def.icon}"></i> ${def.label}</span>`
                  : "";
              })
              .filter(Boolean)
              .join("")}
          </div>
        </div>

        <div class="detail-checked-in" id="detailCheckedIn" style="display: none;">
          <h3><i class="fas fa-users"></i> Currently Studying Here (<span class="checkin-count-detail">0</span>)</h3>
          <div class="detail-users-grid" id="detailUsersGrid"></div>
        </div>

        <div class="detail-actions">
          <button class="btn-primary detail-view-full" onclick="window.location.href='${spot.detailUrl}'">
            View Full Details
          </button>
          <button class="btn-secondary detail-get-directions">
            <i class="fas fa-directions"></i> Get Directions
          </button>
        </div>
      </div>
    `;

    spotList.parentNode.insertBefore(detailView, spotList.nextSibling);

    const slot = detailView.querySelector(".detail-carousel-slot");
    if (slot) {
      const cardCarousel = spot.card?.querySelector(".spot-image-carousel");
      if (cardCarousel) {
        const clone = cardCarousel.cloneNode(true);
        clone.classList.add("detail-carousel");
        slot.replaceWith(clone);
        initSpotImageCarousels(detailView);
      } else {
        slot.outerHTML = `
          <img src="${spot.image}" alt="${spot.name}" class="detail-image">
        `;
      }
    }

    const starsContainer = detailView.querySelector(".detail-rating-stars");
    renderRatingStars(starsContainer, spot.rating);

    displayCheckedInUsers(spot);

    const backBtn = document.getElementById("backToListBtn");
    backBtn.addEventListener("click", () => {
      returnToListView();
    });

    const directionsBtn = detailView.querySelector(".detail-get-directions");
    directionsBtn.addEventListener("click", () => {
      if (!spot.card) return;

      const lat = parseFloat(spot.card.dataset.lat);
      const lng = parseFloat(spot.card.dataset.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      showDirectionsRoute({ lat, lng }, spot.name);
    });

    sidebarMode = "detail";
    currentDetailSpotId = spotId;
  }

  function returnToListView() {
    const sidebarHeader = mapSidebar.querySelector(".sidebar-header");
    const sidebarSearch = mapSidebar.querySelector(".sidebar-search");
    const chipFilters = mapSidebar.querySelector(".chip-filters");
    const spotList = mapSidebar.querySelector(".spot-list");
    const detailView = document.querySelector(".spot-detail-view");

    sidebarHeader.innerHTML = `
      <button id="menuBtn" class="icon-btn"><i class="fas fa-bars"></i></button>
      <div class="sidebar-title">
        <h2>Study Spots</h2>
        <p>${spotCards.length} locations near you</p>
      </div>
    `;

    const newMenuBtn = document.getElementById("menuBtn");
    newMenuBtn.addEventListener("click", () => {
      mapSidebar.classList.toggle("collapsed");
    });

    sidebarSearch.style.display = "block";
    chipFilters.style.display = "flex";
    spotList.style.display = "block";

    if (detailView) detailView.remove();

    clearHighlightedMarker();
    setExclusiveMarker(null);
    clearRoute(); // ✅ clear route when going back

    sidebarMode = "list";
    currentDetailSpotId = null;
  }

  // =========================
  // 8. MARKER HIGHLIGHTING
  // =========================
  function highlightMarker(spotId) {
    const spot = spotDataMap.get(spotId);
    if (!spot || !spot.marker) return;

    // If this marker is already highlighted, toggle OFF
    if (highlightedMarker && highlightedSpotId === spotId) {
      clearHighlightedMarker();
      highlightedSpotId = null;
      return;
    }

    // Highlight a new marker
    clearHighlightedMarker();

    const marker = spot.marker;

    const isOpen =
      computeOpenStatus(spot.opening, spot.closing, spot.amenities.open24) ===
      "open";

    marker.setIcon(getCustomIcon(isOpen, true));
    highlightedMarker = marker;
    highlightedSpotId = spotId;

    const el = marker.getElement();
    if (el) {
      el.classList.add("marker-highlighted");
    }

    if (studyMap) {
      studyMap.flyTo(marker.getLatLng(), 16, { duration: 1 });
    }
  }

  function clearHighlightedMarker() {
    if (highlightedMarker) {
      const spot = spotDataMap.get(highlightedMarker.spotId);
      let isOpen = false;
      if (spot) {
        isOpen =
          computeOpenStatus(
            spot.opening,
            spot.closing,
            spot.amenities.open24
          ) === "open";
      }
      highlightedMarker.setIcon(getCustomIcon(isOpen, false));

      const markerElement = highlightedMarker.getElement();
      if (markerElement) {
        markerElement.classList.remove("marker-highlighted");
      }

      highlightedMarker = null;
      highlightedSpotId = null;
    }
  }

  // =========================
  // 9. LEAFLET MAP INITIALIZATION
  // =========================
  const mapElement = document.getElementById("map");
  const fallbackLat = 8.718;
  const fallbackLng = 123.416;
  const fallbackZoom = 14;
  let hasValidCoords = false;

  if (mapElement && typeof L !== "undefined") {
    studyMap = L.map("map", {
      zoomControl: false,
    }).setView([fallbackLat, fallbackLng], fallbackZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      minZoom: 4,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(studyMap);

    const onLocationFound = (e) => {
      const radius = e.accuracy;
      const heading = e.heading;

      userLatLng = e.latlng;

      if (locationMarker) {
        studyMap.removeLayer(locationMarker);
      }

      locationMarker = L.marker(e.latlng, {
        icon: getUserLocationIcon(),
      })
        .addTo(studyMap)
        .bindPopup(
          "You are here (Accuracy: " + radius.toFixed(1) + " meters)"
        );

      const markerElement = locationMarker.getElement();
      if (markerElement && heading !== null && !isNaN(heading)) {
        const rotatableDiv = markerElement.querySelector(
          ".user-location-pin-rotatable"
        );
        if (rotatableDiv) {
          rotatableDiv.style.transition = "transform 0.5s ease-out";
          rotatableDiv.style.transform = `rotate(${heading}deg)`;
        }
      }

      if (!studyMap.isLocateHandled) {
        studyMap.setView(e.latlng, Math.max(studyMap.getZoom(), 15));
        studyMap.isLocateHandled = true;
      }
    };

    const onLocationError = (e) => {
      console.error("Geolocation Error:", e.message);
      if (!studyMap.isLocateHandled && hasValidCoords) {
        const latLngs = leafletMarkers.map((m) => m.getLatLng());
        const bounds = L.latLngBounds(latLngs);
        studyMap.fitBounds(bounds, { padding: [50, 50] });
        studyMap.isLocateHandled = true;
      }
    };

    studyMap.on("locationfound", onLocationFound);
    studyMap.on("locationerror", onLocationError);

    studyMap.locate({
      setView: false,
      maxZoom: 16,
      watch: true,
      enableHighAccuracy: true,
    });

    spotCards.forEach((card) => {
      const lat = parseFloat(card.dataset.lat);
      const lng = parseFloat(card.dataset.lng);

      registerSpotDataFromCard(card);
      const spotId = card.dataset.spotId;
      const spot = spotDataMap.get(spotId);

      if (!isNaN(lat) && !isNaN(lng)) {
        hasValidCoords = true;
        const isOpen = spot.status === "open";
        const marker = L.marker([lat, lng], {
          icon: getCustomIcon(isOpen),
        }).addTo(studyMap);

        marker.spotId = spotId;
        marker.card = card;
        leafletMarkers.push(marker);

        if (spotDataMap.has(spotId)) {
          spotDataMap.get(spotId).marker = marker;
        }

        marker.on("click", () => {
          createDetailSidebar(spotId);
          highlightMarker(spotId);

          if (mapSidebar) {
            mapSidebar.scrollTop = 0;
          }
        });
      }
    });

    studyMap.on("movestart", () => {
      if (mapPreviewCard) {
        mapPreviewCard.classList.remove("active");
      }
    });
  }

  // =========================
  // 10. PREVIEW CARD LOGIC
  // =========================
  function renderRatingStars(container, rating) {
    if (!container) return;
    container.innerHTML = "";

    const rounded = Math.round(rating * 2) / 2;
    const fullStars = Math.floor(rounded);
    const hasHalfStar = rounded % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let html = "";
    for (let i = 0; i < fullStars; i++) {
      html += '<i class="fas fa-star filled"></i>';
    }
    if (hasHalfStar) {
      html += '<i class="fas fa-star-half-alt filled"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
      html += '<i class="far fa-star"></i>';
    }
    container.innerHTML = html;
  }

  function showPreviewCard(spotId) {
    const spot = spotDataMap.get(spotId);
    if (!spot || !mapPreviewCard) return;

    currentPreviewSpotId = spotId;
    currentPreviewDetailUrl = spot.detailUrl;

    if (previewImage) {
      const placeholder = previewImage.dataset?.placeholder;
      previewImage.src = spot.image || placeholder || previewImage.src;
      previewImage.alt = spot.name;
    }

    if (previewTitle) {
      previewTitle.textContent = spot.name;
    }

    if (previewRatingValue) {
      previewRatingValue.textContent = spot.rating.toFixed(1);
    }

    if (previewLocationText) {
      previewLocationText.textContent = spot.location;
    }

    if (previewStatusBadge) {
      previewStatusBadge.textContent =
        spot.status === "open" ? "Open" : "Closed";
      previewStatusBadge.className = `preview-status-badge ${spot.status}`;
    }

    renderRatingStars(previewRatingStars, spot.rating);

    if (previewTagsContainer) {
      const tagsHtml = spot.tags
        .map((tagKey) => {
          const definition = amenityDefinitions[tagKey];
          if (!definition) return "";
          return `<span><i class="fas ${definition.icon}"></i> ${definition.label}</span>`;
        })
        .filter(Boolean)
        .join("");
      previewTagsContainer.innerHTML = tagsHtml;
    }

    mapPreviewCard.classList.add("active");
  }

  if (previewCloseBtn) {
    previewCloseBtn.addEventListener("click", () => {
      mapPreviewCard.classList.remove("active");
      currentPreviewSpotId = null;
      currentPreviewDetailUrl = null;
      clearRoute(); // ✅ clear route when closing preview
    });
  }

  if (viewDetailsBtn) {
    viewDetailsBtn.addEventListener("click", () => {
      if (currentPreviewDetailUrl) {
        window.location.href = currentPreviewDetailUrl;
      }
    });
  }

  // =========================
  // 11. MARKER VISIBILITY SYNC
  // =========================
  function updateMarkerVisibility() {
    if (!studyMap) return;

    if (exclusiveSpotId) {
      leafletMarkers.forEach((marker) => {
        const spotId = marker.spotId;

        if (spotId === exclusiveSpotId) {
          if (!studyMap.hasLayer(marker)) {
            marker.addTo(studyMap);
          }
        } else {
          if (studyMap.hasLayer(marker)) {
            studyMap.removeLayer(marker);
          }
        }
      });
      return;
    }

    leafletMarkers.forEach((marker) => {
      const card = marker.card;
      const isCardVisible = !card || card.style.display !== "none";

      if (isCardVisible) {
        if (!studyMap.hasLayer(marker)) {
          marker.addTo(studyMap);
        }
      } else {
        if (studyMap.hasLayer(marker)) {
          studyMap.removeLayer(marker);
        }
      }
    });
  }

  // =========================
  // 12. FILTER + SEARCH LOGIC
  // =========================
  const filterChips = document.querySelectorAll(".filter-chip");
  let activeFilterSet = new Set(["all"]);

  const filterToDatasetMap = {
    wifi: "wifi",
    open24: "open24",
    outlets: "outlets",
    coffee: "coffee",
    ac: "ac",
    pastries: "pastries",
    trending: "trending",
  };

  filterChips.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      if (filter === "all") {
        activeFilterSet.clear();
        activeFilterSet.add("all");
        filterChips.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        spotCards.forEach((card) => {
          card.style.display = "block";
        });
      } else {
        activeFilterSet.delete("all");
        const allChip = document.querySelector(
          '.filter-chip[data-filter="all"]'
        );
        if (allChip) allChip.classList.remove("active");

        if (activeFilterSet.has(filter)) {
          activeFilterSet.delete(filter);
          button.classList.remove("active");
        } else {
          activeFilterSet.add(filter);
          button.classList.add("active");
        }

        if (activeFilterSet.size === 0) {
          activeFilterSet.add("all");
          if (allChip) allChip.classList.add("active");

          spotCards.forEach((card) => {
            card.style.display = "block";
          });
        } else {
          spotCards.forEach((card) => {
            let matchesAllFilters = true;

            activeFilterSet.forEach((filterKey) => {
              const datasetKey = filterToDatasetMap[filterKey] || filterKey;
              const value = card.dataset[datasetKey];
              const hasAmenity = value === "true";

              if (!hasAmenity) {
                matchesAllFilters = false;
              }
            });

            card.style.display = matchesAllFilters ? "block" : "none";
          });
        }
      }

      if (!exclusiveSpotId) {
        updateMarkerVisibility();
      }
    });
  });

  if (searchSpot) {
    searchSpot.addEventListener("input", () => {
      const query = searchSpot.value.trim().toLowerCase();

      spotCards.forEach((card) => {
        const name =
          (
            card.dataset.name ||
            card.querySelector("h3")?.textContent ||
            ""
          ).toLowerCase();
        const location =
          (
            card.dataset.location ||
            card.querySelector(".spot-location span")?.textContent ||
            ""
          ).toLowerCase();

        const datasetTrueKeys = Object.keys(card.dataset).filter(
          (key) =>
            card.dataset[key] === "True" || card.dataset[key] === "true"
        );

        const matchesName = name.includes(query);
        const matchesLocation = location.includes(query);
        const matchesAmenity = datasetTrueKeys.some((field) =>
          field.includes(query.replace(/[^a-z0-9]/g, ""))
        );

        const searchMatch =
          query === "" || matchesName || matchesLocation || matchesAmenity;

        let filterMatch = true;
        if (!activeFilterSet.has("all")) {
          activeFilterSet.forEach((filterKey) => {
            const datasetKey = filterToDatasetMap[filterKey] || filterKey;
            const value = card.dataset[datasetKey];
            const hasAmenity = value === "true";

            if (!hasAmenity) {
              filterMatch = false;
            }
          });
        }

        card.style.display = searchMatch && filterMatch ? "block" : "none";
      });

      if (!exclusiveSpotId) {
        updateMarkerVisibility();
      }
    });
  }

  if (searchTriggerBtn && searchSpot) {
    searchTriggerBtn.addEventListener("click", () => {
      const term = searchSpot.value.trim().toLowerCase();
      if (!term) return;

      let foundSpotId = null;
      for (const card of spotCards) {
        if (card.style.display === "none") continue;

        const spotId = card.dataset.spotId;
        const spot = spotDataMap.get(spotId);
        if (!spot) continue;

        const nameMatch = spot.name.toLowerCase().includes(term);
        const locMatch = spot.location.toLowerCase().includes(term);

        if (nameMatch || locMatch) {
          foundSpotId = spotId;
          break;
        }
      }

      if (foundSpotId) {
        createDetailSidebar(foundSpotId);
        highlightMarker(foundSpotId);
      }
    });
  }

  if (filterBtn && filterPopup) {
    filterBtn.addEventListener("click", () => {
      filterPopup.classList.add("active");
    });
  }

  if (closeFilterBtn && filterPopup) {
    closeFilterBtn.addEventListener("click", () => {
      filterPopup.classList.remove("active");
    });

    filterPopup.addEventListener("click", (e) => {
      if (e.target === filterPopup) {
        filterPopup.classList.remove("active");
      }
    });
  }

  if (distanceSlider && distanceValue) {
    distanceSlider.addEventListener("input", () => {
      distanceValue.textContent = `${distanceSlider.value} km`;
      activeFilters.distance = Number(distanceSlider.value);
    });
  }

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", () => {
      filterPopup?.classList.remove("active");
      if (!exclusiveSpotId) {
        updateMarkerVisibility();
      }
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      activeFilters = {
        amenities: [],
        hours: "any",
        price: "1",
        rating: 4.5,
        distance: 5,
      };

      if (distanceSlider && distanceValue) {
        distanceSlider.value = 5;
        distanceValue.textContent = "5 km";
      }

      activeFilterSet.clear();
      activeFilterSet.add("all");
      filterChips.forEach((btn) => btn.classList.remove("active"));
      const allChip = document.querySelector(
        '.filter-chip[data-filter="all"]'
      );
      if (allChip) allChip.classList.add("active");

      spotCards.forEach((card) => {
        card.style.display = "block";
      });

      if (!exclusiveSpotId) {
        updateMarkerVisibility();
      }
    });
  }

  // =========================
  // 13. SIDEBAR + DROPDOWNS + LOGOUT
  // =========================
  if (menuBtn && mapSidebar) {
    menuBtn.addEventListener("click", () => {
      mapSidebar.classList.toggle("collapsed");
    });
  }

  spotCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      const isModifiedClick =
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0;

      const spotId = card.dataset.spotId;
      if (!spotId) return;

      if (!isModifiedClick) {
        e.preventDefault();
      } else {
        return;
      }

      createDetailSidebar(spotId);
      highlightMarker(spotId);

      if (window.innerWidth <= 768 && mapSidebar) {
        mapSidebar.classList.add("collapsed");
      }
    });
  });

  if (dropdownBtn && userDropdown) {
    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.style.display =
        userDropdown.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".user-dropdown")) {
        userDropdown.style.display = "none";
      }
    });
  }

  if (logoutLink && logoutModal) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      logoutModal.classList.add("active");
      if (userDropdown) userDropdown.style.display = "none";
    });

    if (cancelLogout) {
      cancelLogout.addEventListener("click", () => {
        logoutModal.classList.remove("active");
      });
    }

    if (confirmLogout) {
      confirmLogout.addEventListener("click", () => {
        window.location.href = logoutLink.href;
      });
    }

    logoutModal.addEventListener("click", (e) => {
      if (e.target === logoutModal) {
        logoutModal.classList.remove("active");
      }
    });
  }

  if (menuDots && dropdownMenu) {
    menuDots.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".map-menu-dropdown")) {
        dropdownMenu.classList.add("hidden");
      }
    });
  }

  if (locationBtn && studyMap) {
    locationBtn.addEventListener("click", () => {
      if (locationMarker) {
        studyMap.setView(
          locationMarker.getLatLng(),
          Math.max(studyMap.getZoom(), 16)
        );
      } else {
        studyMap.locate({
          setView: true,
          maxZoom: 16,
          enableHighAccuracy: true,
        });
      }
    });
  }

  if (zoomInBtn && studyMap) {
    zoomInBtn.addEventListener("click", () => {
      studyMap.zoomIn();
    });
  }

  if (zoomOutBtn && studyMap) {
    zoomOutBtn.addEventListener("click", () => {
      studyMap.zoomOut();
    });
  }

  if (searchAsMove) {
    searchAsMove.addEventListener("change", (e) => {
      if (e.target.checked) {
        console.log("Search as you move enabled");
      } else {
        console.log("Search as you move disabled");
      }
    });
  }

  // =========================
  // 14. FAVORITES
  // =========================
  spotCards.forEach((card) => {
    const favoriteBtn = card.querySelector(".favorite-btn");
    const spotId = card.dataset.spotId;

    if (!favoriteBtn || !spotId) return;

    favoriteBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      favoriteBtn.classList.toggle("active");
      const heartIcon = favoriteBtn.querySelector("i");

      if (favoriteBtn.classList.contains("active")) {
        favorites.add(spotId);
        if (heartIcon) {
          heartIcon.classList.remove("far");
          heartIcon.classList.add("fas");
        }
      } else {
        favorites.delete(spotId);
        if (heartIcon) {
          heartIcon.classList.remove("fas");
          heartIcon.classList.add("far");
        }
      }
    });
  });

  // =========================
  // 15. OWNER CONTROLS TOGGLE
  // =========================
  ownerControlsContainers.forEach((controlsContainer) => {
    const settingsButton = controlsContainer.querySelector(
      ".ctrl-btn-settings"
    );
    const cancelButton = controlsContainer.querySelector(".ctrl-btn.cancel");
    const defaultControls = controlsContainer.querySelector(
      ".owner-controls-default"
    );
    const editControls = controlsContainer.querySelector(
      ".owner-controls-edit"
    );

    if (settingsButton && defaultControls && editControls) {
      settingsButton.addEventListener("click", () => {
        defaultControls.style.display = "none";
        editControls.style.display = "flex";
      });
    }

    if (cancelButton && defaultControls && editControls) {
      cancelButton.addEventListener("click", () => {
        editControls.style.display = "none";
        defaultControls.style.display = "flex";
      });
    }
  });

  // =========================
  // 16. GLOBAL SHORTCUTS
  // =========================
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (sidebarMode === "detail") {
        returnToListView();
      }
      filterPopup && filterPopup.classList.remove("active");
      mapPreviewCard && mapPreviewCard.classList.remove("active");
      dropdownMenu && dropdownMenu.classList.add("hidden");
      userDropdown && (userDropdown.style.display = "none");
      logoutModal && logoutModal.classList.remove("active");
      clearRoute(); // optional: Esc also clears route
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && mapSidebar) {
      mapSidebar.classList.remove("collapsed");
    }
  });

  // =========================
  // 17. STATUS REFRESH
  // =========================
  function refreshSpotStatuses() {
    spotDataMap.forEach((spot) => {
      const newStatus = computeOpenStatus(
        spot.opening,
        spot.closing,
        spot.amenities.open24
      );

      spot.status = newStatus;

      if (spot.card) {
        const badge = spot.card.querySelector(".map-status-badge");
        if (badge) {
          const label = newStatus === "open" ? "Open" : "Closed";
          badge.setAttribute("data-label", label);
          badge.classList.remove("status-init", "open", "closed");
          badge.classList.add(newStatus);
        }
      }

      const marker = spot.marker;
      if (marker) {
        const isHighlighted = marker === highlightedMarker;
        marker.setIcon(
          getCustomIcon(newStatus === "open", isHighlighted)
        );
      }
    });

    if (currentPreviewSpotId && previewStatusBadge) {
      const s = spotDataMap.get(currentPreviewSpotId);
      if (s) {
        previewStatusBadge.textContent =
          s.status === "open" ? "Open" : "Closed";
        previewStatusBadge.className = `preview-status-badge ${s.status}`;
      }
    }

    if (sidebarMode === "detail" && currentDetailSpotId) {
      const spot = spotDataMap.get(currentDetailSpotId);
      const badge = document.querySelector(".detail-status-badge");
      if (badge && spot) {
        badge.textContent = spot.status === "open" ? "Open" : "Closed";
        badge.className = `detail-status-badge ${spot.status}`;
      }
    }
  }

  updateMarkerVisibility();
  refreshSpotStatuses();
  setInterval(refreshSpotStatuses, 60000);

  // =========================
  // 18. SPOT IMAGE CAROUSELS (with slide animation)
  // =========================
  function initSpotImageCarousels(root = document) {
    const carousels = root.querySelectorAll(".spot-image-carousel");
    const TRANSITION_MS = 350;

    carousels.forEach((carousel) => {
      const images = carousel.querySelectorAll(".carousel-image");
      if (!images.length) return;

      let currentIndex = 0;
      let isAnimating = false;

      const ALL_CLASSES = [
        "active",
        "slide-in-right",
        "slide-in-left",
        "slide-from-right",
        "slide-from-left",
        "slide-out-left",
        "slide-out-right",
      ];

      const resetClasses = (img) => {
        ALL_CLASSES.forEach((cls) => img.classList.remove(cls));
      };

      images.forEach((img, idx) => {
        resetClasses(img);
        if (idx === 0) img.classList.add("active");
      });

      const goTo = (newIndex, direction) => {
        if (isAnimating || newIndex === currentIndex) return;
        isAnimating = true;

        const currentImg = images[currentIndex];
        const nextImg = images[newIndex];

        resetClasses(currentImg);
        resetClasses(nextImg);

        if (direction === "next") {
          currentImg.classList.add("active", "slide-out-left");
          nextImg.classList.add("slide-in-right");
          void nextImg.offsetWidth;
          nextImg.classList.add("active", "slide-from-right");
        } else {
          currentImg.classList.add("active", "slide-out-right");
          nextImg.classList.add("slide-in-left");
          void nextImg.offsetWidth;
          nextImg.classList.add("active", "slide-from-left");
        }

        setTimeout(() => {
          resetClasses(currentImg);
          nextImg.classList.add("active");
          currentIndex = newIndex;
          isAnimating = false;
        }, TRANSITION_MS);
      };

      const prevBtn = carousel.querySelector(".carousel-btn.prev");
      const nextBtn = carousel.querySelector(".carousel-btn.next");

      if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const newIndex =
            (currentIndex - 1 + images.length) % images.length;
          goTo(newIndex, "prev");
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const newIndex = (currentIndex + 1) % images.length;
          goTo(newIndex, "next");
        });
      }
    });
  }

  initSpotImageCarousels();

  console.log(
    "StudyHive Map View initialized with enhanced detail sidebar, exclusive marker highlight, animated carousels, and OSRM routing."
  );

  // =========================
  // 19. ROUTE HELPERS (OSRM + CLEAR)
  // =========================
  function clearRoute() {
    if (!studyMap) return;
    if (activeRouteLine) {
      studyMap.removeLayer(activeRouteLine);
      activeRouteLine = null;
    }
    if (activeRoutePopup) {
      studyMap.removeLayer(activeRoutePopup);
      activeRoutePopup = null;
    }
  }

  function formatMinutes(mins) {
    if (mins < 1) return "< 1 min";
    if (mins < 60) return `${Math.round(mins)} min`;
    const hours = Math.floor(mins / 60);
    const rest = Math.round(mins % 60);
    if (rest === 0) {
      return `${hours} hr${hours > 1 ? "s" : ""}`;
    }
    return `${hours} hr${hours > 1 ? "s" : ""} ${rest} min`;
  }

  function showDirectionsRoute(spotLatLng, spotName) {
    if (!studyMap) return;

    // Make sure we know the user's location
    if (!userLatLng) {
      studyMap.locate({
        setView: true,
        maxZoom: 16,
        enableHighAccuracy: true,
      });
      alert(
        "Detecting your location first. Please tap Get Directions again in a moment."
      );
      return;
    }

    // Clear previous route & popup
    clearRoute();

    const user = { lat: userLatLng.lat, lng: userLatLng.lng };
    const dest = { lat: spotLatLng.lat, lng: spotLatLng.lng };

    // OSRM public demo server (road-network routing)
    const url = `https://router.project-osrm.org/route/v1/driving/${user.lng},${user.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!data.routes || !data.routes.length) {
          alert("No route found for this destination.");
          return;
        }

        const route = data.routes[0];

        // Convert [lng, lat] → [lat, lng] for Leaflet
        const coords = route.geometry.coordinates.map(([lng, lat]) => [
          lat,
          lng,
        ]);

        // Distance (m → km) and duration (s → minutes)
        const distanceKm = route.distance / 1000;
        const baseMinutes = route.duration / 60;

        // ✅ Solid bold green line
        activeRouteLine = L.polyline(coords, {
          color: "#22c55e", // green
          weight: 6, // bold
          opacity: 1,
        }).addTo(studyMap);

        // Approximate times for different modes, using distance
        const modes = {
          Walking: 5, // km/h
          Commute: 18,
          Biking: 15,
          Motorcycle: 30,
          Car: 40,
        };

        let rows = "";
        Object.entries(modes).forEach(([label, speed]) => {
          const mins = (distanceKm / speed) * 60;
          rows += `
            <tr>
              <td>${label}</td>
              <td style="text-align:right;">${formatMinutes(mins)}</td>
            </tr>
          `;
        });

        // Use the route's midpoint as popup anchor
        const midIndex = Math.floor(coords.length / 2);
        const midLatLng = coords[midIndex];

        activeRoutePopup = L.popup({
          closeButton: true,
          autoPan: true,
          maxWidth: 260,
        })
          .setLatLng(midLatLng)
          .setContent(`
            <div style="font-family:'Nunito Sans',system-ui; font-size:13px;">
              <strong>${spotName}</strong><br/>
              Distance (by road): ${distanceKm.toFixed(2)} km<br/>
              <small>Approx. driving time (OSRM): ${formatMinutes(
                baseMinutes
              )}</small>
              <table style="width:100%; margin-top:6px; border-collapse:collapse;">
                <tbody>
                  ${rows}
                </tbody>
              </table>
              <small style="color:#666;">Route based on OpenStreetMap road network.</small>
            </div>
          `)
          .openOn(studyMap);

        // Fit map to show full route
        studyMap.fitBounds(activeRouteLine.getBounds(), {
          padding: [80, 80],
        });
      })
      .catch((err) => {
        console.error("Routing error:", err);
        alert("Unable to fetch route. Please try again in a moment.");
      });
  }
});
