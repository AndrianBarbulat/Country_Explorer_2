<script>
    import { onMount } from 'svelte';
    import { ref, onValue, update } from 'firebase/database';
    import { db } from '../services/firebase';
    import { getAuth, onAuthStateChanged } from 'firebase/auth';
    import Footer from './assets/Footer.svelte';

    let userData = null;
    let userId = null;
    let firstName = '';
    let lastName = '';
    let saveSuccess = false;
    let saveError = '';

    onMount(() => {
        const auth = getAuth();
        onAuthStateChanged(auth, user => {
            if (user) {
                userId = user.uid;
                fetchUserData();
            } else {
                userData = null;
            }
        });
    });

    function fetchUserData() {
        const userRef = ref(db, 'users/' + userId);
        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                userData = snapshot.val();
                firstName = userData.firstName || '';
                lastName = userData.lastName || '';
            } else {
                userData = null;
            }
        }, { onlyOnce: true });
    }

    async function updateUserProfile(event) {
        event.preventDefault();
        saveSuccess = false;
        saveError = '';
        if (userId) {
            try {
                await update(ref(db, 'users/' + userId), { firstName, lastName });
                saveSuccess = true;
                fetchUserData();
                setTimeout(() => { saveSuccess = false; }, 3000);
            } catch (error) {
                saveError = 'Failed to update profile. Please try again.';
            }
        }
    }
</script>

<main class="gradient-bg profile-page">
    <div class="profile-wrapper fade-in">
        <h1 class="page-title">My Profile</h1>

        {#if userData}
            <!-- Info card -->
            <div class="glass-card info-card">
                <div class="avatar">
                    {#if userData.photoURL}
                        <img src={userData.photoURL} alt="Profile avatar" class="avatar-img" />
                    {:else}
                        <span class="avatar-initials">
                            {(userData.firstName || '?')[0].toUpperCase()}{(userData.lastName || '')[0]?.toUpperCase() || ''}
                        </span>
                    {/if}
                </div>

                <div class="info-fields">
                    <div class="info-row">
                        <span class="info-label">First Name</span>
                        <span class="info-value">{userData.firstName || '—'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Last Name</span>
                        <span class="info-value">{userData.lastName || '—'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email</span>
                        <span class="info-value">{userData.email || '—'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Account Type</span>
                        <span class="info-value role-badge" class:admin={userData.userType === 'admin'}>
                            {userData.userType || 'user'}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Edit form -->
            <form class="glass-card edit-card" on:submit={updateUserProfile}>
                <h2 class="form-title">Edit Profile</h2>
                <p class="form-hint">Only alphabetic letters are allowed in name fields.</p>

                <div class="field-group">
                    <label class="glass-label" for="upFirstName">First Name</label>
                    <input
                        id="upFirstName"
                        class="glass-input"
                        type="text"
                        bind:value={firstName}
                        placeholder="Jane"
                        pattern="[A-Za-z]+"
                        required
                    />
                </div>

                <div class="field-group">
                    <label class="glass-label" for="upLastName">Last Name</label>
                    <input
                        id="upLastName"
                        class="glass-input"
                        type="text"
                        bind:value={lastName}
                        placeholder="Smith"
                        pattern="[A-Za-z]+"
                        required
                    />
                </div>

                {#if saveError}
                    <div class="msg-error">{saveError}</div>
                {/if}
                {#if saveSuccess}
                    <div class="msg-success">Profile updated successfully!</div>
                {/if}

                <button type="submit" class="btn-primary save-btn">Save Changes</button>
            </form>
        {:else}
            <p class="loading-text">Loading profile…</p>
        {/if}
    </div>
</main>
<Footer />

<style>
    .profile-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 24px 60px;
        color: white;
    }

    .profile-wrapper {
        width: 100%;
        max-width: 520px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .page-title {
        font-size: clamp(22px, 3.5vw, 28px);
        font-weight: 700;
        margin: 0 0 8px;
    }

    /* ── Info card ── */
    .info-card {
        display: flex;
        flex-direction: column;
        gap: 20px;
        align-items: center;
        text-align: center;
    }

    .info-card:hover {
        transform: none;
    }

    .avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        overflow: hidden;
        background: rgba(78, 185, 159, 0.2);
        border: 2px solid rgba(78, 185, 159, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .avatar-initials {
        font-size: 26px;
        font-weight: 700;
        color: #4eb99f;
        letter-spacing: -1px;
    }

    .info-fields {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 11px 0;
        border-bottom: 1px solid rgba(255,255,255,0.07);
        gap: 12px;
    }

    .info-row:last-child {
        border-bottom: none;
    }

    .info-label {
        font-size: 12px;
        color: rgba(255,255,255,0.45);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
    }

    .info-value {
        font-size: 14px;
        color: rgba(255,255,255,0.85);
        font-weight: 500;
        text-align: right;
        word-break: break-all;
    }

    .role-badge {
        background: rgba(78, 185, 159, 0.15);
        color: #4eb99f;
        border: 1px solid rgba(78, 185, 159, 0.25);
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 12px;
        text-transform: capitalize;
    }

    .role-badge.admin {
        background: rgba(242, 176, 53, 0.15);
        color: #f2b035;
        border-color: rgba(242, 176, 53, 0.3);
    }

    /* ── Edit form ── */
    .edit-card {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .edit-card:hover {
        transform: none;
    }

    .form-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        color: rgba(255,255,255,0.9);
    }

    .form-hint {
        font-size: 12px;
        color: rgba(255,255,255,0.4);
        margin: -4px 0 0;
    }

    .field-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .save-btn {
        width: 100%;
        padding: 13px;
        font-size: 15px;
        margin-top: 4px;
    }
</style>
