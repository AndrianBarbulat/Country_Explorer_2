<script>
    import { onMount } from 'svelte';
    import { getAuth, onAuthStateChanged } from 'firebase/auth';
    import { getDatabase, ref, get } from 'firebase/database';
    import { navigate } from 'svelte-routing';
    import L from 'leaflet';
    import 'leaflet/dist/leaflet.css';
    import Footer from "./assets/Footer.svelte";

    let map;
    let landmarks = [];
    let landmarkCount = 0;
    let latestLogin = '';

    onMount(() => {
        const auth = getAuth();
        const db = getDatabase();

        onAuthStateChanged(auth, user => {
            if (user) {
                fetchLandmarks(db, user.uid);
                latestLogin = 'Last login: ' + new Date(user.metadata.lastSignInTime).toLocaleString();
            } else {
                navigate('/signin');
            }
        });

        map = L.map('map').setView([51.505, -0.09], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
    });

    async function fetchLandmarks(db, userId) {
        const categoriesRef = ref(db, `users/${userId}/categories`);
        const snapshot = await get(categoriesRef);

        if (snapshot.exists()) {
            const categories = snapshot.val();
            landmarks = [];
            Object.keys(categories).forEach(categoryId => {
                const categoryLandmarks = categories[categoryId].landmarks || {};
                Object.values(categoryLandmarks).forEach(landmark => {
                    landmarks.push(landmark);
                    L.marker([landmark.latitude, landmark.longitude])
                        .addTo(map)
                        .bindPopup(landmark.name);
                });
            });
            landmarkCount = landmarks.length;
            if (landmarks.length > 0) {
                map.setView([landmarks[0].latitude, landmarks[0].longitude], 10);
            }
        }
    }
</script>

<main class="gradient-bg home-page">
    <div class="hero fade-in">
        <h1 class="hero-title">Welcome to Country Explorer</h1>
        {#if latestLogin}
            <p class="last-login">{latestLogin}</p>
        {/if}
    </div>

    <div class="home-grid fade-in">
        <div class="map-card glass-card">
            <h2 class="card-heading">Your Landmarks</h2>
            <div class="map-wrapper">
                <div id="map"></div>
            </div>
        </div>

        <div class="side-panel">
            <div class="stat-card glass-card">
                <div class="stat-number">{landmarkCount}</div>
                <div class="stat-label">Total Landmarks</div>
            </div>

            <button
                class="btn-primary explore-btn"
                on:click={() => navigate('/map-category')}
            >
                Explore All Landmarks
            </button>

            <button
                class="btn-ghost manage-btn"
                on:click={() => navigate('/category')}
            >
                Manage Categories
            </button>
        </div>
    </div>
</main>
<Footer />

<style>
    .home-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 24px 0;
        color: white;
    }

    .hero {
        text-align: center;
        margin-bottom: 32px;
    }

    .hero-title {
        font-size: clamp(24px, 4vw, 36px);
        font-weight: 700;
        margin: 0 0 8px;
        letter-spacing: -0.5px;
    }

    .last-login {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.55);
        margin: 0;
    }

    .home-grid {
        display: grid;
        grid-template-columns: 1fr 280px;
        gap: 24px;
        width: 100%;
        max-width: 1100px;
    }

    .map-card {
        padding: 20px;
    }

    .map-card:hover {
        transform: none;
    }

    .card-heading {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 14px;
        color: rgba(255, 255, 255, 0.85);
    }

    #map {
        height: 420px;
        width: 100%;
        border-radius: 12px;
        overflow: hidden;
    }

    .side-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .stat-card {
        text-align: center;
        padding: 32px 24px;
    }

    .stat-number {
        font-size: 52px;
        font-weight: 700;
        color: #4eb99f;
        line-height: 1;
        margin-bottom: 8px;
    }

    .stat-label {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .explore-btn {
        width: 100%;
        padding: 14px;
        font-size: 15px;
    }

    .manage-btn {
        width: 100%;
        padding: 13px;
    }

    @media (max-width: 768px) {
        .home-grid {
            grid-template-columns: 1fr;
        }

        #map {
            height: 280px;
        }

        .side-panel {
            flex-direction: row;
            flex-wrap: wrap;
        }

        .stat-card {
            flex: 1;
            min-width: 120px;
        }

        .explore-btn,
        .manage-btn {
            flex: 1;
        }
    }
</style>
