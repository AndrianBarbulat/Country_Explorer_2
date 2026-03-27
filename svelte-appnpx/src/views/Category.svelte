<script>
    import { onDestroy } from 'svelte';
    import { navigate } from 'svelte-routing';
    import { db } from '../services/firebase';
    import { ref, set, push, remove, onValue } from 'firebase/database';
    import { user } from '../stores/authStore';
    import Footer from './assets/Footer.svelte';

    let categories = [];
    let newCategoryType = '';
    let error = '';
    let loading = true;
    let unsubscribeCategories;
    let confirmDeleteId = null;

    const categoryTypes = [
        "Mountain", "Museum", "Beach", "Park", "Historical Site",
        "Restaurant", "Shopping Mall", "Art Gallery"
    ];

    $: $user, checkAuthState();

    function checkAuthState() {
        if ($user === undefined) {
            // Auth state still loading
        } else if ($user) {
            initializeCategories();
        } else {
            loading = false;
            navigate('/signin');
        }
    }

    function initializeCategories() {
        if (unsubscribeCategories) unsubscribeCategories();

        const categoriesRef = ref(db, `users/${$user.uid}/categories`);
        unsubscribeCategories = onValue(categoriesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                categories = Object.entries(data).map(([key, value]) => ({
                    id: key,
                    name: value.name
                }));
                error = '';
            } else {
                categories = [];
                error = '';
            }
            loading = false;
        }, () => {
            error = 'Failed to load data.';
            loading = false;
        });
    }

    onDestroy(() => {
        if (unsubscribeCategories) unsubscribeCategories();
    });

    async function addCategory() {
        if (newCategoryType.trim() === '') {
            error = 'Please select a category type.';
            return;
        }
        if (!$user) return;

        const categoriesRef = ref(db, `users/${$user.uid}/categories`);
        const newCategoryRef = push(categoriesRef);
        await set(newCategoryRef, { name: newCategoryType });
        newCategoryType = '';
        error = '';
    }

    function requestDelete(categoryId) {
        confirmDeleteId = categoryId;
    }

    function cancelDelete() {
        confirmDeleteId = null;
    }

    async function confirmDelete() {
        if (!$user || !confirmDeleteId) return;
        const categoryRef = ref(db, `users/${$user.uid}/categories/${confirmDeleteId}`);
        await remove(categoryRef);
        confirmDeleteId = null;
    }

    function viewLandmarks(categoryId, categoryName) {
        navigate(`/landmark-category/${categoryId}/${encodeURIComponent(categoryName)}`);
    }

    $: availableCategoryTypes = categoryTypes.filter(
        type => !categories.some(category => category.name === type)
    );

    $: confirmDeleteName = confirmDeleteId
        ? (categories.find(c => c.id === confirmDeleteId) || {}).name
        : null;
</script>

<main class="gradient-bg category-page">
    <div class="page-header fade-in">
        <h1 class="page-title">My Categories</h1>
        <p class="page-sub">Organise your landmarks by category</p>
    </div>

    {#if loading}
        <p class="loading-text">Loading categories…</p>
    {:else}
        {#if error}
            <div class="msg-error fade-in">{error}</div>
        {/if}

        {#if categories.length > 0}
            <div class="category-grid fade-in">
                {#each categories as category (category.id)}
                    <div class="category-card glass-card">
                        <div class="category-icon">&#127758;</div>
                        <h3 class="category-name">{category.name}</h3>
                        <div class="category-actions">
                            <button
                                class="btn-primary btn-sm"
                                on:click={() => viewLandmarks(category.id, category.name)}
                            >
                                View Landmarks
                            </button>
                            <button
                                class="btn-danger btn-sm"
                                on:click={() => requestDelete(category.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <div class="empty-state glass-card fade-in">
                <span class="empty-icon">&#128205;</span>
                <p>No categories yet. Add your first one below!</p>
            </div>
        {/if}

        <div class="add-form glass-card fade-in">
            <h2 class="form-title">Add New Category</h2>
            <div class="form-row">
                <div class="select-wrapper">
                    <select
                        id="categoryType"
                        class="glass-input"
                        bind:value={newCategoryType}
                    >
                        <option value="" disabled selected>Select a category type…</option>
                        {#each availableCategoryTypes as categoryType (categoryType)}
                            <option value={categoryType}>{categoryType}</option>
                        {/each}
                    </select>
                </div>
                <button class="btn-primary" on:click={addCategory}>Add Category</button>
            </div>
            {#if availableCategoryTypes.length === 0}
                <p class="all-added">All available category types have been added.</p>
            {/if}
        </div>
    {/if}
</main>

<!-- Delete confirmation modal -->
{#if confirmDeleteId}
    <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete">
        <div class="modal-box glass-card">
            <h3>Delete Category</h3>
            <p>Are you sure you want to delete <strong>"{confirmDeleteName}"</strong>? This will also remove all its landmarks.</p>
            <div class="modal-actions">
                <button class="btn-ghost" on:click={cancelDelete}>Cancel</button>
                <button class="btn-danger" on:click={confirmDelete}>Yes, Delete</button>
            </div>
        </div>
    </div>
{/if}

<Footer />

<style>
    .category-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 24px 60px;
        color: white;
        min-height: 100vh;
    }

    .page-header {
        text-align: center;
        margin-bottom: 32px;
    }

    .page-title {
        font-size: clamp(24px, 4vw, 32px);
        font-weight: 700;
        margin: 0 0 6px;
    }

    .page-sub {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.6);
        margin: 0;
    }

    /* ── Category grid ── */
    .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 20px;
        width: 100%;
        max-width: 900px;
        margin-bottom: 32px;
    }

    .category-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 12px;
        padding: 28px 20px;
    }

    .category-icon {
        font-size: 36px;
    }

    .category-name {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        color: white;
    }

    .category-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: center;
    }

    .btn-sm {
        padding: 8px 16px;
        font-size: 13px;
    }

    /* ── Empty state ── */
    .empty-state {
        text-align: center;
        padding: 48px 32px;
        margin-bottom: 24px;
        width: 100%;
        max-width: 400px;
    }

    .empty-icon {
        font-size: 48px;
        display: block;
        margin-bottom: 12px;
    }

    /* ── Add form ── */
    .add-form {
        width: 100%;
        max-width: 560px;
    }

    .add-form:hover {
        transform: none;
    }

    .form-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 16px;
        color: rgba(255, 255, 255, 0.85);
    }

    .form-row {
        display: flex;
        gap: 12px;
        align-items: stretch;
    }

    .select-wrapper {
        flex: 1;
    }

    select.glass-input {
        appearance: none;
        -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.6)' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 36px;
        cursor: pointer;
    }

    select.glass-input option {
        background: #122f41;
        color: white;
    }

    .all-added {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
        margin: 12px 0 0;
        text-align: center;
    }

    /* ── Delete modal ── */
    .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
    }

    .modal-box {
        max-width: 420px;
        width: 100%;
        background: rgba(18, 47, 65, 0.95);
    }

    .modal-box h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 12px;
    }

    .modal-box p {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.75);
        margin: 0 0 20px;
        line-height: 1.5;
    }

    .modal-box strong {
        color: white;
    }

    .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }

    @media (max-width: 480px) {
        .form-row {
            flex-direction: column;
        }
    }
</style>
