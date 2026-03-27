<script>
    import { resetPassword } from '../models/authModel';
    import { navigate } from 'svelte-routing';
    import Footer from './assets/Footer.svelte';

    let email = '';
    let successMessage = '';
    let error = '';
    let loading = false;

    async function handlePasswordReset(event) {
        event.preventDefault();
        if (!email.trim()) return;
        loading = true;
        error = '';
        successMessage = '';
        try {
            await resetPassword(email.trim());
            successMessage = 'Reset link sent! Check your inbox.';
        } catch (e) {
            error = 'Could not send reset email. Please check the address and try again.';
        }
        loading = false;
    }
</script>

<main class="gradient-bg reset-page">
    <div class="reset-wrapper fade-in">
        <div class="brand-header">
            <span class="brand-icon">&#128274;</span>
            <h1 class="brand-title">Reset Password</h1>
            <p class="brand-sub">Enter your email and we'll send you a reset link.</p>
        </div>

        <form class="glass-card reset-card" on:submit|preventDefault={handlePasswordReset}>
            <div class="field-group">
                <label class="glass-label" for="resetEmail">Email Address</label>
                <input
                    id="resetEmail"
                    class="glass-input"
                    type="email"
                    bind:value={email}
                    placeholder="your@email.com"
                    required
                />
            </div>

            {#if error}
                <div class="msg-error">{error}</div>
            {/if}
            {#if successMessage}
                <div class="msg-success">{successMessage}</div>
            {/if}

            <button type="submit" class="btn-primary btn-full" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
            </button>

            <button
                type="button"
                class="btn-ghost btn-full"
                on:click={() => navigate('/signin')}
            >
                &#8592; Back to Sign In
            </button>
        </form>
    </div>
</main>
<Footer />

<style>
    .reset-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
    }

    .reset-wrapper {
        width: 100%;
        max-width: 380px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
    }

    .brand-header {
        text-align: center;
    }

    .brand-icon {
        font-size: 44px;
        display: block;
        margin-bottom: 8px;
    }

    .brand-title {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 6px;
        color: white;
    }

    .brand-sub {
        font-size: 14px;
        color: rgba(255,255,255,0.6);
        margin: 0;
    }

    .reset-card {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .reset-card:hover {
        transform: none;
    }

    .field-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .btn-full {
        width: 100%;
        padding: 13px;
        font-size: 15px;
    }
</style>
