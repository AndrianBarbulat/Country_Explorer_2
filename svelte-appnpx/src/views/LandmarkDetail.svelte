<script>
    import { onMount } from 'svelte';
    import { getLandmarkDetails, updateLandmarkDetails } from '../controllers/landmarkController';
    import { user } from '../stores/authStore';
    import { navigate } from 'svelte-routing';
    import { ref, deleteObject } from 'firebase/storage';
    import { storage } from '../services/firebase';
    import Footer from './assets/Footer.svelte';

    export let categoryId;
    export let landmarkId;

    let landmark = {
        name: '',
        description: '',
        latitude: '',
        longitude: '',
        imageUrls: [],
        isPrivate: false
    };
    let error = '';
    let loading = true;
    let saveError = '';

    $: $user, checkAuthState();

    function checkAuthState() {
        if ($user === undefined) {
            loading = true;
            error = '';
        } else if ($user) {
            initializeLandmark();
        } else {
            error = "User not logged in. Please sign in.";
            loading = false;
            navigate('/signin');
        }
    }

    async function initializeLandmark() {
        if (categoryId && landmarkId) {
            try {
                const fetchedLandmark = await getLandmarkDetails(categoryId, landmarkId);
                landmark = {
                    ...fetchedLandmark,
                    imageUrls: fetchedLandmark.imageUrls || [],
                    isPrivate: fetchedLandmark.isPrivate || false
                };
            } catch (err) {
                error = "Failed to load landmark details.";
            }
            loading = false;
        } else {
            error = "Required IDs not provided.";
            loading = false;
        }
    }

    async function saveLandmarkDetails() {
        saveError = '';
        loading = true;
        try {
            await updateLandmarkDetails(categoryId, landmarkId, landmark);
            navigate(`/category`);
        } catch (err) {
            saveError = "Failed to update landmark details.";
            loading = false;
        }
    }

    async function deleteImage(imageUrl) {
        const imageRef = ref(storage, imageUrl);
        try {
            await deleteObject(imageRef);
            landmark.imageUrls = landmark.imageUrls.filter(url => url !== imageUrl);
            await updateLandmarkDetails(categoryId, landmarkId, { ...landmark, imageUrls: landmark.imageUrls });
        } catch (error) {
            // deletion failed silently — image ref may be invalid
        }
    }
</script>

<main class="gradient-bg detail-page">
    <div class="detail-wrapper fade-in">
        <div class="page-header">
            <button class="back-btn btn-ghost" on:click={() => navigate('/category')}>
                &#8592; Back to Categories
            </button>
            <h1 class="page-title">Edit Landmark</h1>
        </div>

        {#if loading}
            <div class="glass-card loading-card">
                <p class="loading-text">Loading landmark…</p>
            </div>
        {:else if error}
            <div class="msg-error">{error}</div>
        {:else}
            <form class="glass-card form-card" on:submit|preventDefault={saveLandmarkDetails}>

                <div class="field-group">
                    <label class="glass-label" for="ldName">Landmark Name</label>
                    <input
                        id="ldName"
                        class="glass-input"
                        type="text"
                        bind:value={landmark.name}
                        placeholder="Enter landmark name"
                    />
                </div>

                <div class="field-group">
                    <label class="glass-label" for="ldDesc">Description</label>
                    <textarea
                        id="ldDesc"
                        class="glass-input glass-textarea"
                        bind:value={landmark.description}
                        placeholder="Describe this landmark…"
                        rows="4"
                    ></textarea>
                </div>

                <div class="coord-row">
                    <div class="field-group">
                        <label class="glass-label" for="ldLat">Latitude</label>
                        <input
                            id="ldLat"
                            class="glass-input"
                            type="number"
                            step="0.000001"
                            bind:value={landmark.latitude}
                            placeholder="e.g. 51.505"
                        />
                    </div>
                    <div class="field-group">
                        <label class="glass-label" for="ldLon">Longitude</label>
                        <input
                            id="ldLon"
                            class="glass-input"
                            type="number"
                            step="0.000001"
                            bind:value={landmark.longitude}
                            placeholder="e.g. -0.09"
                        />
                    </div>
                </div>

                <div class="field-group privacy-row">
                    <span class="glass-label">Visibility</span>
                    <label class="toggle-wrap">
                        <input
                            id="privacyToggle"
                            type="checkbox"
                            class="toggle-input"
                            bind:checked={landmark.isPrivate}
                        />
                        <span class="toggle-track">
                            <span class="toggle-thumb"></span>
                        </span>
                        <span class="toggle-text">
                            {landmark.isPrivate ? 'Private' : 'Public'}
                        </span>
                    </label>
                </div>

                {#if Array.isArray(landmark.imageUrls) && landmark.imageUrls.length > 0}
                    <div class="field-group">
                        <span class="glass-label">Images</span>
                        <div class="images-grid">
                            {#each landmark.imageUrls as url (url)}
                                <div class="image-thumb">
                                    <img src={url} alt="Landmark image" />
                                    <button
                                        type="button"
                                        class="img-delete"
                                        on:click={() => deleteImage(url)}
                                        aria-label="Delete image"
                                    >&#10005;</button>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if saveError}
                    <div class="msg-error">{saveError}</div>
                {/if}

                <div class="form-actions">
                    <button type="button" class="btn-ghost" on:click={() => navigate('/category')}>
                        Cancel
                    </button>
                    <button type="submit" class="btn-primary">
                        Save Changes
                    </button>
                </div>
            </form>
        {/if}
    </div>
</main>
<Footer />

<style>
    .detail-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 24px 60px;
        color: white;
    }

    .detail-wrapper {
        width: 100%;
        max-width: 680px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .page-header {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .back-btn {
        align-self: flex-start;
        font-size: 13px;
        padding: 7px 16px;
    }

    .page-title {
        font-size: clamp(22px, 3vw, 28px);
        font-weight: 700;
        margin: 0;
    }

    .loading-card {
        text-align: center;
    }

    .form-card {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .form-card:hover {
        transform: none;
    }

    .field-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .coord-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    .glass-textarea {
        resize: vertical;
        min-height: 100px;
    }

    /* ── Privacy toggle ── */
    .privacy-row {
        flex-direction: row;
        align-items: center;
        gap: 16px;
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
        transition: background 0.3s ease;
        flex-shrink: 0;
        border: 1px solid rgba(255, 255, 255, 0.15);
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

    /* ── Image grid ── */
    .images-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .image-thumb {
        position: relative;
        width: 90px;
    }

    .image-thumb img {
        width: 100%;
        height: 70px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .img-delete {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 20px;
        height: 20px;
        background: #ed563b;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        transition: background 0.2s ease;
    }

    .img-delete:hover {
        background: #c0392b;
    }

    /* ── Form actions ── */
    .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 480px) {
        .coord-row {
            grid-template-columns: 1fr;
        }

        .form-actions {
            flex-direction: column-reverse;
        }

        .form-actions button {
            width: 100%;
        }
    }
</style>
