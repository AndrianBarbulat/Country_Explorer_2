<script>
  import { onMount, onDestroy } from 'svelte';
  import { navigate } from 'svelte-routing';
  import Footer from './assets/Footer.svelte';

  const slides = [
    { src: "https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", alt: "Scenic landscape" },
    { src: "https://images.pexels.com/photos/21014/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", alt: "Travel destination" },
    { src: "https://images.pexels.com/photos/2859169/pexels-photo-2859169.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", alt: "Adventure location" },
  ];

  let current = 0;
  let timer;

  onMount(() => {
    timer = setInterval(() => {
      current = (current + 1) % slides.length;
    }, 4000);
  });

  onDestroy(() => {
    clearInterval(timer);
  });

  function goTo(index) {
    current = index;
    clearInterval(timer);
    timer = setInterval(() => {
      current = (current + 1) % slides.length;
    }, 4000);
  }
</script>

<!-- ── Hero / Slideshow ── -->
<section class="hero-section">
  <!-- Slideshow background -->
  <div class="slideshow" aria-hidden="true">
    {#each slides as slide, i (slide.src)}
      <img
        class="slide-img"
        class:active={i === current}
        src={slide.src}
        alt={slide.alt}
      />
    {/each}
    <div class="slide-overlay"></div>
  </div>

  <!-- Hero content -->
  <div class="hero-content fade-in">
    <span class="hero-globe">&#127758;</span>
    <h1 class="hero-title">Country Explorer</h1>
    <p class="hero-sub">Discover, share, and mark your favourite places on Earth.</p>
    <div class="hero-ctas">
      <button class="btn-primary hero-btn" on:click={() => navigate('/signup')}>Get Started</button>
      <button class="btn-ghost hero-btn" on:click={() => navigate('/signin')}>Sign In</button>
    </div>

    <!-- Slide indicators -->
    <div class="slide-dots" role="tablist" aria-label="Slideshow navigation">
      {#each slides as _, i}
        <button
          class="dot"
          class:active={i === current}
          on:click={() => goTo(i)}
          role="tab"
          aria-selected={i === current}
          aria-label="Slide {i + 1}"
        ></button>
      {/each}
    </div>
  </div>
</section>

<!-- ── Tagline strip + Features ── -->
<section class="tagline-section gradient-bg">
  <div class="tagline-inner">
    <h2 class="tagline-heading">Discover New Placemarks</h2>
    <p class="tagline-sub">Explore, share, and mark your favorite locations with the world.</p>
    <div class="features-inner">
      <div class="feature-card glass-card">
        <span class="feat-icon">&#128247;</span>
        <h3 class="feat-title">Capture</h3>
        <p class="feat-desc">Upload photos, add precise coordinates and share your discoveries on an interactive map.</p>
      </div>
      <div class="feature-card glass-card">
        <span class="feat-icon">&#127758;</span>
        <h3 class="feat-title">Explore</h3>
        <p class="feat-desc">Browse landmarks added by explorers worldwide. Find your next destination and get inspired.</p>
      </div>
      <div class="feature-card glass-card">
        <span class="feat-icon">&#128101;</span>
        <h3 class="feat-title">Connect</h3>
        <p class="feat-desc">Join a community of travellers and adventurers passionate about showcasing the world's wonders.</p>
      </div>
    </div>
  </div>
</section>

<!-- ── About ── -->
<section class="about-section">
  <div class="about-inner">
    <div class="about-text">
      <h2 class="section-heading">About Placemarks</h2>
      <p>Placemarks is an innovative platform to explore, share, and create location markers. Whether it's a scenic lookout, a tranquil lakeside retreat, or an exciting urban destination — you can mark your favourite spots and revisit them anytime.</p>
      <p>Leave footprints across continents or find inspiration for your next journey. Wherever your travels take you, let Country Explorer be your gateway to new adventures and lifelong memories.</p>
      <button class="btn-primary about-btn" on:click={() => navigate('/signup')}>Start Exploring</button>
    </div>
    <div class="about-image-wrap">
      <img
        class="about-image"
        src="https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2"
        alt="Scenic landscape"
        loading="lazy"
      />
    </div>
  </div>
</section>

<!-- ── Vision / Mission / Involved ── -->
<section class="pillars-section gradient-bg">
  <div class="pillars-inner">
    <h2 class="section-heading centered">More About Us</h2>
    <div class="pillars-grid">
      <div class="pillar-card glass-card">
        <span class="pillar-icon">&#127919;</span>
        <h3 class="pillar-title">Our Vision</h3>
        <p>To connect the world through a shared love of exploration and travel.</p>
      </div>
      <div class="pillar-card glass-card">
        <span class="pillar-icon">&#128640;</span>
        <h3 class="pillar-title">Our Mission</h3>
        <p>To provide a platform where adventurers can share their discoveries and find new ones.</p>
      </div>
      <div class="pillar-card glass-card">
        <span class="pillar-icon">&#129309;</span>
        <h3 class="pillar-title">Get Involved</h3>
        <p>Join our community, contribute, and help shape the future of Placemarks.</p>
      </div>
    </div>
  </div>
</section>

<Footer />

<style>
  /* ── Hero ── */
  .hero-section {
    position: relative;
    height: 100vh;
    min-height: 560px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .slideshow {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .slide-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 1.2s ease;
  }

  .slide-img.active {
    opacity: 1;
  }

  .slide-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(18, 47, 65, 0.55) 0%,
      rgba(18, 47, 65, 0.75) 100%
    );
  }

  .hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    color: white;
    padding: 0 24px;
    gap: 16px;
  }

  .hero-globe {
    font-size: 64px;
    line-height: 1;
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));
  }

  .hero-title {
    font-size: clamp(36px, 7vw, 72px);
    font-weight: 800;
    margin: 0;
    letter-spacing: -1.5px;
    text-shadow: 0 2px 20px rgba(0,0,0,0.4);
  }

  .hero-sub {
    font-size: clamp(14px, 2vw, 18px);
    color: rgba(255,255,255,0.8);
    margin: 0;
    max-width: 500px;
  }

  .hero-ctas {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 8px;
  }

  .hero-btn {
    padding: 14px 32px;
    font-size: 15px;
  }

  .slide-dots {
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,0.35);
    border: none;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s ease;
  }

  .dot.active {
    background: white;
    transform: scale(1.3);
  }

  /* ── Tagline strip ── */
  .tagline-section {
    padding: 48px 24px;
    text-align: center;
    min-height: unset;
  }

  .tagline-inner {
    max-width: 700px;
    margin: 0 auto;
  }

  .tagline-heading {
    font-size: clamp(24px, 4vw, 36px);
    font-weight: 700;
    margin: 0 0 12px;
    color: white;
    letter-spacing: -0.5px;
  }

  .tagline-sub {
    font-size: 16px;
    color: rgba(255,255,255,0.65);
    margin: 0;
    line-height: 1.6;
  }

  /* ── Features ── */
  .features-inner {
    margin-top: 32px;
    max-width: 1000px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .feature-card {
    text-align: center;
    padding: 28px 20px;
    background: rgba(255,255,255,0.05);
  }

  .feat-icon {
    font-size: 40px;
    display: block;
    margin-bottom: 14px;
  }

  .feat-title {
    font-size: 18px;
    font-weight: 700;
    color: white;
    margin: 0 0 10px;
  }

  .feat-desc {
    font-size: 14px;
    color: rgba(255,255,255,0.6);
    line-height: 1.6;
    margin: 0;
  }

  /* ── About ── */
  .about-section {
    background: #122f41;
    padding: 52px 24px;
  }

  .about-inner {
    max-width: 1000px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: center;
  }

  .about-text {
    display: flex;
    flex-direction: column;
    gap: 16px;
    color: rgba(255,255,255,0.8);
  }

  .section-heading {
    font-size: clamp(22px, 3vw, 30px);
    font-weight: 700;
    color: white;
    margin: 0 0 4px;
    letter-spacing: -0.4px;
  }

  .section-heading.centered {
    font-size: 18px;
    text-align: center;
    margin-bottom: 36px;
  }

  .about-text p {
    font-size: 15px;
    line-height: 1.7;
    margin: 0;
  }

  .about-btn {
    align-self: flex-start;
    padding: 12px 28px;
    margin-top: 8px;
  }

  .about-image-wrap {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(0,0,0,0.4);
  }

  .about-image {
    width: 100%;
    height: 240px;
    object-fit: cover;
    display: block;
  }

  /* ── Pillars ── */
  .pillars-section {
    padding: 48px 24px;
    min-height: unset;
  }

  .pillars-inner {
    max-width: 1000px;
    margin: 0 auto;
  }

  .pillars-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .pillar-card {
    text-align: center;
    padding: 28px 20px;
  }

  .pillar-icon {
    font-size: 36px;
    display: block;
    margin-bottom: 14px;
  }

  .pillar-title {
    font-size: 17px;
    font-weight: 700;
    color: white;
    margin: 0 0 10px;
  }

  .pillar-card p {
    font-size: 14px;
    color: rgba(255,255,255,0.65);
    line-height: 1.6;
    margin: 0;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .features-inner,
    .pillars-grid {
      grid-template-columns: 1fr;
    }

    .about-inner {
      grid-template-columns: 1fr;
    }

    .about-image-wrap {
      order: -1;
    }
  }
</style>
