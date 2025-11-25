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
    ============================================================= */
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

    let selectedAddress = "";
    let mapPicker = null;
    let activeMarker = null;
    let hasSavedBefore = false;


    /* ============================================================
         CLEAN FORMAT — FIXES ACCURACY
    ============================================================= */
    function cleanAddress(addr, fallback) {
        const a = addr || {};
        const parts = [
            a.road,
            a.neighbourhood || a.suburb,
            a.city || a.town || "Cebu City",
            "Cebu",
            "Philippines"
        ].filter(Boolean);

        return parts.join(", ") || fallback;
    }


    /* ============================================================
         OPEN MODAL
    ============================================================= */
    openMapPicker.addEventListener("click", () => {
        mapModal.style.display = "block";

        setTimeout(() => {
            if (!mapPicker) {
                mapPicker = L.map("mapPicker").setView([10.3157, 123.8854], 13);

                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    maxZoom: 19
                }).addTo(mapPicker);

                mapPicker.on("click", async (e) => {
                    const lat = e.latlng.lat;
                    const lng = e.latlng.lng;

                    updateMarker(lat, lng);
                    latField.value = lat;
                    lngField.value = lng;

                    try {
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
                        );
                        const data = await res.json();
                        const formatted = cleanAddress(data.address, data.display_name);

                        selectedAddress = formatted;
                        mapTitle.textContent = formatted;

                        if (!hasSavedBefore && !locationField.value) {
                            locationField.value = formatted;
                        }

                    } catch {
                        mapTitle.textContent = "Unknown location";
                    }
                });
            }
            mapPicker.invalidateSize();
        }, 150);
    });


    /* ============================================================
         CLOSE MODAL
    ============================================================= */
    closeMapModal.addEventListener("click", () => {
        mapModal.style.display = "none";
        mapSearchResults.style.display = "none";
    });


    /* ============================================================
         SAVE LOCATION
    ============================================================= */
    saveMapBtn.addEventListener("click", () => {
        if (selectedAddress) locationField.value = selectedAddress;
        hasSavedBefore = true;
        mapModal.style.display = "none";
    });


    /* ============================================================
         UPDATE MARKER
    ============================================================= */
    function updateMarker(lat, lng) {
        if (activeMarker) mapPicker.removeLayer(activeMarker);

        activeMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                iconSize: [38, 38],
                iconAnchor: [19, 38]
            })
        }).addTo(mapPicker);

        mapPicker.setView([lat, lng], 16);
    }


    /* ============================================================
         GOOGLE-LIKE SEARCH
    ============================================================= */
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
                    <div class="g-icon"><img src="https://cdn-icons-png.flaticon.com/512/684/684908.png"></div>
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
                    mapTitle.textContent = formatted;

                    latField.value = lat;
                    lngField.value = lng;

                    if (!hasSavedBefore && !locationField.value) {
                        locationField.value = formatted;
                    }

                    mapSearchResults.style.display = "none";
                });

                mapSearchResults.appendChild(div);
            });
        }, 200)
    );



    /* ============================================================
         OPENING HOURS — FIXED
    ============================================================= */
    const open247 = document.getElementById("open_24_7");
    const hoursGroup = document.getElementById("hoursGroup");
    const openingTime = document.getElementById("opening_time");
    const closingTime = document.getElementById("closing_time");

    function updateHoursVisibility() {
        if (open247.checked) {
            hoursGroup.classList.add("hidden");
            openingTime.required = false;
            closingTime.required = false;
        } else {
            hoursGroup.classList.remove("hidden");
            openingTime.required = true;
            closingTime.required = true;
        }
    }

    open247.addEventListener("change", updateHoursVisibility);

    // Needed because checkbox is hidden (chip UI)
    setTimeout(updateHoursVisibility, 80);
});


/* ============================================================
   IMAGE UPLOAD PREVIEW + DRAG & DROP
============================================================ */
const imageUpload = document.getElementById("image-upload");
const previewContainer = document.getElementById("image-preview-container");
const dropZone = document.querySelector(".file-upload-label");

function updateFileList(newFiles) {
    let dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    imageUpload.files = dataTransfer.files;
}

function renderPreviews(files) {
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
                    <i class="fas fa-times"></i>
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

if (dropZone) {
    ["dragenter", "dragover"].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault();
            dropZone.style.borderColor = "var(--primary-green)";
            dropZone.style.background = "rgba(144, 241, 156, 0.08)";
        });
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault();
            dropZone.style.borderColor = "var(--glass-border)";
            dropZone.style.background = "var(--input-bg)";
        });
    });

    dropZone.addEventListener("drop", e => {
        e.preventDefault();
        const dropped = Array.from(e.dataTransfer.files);
        const current = Array.from(imageUpload.files);

        const combined = [...current];

        dropped.forEach(file => {
            if (file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024) {
                combined.push(file);
            }
        });

        updateFileList(combined);
        renderPreviews(combined);
    });
}

previewContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove-preview");
    if (!btn) return;

    const index = parseInt(btn.dataset.index);
    let files = Array.from(imageUpload.files);
    files.splice(index, 1);

    updateFileList(files);
    renderPreviews(files);
});
