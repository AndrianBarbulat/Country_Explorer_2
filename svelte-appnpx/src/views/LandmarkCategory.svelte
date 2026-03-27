<script>
    import { navigate } from "svelte-routing";
    import { onDestroy, afterUpdate } from "svelte";
    import L from "leaflet";
    import "leaflet/dist/leaflet.css";
    import {
        fetchLandmarks,
        removeLandmark,
        createLandmark,
    } from "../controllers/landmarkController";
    import { user } from "../stores/authStore";
    import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
    import { storage } from "../services/firebase";
    import Footer from "./assets/Footer.svelte";

    export let categoryId = "";
    export let categoryName = "";
    let selectedFiles;

    let landmarks = [];
    let error = "";
    let loading = true;
    let submitting = false;
    let newLandmark = {
        name: "",
        description: "",
        latitude: null,
        longitude: null,
        isPrivate: false,
    };

    // ── Map picker state ──
    let mapContainer;
    let pickerMap = null;
    let pickerMarker = null;
    let mapInitialized = false;
    let searchQuery = "";
    let searchLoading = false;
    let searchError = "";

    // ── Auth ──
    $: $user, checkAuthState();

    function checkAuthState() {
        if ($user === undefined) {
            loading = true;
            error = "";
        } else if ($user) {
            initializeLandmarks();
        } else {
            error = "User not logged in. Please sign in.";
            loading = false;
            navigate("/signin");
        }
    }

    // ── Landmark data ──
    function initializeLandmarks() {
        // Destroy any existing picker map before the form is removed from DOM
        destroyPickerMap();
        loading = true;

        fetchLandmarks(categoryId)
            .then((fetched) => {
                landmarks = fetched.map((lm, i) => ({
                    ...lm,
                    id: lm.id || `fallback-${i}`,
                    uniqueKey: lm.id || `fallback-${i}`,
                }));
                loading = false;
            })
            .catch(() => {
                error = "Failed to fetch landmarks. Please try again.";
                loading = false;
            });
    }

    // ── Map lifecycle ──
    // afterUpdate fires every render; initialize the picker only once per mount
    afterUpdate(() => {
        if (mapContainer && !mapInitialized) {
            mapInitialized = true;
            initPickerMap();
        }
    });

    function destroyPickerMap() {
        if (pickerMap) {
            pickerMap.remove();
            pickerMap = null;
        }
        pickerMarker = null;
        mapInitialized = false;
    }

    onDestroy(() => {
        destroyPickerMap();
    });

    function initPickerMap() {
        pickerMap = L.map(mapContainer).setView([20, 0], 2);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
        }).addTo(pickerMap);

        pickerMap.on("click", (e) => {
            placeMarker(e.latlng.lat, e.latlng.lng);
        });

        // Centre on user's position if available
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    pickerMap.setView(
                        [pos.coords.latitude, pos.coords.longitude],
                        12,
                    );
                },
                () => {}, // silent fallback to world view
            );
        }
    }

    function placeMarker(lat, lng) {
        newLandmark.latitude = parseFloat(lat.toFixed(6));
        newLandmark.longitude = parseFloat(lng.toFixed(6));

        if (pickerMarker) {
            pickerMarker.setLatLng([lat, lng]);
        } else {
            pickerMarker = L.marker([lat, lng], { draggable: true }).addTo(
                pickerMap,
            );
            pickerMarker.on("dragend", (e) => {
                const pos = e.target.getLatLng();
                newLandmark.latitude = parseFloat(pos.lat.toFixed(6));
                newLandmark.longitude = parseFloat(pos.lng.toFixed(6));
            });
        }
    }

    // ── Location search (Nominatim) ──
    async function searchLocation() {
        const q = searchQuery.trim();
        if (!q) return;
        searchLoading = true;
        searchError = "";
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`,
                { headers: { "Accept-Language": "en" } },
            );
            const results = await res.json();
            if (results.length > 0) {
                const lat = parseFloat(results[0].lat);
                const lon = parseFloat(results[0].lon);
                pickerMap.setView([lat, lon], 13);
                placeMarker(lat, lon);
            } else {
                searchError = "No results found. Try a different search.";
            }
        } catch {
            searchError = "Search failed. Please try again.";
        }
        searchLoading = false;
    }

    function handleSearchKeydown(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            searchLocation();
        }
    }

    // ── File upload ──
    async function uploadFiles() {
        if (!selectedFiles) return [];
        const uploads = [];
        for (const file of selectedFiles) {
            const storageRef = ref(storage, `landmarks/${file.name}`);
            uploads.push(
                uploadBytes(storageRef, file).then((snap) =>
                    getDownloadURL(snap.ref),
                ),
            );
        }
        try {
            return await Promise.all(uploads);
        } catch {
            return [];
        }
    }

    // ── Form submit ──
    async function addNewLandmark() {
        error = "";
        const { name, description, latitude, longitude, isPrivate } =
            newLandmark;

        if (!latitude || !longitude) {
            error = "Please click on the map to select a location.";
            return;
        }
        if (
            name.length > 30 ||
            description.length > 1000 ||
            !isValidCoordinates(latitude, longitude)
        ) {
            error =
                "Validation failed. Check the name (max 30 chars), description (max 1000 chars), and coordinates.";
            return;
        }

        submitting = true;
        const imageUrls = await uploadFiles();

        if (
            await createLandmark(
                { name, description, latitude, longitude, imageUrls, isPrivate },
                categoryId,
            )
        ) {
            newLandmark = {
                name: "",
                description: "",
                latitude: null,
                longitude: null,
                isPrivate: false,
            };
            selectedFiles = undefined;
            searchQuery = "";
            initializeLandmarks(); // also resets the map
        } else {
            error = "Failed to add landmark. Please check the data and try again.";
        }
        submitting = false;
    }

    function isValidCoordinates(lat, lon) {
        if (lat === null || lon === null) return false;
        return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
    }

    // ── Delete ──
    async function deleteLandmark(landmarkId) {
        if (!landmarkId) return;
        try {
            const success = await removeLandmark(landmarkId, categoryId);
            if (success) {
                landmarks = landmarks.filter((lm) => lm.id !== landmarkId);
            } else {
                error = "Failed to delete the landmark. Please try again.";
            }
        } catch {
            error = "Failed to delete the landmark. Please try again.";
        }
    }

    function viewLandmark(landmarkId) {
        if (landmarkId) navigate(`/landmark/${categoryId}/${landmarkId}`);
    }
</script>

<main class="gradient-bg lc-page">

    <!-- Page header -->
    <div class="page-header fade-in">
        <button class="back-btn btn-ghost" on:click={() => navigate("/category")}>
            &#8592; Back
        </button>
        <h1 class="page-title">
            <span class="page-title-cat">{categoryName}</span> Landmarks
        </h1>
    </div>

    {#if loading}
        <p class="loading-text">Loading…</p>

    {:else}
        <!-- Error banner -->
        {#if error}
            <div class="msg-error banner-error fade-in">{error}</div>
        {/if}

        <!-- Two-column layout: list left, form right -->
        <div class="lc-grid fade-in">

            <!-- ── Landmark list ── -->
            <section class="list-col">
                <h2 class="col-heading">
                    {landmarks.length} Landmark{landmarks.length !== 1 ? "s" : ""}
                </h2>

                {#if landmarks.length === 0}
                    <div class="glass-card empty-state">
                        <span class="empty-icon">&#128205;</span>
                        <p>No landmarks yet. Add the first one →</p>
                    </div>
                {:else}
                    <ul class="landmark-list">
                        {#each landmarks as landmark (landmark.uniqueKey)}
                            <li class="lm-card glass-card">
                                <div class="lm-header">
                                    <h3 class="lm-name">{landmark.name}</h3>
                                    <span class="privacy-badge" class:private={landmark.isPrivate}>
                                        {landmark.isPrivate ? "Private" : "Public"}
                                    </span>
                                </div>

                                {#if landmark.description}
                                    <p class="lm-desc">{landmark.description}</p>
                                {/if}

                                <p class="lm-coords">
                                    &#127759; {landmark.latitude}, {landmark.longitude}
                                </p>

                                {#if landmark.imageUrls && landmark.imageUrls.length > 0}
                                    <div class="lm-thumbs">
                                        {#each landmark.imageUrls as url (url)}
                                            <img
                                                src={url}
                                                alt="Image of {landmark.name}"
                                                loading="lazy"
                                            />
                                        {/each}
                                    </div>
                                {/if}

                                <div class="lm-actions">
                                    <button
                                        class="btn-gold btn-sm"
                                        on:click={() => viewLandmark(landmark.id)}
                                    >
                                        View
                                    </button>
                                    <button
                                        class="btn-danger btn-sm"
                                        on:click={() => deleteLandmark(landmark.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </section>

            <!-- ── Add landmark form ── -->
            <section class="form-col">
                <h2 class="col-heading">Add New Landmark</h2>

                <form class="glass-card add-form" on:submit|preventDefault={addNewLandmark}>

                    <!-- Name -->
                    <div class="field-group">
                        <label class="glass-label" for="lm-name">Name <span class="char-hint">(max 30)</span></label>
                        <input
                            id="lm-name"
                            class="glass-input"
                            type="text"
                            bind:value={newLandmark.name}
                            placeholder="e.g. Eiffel Tower"
                            maxlength="30"
                            required
                        />
                        <span class="char-count" class:near-limit={newLandmark.name.length > 24}>
                            {newLandmark.name.length}/30
                        </span>
                    </div>

                    <!-- Description -->
                    <div class="field-group">
                        <label class="glass-label" for="lm-desc">Description</label>
                        <textarea
                            id="lm-desc"
                            class="glass-input lm-textarea"
                            bind:value={newLandmark.description}
                            placeholder="Describe this landmark…"
                            maxlength="1000"
                            rows="3"
                        ></textarea>
                    </div>

                    <!-- Location picker -->
                    <div class="field-group">
                        <span class="glass-label">Location <span class="char-hint">(click the map or search)</span></span>

                        <!-- Search bar -->
                        <div class="search-row">
                            <input
                                class="glass-input search-input"
                                type="text"
                                bind:value={searchQuery}
                                placeholder="Search for a place…"
                                on:keydown={handleSearchKeydown}
                                disabled={searchLoading}
                            />
                            <button
                                type="button"
                                class="btn-primary search-btn"
                                on:click={searchLocation}
                                disabled={searchLoading}
                                aria-label="Search location"
                            >
                                {#if searchLoading}
                                    &#8987;
                                {:else}
                                    &#128269;
                                {/if}
                            </button>
                        </div>
                        {#if searchError}
                            <p class="search-error">{searchError}</p>
                        {/if}

                        <!-- Map container -->
                        <div class="map-picker-wrapper">
                            <div bind:this={mapContainer} class="map-picker"></div>
                        </div>

                        <!-- Coordinate readout -->
                        <div class="coord-readout" class:has-pin={newLandmark.latitude !== null}>
                            {#if newLandmark.latitude !== null}
                                <span class="coord-icon">&#128205;</span>
                                <span>
                                    {newLandmark.latitude.toFixed(5)},
                                    {newLandmark.longitude.toFixed(5)}
                                </span>
                            {:else}
                                <span class="coord-hint">Click on the map to select a location</span>
                            {/if}
                        </div>
                    </div>

                    <!-- Photos -->
                    <div class="field-group">
                        <label class="glass-label" for="lm-files">Photos <span class="char-hint">(optional)</span></label>
                        <label class="file-drop" for="lm-files">
                            <span class="file-icon">&#128247;</span>
                            {#if selectedFiles && selectedFiles.length > 0}
                                <span class="file-selected">{selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected</span>
                            {:else}
                                <span>Click to upload images</span>
                            {/if}
                            <input
                                id="lm-files"
                                type="file"
                                multiple
                                accept="image/*"
                                bind:files={selectedFiles}
                                class="file-input-hidden"
                            />
                        </label>
                    </div>

                    <!-- Privacy toggle -->
                    <div class="field-group privacy-row">
                        <span class="glass-label">Visibility</span>
                        <label class="toggle-wrap">
                            <input
                                type="checkbox"
                                class="toggle-input"
                                bind:checked={newLandmark.isPrivate}
                            />
                            <span class="toggle-track">
                                <span class="toggle-thumb"></span>
                            </span>
                            <span class="toggle-text">
                                {newLandmark.isPrivate ? "Private" : "Public"}
                            </span>
                        </label>
                    </div>

                    <!-- Submit -->
                    <button
                        type="submit"
                        class="btn-primary submit-btn"
                        disabled={submitting}
                    >
                        {submitting ? "Adding…" : "Add Landmark"}
                    </button>

                </form>
            </section>
        </div>
    {/if}
</main>
<Footer />

<style>
    /* ── Page layout ── */
    .lc-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 32px 24px 60px;
        color: white;
        min-height: 100vh;
    }

    .page-header {
        width: 100%;
        max-width: 1200px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 28px;
    }

    .back-btn {
        align-self: flex-start;
        font-size: 13px;
        padding: 7px 16px;
    }

    .page-title {
        font-size: clamp(22px, 3.5vw, 30px);
        font-weight: 700;
        margin: 0;
    }

    .page-title-cat {
        color: #4eb99f;
    }

    /* ── Two-column grid ── */
    .lc-grid {
        display: grid;
        grid-template-columns: 1fr 480px;
        gap: 28px;
        width: 100%;
        max-width: 1200px;
        align-items: start;
    }

    .col-heading {
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: rgba(255, 255, 255, 0.5);
        margin: 0 0 14px;
    }

    /* ── Error banner ── */
    .banner-error {
        width: 100%;
        max-width: 1200px;
        margin-bottom: 16px;
    }

    /* ── Landmark list ── */
    .landmark-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .lm-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 18px 20px;
    }

    .lm-card:hover {
        transform: translateY(-2px);
    }

    .lm-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    .lm-name {
        font-size: 15px;
        font-weight: 600;
        margin: 0;
        color: white;
    }

    .privacy-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 3px 10px;
        border-radius: 20px;
        background: rgba(78, 185, 159, 0.18);
        color: #4eb99f;
        border: 1px solid rgba(78, 185, 159, 0.3);
        white-space: nowrap;
        flex-shrink: 0;
    }

    .privacy-badge.private {
        background: rgba(237, 86, 59, 0.15);
        color: #ff9a85;
        border-color: rgba(237, 86, 59, 0.3);
    }

    .lm-desc {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.65);
        margin: 0;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .lm-coords {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.4);
        margin: 0;
        font-variant-numeric: tabular-nums;
    }

    .lm-thumbs {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .lm-thumbs img {
        width: 60px;
        height: 48px;
        object-fit: cover;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .lm-actions {
        display: flex;
        gap: 8px;
        padding-top: 4px;
    }

    .btn-sm {
        padding: 7px 18px;
        font-size: 13px;
    }

    .empty-state {
        text-align: center;
        padding: 40px 24px;
        color: rgba(255, 255, 255, 0.5);
    }

    .empty-icon {
        font-size: 36px;
        display: block;
        margin-bottom: 10px;
    }

    /* ── Add form ── */
    .add-form {
        display: flex;
        flex-direction: column;
        gap: 18px;
    }

    .add-form:hover {
        transform: none;
    }

    .field-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .char-hint {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.35);
        font-weight: 400;
        text-transform: none;
        letter-spacing: 0;
    }

    .char-count {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.35);
        text-align: right;
        margin-top: -2px;
    }

    .char-count.near-limit {
        color: #f2b035;
    }

    .lm-textarea {
        resize: vertical;
        min-height: 80px;
    }

    /* ── Search bar ── */
    .search-row {
        display: flex;
        gap: 8px;
    }

    .search-input {
        flex: 1;
    }

    .search-btn {
        padding: 10px 14px;
        font-size: 16px;
        border-radius: 10px;
        flex-shrink: 0;
    }

    .search-error {
        font-size: 12px;
        color: #ffb3a3;
        margin: 0;
    }

    /* ── Map picker ── */
    .map-picker-wrapper {
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }

    .map-picker {
        height: 300px;
        width: 100%;
        display: block;
    }

    /* ── Coordinate readout ── */
    .coord-readout {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        padding: 8px 12px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        transition: all 0.2s ease;
    }

    .coord-readout.has-pin {
        background: rgba(78, 185, 159, 0.1);
        border-color: rgba(78, 185, 159, 0.25);
        color: #a0f0dc;
    }

    .coord-icon {
        font-size: 15px;
    }

    .coord-hint {
        color: rgba(255, 255, 255, 0.35);
        font-style: italic;
    }

    /* ── File upload ── */
    .file-drop {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px dashed rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        cursor: pointer;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.55);
        transition: all 0.2s ease;
    }

    .file-drop:hover {
        background: rgba(255, 255, 255, 0.09);
        border-color: rgba(255, 255, 255, 0.35);
        color: white;
    }

    .file-icon {
        font-size: 18px;
    }

    .file-selected {
        color: #4eb99f;
        font-weight: 500;
    }

    .file-input-hidden {
        display: none;
    }

    /* ── Privacy toggle ── */
    .privacy-row {
        flex-direction: row;
        align-items: center;
        gap: 14px;
    }

    .toggle-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
    }

    .toggle-input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
    }

    .toggle-track {
        position: relative;
        width: 44px;
        height: 24px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        transition: background 0.3s ease;
        flex-shrink: 0;
    }

    .toggle-input:checked ~ .toggle-track {
        background: #4eb99f;
        border-color: #4eb99f;
    }

    .toggle-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 18px;
        height: 18px;
        background: white;
        border-radius: 50%;
        transition: transform 0.3s ease;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    }

    .toggle-input:checked ~ .toggle-track .toggle-thumb {
        transform: translateX(20px);
    }

    .toggle-text {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
    }

    /* ── Submit ── */
    .submit-btn {
        width: 100%;
        padding: 14px;
        font-size: 15px;
        margin-top: 4px;
    }

    .submit-btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
        transform: none;
    }

    /* ── Responsive ── */
    @media (max-width: 960px) {
        .lc-grid {
            grid-template-columns: 1fr;
        }

        /* Show form first on mobile so it's easy to add */
        .form-col {
            order: -1;
        }
    }
</style>
