<script>
    import { Router, Route, Link, navigate } from "svelte-routing";
    import Home from "./views/Home.svelte";
    import Signup from "./views/Signup.svelte";
    import SignIn from "./views/SignIn.svelte";
    import Main from "./views/Main.svelte";
    import LandmarkCategory from "./views/LandmarkCategory.svelte";
    import Category from "./views/Category.svelte";
    import LandmarkDetail from "./views/LandmarkDetail.svelte";
    import UserProfile from "./views/UserProfile.svelte";
    import PasswordReset from "./views/PasswordReset.svelte";
    import AdminPanel from "./views/AdminPanel.svelte";
    import UserDetails from "./views/UserDetails.svelte";
    import MapCategory from "./views/MapCategory.svelte";
    import LandmarkOverview from "./views/LandmarkOverview.svelte";
    import { user, authReady } from "./stores/authStore";
    import { logoutUser } from "./models/authModel.js";

    // Redirect already-logged-in users away from auth pages
    $: if ($user && (location.pathname === "/signin" || location.pathname === "/signup")) {
        navigate("/home");
    }

    // Reactively guard the admin page whenever auth state changes
    $: if (
        $user !== undefined &&
        (!$user || $user.userType !== "admin") &&
        location.pathname.startsWith("/admin")
    ) {
        navigate("/signin");
    }

    let menuOpen = false;

    function toggleMenu() {
        menuOpen = !menuOpen;
    }

    function closeMenu() {
        menuOpen = false;
    }

    async function handleLogout() {
        await logoutUser();
        user.set(null);
        navigate("/signin");
    }
</script>

{#if !$authReady}
    <div class="splash-screen">
        <div class="splash-inner">
            <span class="splash-globe">&#127758;</span>
            <p class="splash-name">Country Explorer</p>
            <div class="splash-spinner" aria-label="Loading"></div>
        </div>
    </div>
{:else}
<Router>
    <nav class="navbar" class:menu-open={menuOpen}>
        <div class="navbar-inner">
            <a href="/home" class="brand" on:click={closeMenu}>
                <span class="brand-globe">&#127758;</span>
                <span class="brand-name">Country Explorer</span>
            </a>

            <button
                class="burger"
                class:is-open={menuOpen}
                on:click={toggleMenu}
                aria-label="Toggle navigation menu"
                aria-expanded={String(menuOpen)}
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            <div class="nav-links" class:is-open={menuOpen}>
                {#if $user}
                    <Link to="/category" class="nav-link" on:click={closeMenu}>Landmarks</Link>
                    <Link to="/map-category" class="nav-link" on:click={closeMenu}>Map</Link>
                    <Link to="/profile" class="nav-link" on:click={closeMenu}>Profile</Link>
                    {#if $user.userType === "admin"}
                        <Link to="/admin" class="nav-link" on:click={closeMenu}>Admin</Link>
                    {/if}
                    <button class="nav-logout" on:click={handleLogout}>Logout</button>
                {:else}
                    <Link to="/signup" class="nav-link" on:click={closeMenu}>Sign Up</Link>
                    <Link to="/signin" class="nav-link nav-link-cta" on:click={closeMenu}>Sign In</Link>
                {/if}
            </div>
        </div>
    </nav>

    <Route path="/" component={Main} />
    <Route path="/home" component={Home} />
    <Route path="/signup" component={Signup} />
    <Route path="/signin" component={SignIn} />
    <Route path="/category" component={Category} />
    <Route
        path="/landmark-category/:categoryId/:categoryName"
        component={LandmarkCategory}
    />
    <Route
        path="/landmark/:categoryId/:landmarkId"
        component={LandmarkDetail}
    />
    <Route path="/profile" component={UserProfile} />
    <Route path="/password-reset" component={PasswordReset} />
    <Route path="/admin" component={AdminPanel} />
    <Route path="/user-details/:key" component={UserDetails} />
    <Route path="/map-category" component={MapCategory} />
    <Route
        path="/landmark-overview/:userId/:categoryId/:landmarkId"
        component={LandmarkOverview}
    />
</Router>
{/if}

<style>
    /* ── Splash / auth loading screen ── */
    .splash-screen {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(-45deg, #4eb99f, #122f41, #ed563b, #f2b035);
        background-size: 400% 400%;
        animation: gradient 15s ease infinite;
    }

    .splash-inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        color: white;
    }

    .splash-globe {
        font-size: 56px;
        line-height: 1;
    }

    .splash-name {
        font-size: 20px;
        font-weight: 700;
        margin: 0;
        letter-spacing: -0.3px;
        color: rgba(255, 255, 255, 0.9);
    }

    .splash-spinner {
        width: 28px;
        height: 28px;
        border: 3px solid rgba(255, 255, 255, 0.2);
        border-top-color: rgba(255, 255, 255, 0.85);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-top: 4px;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* ── Navbar ── */
    .navbar {
        position: sticky;
        top: 0;
        z-index: 500;
        background: rgba(18, 47, 65, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        height: 64px;
    }

    .navbar-inner {
        max-width: 1400px;
        margin: 0 auto;
        height: 100%;
        padding: 0 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    /* ── Brand ── */
    .brand {
        display: flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        color: white;
    }

    .brand-globe {
        font-size: 22px;
        line-height: 1;
    }

    .brand-name {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.3px;
        color: white;
    }

    /* ── Nav links ── */
    .nav-links {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    :global(.nav-link) {
        color: rgba(255, 255, 255, 0.8);
        text-decoration: none;
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    :global(.nav-link:hover) {
        color: white;
        background: rgba(255, 255, 255, 0.1);
    }

    :global(.nav-link-cta) {
        background: rgba(78, 185, 159, 0.25);
        color: #4eb99f;
        border: 1px solid rgba(78, 185, 159, 0.4);
    }

    :global(.nav-link-cta:hover) {
        background: rgba(78, 185, 159, 0.4);
        color: white;
    }

    .nav-logout {
        color: rgba(255, 255, 255, 0.7);
        background: none;
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 7px 14px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
    }

    .nav-logout:hover {
        background: rgba(237, 86, 59, 0.2);
        border-color: rgba(237, 86, 59, 0.4);
        color: #ffb3a3;
    }

    /* ── Burger button ── */
    .burger {
        display: none;
        flex-direction: column;
        justify-content: center;
        gap: 5px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px;
        width: 36px;
        height: 36px;
    }

    .burger span {
        display: block;
        width: 22px;
        height: 2px;
        background: white;
        border-radius: 2px;
        transition: all 0.25s ease;
        transform-origin: center;
    }

    /* Hamburger → X animation */
    .burger.is-open span:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
    }
    .burger.is-open span:nth-child(2) {
        opacity: 0;
        transform: scaleX(0);
    }
    .burger.is-open span:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
    }

    /* ── Mobile ── */
    @media (max-width: 768px) {
        .burger {
            display: flex;
        }

        .nav-links {
            display: none;
            position: absolute;
            top: 64px;
            left: 0;
            right: 0;
            flex-direction: column;
            align-items: stretch;
            padding: 12px 16px 16px;
            background: rgba(18, 47, 65, 0.97);
            backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            gap: 4px;
        }

        .nav-links.is-open {
            display: flex;
        }

        :global(.nav-link) {
            padding: 12px 16px;
            border-radius: 8px;
        }

        .nav-logout {
            margin-top: 4px;
            padding: 12px 16px;
            text-align: left;
        }
    }
</style>
