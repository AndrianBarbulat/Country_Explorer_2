<script>
    import { onMount, onDestroy } from 'svelte';
    import L from 'leaflet';
    import { db } from '../services/firebase.js';
    import Sidebar from './assets/SidebarCategory.svelte';
    import Footer from './assets/Footer.svelte';
    import { ref, onValue } from "firebase/database";

    let map;
    let markers = [];
    let unsubscribe;
    let sidebarOpen = true;

    onMount(() => {
        initMap();
    });

    onDestroy(() => {
        if (unsubscribe) unsubscribe();
    });

    function initMap() {
        map = L.map('map1').setView([0, 0], 3);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const catRef = ref(db, 'users');
        unsubscribe = onValue(catRef, (snapshot) => {
            const data = snapshot.val();
            if (data) updateMapWithPlacemarks(data);
        });
    }

    function updateMapWithPlacemarks(data) {
        markers.forEach(m => m.remove());
        markers = [];

        Object.entries(data).forEach(([userId, userData]) => {
            if (userData.categories) {
                Object.entries(userData.categories).forEach(([categoryId, category]) => {
                    if (category.landmarks) {
                        Object.entries(category.landmarks).forEach(([landmarkId, landmark]) => {
                            if (!landmark.isPrivate && landmark.latitude && landmark.longitude) {
                                const popup = buildPopup(userId, categoryId, landmarkId, landmark, category.name);
                                const marker = L.marker([landmark.latitude, landmark.longitude])
                                    .addTo(map)
                                    .bindPopup(popup, { maxWidth: 260, className: 'lp-popup' });
                                markers.push(marker);
                            }
                        });
                    }
                });
            }
        });
    }

    function buildPopup(userId, categoryId, landmarkId, landmark, categoryName) {
        const img = landmark.imageUrls && landmark.imageUrls.length > 0
            ? `<img class="lp-img" src="${landmark.imageUrls[0]}" alt="${landmark.name}" />`
            : '';
        const desc = landmark.description
            ? `<p class="lp-desc">${landmark.description}</p>`
            : '';
        const link = `/landmark-overview/${userId}/${categoryId}/${landmarkId}`;

        return `
            <div class="lp">
                ${img}
                <div class="lp-body">
                    <p class="lp-cat">${categoryName || ''}</p>
                    <strong class="lp-name">${landmark.name}</strong>
                    ${desc}
                    <p class="lp-coords">&#127759; ${Number(landmark.latitude).toFixed(5)}, ${Number(landmark.longitude).toFixed(5)}</p>
                    <a class="lp-link" href="${link}">View Details &#8594;</a>
                </div>
            </div>
        `;
    }

    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
    }
</script>

<div class="map-page">
    <div class="sidebar-panel" class:closed={!sidebarOpen}>
        <div class="sidebar-header">
            <span class="sidebar-title">Categories</span>
            <button class="sidebar-close" on:click={toggleSidebar} aria-label="Collapse sidebar">&#8249;</button>
        </div>
        <div class="sidebar-body">
            <Sidebar />
        </div>
    </div>

    <button
        class="sidebar-toggle"
        class:is-open={sidebarOpen}
        on:click={toggleSidebar}
        aria-label="Toggle sidebar"
    >
        {sidebarOpen ? '&#8249;' : '&#8250;'}
    </button>

    <div class="map-area" class:full={!sidebarOpen}>
        <div id="map1" class="map-fill"></div>
    </div>
</div>
<Footer />

<style>
    @import "leaflet/dist/leaflet.css";

    .map-page {
        display: flex;
        height: calc(100vh - 64px);
        position: relative;
        background: #122f41;
    }

    /* ── Sidebar ── */
    .sidebar-panel {
        width: 280px;
        min-width: 280px;
        display: flex;
        flex-direction: column;
        background: rgba(18, 47, 65, 0.92);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        transition: width 0.3s ease, min-width 0.3s ease;
        overflow: hidden;
        z-index: 10;
    }

    .sidebar-panel.closed {
        width: 0;
        min-width: 0;
    }

    .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
    }

    .sidebar-title {
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.85);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .sidebar-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        font-size: 22px;
        line-height: 1;
        padding: 2px 6px;
        border-radius: 4px;
        transition: all 0.2s ease;
    }

    .sidebar-close:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
    }

    .sidebar-body {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
    }

    /* ── Sidebar toggle (floating button) ── */
    .sidebar-toggle {
        position: absolute;
        left: 280px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 20;
        background: rgba(18, 47, 65, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: white;
        width: 28px;
        height: 48px;
        border-radius: 0 8px 8px 0;
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: left 0.3s ease;
        backdrop-filter: blur(8px);
    }

    .sidebar-toggle:not(.is-open) {
        left: 0;
    }

    /* ── Map ── */
    .map-area {
        flex: 1;
        transition: flex 0.3s ease;
        position: relative;
    }

    .map-fill {
        width: 100%;
        height: 100%;
    }

    /* ── Leaflet popup (must be :global — injected outside Svelte scope) ── */
    :global(.lp-popup .leaflet-popup-content-wrapper) {
        background: rgba(18, 47, 65, 0.97);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        padding: 0;
        overflow: hidden;
        color: white;
    }

    :global(.lp-popup .leaflet-popup-content) {
        margin: 0;
        width: 240px !important;
    }

    :global(.lp-popup .leaflet-popup-tip) {
        background: rgba(18, 47, 65, 0.97);
    }

    :global(.lp-popup .leaflet-popup-close-button) {
        color: rgba(255, 255, 255, 0.5);
        font-size: 18px;
        padding: 6px 8px;
        z-index: 1;
    }

    :global(.lp-popup .leaflet-popup-close-button:hover) {
        color: white;
    }

    :global(.lp) {
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }

    :global(.lp-img) {
        width: 100%;
        height: 130px;
        object-fit: cover;
        display: block;
    }

    :global(.lp-body) {
        padding: 12px 14px 14px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    :global(.lp-cat) {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #4eb99f;
        margin: 0;
    }

    :global(.lp-name) {
        font-size: 15px;
        font-weight: 700;
        color: white;
        line-height: 1.3;
        display: block;
        margin-bottom: 2px;
    }

    :global(.lp-desc) {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        margin: 2px 0 4px;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    :global(.lp-coords) {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.35);
        margin: 2px 0 6px;
        font-variant-numeric: tabular-nums;
    }

    :global(.lp-link) {
        display: inline-block;
        font-size: 12px;
        font-weight: 600;
        color: #f2b035;
        text-decoration: none;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 8px;
        margin-top: 2px;
        transition: color 0.15s ease;
    }

    :global(.lp-link:hover) {
        color: #4eb99f;
    }

    /* ── Mobile ── */
    @media (max-width: 768px) {
        .sidebar-panel {
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 50;
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
        }

        .sidebar-toggle {
            top: 16px;
            transform: none;
        }

        .sidebar-toggle.is-open {
            left: 280px;
        }
    }
</style>
