<script>
    import { loginUser, signInWithGoogle } from '../models/authModel';
    import { navigate } from 'svelte-routing';
    import Footer from './assets/Footer.svelte';

    let email = '';
    let password = '';
    let error = '';
    let googleLoading = false;

    function getFriendlyErrorMessage(firebaseErrorCode) {
        const errorMessages = {
            'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
            'auth/user-not-found': 'No account found for this email. Please sign up.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your internet connection.',
        };
        return errorMessages[firebaseErrorCode] || 'An unknown error occurred. Please try again.';
    }

    async function signIn() {
        try {
            await loginUser(email, password);
            navigate('/home');
        } catch (e) {
            error = getFriendlyErrorMessage(e.code);
        }
    }

    function goToPasswordReset() {
        navigate('/password-reset');
    }

    async function signInWithGoogleAction() {
        if (googleLoading) return;
        googleLoading = true;
        try {
            await signInWithGoogle();
            navigate('/home');
        } catch (e) {
            error = getFriendlyErrorMessage(e.code);
        } finally {
            googleLoading = false;
        }
    }
</script>

<main class="gradient-bg signin-page">
    <div class="signin-wrapper fade-in">
        <div class="brand-header">
            <span class="brand-icon">&#127758;</span>
            <h1 class="brand-title">Country Explorer</h1>
            <p class="brand-sub">Welcome back — sign in to continue</p>
        </div>

        <form class="glass-card signin-card" on:submit|preventDefault={signIn}>
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
                <label class="glass-label" for="password">Password</label>
                <input
                    class="glass-input"
                    id="password"
                    type="password"
                    bind:value={password}
                    placeholder="••••••••"
                    required
                />
            </div>

            <button class="btn-primary btn-full" type="submit">Sign In</button>

            <div class="divider"><span>or</span></div>

            <button
                class="btn-google"
                on:click|preventDefault={signInWithGoogleAction}
                type="button"
                disabled={googleLoading}
            >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {googleLoading ? 'Signing in...' : 'Sign In with Google'}
            </button>

            <button
                class="btn-ghost btn-full"
                on:click|preventDefault={goToPasswordReset}
                type="button"
            >
                Forgot Password?
            </button>

            {#if error}
                <div class="msg-error">{error}</div>
            {/if}
        </form>

        <p class="signup-prompt">
            Don't have an account? <a href="/signup">Sign up</a>
        </p>
    </div>
</main>
<Footer />

<style>
    .signin-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
    }

    .signin-wrapper {
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
    }

    .brand-header {
        text-align: center;
    }

    .brand-icon {
        font-size: 48px;
        display: block;
        margin-bottom: 8px;
    }

    .brand-title {
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 6px;
        color: white;
    }

    .brand-sub {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.65);
        margin: 0;
    }

    .signin-card {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    /* Override glass-card hover for the form itself */
    .signin-card:hover {
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

    .divider {
        display: flex;
        align-items: center;
        gap: 12px;
        color: rgba(255, 255, 255, 0.35);
        font-size: 12px;
    }

    .divider::before,
    .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.15);
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
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .btn-google:hover {
        background: #f5f5f5;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transform: translateY(-1px);
    }

    .btn-google:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }

    .signup-prompt {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.6);
    }

    .signup-prompt a {
        color: #4eb99f;
        text-decoration: none;
        font-weight: 500;
    }

    .signup-prompt a:hover {
        text-decoration: underline;
    }
</style>
