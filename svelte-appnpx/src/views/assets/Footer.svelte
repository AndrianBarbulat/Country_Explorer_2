<script>
    const year = new Date().getFullYear();
</script>

<style>
    footer {
        background: rgba(18, 47, 65, 0.8);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
        padding: 20px 32px;
        text-align: center;
        font-size: 13px;
    }

    .footer-links {
        margin-top: 6px;
        display: flex;
        justify-content: center;
        gap: 16px;
    }

    .footer-links a {
        color: rgba(255, 255, 255, 0.5);
        text-decoration: none;
        transition: color 0.2s ease;
    }

    .footer-links a:hover {
        color: #4eb99f;
    }
</style>

<footer>
    <p>&copy; {year} Country Explorer. All rights reserved.</p>
    <div class="footer-links">
        <a href="/home">Privacy</a>
        <a href="/home">Terms</a>
        <a href="/home">Contact</a>
    </div>
</footer>
