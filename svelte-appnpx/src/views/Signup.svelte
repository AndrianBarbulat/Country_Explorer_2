<script>
    import { createUser, signInWithGoogle } from '../models/authModel';
    import { navigate } from 'svelte-routing';
    import Footer from './assets/Footer.svelte';

    let email = '';
    let password = '';
    let firstName = '';
    let lastName = '';
    let error = '';
    let successMessage = '';
    let userType = 'user';

    async function signUp() {
        try {
            if (password.length < 6) {
                throw new Error("Password should have at least 6 characters.");
            }
            await createUser(email, password, firstName, lastName, userType);
            successMessage = 'Account created! Redirecting to sign-in…';
            setTimeout(() => navigate('/signin'), 3000);
        } catch (e) {
            if (e.code === "auth/email-already-in-use") {
                error = "This email is already registered. Please use another email.";
            } else if (e.code === "auth/weak-password") {
                error = "The password is too weak. Please use a stronger password.";
            } else {
                error = e.message;
            }
        }
    }

    async function signUpWithGoogle() {
        try {
            await signInWithGoogle();
            successMessage = 'Google sign-up successful. Redirecting…';
            setTimeout(() => navigate('/home'), 1500);
        } catch (e) {
            error = "An error occurred during Google sign-up. Please try again.";
        }
    }
</script>

<main class="gradient-bg signup-page">
    <div class="signup-wrapper fade-in">
        <div class="brand-header">
            <span class="brand-icon">&#127758;</span>
            <h1 class="brand-title">Create Account</h1>
            <p class="brand-sub">Join Country Explorer and start discovering</p>
        </div>

        <form class="glass-card signup-card" on:submit|preventDefault={signUp}>
            <div class="name-row">
                <div class="field-group">
                    <label class="glass-label" for="firstName">First Name</label>
                    <input
                        class="glass-input"
                        id="firstName"
                        type="text"
                        bind:value={firstName}
                        placeholder="Jane"
                        pattern="[A-Za-z]+"
                        required
                    />
                </div>
                <div class="field-group">
                    <label class="glass-label" for="lastName">Last Name</label>
                    <input
                        class="glass-input"
                        id="lastName"
                        type="text"
                        bind:value={lastName}
                        placeholder="Smith"
                        pattern="[A-Za-z]+"
                        required
                    />
                </div>
            </div>

            <div class="field-group">
                <label class="glass-label" for="email">Email</label>
                <input
                    class="glass-input"
                    id="email"
                    type="email"
                    bind:value={email}
                    placeholder="your@email.com"
                    required
                />
            </div>

            <div class="field-group">
                <label class="glass-label" for="password">Password <span class="hint">(min 6 characters)</span></label>
                <input
                    class="glass-input"
                    id="password"
                    type="password"
                    bind:value={password}
                    placeholder="••••••••"
                    minlength="6"
                    required
                />
            </div>

            <button class="btn-primary btn-full" type="submit">Create Account</button>

            <div class="divider"><span>or</span></div>

            <button
                class="btn-google"
                type="button"
                on:click={signUpWithGoogle}
            >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign Up with Google
            </button>

            {#if error}
                <div class="msg-error">{error}</div>
            {/if}

            {#if successMessage}
                <div class="msg-success">{successMessage}</div>
            {/if}
        </form>

        <p class="signin-prompt">
            Already have an account? <a href="/signin">Sign in</a>
        </p>
    </div>
</main>
<Footer />

<style>
    .signup-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 16px;
    }

    .signup-wrapper {
        width: 100%;
        max-width: 440px;
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
        font-size: 26px;
        font-weight: 700;
        margin: 0 0 6px;
        color: white;
    }

    .brand-sub {
        font-size: 14px;
        color: rgba(255,255,255,0.6);
        margin: 0;
    }

    .signup-card {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .signup-card:hover {
        transform: none;
    }

    .name-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }

    .field-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .hint {
        font-size: 10px;
        color: rgba(255,255,255,0.35);
        font-weight: 400;
        text-transform: none;
        letter-spacing: 0;
    }

    .btn-full {
        width: 100%;
        padding: 13px;
        font-size: 15px;
    }

    .divider {
        display: flex;
        align-items: center;
        gap: 12px;
        color: rgba(255,255,255,0.35);
        font-size: 12px;
    }

    .divider::before,
    .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(255,255,255,0.15);
    }

    .btn-google {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        background: white;
        color: #333;
        border: none;
        padding: 12px;
        border-radius: 50px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .btn-google:hover {
        background: #f5f5f5;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transform: translateY(-1px);
    }

    .signin-prompt {
        font-size: 13px;
        color: rgba(255,255,255,0.6);
    }

    .signin-prompt a {
        color: #4eb99f;
        text-decoration: none;
        font-weight: 500;
    }

    .signin-prompt a:hover {
        text-decoration: underline;
    }

    @media (max-width: 380px) {
        .name-row {
            grid-template-columns: 1fr;
        }
    }
</style>
