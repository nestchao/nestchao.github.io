// Motion and micro-interactions: scroll reveals, hero intro, text scramble,
// role typing, card tilt/spotlight, magnetic buttons, the hero canvas and
// the nav/status-bar scroll tracking. Everything degrades to static content
// when GSAP is missing or the visitor prefers reduced motion.
import { $, $$, reducedMotion } from './util.js';
import { onThemeChange } from './theme.js';

const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ------------------------------------------------------------ reveals */
let revealObserver;
export function observeReveals(root = document) {
    const targets = $$('[data-reveal]:not([data-reveal-bound])', root);
    if (!document.documentElement.classList.contains('motion') || !('IntersectionObserver' in window)) {
        targets.forEach((t) => t.classList.add('in'));
        return;
    }
    revealObserver ||= new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const target = entry.target;
            target.classList.add('in');
            revealObserver.unobserve(target);
            // Drop the stagger delay once revealed so hover/tilt transitions stay instant.
            target.addEventListener('transitionend', () => { target.style.transitionDelay = '0s'; }, { once: true });
        }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    for (const t of targets) {
        t.setAttribute('data-reveal-bound', '');
        revealObserver.observe(t);
    }
}

/* --------------------------------------------------------- hero intro */
function heroIntro() {
    const gsap = window.gsap;
    if (!gsap || reducedMotion()) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });
    tl.from('.hero .eyebrow', { y: 16, opacity: 0 })
        .from('.hero-hello', { y: 16, opacity: 0 }, '-=0.7')
        .from('.hero-name-text', { y: 30, opacity: 0, duration: 1 }, '-=0.7')
        .from(['.hero-role', '.hero-desc', '.hero-cta', '.hero-meta'], { y: 18, opacity: 0, stagger: 0.08 }, '-=0.7')
        .from('#terminal', { y: 40, opacity: 0, scale: 0.97, duration: 1.1 }, 0.25)
        .from('.topbar', { y: -20, opacity: 0, duration: 0.7 }, 0);

    const name = $('#hero-name');
    if (window.ScrambleTextPlugin && name) {
        tl.to(name, { duration: 1.2, scrambleText: { text: name.textContent, chars: '01<>/{}#_*', speed: 0.6, revealDelay: 0.25 } }, 0.2);
    }
}

/* ------------------------------------------------------ section titles */
function scrambleTitles() {
    const gsap = window.gsap;
    if (!gsap || !window.ScrambleTextPlugin || !window.ScrollTrigger || reducedMotion()) return;
    for (const title of $$('[data-scramble]')) {
        const text = title.textContent;
        gsap.to(title, {
            duration: 1,
            scrambleText: { text, chars: 'abcdefghijklmnopqrstuvwxyz01<>/{}_', speed: 0.5 },
            scrollTrigger: { trigger: title, start: 'top 85%', once: true },
        });
    }
}

/* -------------------------------------------------------- role typing */
function roleTyper(roles) {
    const node = $('#hero-role');
    if (!node || !roles?.length) return;
    node.textContent = roles[0];
    if (reducedMotion() || roles.length < 2) return;

    let i = 0;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    (async function loop() {
        await sleep(2600);
        for (;;) {
            const current = roles[i];
            for (let n = current.length; n >= 0; n--) { node.textContent = current.slice(0, n); await sleep(28); }
            i = (i + 1) % roles.length;
            const next = roles[i];
            await sleep(250);
            for (let n = 1; n <= next.length; n++) { node.textContent = next.slice(0, n); await sleep(55 + Math.random() * 45); }
            await sleep(2400);
        }
    })();
}

/* ----------------------------------- spotlight, tilt & magnetic buttons */
function pointerEffects() {
    if (!finePointer()) return;
    const motion = !reducedMotion();
    let tilted = null;
    let magnet = null;

    const resetTilt = () => { if (tilted) { tilted.style.transform = ''; tilted = null; } };
    const resetMagnet = () => { if (magnet) { magnet.style.transform = ''; magnet = null; } };

    document.addEventListener('pointermove', (e) => {
        const spot = e.target.closest?.('[data-spotlight]');
        if (spot) {
            const r = spot.getBoundingClientRect();
            spot.style.setProperty('--mx', `${e.clientX - r.left}px`);
            spot.style.setProperty('--my', `${e.clientY - r.top}px`);
        }
        if (!motion) return;

        const tilt = e.target.closest?.('[data-tilt]');
        if (tilt !== tilted) resetTilt();
        if (tilt && !tilt.hidden) {
            tilted = tilt;
            const r = tilt.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            tilt.style.transform = `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-4px)`;
        }

        const mag = e.target.closest?.('[data-magnetic]');
        if (mag !== magnet) resetMagnet();
        if (mag) {
            magnet = mag;
            const r = mag.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            mag.style.transform = `translate(${dx * 0.18}px, ${dy * 0.28}px)`;
        }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { resetTilt(); resetMagnet(); });
}

/* --------------------------------------------------- git log rail draw */
function gitRail() {
    const gsap = window.gsap;
    const fill = $('.gitlog-rail-fill');
    if (!fill || !gsap || !window.ScrollTrigger || reducedMotion()) return;
    gsap.fromTo(fill, { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.gitlog-wrap', start: 'top 75%', end: 'bottom 60%', scrub: 0.6 },
    });
}

/* --------------------- nav: active tab, progress bar, status bar, menu */
function navTracking() {
    const topbar = $('#topbar');
    const tabs = $('#tabs');
    const indicator = $('.tab-indicator');
    const progress = $('.scroll-progress');
    const statusSection = $('#status-section');
    const statusPos = $('#status-pos');
    const tabLinks = $$('.tab', tabs);

    function moveIndicator(active) {
        if (!indicator) return;
        if (!active || getComputedStyle(indicator).display === 'none') {
            indicator.style.setProperty('--o', '0');
            return;
        }
        indicator.style.setProperty('--x', `${active.offsetLeft}px`);
        indicator.style.setProperty('--w', `${active.offsetWidth}px`);
        indicator.style.setProperty('--o', '1');
    }

    let current = null;
    function setActive(id) {
        if (id === current) return;
        current = id;
        let active = null;
        for (const link of tabLinks) {
            const on = link.dataset.section === id;
            link.classList.toggle('active', on);
            if (on) { active = link; link.setAttribute('aria-current', 'true'); } else link.removeAttribute('aria-current');
        }
        moveIndicator(active);
        const section = document.getElementById(id);
        if (statusSection && section) statusSection.textContent = id === 'home' ? '~/home' : `~/${section.dataset.sectionName || id}`;
    }

    const sections = $$('main > section[id]');
    const io = new IntersectionObserver((entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));

    let ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const max = document.documentElement.scrollHeight - innerHeight;
            const p = max > 0 ? Math.min(1, scrollY / max) : 0;
            progress?.style.setProperty('--progress', p.toFixed(4));
            topbar?.classList.toggle('scrolled', scrollY > 8);
            if (statusPos) statusPos.textContent = `Ln ${Math.round(scrollY / 24) + 1}, Col ${Math.round(p * 100) + 1}`;
            ticking = false;
        });
    }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', () => {
        moveIndicator(tabLinks.find((l) => l.classList.contains('active')));
    });
    onScroll();

    // Mobile drawer
    const toggle = $('#menu-toggle');
    const setOpen = (open) => {
        document.body.classList.toggle('menu-open', open);
        toggle?.setAttribute('aria-expanded', String(open));
        toggle?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle?.addEventListener('click', () => setOpen(!document.body.classList.contains('menu-open')));
    tabLinks.forEach((l) => l.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

/* ------------------------------------------------------- hero canvas */
const GLYPHS = ['{ }', '=>', '</>', 'fn', '0x1F', '&&', '::', '[ ]', '#', '//', 'λ', '++', '!=', '01', 'git', 'val', 'def', 'int', '$', '*', 'O(n)', '>>'];

function heroCanvas() {
    const canvas = $('#hero-canvas');
    const hero = $('#home');
    if (!canvas || !hero || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const still = reducedMotion();
    const SPACING = 30;

    let w = 0; let h = 0; let dpr = 1;
    let glyphs = [];
    let colors = readColors();
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    let running = false;
    let raf = 0;

    function readColors() {
        const cs = getComputedStyle(document.documentElement);
        return {
            dot: cs.getPropertyValue('--grid-dot').trim() || 'rgba(255,255,255,.06)',
            accent: cs.getPropertyValue('--accent-rgb').trim() || '61,220,151',
        };
    }

    function resize() {
        dpr = Math.min(2, window.devicePixelRatio || 1);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.max(10, Math.min(36, Math.round((w * h) / 42000)));
        glyphs = Array.from({ length: count }, () => spawn(true));
        if (still) draw(0);
    }

    function spawn(anywhere) {
        return {
            x: Math.random() * w,
            y: anywhere ? Math.random() * h : h + 20,
            vy: 0.12 + Math.random() * 0.32,
            a: 0.06 + Math.random() * 0.16,
            size: 11 + Math.round(Math.random() * 4),
            text: GLYPHS[(Math.random() * GLYPHS.length) | 0],
        };
    }

    function draw(t) {
        ctx.clearRect(0, 0, w, h);
        pointer.x += (pointer.tx - pointer.x) * 0.12;
        pointer.y += (pointer.ty - pointer.y) * 0.12;

        // dot grid with a pointer-following glow
        const R = 150;
        for (let y = SPACING / 2; y < h; y += SPACING) {
            for (let x = SPACING / 2; x < w; x += SPACING) {
                const dx = x - pointer.x;
                const dy = y - pointer.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < R * R) {
                    const k = 1 - Math.sqrt(d2) / R;
                    ctx.fillStyle = `rgba(${colors.accent}, ${0.15 + k * 0.6})`;
                    ctx.beginPath();
                    ctx.arc(x, y, 1 + k * 1.6, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = colors.dot;
                    ctx.fillRect(x - 1, y - 1, 2, 2);
                }
            }
        }

        // drifting code glyphs
        ctx.textAlign = 'center';
        for (const g of glyphs) {
            if (!still) {
                g.y -= g.vy;
                if (g.y < -20) Object.assign(g, spawn(false));
            }
            const wobble = still ? 0 : Math.sin((t / 1000) + g.x) * 0.02;
            ctx.font = `${g.size}px "JetBrains Mono", monospace`;
            ctx.fillStyle = `rgba(${colors.accent}, ${Math.max(0, g.a + wobble)})`;
            ctx.fillText(g.text, g.x, g.y);
        }
    }

    function frame(t) {
        draw(t);
        if (running) raf = requestAnimationFrame(frame);
    }
    function start() {
        if (running || still) return;
        running = true;
        raf = requestAnimationFrame(frame);
    }
    function stop() {
        running = false;
        cancelAnimationFrame(raf);
    }

    resize();
    addEventListener('resize', resize);
    hero.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        pointer.tx = e.clientX - r.left;
        pointer.ty = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { pointer.tx = -9999; pointer.ty = -9999; });

    onThemeChange(() => {
        colors = readColors();
        if (still) draw(0);
    });

    if (still) return;
    let visible = true;
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden) start(); else stop();
    }).observe(hero);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else if (visible) start();
    });
    start();
}

/* -------------------------------------------------------------- init */
export function initFx({ roles } = {}) {
    navTracking();
    roleTyper(roles);
    pointerEffects();
    heroCanvas();
    observeReveals();
    heroIntro();
    scrambleTitles();
    gitRail();
    window.ScrollTrigger?.refresh();
}
