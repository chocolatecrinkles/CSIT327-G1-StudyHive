/* ============================================================
   DEBOUNCE
============================================================ */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  /* ============================================================
       ELEMENTS
  ============================================================ */
  const mapModal = document.getElementById("mapModal");
  const openMapPicker = document.getElementById("openMapPicker");
  const closeMapModal = document.getElementById("closeMapModal");
  const saveMapBtn = document.getElementById("saveMapLocation");

  const mapSearchInput = document.getElementById("mapSearchInput");
  const mapSearchResults = document.getElementById("mapSearchResults");

  const locationField = document.getElementById("location");
  const mapTitle = document.getElementById("mapSelectedTitle");

  const latField = document.getElementById("lat");
  const lngField = document.getElementById("lng");

  const form = document.querySelector(".listing-form");
  const submitBtn = form ? form.querySelector(".submit-btn") : null;

  // image fields (also used below for Supabase upload)
  const imageUpload = document.getElementById("image-upload");
  const imagesJsonField = document.getElementById("images_json");
  const imageUrlField = document.getElementById("image_url");

  let selectedAddress = "";
  let mapPicker = null;
  let activeMarker = null;
  let hasSavedBefore = false;

  // Get existing location data
  const existingLat = latField ? latField.value : "";
  const existingLng = lngField ? lngField.value : "";

  /* ============================================================
       ADDRESS CLEAN FORMAT
  ============================================================ */
  function cleanAddress(addr, fallback) {
    const a = addr || {};
    const parts = [
      a.road,
      a.neighbourhood || a.suburb,
      a.city || a.town || "Cebu City",
      "Cebu",
      "Philippines",
    ].filter(Boolean);

    return parts.join(", ") || fallback;
  }

  /* ============================================================
       OPEN MAP MODAL
  ============================================================ */
  if (openMapPicker && mapModal) {
    openMapPicker.addEventListener("click", () => {
      mapModal.style.display = "block";

      if (locationField && locationField.value && mapTitle) {
        selectedAddress = locationField.value;
        mapTitle.textContent = locationField.value;
      } else if (mapTitle) {
        mapTitle.textContent = "Select Location in Cebu City";
      }

      setTimeout(() => {
        if (!mapPicker) {
          const defaultLat = existingLat ? parseFloat(existingLat) : 10.3157;
          const defaultLng = existingLng ? parseFloat(existingLng) : 123.8854;

          const cebuBounds = [
            [10.18, 123.8],
            [10.45, 124.05],
          ];

          mapPicker = L.map("mapPicker", {
            minZoom: 12,
            maxZoom: 19,
            maxBounds: cebuBounds,
            maxBoundsViscosity: 0.8,
          }).setView([defaultLat, defaultLng], 13);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            minZoom: 12,
            maxZoom: 19,
          }).addTo(mapPicker);

          if (existingLat && existingLng) {
            updateMarker(parseFloat(existingLat), parseFloat(existingLng));
          }

          mapPicker.on("click", async (e) => {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            updateMarker(lat, lng);
            if (latField) latField.value = lat;
            if (lngField) lngField.value = lng;

            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
              );

              if (!res.ok) {
                throw new Error("Reverse geocode failed with status " + res.status);
              }

              const data = await res.json();
              const formatted = cleanAddress(data.address, data.display_name);

              selectedAddress = formatted;
              if (mapTitle) mapTitle.textContent = formatted;

              if (!hasSavedBefore && locationField && !locationField.value) {
                locationField.value = formatted;
              }
            } catch (err) {
              console.error("Reverse geocoding error:", err);

              const fallback =
                (locationField && locationField.value) ||
                `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;

              selectedAddress = fallback;
              if (mapTitle) mapTitle.textContent = fallback;

              if (!hasSavedBefore && locationField && !locationField.value) {
                locationField.value = fallback;
              }
            }
          });
        } else {
          mapPicker.invalidateSize();
          if (existingLat && existingLng) {
            mapPicker.setView([parseFloat(existingLat), parseFloat(existingLng)], 13);
          }
        }
      }, 150);
    });
  }

  /* ============================================================
       CLOSE MAP MODAL
  ============================================================ */
  if (closeMapModal && mapModal) {
    closeMapModal.addEventListener("click", () => {
      mapModal.style.display = "none";
      if (mapSearchResults) mapSearchResults.style.display = "none";
    });
  }

  const mapOverlay = document.querySelector(".map-modal-overlay");
  if (mapOverlay && mapModal) {
    mapOverlay.addEventListener("click", () => {
      mapModal.style.display = "none";
      if (mapSearchResults) mapSearchResults.style.display = "none";
    });
  }

  /* ============================================================
       SAVE LOCATION
  ============================================================ */
  if (saveMapBtn && mapModal) {
    saveMapBtn.addEventListener("click", () => {
      if (selectedAddress && locationField) locationField.value = selectedAddress;
      hasSavedBefore = true;
      mapModal.style.display = "none";
      if (mapSearchResults) mapSearchResults.style.display = "none";
    });
  }

  /* ============================================================
       UPDATE MARKER
  ============================================================ */
  function updateMarker(lat, lng) {
    if (!mapPicker) return;

    if (activeMarker) mapPicker.removeLayer(activeMarker);

    activeMarker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
        iconSize: [38, 38],
        iconAnchor: [19, 38],
      }),
    }).addTo(mapPicker);

    mapPicker.setView([lat, lng], 16);
  }

  /* ============================================================
       SEARCH (Nominatim)
  ============================================================ */
  if (mapSearchInput && mapSearchResults) {
    mapSearchInput.addEventListener(
      "input",
      debounce(async () => {
        const query = mapSearchInput.value.trim();

        if (query.length < 2) {
          mapSearchResults.style.display = "none";
          return;
        }

        const url = `
          https://nominatim.openstreetmap.org/search?format=json
          &q=${query}+Cebu+City
          &addressdetails=1
          &limit=5
        `.replace(/\s+/g, "");

        const res = await fetch(url);
        const results = await res.json();

        mapSearchResults.innerHTML = "";
        mapSearchResults.style.display = "block";

        if (!results.length) {
          mapSearchResults.innerHTML = "<div class='no-result'>No results found</div>";
          return;
        }

        results.forEach((place) => {
          const formatted = cleanAddress(place.address, place.display_name);

          const primary = formatted.split(",")[0];
          const secondary = formatted.replace(primary + ",", "");

          const div = document.createElement("div");
          div.classList.add("g-search-item");

          div.innerHTML = `
            <div class="g-icon">
              <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png">
            </div>
            <div class="g-text">
              <div class="g-primary">${primary}</div>
              <div class="g-secondary">${secondary}</div>
            </div>
          `;

          div.addEventListener("click", () => {
            const lat = parseFloat(place.lat);
            const lng = parseFloat(place.lon);

            updateMarker(lat, lng);

            selectedAddress = formatted;
            if (mapTitle) mapTitle.textContent = formatted;

            if (latField) latField.value = lat;
            if (lngField) lngField.value = lng;

            if (!hasSavedBefore && locationField && !locationField.value) {
              locationField.value = formatted;
            }

            mapSearchResults.style.display = "none";
          });

          mapSearchResults.appendChild(div);
        });
      }, 200)
    );
  }

  /* ============================================================
       OPENING HOURS: HIDE WHEN 24/7
       (KEEP LAST MANUAL TIME VALUES)
  ============================================================ */
  const open247 = document.querySelector('input[name="open_24_7"]');
  const hoursGroup = document.getElementById("hoursGroup");
  const openingTime = document.querySelector('input[name="opening_time"]');
  const closingTime = document.querySelector('input[name="closing_time"]');

  // store last manually set times
  let storedOpening = openingTime ? openingTime.value : "";
  let storedClosing = closingTime ? closingTime.value : "";

  if (openingTime) {
    openingTime.addEventListener("input", () => {
      storedOpening = openingTime.value;
    });
  }
  if (closingTime) {
    closingTime.addEventListener("input", () => {
      storedClosing = closingTime.value;
    });
  }

  function updateHoursVisibility() {
    if (!open247 || !hoursGroup || !openingTime || !closingTime) return;

    if (open247.checked) {
      hoursGroup.classList.add("hidden");
      openingTime.required = false;
      closingTime.required = false;
      // do NOT change values here
    } else {
      hoursGroup.classList.remove("hidden");
      openingTime.required = true;
      closingTime.required = true;
      // restore last manual values (if any)
      if (storedOpening) openingTime.value = storedOpening;
      if (storedClosing) closingTime.value = storedClosing;
    }
  }

  if (open247) {
    open247.addEventListener("change", updateHoursVisibility);
    setTimeout(updateHoursVisibility, 80);
  }

  /* ============================================================
       AMENITIES VALIDATION (AT LEAST ONE)
  ============================================================ */
  const amenityCheckboxes = document.querySelectorAll(
    '.amenities-group input[type="checkbox"]'
  );
  const amenitiesError = document.querySelector(".amenities-error");

  function hasAmenitySelected() {
    return Array.from(amenityCheckboxes).some((cb) => cb.checked);
  }

  function updateAmenitiesValidity() {
    if (!amenityCheckboxes.length) return true;
    const ok = hasAmenitySelected();
    if (amenitiesError) {
      amenitiesError.classList.toggle("hidden", ok);
    }
    return ok;
  }

  amenityCheckboxes.forEach((cb) => {
    cb.addEventListener("change", updateAmenitiesValidity);
  });

  /* ============================================================
       FORM DIRTY CHECK
  ============================================================ */
  function formDataToString(fd) {
    const pairs = [];
    for (const [key, value] of fd.entries()) {
      if (key === "csrfmiddlewaretoken") continue;

      if (value instanceof File) {
        pairs.push(`${key}:${value.name}:${value.size}`);
      } else {
        pairs.push(`${key}:${value}`);
      }
    }
    return pairs.sort().join("&");
  }

  if (form && submitBtn) {
    const initialKey = formDataToString(new FormData(form));

    function checkDirty() {
      const currentKey = formDataToString(new FormData(form));
      const isDirty = currentKey !== initialKey;
      submitBtn.disabled = !isDirty;
    }

    submitBtn.disabled = true;

    form.addEventListener("input", checkDirty);
    form.addEventListener("change", checkDirty);

    // Block submit if no amenity is selected
    form.addEventListener("submit", (e) => {
      if (!updateAmenitiesValidity()) {
        e.preventDefault();
        const amenitiesGroup = document.querySelector(".amenities-group");
        if (amenitiesGroup) {
          amenitiesGroup.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });

    /* ============================================================
         SUPABASE UPLOAD ON SUBMIT (ONLY IF NEW IMAGES)
    ============================================================ */
    form.addEventListener("submit", async (e) => {
      // if previous handler already blocked submit, stop here
      if (e.defaultPrevented) return;

      // if no new files, let Django handle everything (keeps old images)
      if (!imageUpload || !imageUpload.files || imageUpload.files.length === 0) {
        return;
      }

      if (!window.supabase || !SUPABASE_URL || !SUPABASE_KEY) {
        console.warn("Supabase not configured, submitting without image upload.");
        return;
      }

      e.preventDefault();

      const { createClient } = supabase;
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

      submitBtn.disabled = true;

      const files = Array.from(imageUpload.files);
      const uploadedUrls = [];
      const bucketName = "study_spots"; // same bucket as create_listing
      const listingId = form.dataset.spotId || "listing";

      try {
        for (const file of files) {
          const ext = file.name.split(".").pop() || "jpg";
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${ext}`;
          const filePath = `spots/${listingId}/${fileName}`;

          const { error: uploadError } = await supabaseClient.storage
            .from(bucketName)
            .upload(filePath, file, { upsert: true });

          if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            continue;
          }

          const { data: publicData } = supabaseClient.storage
            .from(bucketName)
            .getPublicUrl(filePath);

          if (publicData && publicData.publicUrl) {
            uploadedUrls.push(publicData.publicUrl);
          }
        }

        if (uploadedUrls.length) {
          if (imagesJsonField) {
            imagesJsonField.value = JSON.stringify(uploadedUrls);
          }
          if (imageUrlField) {
            imageUrlField.value = uploadedUrls[0];
          }
        }
      } catch (err) {
        console.error("Image upload failed:", err);
      }

      // finally submit to Django
      form.submit();
    });
  }
});

/* ============================================================
   IMAGE UPLOAD PREVIEW + DRAG & DROP
============================================================ */
const imageUpload = document.getElementById("image-upload");
const previewContainer = document.getElementById("image-preview-container");
const dropZone = document.querySelector(".file-upload-label");
const imagesJsonField = document.getElementById("images_json");

function updateFileList(newFiles) {
  if (!imageUpload) return;
  const dataTransfer = new DataTransfer();
  newFiles.forEach((file) => dataTransfer.items.add(file));
  imageUpload.files = dataTransfer.files;
}

function renderPreviews(files) {
  if (!previewContainer) return;

  previewContainer.innerHTML = "";
  files.forEach((file, index) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const previewBox = document.createElement("div");
      previewBox.classList.add("image-preview-box");
      previewBox.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-preview" data-index="${index}">
          &times;
        </button>
      `;
      previewContainer.appendChild(previewBox);
    };
    reader.readAsDataURL(file);
  });
}

if (imageUpload) {
  imageUpload.addEventListener("change", () => {
    renderPreviews(Array.from(imageUpload.files));
  });
}

if (previewContainer && imageUpload) {
  previewContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove-preview");
    if (!btn) return;

    const index = parseInt(btn.dataset.index, 10);
    let files = Array.from(imageUpload.files);
    files.splice(index, 1);

    updateFileList(files);
    renderPreviews(files);
  });
}

if (dropZone && imageUpload && previewContainer) {
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "var(--primary-green)";
      dropZone.style.background = "rgba(144, 241, 156, 0.08)";
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "var(--glass-border)";
      dropZone.style.background = "var(--input-bg)";
    });
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    const current = Array.from(imageUpload.files);
    const combined = [...current];

    dropped.forEach((file) => {
      if (file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024) {
        combined.push(file);
      }
    });

    updateFileList(combined);
    renderPreviews(combined);
  });
}
