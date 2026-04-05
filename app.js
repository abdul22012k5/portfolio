'use strict';

/* ============================================================
   1. CIRCUIT BOARD CANVAS BACKGROUND
   ============================================================ */
(function initCircuit() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const W = window.innerWidth, H = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 90;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    // PCB nodes
    const COLS = 16, ROWS = 10, SX = 180, SY = 110;
    const nodeGeo = new THREE.CircleGeometry(0.55, 8);
    const nodes = [];

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = -SX / 2 + (c / (COLS - 1)) * SX + (Math.random() - 0.5) * 8;
            const y = -SY / 2 + (r / (ROWS - 1)) * SY + (Math.random() - 0.5) * 6;
            const mat = new THREE.MeshBasicMaterial({ color: 0x00C8FF, transparent: true, opacity: 0.2 + Math.random() * 0.3 });
            const mesh = new THREE.Mesh(nodeGeo, mat);
            mesh.position.set(x, y, 0);
            scene.add(mesh);
            nodes.push({ mesh, x, y, r, c });
        }
    }

    // Traces
    const traces = [];
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00C8FF, transparent: true, opacity: 0.1 });

    for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (a.c < COLS - 1 && Math.random() > 0.25) {
            const b = nodes[i + 1];
            const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x, a.y, 0), new THREE.Vector3(b.x, b.y, 0)]);
            const line = new THREE.Line(g, lineMat.clone());
            scene.add(line);
            traces.push({ line, a, b });
        }
        if (a.r < ROWS - 1 && Math.random() > 0.4) {
            const b = nodes[i + COLS];
            const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x, a.y, 0), new THREE.Vector3(b.x, b.y, 0)]);
            const line = new THREE.Line(g, lineMat.clone());
            scene.add(line);
            traces.push({ line, a, b });
        }
    }

    // Signal pulses
    const pulseGeo = new THREE.SphereGeometry(1.1, 8, 8);
    const pulses = [];
    for (let i = 0; i < 16; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: 0x00C8FF, transparent: true, opacity: 0 });
        const mesh = new THREE.Mesh(pulseGeo, mat);
        const trace = traces[Math.floor(Math.random() * traces.length)];
        pulses.push({ mesh, trace, t: Math.random(), speed: 0.004 + Math.random() * 0.008 });
        scene.add(mesh);
    }

    // Stars
    const starPos = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
        starPos[i * 3]     = (Math.random() - 0.5) * 320;
        starPos[i * 3 + 1] = (Math.random() - 0.5) * 200;
        starPos[i * 3 + 2] = (Math.random() - 0.5) * 80 - 20;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x7C3AED, size: 0.28, transparent: true, opacity: 0.2 })));

    // Mouse parallax
    let mx = 0, my = 0;
    document.addEventListener('mousemove', e => {
        mx = (e.clientX / innerWidth  - 0.5) * 2;
        my = (e.clientY / innerHeight - 0.5) * 2;
    });

    let frame = 0, animId;
    function tick() {
        animId = requestAnimationFrame(tick);
        frame++;
        scene.rotation.z = Math.sin(frame * 0.001) * 0.035;
        camera.position.x += (mx * 4 - camera.position.x) * 0.03;
        camera.position.y += (-my * 2.5 - camera.position.y) * 0.03;

        pulses.forEach(p => {
            p.t += p.speed;
            if (p.t > 1) { p.t = 0; p.trace = traces[Math.floor(Math.random() * traces.length)]; }
            const { a, b } = p.trace;
            p.mesh.position.set(a.x + (b.x - a.x) * p.t, a.y + (b.y - a.y) * p.t, 1);
            const f = Math.sin(p.t * Math.PI);
            p.mesh.material.opacity = f * 0.8;
            p.mesh.scale.setScalar(0.4 + f * 0.8);
        });

        if (frame % 5 === 0) {
            nodes.forEach(n => { if (Math.random() > 0.97) n.mesh.material.opacity = 0.1 + Math.random() * 0.6; });
        }

        renderer.render(scene, camera);
    }
    tick();

    window.addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    });

    const hero = document.getElementById('hero');
    new IntersectionObserver(e => {
        if (e[0].isIntersecting) { if (!animId) tick(); }
        else { cancelAnimationFrame(animId); animId = null; }
    }, { threshold: 0 }).observe(hero);
})();


/* ============================================================
   2. NAVBAR
   ============================================================ */
const navbar   = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const drawer   = document.getElementById('nav-drawer');

// Scroll → add class
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', scrollY > 50);
    updateActiveLink();
});

// Hamburger toggle
hamburger.addEventListener('click', () => {
    const open = drawer.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
    const [s1, s2, s3] = hamburger.querySelectorAll('span');
    s1.style.transform = open ? 'rotate(45deg) translate(5px,5px)' : '';
    s2.style.opacity   = open ? '0' : '';
    s3.style.transform = open ? 'rotate(-45deg) translate(5px,-5px)' : '';
});

// Close drawer on link click
drawer.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', closeDrawer);
});

// Close drawer on outside tap
document.addEventListener('click', e => {
    if (!drawer.contains(e.target) && !hamburger.contains(e.target)) closeDrawer();
});

function closeDrawer() {
    drawer.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
}

function updateActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(s => { if (scrollY >= s.offsetTop - 130) current = s.id; });

    // Desktop nav
    document.querySelectorAll('#nav-links .nav-link').forEach(l => {
        l.classList.toggle('active-link', l.getAttribute('href') === `#${current}`);
    });
    // Drawer links
    drawer.querySelectorAll('.drawer-link').forEach(l => {
        l.classList.toggle('active-link', l.getAttribute('href') === `#${current}`);
    });
}


/* ============================================================
   3. TYPEWRITER
   ============================================================ */
(function typewriter() {
    const el = document.getElementById('typewriter');
    if (!el) return;
    const words = [
        'Embedded Systems Dev 🔧',
        'IoT Engineer 🌐',
        'PCB Designer ⚙️',
        'Automotive Tech Enthusiast 🚗',
        'Edge AI Explorer 🤖',
        'B.Tech ECE Student 🎓',
    ];
    let wi = 0, ci = 0, del = false;
    function type() {
        const cur = words[wi];
        if (!del) {
            el.textContent = cur.slice(0, ++ci);
            if (ci === cur.length) { del = true; setTimeout(type, 2200); return; }
        } else {
            el.textContent = cur.slice(0, --ci);
            if (ci === 0) { del = false; wi = (wi + 1) % words.length; }
        }
        setTimeout(type, del ? 55 : 90);
    }
    setTimeout(type, 900);
})();


/* ============================================================
   4. STAT COUNTERS
   ============================================================ */
function runCounters() {
    document.querySelectorAll('.stat-num[data-target]').forEach(el => {
        const target = +el.dataset.target;
        let cur = 0;
        const step = target / 50;
        const timer = setInterval(() => {
            cur += step;
            if (cur >= target) { el.textContent = target + '+'; clearInterval(timer); }
            else el.textContent = Math.floor(cur);
        }, 30);
    });
}

let counted = false;
new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !counted) { counted = true; setTimeout(runCounters, 600); }
}, { threshold: 0.4 }).observe(document.getElementById('hero'));


/* ============================================================
   5. SCROLL REVEAL
   ============================================================ */
const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

[
    ...document.querySelectorAll('.about-visual, .about-text-side'),
    ...document.querySelectorAll('.section-header'),
    ...document.querySelectorAll('.ach-card'),
    ...document.querySelectorAll('.cert-card'),
    ...document.querySelectorAll('.edu-card'),
    ...document.querySelectorAll('.skills-header-centered, .skills-pills-wrap'),
    ...document.querySelectorAll('.contact-header-centered, .contact-pills-wrap'),
].forEach(el => { el.classList.add('reveal'); revealObs.observe(el); });





/* ============================================================
   7. PROJECT FILTERS
   ============================================================ */
document.querySelectorAll('.f-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.f-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.proj-card').forEach(card => {
            card.classList.toggle('hidden', filter !== 'all' && card.dataset.filter !== filter);
        });
    });
});


/* ============================================================
   8. TIMELINE ANIMATION
   ============================================================ */
const tlObs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
        if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add('visible'), i * 180);
            tlObs.unobserve(e.target);
        }
    });
}, { threshold: 0.2 });
document.querySelectorAll('.tl-item').forEach(el => tlObs.observe(el));


/* ============================================================
   9. ABOUT IMAGE 3D TILT (Desktop only)
   ============================================================ */
(function tilt() {
    const wrap = document.getElementById('about-image-3d');
    if (!wrap || window.matchMedia('(pointer:coarse)').matches) return;
    wrap.addEventListener('mousemove', e => {
        const r = wrap.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        wrap.style.transform = `perspective(800px) rotateY(${x * 16}deg) rotateX(${-y * 16}deg) scale(1.02)`;
    });
    wrap.addEventListener('mouseleave', () => { wrap.style.transform = ''; });
})();


/* ============================================================
   11. SMOOTH SCROLL
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        window.scrollTo({ top: target.offsetTop - 72, behavior: 'smooth' });
    });
});


/* ============================================================
   12. PROGRESS BAR
   ============================================================ */
(function progressBar() {
    const bar = document.createElement('div');
    bar.style.cssText = `position:fixed;top:0;left:0;height:2px;width:0%;background:linear-gradient(90deg,#00C8FF,#7C3AED);z-index:9999;transition:width 0.3s ease;border-radius:0 2px 2px 0;`;
    document.body.appendChild(bar);
    window.addEventListener('scroll', () => {
        const pct = scrollY / (document.documentElement.scrollHeight - innerHeight) * 100;
        bar.style.width = Math.min(pct, 100) + '%';
    });
})();


/* ============================================================
   13. CURSOR GLOW (Desktop only)
   ============================================================ */
(function cursor() {
    if (window.matchMedia('(pointer:coarse)').matches) return;
    const g = document.createElement('div');
    g.style.cssText = `position:fixed;pointer-events:none;z-index:9998;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(0,200,255,0.055) 0%,transparent 70%);transform:translate(-50%,-50%);transition:left 0.1s ease,top 0.1s ease;left:-400px;top:-400px;`;
    document.body.appendChild(g);
    document.addEventListener('mousemove', e => { g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; });
})();


/* ============================================================
   14. PROFILE IMAGE FALLBACK
   ============================================================ */
['profile-img', 'profile-img-hero'].forEach(id => {
    const img = document.getElementById(id);
    if (!img) return;
    img.addEventListener('error', () => {
        img.src = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="533" viewBox="0 0 400 533">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#04091A"/>
      <stop offset="100%" style="stop-color:#0C1428"/>
    </linearGradient>
    <linearGradient id="acc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00C8FF"/>
      <stop offset="100%" style="stop-color:#7C3AED"/>
    </linearGradient>
  </defs>
  <rect width="400" height="533" fill="url(#bg)"/>
  <circle cx="200" cy="185" r="90" fill="url(#acc)" opacity="0.9"/>
  <circle cx="200" cy="175" r="55" fill="#04091A" opacity="0.9"/>
  <circle cx="200" cy="168" r="38" fill="url(#acc)" opacity="0.85"/>
  <ellipse cx="200" cy="420" rx="115" ry="95" fill="url(#acc)" opacity="0.7"/>
  <text x="200" y="505" font-family="Space Grotesk,sans-serif" font-size="18" fill="#E2E8F6" text-anchor="middle" font-weight="700">Abdul Rahiman</text>
  <text x="200" y="524" font-family="Space Grotesk,sans-serif" font-size="13" fill="#00C8FF" text-anchor="middle">B.Tech ECE · GMRIT</text>
</svg>`)}`;
    });
});

/* ============================================================
   15. THEME TOGGLER
   ============================================================ */
(function themeToggle() {
    const themes = ['default', 'light', 'dark'];
    let currentThemeIndex = 0;
    
    const savedTheme = localStorage.getItem('portfolio-theme');
    if (savedTheme && themes.includes(savedTheme)) {
        currentThemeIndex = themes.indexOf(savedTheme);
        applyTheme(savedTheme);
    }
    
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentThemeIndex = (currentThemeIndex + 1) % themes.length;
            const newTheme = themes[currentThemeIndex];
            applyTheme(newTheme);
            localStorage.setItem('portfolio-theme', newTheme);
        });
    });

    function applyTheme(theme) {
        document.body.classList.remove('theme-light', 'theme-dark');
        if (theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
        
        const iconClasses = {
            'default': 'fa-circle-half-stroke',
            'light': 'fa-sun',
            'dark': 'fa-moon'
        };
        
        document.querySelectorAll('.theme-toggle-btn i').forEach(icon => {
            icon.className = `fa-solid ${iconClasses[theme]}`;
        });
    }
})();
 
/* ============================================================
    16. PROTOTYPE MODAL LOGIC
    ============================================================ */
(function initModal() {
    const modal    = document.getElementById('prototype-modal');
    const modalImg = document.getElementById('modal-img');
    const closeBtn = modal?.querySelector('.modal-close');
    const overlay  = modal?.querySelector('.modal-overlay');

    if (!modal || !modalImg) return;

    document.querySelectorAll('.p-btn-prototype').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const imgSrc = btn.dataset.prototype;
            if (imgSrc) {
                modalImg.src = imgSrc;
                modal.classList.add('open');
                modal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden'; // Prevent scroll
            }
        });
    });

    const closeModal = () => {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // Optional: clear src after animation
        setTimeout(() => { 
            if (!modal.classList.contains('open')) modalImg.src = ''; 
        }, 400);
    };

    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', closeModal);
    
    // Close on Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
})();

