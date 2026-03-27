<script>
    import { writable } from 'svelte/store';
    import { onMount, onDestroy } from 'svelte';
    import { ref, onValue } from 'firebase/database';
    import { db } from '../../services/firebase';
    import { navigate } from 'svelte-routing';

    let categories = writable({});
    let activeCategory = writable(null);
    let unsubscribe;

    function toggleCategory(categoryName) {
        activeCategory.update(current => current === categoryName ? null : categoryName);
    }

    function handleKeydown(event, categoryName) {
        if (event.key === 'Enter' || event.key === ' ') {
            toggleCategory(categoryName);
            event.preventDefault();
        }
    }

    function goToLandmarkDetails(userId, categoryId, landmarkId) {
        navigate(`/landmark-overview/${userId}/${categoryId}/${landmarkId}`);
    }

    onMount(() => {
        const catRef = ref(db, 'users');
        unsubscribe = onValue(catRef, (snapshot) => {
            const data = snapshot.val();
            let newCategories = {};
            for (let userId in data) {
                if (data[userId].categories) {
                    for (let categoryId in data[userId].categories) {
                        let categoryName = data[userId].categories[categoryId].name;
                        let landmarks = data[userId].categories[categoryId].landmarks || {};
                        newCategories[categoryName] = newCategories[categoryName] || [];
                        for (let landmarkId in landmarks) {
                            let landmark = { ...landmarks[landmarkId], userId, categoryId, id: landmarkId };
                            if (!landmark.isPrivate) {
                                newCategories[categoryName].push(landmark);
                            }
                        }
                    }
                }
            }
            categories.set(newCategories);
        });
    });

    onDestroy(() => {
        if (unsubscribe) unsubscribe();
    });
</script>

<style>
    .category-list {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .category-btn {
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.75);
        font-family: inherit;
        font-size: 14px;
        cursor: pointer;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.2s ease;
        border-left: 3px solid transparent;
        gap: 8px;
    }

    .category-btn:hover,
    .category-btn:focus {
        background: rgba(255, 255, 255, 0.08);
        color: white;
        outline: none;
    }

    .category-btn.is-active {
        color: #4eb99f;
        border-left-color: #4eb99f;
        background: rgba(78, 185, 159, 0.1);
    }

    .category-label {
        flex: 1;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .count-badge {
        font-size: 11px;
        background: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.6);
        padding: 2px 7px;
        border-radius: 10px;
        flex-shrink: 0;
    }

    .category-btn.is-active .count-badge {
        background: rgba(78, 185, 159, 0.2);
        color: #4eb99f;
    }

    .chevron {
        font-size: 10px;
        flex-shrink: 0;
        transition: transform 0.2s ease;
        color: rgba(255, 255, 255, 0.4);
    }

    .category-btn.is-active .chevron {
        transform: rotate(90deg);
    }

    /* ── Landmark list ── */
    .landmark-list {
        list-style: none;
        margin: 0;
        padding: 0;
        background: rgba(0, 0, 0, 0.15);
    }

    .landmark-btn {
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-family: inherit;
        font-size: 13px;
        cursor: pointer;
        padding: 9px 20px 9px 36px;
        display: block;
        transition: all 0.2s ease;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .landmark-btn:hover,
    .landmark-btn:focus {
        background: rgba(255, 255, 255, 0.06);
        color: white;
        outline: none;
    }

    .empty-msg {
        padding: 8px 20px 8px 36px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.35);
        font-style: italic;
    }
</style>

<ul class="category-list">
    {#each Object.entries($categories) as [categoryName, landmarks] (categoryName)}
        <li>
            <button
                class="category-btn"
                class:is-active={$activeCategory === categoryName}
                on:click={() => toggleCategory(categoryName)}
                on:keydown={(e) => handleKeydown(e, categoryName)}
            >
                <span class="category-label">{categoryName}</span>
                <span class="count-badge">{landmarks.length}</span>
                <span class="chevron">&#9658;</span>
            </button>

            {#if $activeCategory === categoryName}
                <ul class="landmark-list">
                    {#if landmarks.length > 0}
                        {#each landmarks as landmark (landmark.id)}
                            <li>
                                <button
                                    class="landmark-btn"
                                    on:click={() => goToLandmarkDetails(landmark.userId, landmark.categoryId, landmark.id)}
                                >
                                    {landmark.name}
                                </button>
                            </li>
                        {/each}
                    {:else}
                        <li><span class="empty-msg">No public landmarks</span></li>
                    {/if}
                </ul>
            {/if}
        </li>
    {/each}
</ul>
