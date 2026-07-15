/* -------------------------------------------------------------
   AMUL KOOL ROSE — INTERACTIVE APPLICATION LOGIC
   ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 1. STATE & UTILITIES
    // ---------------------------------------------------------
    const totalFrames = 202; // Frame index goes from 1 to 202
    const skippedFrames = [20]; // 020 is missing
    const imageElements = [];
    let loadedImagesCount = 0;
    
    // Smooth scroll interpolation (Lerp) states
    let currentFrameIndex = 0;
    let targetFrameIndex = 0;
    let lastDrawnFrameIndex = -1;
    const lerpFactor = 0.08; // Control animation lag speed (smoothness)

    // Elements
    const preloader = document.getElementById('preloader');
    const progressBar = document.getElementById('progress-bar');
    const loaderPercentage = document.getElementById('loader-percentage');
    const canvas = document.getElementById('scroll-canvas');
    const ctx = canvas.getContext('2d');
    const scrollIndicator = document.getElementById('scroll-indicator');
    
    // Custom cursor elements
    const cursor = document.getElementById('custom-cursor');
    const cursorGlow = document.getElementById('custom-cursor-glow');

    // ---------------------------------------------------------
    // 2. HELPER FUNCTIONS
    // ---------------------------------------------------------
    // Zero-pad the frame numbers (e.g. 1 -> "001", 10 -> "010", 123 -> "123")
    function padZero(num, size = 3) {
        let s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    }

    // Generate list of frames (excluding skipped)
    const framePaths = [];
    for (let i = 1; i <= totalFrames; i++) {
        if (!skippedFrames.includes(i)) {
            framePaths.push(`Amul/ezgif-frame-${padZero(i)}.jpg`);
        }
    }
    const totalValidImages = framePaths.length;

    // ---------------------------------------------------------
    // 3. PRELOADING IMAGE FRAMES
    // ---------------------------------------------------------
    function preloadImages() {
        return new Promise((resolve) => {
            framePaths.forEach((path, index) => {
                const img = new Image();
                img.src = path;
                img.onload = () => {
                    loadedImagesCount++;
                    updateLoaderProgress();
                    
                    if (loadedImagesCount === totalValidImages) {
                        onPreloadComplete();
                        resolve();
                    }
                };
                img.onerror = () => {
                    // Fail silently or handle missing images gracefully
                    loadedImagesCount++;
                    updateLoaderProgress();
                    if (loadedImagesCount === totalValidImages) {
                        onPreloadComplete();
                        resolve();
                    }
                };
                imageElements[index] = img;
            });
        });
    }

    function updateLoaderProgress() {
        const progressPercent = Math.min(loadedImagesCount / totalValidImages, 1);
        
        // Progress circle svg calculations
        // r = 45, Circumference = 283
        const dashoffset = 283 - (283 * progressPercent);
        progressBar.style.strokeDashoffset = dashoffset;
        
        // Update text percentage
        loaderPercentage.innerText = Math.round(progressPercent * 100) + '%';
    }

    function onPreloadComplete() {
        // Fade out preloader
        preloader.classList.add('fade-out');
        
        // Init Canvas Drawing
        resizeCanvas();
        drawFrame(0);
        
        // Start animation rendering loop
        tick();
    }

    // ---------------------------------------------------------
    // 4. CANVAS STRETCH & DRAWING
    // ---------------------------------------------------------
    // Fit canvas aspect ratio to screen (Cover mode)
    function drawImageProp(ctx, img) {
        const w = canvas.width;
        const h = canvas.height;
        const iw = img.width;
        const ih = img.height;
        
        const r = Math.max(w / iw, h / ih);
        const nw = iw * r;
        const nh = ih * r;
        
        const cx = (w - nw) / 2;
        const cy = (h - nh) / 2;
        
        ctx.drawImage(img, cx, cy, nw, nh);
    }

    function drawFrame(index) {
        const imageIndex = Math.max(0, Math.min(Math.round(index), totalValidImages - 1));
        const img = imageElements[imageIndex];
        
        if (img && img.complete) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawImageProp(ctx, img);
            lastDrawnFrameIndex = imageIndex;
        }
    }

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr);
        
        // Redraw current frame
        drawFrame(currentFrameIndex);
    }

    window.addEventListener('resize', resizeCanvas);

    // ---------------------------------------------------------
    // 5. SCROLL TRIGGER AND LERP TICK
    // ---------------------------------------------------------
    function updateScrollCalculations() {
        const scrollTop = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        
        if (maxScroll <= 0) return;
        
        const scrollFraction = scrollTop / maxScroll;
        
        // Map scroll fraction to frame index
        targetFrameIndex = scrollFraction * (totalValidImages - 1);
        
        // Hide scroll indicator mouse icon after scrolling down a bit
        if (scrollFraction > 0.05) {
            scrollIndicator.classList.add('fade-out');
        } else {
            scrollIndicator.classList.remove('fade-out');
        }
        
        // Determine active overlay sections based on scroll
        updateSectionHighlights(scrollFraction);
    }

    // Render loop
    function tick() {
        // Linear Interpolation (Lerp) towards the target frame index
        const diff = targetFrameIndex - currentFrameIndex;
        
        if (Math.abs(diff) > 0.01) {
            currentFrameIndex += diff * lerpFactor;
            
            // Draw only if index changes to save performance
            const checkIndex = Math.round(currentFrameIndex);
            if (checkIndex !== lastDrawnFrameIndex) {
                drawFrame(currentFrameIndex);
            }
        }
        
        requestAnimationFrame(tick);
    }

    window.addEventListener('scroll', updateScrollCalculations);

    // ---------------------------------------------------------
    // 6. CONTENT SECTION HIGHLIGHT ACTIVE STATE
    // ---------------------------------------------------------
    const sections = document.querySelectorAll('.scroll-section');
    const navLinks = document.querySelectorAll('.nav-menu .nav-link');

    function updateSectionHighlights(progress) {
        // Set section boundaries
        // 5 sections total: Hero (0), Swirl (1), Bottle (2), Benefits (3), CTA (4)
        let activeIndex = 0;
        
        if (progress < 0.18) {
            activeIndex = 0; // Hero
        } else if (progress >= 0.18 && progress < 0.45) {
            activeIndex = 1; // Swirl
        } else if (progress >= 0.45 && progress < 0.68) {
            activeIndex = 2; // Bottle
        } else if (progress >= 0.68 && progress < 0.88) {
            activeIndex = 3; // Benefits
        } else {
            activeIndex = 4; // CTA
        }

        sections.forEach((section, idx) => {
            if (idx === activeIndex) {
                section.classList.add('active-section');
            } else {
                section.classList.remove('active-section');
            }
        });

        // Update Nav Menu Links
        navLinks.forEach((link, idx) => {
            // Check if link matches section or if highlight class
            if (idx === activeIndex) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Smooth scroll navigation clicks
    navLinks.forEach((link, idx) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-sec');
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                // Calculate position to center section
                const targetY = targetSection.offsetTop;
                window.scrollTo({
                    top: targetY,
                    behavior: 'smooth'
                });
            }
        });
    });

    // In-page scroll buttons
    document.querySelectorAll('.scroll-to-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = document.getElementById('sec-swirl');
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ---------------------------------------------------------
    // 7. WEBAUDIO AMBIENT SYNTHESIZER (AMAZING WOW FACTOR)
    // ---------------------------------------------------------
    const soundToggleBtn = document.getElementById('sound-toggle');
    let audioCtx = null;
    let synthNodes = [];
    let isPlaying = false;

    function initAmbientSynth() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Oscillator 1: Warm pink hum (Low frequency pitch)
            const osc1 = audioCtx.createOscillator();
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(110, audioCtx.currentTime); // A2 note
            
            // Oscillator 2: Gentle resonant shimmer (Detuned fifth)
            const osc2 = audioCtx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(165, audioCtx.currentTime); // E3 note
            osc2.detune.setValueAtTime(4, audioCtx.currentTime); // Slight chorus detune
            
            // Filter: Filter out harsh highs for creamy sound
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, audioCtx.currentTime);
            
            // Gain (Volume) node
            const mainGain = audioCtx.createGain();
            mainGain.gain.setValueAtTime(0, audioCtx.currentTime); // Start silent
            
            // Modulation: Subtle vibrato like swirling liquid
            const lfo = audioCtx.createOscillator();
            lfo.frequency.setValueAtTime(0.3, audioCtx.currentTime); // Slow 0.3Hz
            const lfoGain = audioCtx.createGain();
            lfoGain.gain.setValueAtTime(10, audioCtx.currentTime); // 10Hz pitch variance
            
            // Connect LFO modulation
            lfo.connect(lfoGain);
            lfoGain.connect(osc1.frequency);
            
            // Connect audio graph
            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(mainGain);
            mainGain.connect(audioCtx.destination);
            
            // Start Oscillators
            osc1.start();
            osc2.start();
            lfo.start();
            
            // Save references for toggle/control
            synthNodes = { osc1, osc2, filter, mainGain, lfo };
        } catch (e) {
            console.warn('Web Audio API is not supported in this browser.', e);
        }
    }

    function toggleSound() {
        if (!audioCtx) {
            initAmbientSynth();
        }
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const gainNode = synthNodes.mainGain;
        
        if (isPlaying) {
            // Fade out
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
            soundToggleBtn.classList.add('muted');
            isPlaying = false;
        } else {
            // Fade in (very soft volume to blend with ambient feel)
            gainNode.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.5);
            soundToggleBtn.classList.remove('muted');
            isPlaying = true;
        }
    }

    soundToggleBtn.addEventListener('click', toggleSound);
    // Initialize with muted state
    soundToggleBtn.classList.add('muted');

    // ---------------------------------------------------------
    // 8. CUSTOM CURSOR MOTION & GLOW DAMPING
    // ---------------------------------------------------------
    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let currentX = cursorX;
    let currentY = cursorY;

    window.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        
        // Instant cursor dot reposition
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
    });

    // Custom cursor glow damping animation loop
    function updateCursorGlow() {
        const ease = 0.15; // Glow catch-up factor
        currentX += (cursorX - currentX) * ease;
        currentY += (cursorY - currentY) * ease;
        
        cursorGlow.style.left = currentX + 'px';
        cursorGlow.style.top = currentY + 'px';
        
        requestAnimationFrame(updateCursorGlow);
    }
    updateCursorGlow();

    // Toggle cursor scale on hoverable elements
    const hoverables = 'a, button, .btn-primary, .btn-secondary, .pill, .info-card, .sound-toggle';
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(hoverables)) {
            document.body.classList.add('hovering');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(hoverables)) {
            document.body.classList.remove('hovering');
        }
    });

    // Header compression scroll listener
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.main-header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ---------------------------------------------------------
    // 9. START PRELOAD PROCESS
    // ---------------------------------------------------------
    preloadImages();
});
