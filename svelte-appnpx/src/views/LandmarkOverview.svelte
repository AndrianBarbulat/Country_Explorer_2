<script>
    import { onMount, onDestroy, afterUpdate } from 'svelte';
    import L from 'leaflet';
    import 'leaflet/dist/leaflet.css';
    import { ref, onValue } from 'firebase/database';
    import { db, API_KEY } from '../services/firebase.js';
    import Footer from './assets/Footer.svelte';

    export let userId;
    export let categoryId;
    export let landmarkId;

    let landmarkData = {};
    let weatherData = null;
    let loading = true;
    let error = '';
    let mapContainer1, mapContainer2, mapContainer3;
    let mapsInitialized = false;

    let selectedImage = null;
    let closeButton;

    let unsubscribe;

    onMount(() => {
        if (userId && categoryId && landmarkId) {
            const landmarkRef = ref(db, `users/${userId}/categories/${categoryId}/landmarks/${landmarkId}`);
            unsubscribe = onValue(landmarkRef, (snapshot) => {
                if (snapshot.exists()) {
                    landmarkData = snapshot.val();
                    loading = false;
                    if (landmarkData.latitude && landmarkData.longitude) {
                        fetchWeather(landmarkData.latitude, landmarkData.longitude);
                    }
                } else {
                    error = "Landmark not found.";
                    loading = false;
                }
            }, { onlyOnce: true });
        } else {
            error = 'All parameters (userId, categoryId, and landmarkId) must be provided.';
            loading = false;
        }
    });

    onDestroy(() => {
        if (unsubscribe) unsubscribe();
    });

    afterUpdate(() => {
        if (!loading && !mapsInitialized && landmarkData.latitude && landmarkData.longitude) {
            mapsInitialized = true;
            initMaps();
        }
    });

    $: if (selectedImage && closeButton) {
        closeButton.focus();
    }

    function initMaps() {
        const coordinates = [landmarkData.latitude, landmarkData.longitude];
        createMap(mapContainer1, coordinates, 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', '&copy; OpenStreetMap contributors');
        createMap(mapContainer2, coordinates, 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', 'Map data &copy; OpenTopoMap contributors');
        createMap(mapContainer3, coordinates, 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 'Tiles &copy; Esri');
    }

    function createMap(container, coordinates, tilesURL, attribution) {
        if (container) {
            const map = L.map(container).setView(coordinates, 13);
            L.tileLayer(tilesURL, { attribution }).addTo(map);
            L.marker(coordinates).addTo(map);
        }
    }

    async function fetchWeather(lat, lon) {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
            if (response.ok) {
                weatherData = await response.json();
            } else {
                throw new Error("Failed to fetch weather data.");
            }
        } catch (err) {
            error = err.message;
        }
    }

    function openModal(imageUrl) {
        selectedImage = imageUrl;
    }

    function closeModal() {
        selectedImage = null;
    }

    function handleModalKeydown(e) {
        if (e.key === 'Escape') closeModal();
    }

    function handleGalleryKeydown(e, imageUrl) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal(imageUrl);
        }
    }

    function handleBackdropKeydown(e) {
        if (e.key === 'Enter' || e.key === ' ') closeModal();
    }
</script>

<svelte:window on:keydown={handleModalKeydown} />

<main class="gradient-bg overview-page">
    {#if loading}
        <p class="loading-text">Loading landmark…</p>
    {:else if error}
        <div class="error-wrap">
            <div class="msg-error">{error}</div>
        </div>
    {:else if landmarkData}
        <div class="overview-wrapper fade-in">

            <!-- Breadcrumb -->
            <nav class="breadcrumb" aria-label="Breadcrumb">
                <a href="/category">Categories</a>
                <span class="crumb-sep">&#8250;</span>
                <span>{landmarkData.name || 'Landmark'}</span>
            </nav>

            <h1 class="landmark-title">{landmarkData.name || 'Unnamed Landmark'}</h1>

            <!-- Details + Main map row -->
            <div class="top-grid">
                <div class="glass-card info-card">
                    <h2 class="section-label">Details</h2>
                    {#if landmarkData.description}
                        <p class="info-desc">{landmarkData.description}</p>
                    {/if}
                    <div class="coord-pills">
                        <span class="pill">&#127759; {landmarkData.latitude?.toFixed(4)}, {landmarkData.longitude?.toFixed(4)}</span>
                    </div>

                    {#if weatherData}
                        <div class="weather-section">
                            <h3 class="section-label">Weather</h3>
                            <div class="weather-grid">
                                <div class="weather-item">
                                    <span class="weather-val">{weatherData.main.temp}°C</span>
                                    <span class="weather-key">Temperature</span>
                                </div>
                                <div class="weather-item">
                                    <span class="weather-val">{weatherData.main.humidity}%</span>
                                    <span class="weather-key">Humidity</span>
                                </div>
                                <div class="weather-item">
                                    <span class="weather-val">{weatherData.wind.speed} m/s</span>
                                    <span class="weather-key">Wind</span>
                                </div>
                                <div class="weather-item">
                                    <span class="weather-val weather-desc">{weatherData.weather[0].description}</span>
                                    <span class="weather-key">Conditions</span>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>

                <div class="maps-col">
                    <div class="glass-card map-card">
                        <h2 class="section-label">Street Map</h2>
                        <div class="map-wrapper">
                            <div bind:this={mapContainer1} class="map-container"></div>
                        </div>
                    </div>
                    <div class="glass-card map-card">
                        <h2 class="section-label">Topographic</h2>
                        <div class="map-wrapper">
                            <div bind:this={mapContainer2} class="map-container"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Satellite map -->
            <div class="glass-card map-card full-map">
                <h2 class="section-label">Satellite</h2>
                <div class="map-wrapper">
                    <div bind:this={mapContainer3} class="map-container"></div>
                </div>
            </div>

            <!-- Gallery -->
            <div class="gallery-section">
                <h2 class="section-heading">Photo Gallery</h2>
                {#if landmarkData.imageUrls && landmarkData.imageUrls.length > 0}
                    <div class="gallery-grid">
                        {#each landmarkData.imageUrls as imageUrl (imageUrl)}
                            <button
                                class="gallery-thumb"
                                on:click={() => openModal(imageUrl)}
                                on:keydown={(e) => handleGalleryKeydown(e, imageUrl)}
                                aria-label="Open full image"
                            >
                                <img
                                    src={imageUrl}
                                    alt=""
                                    loading="lazy"
                                />
                            </button>
                        {/each}
                    </div>
                {:else}
                    <div class="glass-card no-images">
                        <span>No photos uploaded yet</span>
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <div class="msg-error">Landmark details could not be loaded.</div>
    {/if}
</main>

<!-- Image Modal -->
{#if selectedImage}
    <div
        class="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
    >
        <div
            class="modal-backdrop"
            on:click={closeModal}
            on:keydown={handleBackdropKeydown}
            role="button"
            tabindex="0"
            aria-label="Close image"
        ></div>
        <div class="modal-content">
            <img src={selectedImage} alt="Full-size landmark image" />
        </div>
        <button
            class="modal-close"
            aria-label="Close image"
            on:click={closeModal}
            bind:this={closeButton}
        >&#10005;</button>
    </div>
{/if}

<Footer />

<style>
    .overview-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 32px 24px 60px;
        color: white;
    }

    .overview-wrapper {
        width: 100%;
        max-width: 1100px;
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    /* ── Breadcrumb ── */
    .breadcrumb {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
    }

    .breadcrumb a {
        color: #4eb99f;
        text-decoration: none;
    }

    .breadcrumb a:hover {
        text-decoration: underline;
    }

    .crumb-sep {
        font-size: 16px;
        opacity: 0.4;
    }

    .landmark-title {
        font-size: clamp(24px, 4vw, 36px);
        font-weight: 700;
        margin: 0;
        letter-spacing: -0.5px;
    }

    /* ── Top grid ── */
    .top-grid {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 20px;
        align-items: start;
    }

    .info-card {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .info-card:hover {
        transform: none;
    }

    .section-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: rgba(255, 255, 255, 0.45);
        margin: 0;
    }

    .info-desc {
        font-size: 14px;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.8);
        margin: 0;
    }

    .coord-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .pill {
        background: rgba(78, 185, 159, 0.15);
        border: 1px solid rgba(78, 185, 159, 0.3);
        color: #4eb99f;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
    }

    /* ── Weather ── */
    .weather-section {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-top: 4px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .weather-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }

    .weather-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .weather-val {
        font-size: 16px;
        font-weight: 600;
        color: white;
    }

    .weather-desc {
        font-size: 13px;
        text-transform: capitalize;
    }

    .weather-key {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.45);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* ── Maps ── */
    .maps-col {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .map-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
    }

    .map-card:hover {
        transform: none;
    }

    .map-container {
        height: 220px;
        width: 100%;
        border-radius: 10px;
        overflow: hidden;
    }

    .full-map .map-container {
        height: 300px;
    }

    /* ── Gallery ── */
    .section-heading {
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 16px;
    }

    .gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 12px;
    }

    .gallery-thumb {
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        padding: 0;
        transition: all 0.2s ease;
        aspect-ratio: 4 / 3;
    }

    .gallery-thumb:hover,
    .gallery-thumb:focus {
        transform: scale(1.03);
        border-color: #f2b035;
        outline: 2px solid #f2b035;
        outline-offset: 2px;
    }

    .gallery-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .no-images {
        text-align: center;
        color: rgba(255, 255, 255, 0.45);
        font-size: 14px;
        padding: 32px;
    }

    /* ── Modal ── */
    .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
    }

    .modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.88);
        backdrop-filter: blur(6px);
        cursor: pointer;
    }

    .modal-content {
        position: relative;
        z-index: 2001;
        max-width: 90vw;
        max-height: 85vh;
    }

    .modal-content img {
        max-width: 100%;
        max-height: 85vh;
        border-radius: 12px;
        display: block;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
    }

    .modal-close {
        position: absolute;
        top: -14px;
        right: -14px;
        z-index: 2002;
        background: rgba(237, 86, 59, 0.9);
        color: white;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease;
        line-height: 1;
    }

    .modal-close:hover {
        background: #ed563b;
    }

    .error-wrap {
        padding: 40px 24px;
        max-width: 500px;
        width: 100%;
    }

    /* ── Responsive ── */
    @media (max-width: 900px) {
        .top-grid {
            grid-template-columns: 1fr;
        }

        .maps-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
        }
    }

    @media (max-width: 560px) {
        .maps-col {
            grid-template-columns: 1fr;
        }

        .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>
