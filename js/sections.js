// Renders every data-driven section from data/*.json.
import { $, el, icon, safeUrl, shortHash, copyText, toast, reducedMotion, formatDate } from './util.js';

/* ------------------------------------------------------------------ hero */
export function renderHero(profile) {
    if (profile.shortName) $('#hero-name').textContent = profile.shortName;
    if (profile.description) $('#hero-desc').textContent = profile.description;
    if (profile.status) $('#hero-status').textContent = profile.status;
    if (profile.resume) $('#hero-resume').setAttribute('href', safeUrl(profile.resume));

    const meta = $('#hero-meta');
    meta.replaceChildren();
    const facts = [
        ['loc', profile.location],
        ['cgpa', profile.facts?.cgpa],
        ['focus', (profile.facts?.focus || []).join(' · ')],
    ];
    for (const [key, value] of facts) {
        if (value === undefined || value === '') continue;
        meta.append(el('li', {}, el('span', { class: 'tk-key' }, `${key}:`), el('b', {}, String(value))));
    }
    $('#year').textContent = new Date().getFullYear();
}

/* ----------------------------------------------------------------- about */
const HIGHLIGHT_WORDS = [
    'Java', 'Kotlin', 'C\\+\\+', 'Python', 'MySQL', 'Git', 'Artificial Intelligence', '3\\.9117 CGPA',
];
const HIGHLIGHT_RE = new RegExp(`(?<!\\w)(${HIGHLIGHT_WORDS.join('|')})(?![\\w+])`, 'g');

/** Wrap known keywords in <span class="hl"> using text nodes only. */
function highlighted(text) {
    const parts = String(text).split(HIGHLIGHT_RE);
    return parts.map((part, i) => (i % 2 === 1 ? el('span', { class: 'hl' }, part) : part));
}

export function renderAbout(profile) {
    const about = profile.about || {};
    const box = $('#about-text');
    box.replaceChildren(
        ...[about.intro, about.interests, about.goal]
            .filter(Boolean)
            .map((p) => el('p', {}, highlighted(p))),
    );

    // profile.ts code card
    const t = (cls, text) => el('span', { class: cls }, text);
    const str = (s) => t('tk-str', JSON.stringify(s));
    const arr = (items) => [t('tk-punc', '['), ...items.flatMap((s, i) => (i ? [t('tk-punc', ', '), str(s)] : [str(s)])), t('tk-punc', ']')];
    const prop = (key, valueNodes) => [`  `, t('tk-key', key), t('tk-punc', ': '), ...[].concat(valueNodes), t('tk-punc', ',')];

    const languages = (profile.skills || []).find((g) => g.category === 'languages')?.items || [];
    const lines = [
        [t('tk-com', '// profile.ts: generated from data/profile.json')],
        [t('tk-kw', 'interface '), t('tk-type', 'Developer'), t('tk-punc', ' { '), t('tk-key', 'curious'), t('tk-punc', ': '), t('tk-kw', 'true'), t('tk-punc', ' }')],
        ['\u00a0'],
        [t('tk-kw', 'export const '), t('tk-fn', 'me'), t('tk-punc', ': '), t('tk-type', 'Developer'), t('tk-punc', ' = {')],
        prop('name', str(profile.name)),
        prop('handle', str(`@${profile.handle || profile.contact?.github || ''}`)),
        prop('role', str(profile.title)),
        profile.location && prop('location', str(profile.location)),
        profile.facts?.education && prop('education', str(profile.facts.education)),
        profile.facts?.cgpa !== undefined && prop('cgpa', t('tk-num', String(profile.facts.cgpa))),
        profile.facts?.focus && prop('focus', arr(profile.facts.focus)),
        languages.length && prop('languages', arr(languages)),
        prop('curious', t('tk-kw', 'true')),
        [t('tk-punc', '};')],
        ['\u00a0'],
        [t('tk-fn', 'me'), t('tk-punc', '.'), t('tk-fn', 'build'), t('tk-punc', '('), t('tk-key', 'ideas'), t('tk-punc', ').'), t('tk-fn', 'ship'), t('tk-punc', '();'), t('tk-com', ' // repeat')],
    ].filter(Boolean);

    $('#profile-code').replaceChildren(...lines.map((parts) => el('span', { class: 'ln' }, parts)));
}

/* ---------------------------------------------------------------- skills */
export function renderSkills(profile) {
    const box = $('#skills');
    box.replaceChildren(
        ...(profile.skills || []).map((group, i) =>
            el('div', { class: 'skill-group', 'data-reveal': true, 'data-spotlight': true, style: { '--delay': `${i * 0.07}s` } },
                el('h3', {}, el('span', { class: 'tk-kw' }, 'skills'), '.', el('span', { class: 'tk-key' }, group.category)),
                el('div', { class: 'pills' }, (group.items || []).map((item) => el('span', { class: 'pill' }, item))),
            ),
        ),
    );
}

/* -------------------------------------------------------------- projects */
export function renderProjects(projects) {
    const grid = $('#projects-grid');
    const sorted = [...projects].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));

    grid.replaceChildren(
        ...sorted.map((p, i) => {
            const slug = p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const searchText = [p.title, p.description, ...(p.tags || []), ...(p.categories || [])].join(' ').toLowerCase();
            return el('article', {
                class: 'project',
                'data-reveal': true,
                'data-spotlight': true,
                'data-tilt': true,
                'data-categories': (p.categories || []).join('|'),
                'data-search': searchText,
                style: { '--delay': `${(i % 3) * 0.08}s` },
            },
                el('div', { class: 'project-media' },
                    p.featured && el('span', { class: 'project-badge' }, '★ featured'),
                    p.image
                        ? el('img', { src: encodeURI(p.image), alt: `Screenshot of ${p.title}`, loading: 'lazy', decoding: 'async', width: 640, height: 400 })
                        : el('div', { class: 'project-art', 'aria-hidden': 'true' }, el('span', { class: 'project-art-name' }, slug), el('span', { class: 'project-art-lang' }, (p.tags || [])[0] || '')),
                ),
                el('div', { class: 'project-body' },
                    el('p', { class: 'project-path' }, `~/projects/${slug}`),
                    el('h3', { class: 'project-title' }, p.title),
                    el('p', { class: 'project-desc' }, p.description),
                    el('div', { class: 'tags' }, (p.tags || []).map((tag) => el('span', { class: 'tag' }, tag))),
                    p.github && el('a', { class: 'project-link', href: safeUrl(p.github), target: '_blank', rel: 'noopener noreferrer', 'aria-label': `View ${p.title} source on GitHub` },
                        icon('github'), 'view source', icon('external')),
                ),
            );
        }),
    );

    setupProjectFilters(projects);
}

const filterState = { category: 'All', query: '' };

function setupProjectFilters(projects) {
    const counts = new Map();
    for (const p of projects) for (const c of p.categories || []) counts.set(c, (counts.get(c) || 0) + 1);
    const categories = ['All', ...[...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c]) => c)];

    const bar = $('#project-filters');
    bar.replaceChildren(
        ...categories.map((cat) =>
            el('button', {
                class: 'chip', type: 'button', 'data-category': cat,
                'aria-pressed': String(cat === filterState.category),
                onclick: () => filterProjects({ category: cat }),
            }, cat, el('span', { class: 'chip-count' }, cat === 'All' ? projects.length : counts.get(cat))),
        ),
    );

    const search = $('#project-search');
    let t;
    search.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => filterProjects({ query: search.value }), 120);
    });
}

/** Public: used by the chips, the grep box, the terminal and the palette. */
export function filterProjects({ category, query } = {}) {
    if (category !== undefined) filterState.category = category;
    if (query !== undefined) filterState.query = query.trim().toLowerCase();

    document.querySelectorAll('#project-filters .chip').forEach((chip) => {
        chip.setAttribute('aria-pressed', String(chip.dataset.category === filterState.category));
    });

    const cards = Array.from(document.querySelectorAll('#projects-grid .project'));
    const gsap = window.gsap;
    const Flip = window.Flip;
    const animate = gsap && Flip && !reducedMotion();
    const state = animate ? Flip.getState(cards) : null;

    let visible = 0;
    for (const card of cards) {
        const inCategory = filterState.category === 'All' || card.dataset.categories.split('|').includes(filterState.category);
        const terms = filterState.query.split(/\s+/).filter(Boolean);
        const matches = terms.every((term) => card.dataset.search.includes(term));
        const show = inCategory && matches;
        card.hidden = !show;
        card.style.transform = '';
        card.classList.add('in'); // never leave a filtered-in card stuck in its pre-reveal state
        if (show) visible++;
    }
    $('#projects-empty').hidden = visible !== 0;

    if (animate) {
        Flip.from(state, {
            duration: 0.55,
            ease: 'power3.inOut',
            scale: true,
            absolute: true,
            nested: true,
            onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }),
            onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.3 }),
            onComplete: () => window.ScrollTrigger?.refresh(),
        });
    }
    return visible;
}

/* ------------------------------------------------------------ experience */
export function renderExperience(entries) {
    const list = $('#gitlog');
    list.replaceChildren(
        ...entries.map((item, i) => {
            const type = item.type === 'work' ? 'work' : 'education';
            return el('li', { class: 'commit', 'data-type': type, 'data-reveal': true },
                el('span', { class: 'commit-node', 'aria-hidden': 'true' }),
                el('article', { class: 'commit-card', 'data-spotlight': true },
                    el('div', { class: 'commit-head' },
                        el('span', { class: 'commit-hash' }, `commit ${shortHash(item.title + item.date)}`),
                        i === 0 && el('span', { class: 'ref ref-head' }, 'HEAD → main'),
                        el('span', { class: `ref ${type === 'work' ? 'ref-work' : 'ref-edu'}` }, type),
                        el('span', { class: 'commit-date' }, item.date),
                    ),
                    el('h3', { class: 'commit-title' }, item.title),
                    el('p', { class: 'commit-org' }, item.company),
                    el('p', { class: 'commit-desc' }, item.description),
                ),
            );
        }),
    );
}

/* ------------------------------------------------------------------ blog */
export function renderPosts(posts) {
    const box = $('#posts');
    const sorted = [...posts].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (!sorted.length) {
        box.replaceChildren(el('p', { class: 'empty-state' }, 'No posts yet. ', el('code', {}, 'touch posts/first.md'), ' coming soon.'));
        return;
    }
    box.replaceChildren(
        ...sorted.map((post, i) =>
            el('article', { class: 'post-card', 'data-reveal': true, 'data-spotlight': true, style: { '--delay': `${i * 0.08}s` } },
                el('div', { class: 'post-meta' },
                    el('time', { datetime: post.date }, formatDate(post.date)),
                    post.minutes && el('span', {}, `${post.minutes} min read`),
                ),
                el('h3', { class: 'post-title' }, post.title),
                el('p', { class: 'post-summary' }, post.summary),
                el('div', { class: 'tags' }, (post.tags || []).map((tag) => el('span', { class: 'tag' }, `#${tag}`))),
                el('a', { class: 'post-read', href: `post.html?slug=${encodeURIComponent(post.slug)}` }, 'cat post.md ', icon('arrow')),
            ),
        ),
    );
}

/* --------------------------------------------------------------- contact */
export function renderContact(profile) {
    const c = profile.contact || {};
    const mail = $('#contact-mail');
    if (c.email) mail.setAttribute('href', `mailto:${c.email}`);

    const copyBtn = (value, label) =>
        el('button', {
            class: 'copy-btn', type: 'button', 'aria-label': `Copy ${label}`,
            onclick: async () => toast((await copyText(value)) ? `${label} copied to clipboard` : `Copy failed: ${value}`),
        }, icon('copy'), 'copy');

    const line = (key, value, href, extra) =>
        el('div', { class: 'c-line' },
            el('span', { class: 'c-key' }, key),
            el('span', { class: 'c-arrow', 'aria-hidden': 'true' }, '→'),
            href
                ? el('a', { class: 'c-val', href: safeUrl(href), ...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }, value)
                : el('span', { class: 'c-val' }, value),
            extra,
        );

    $('#contact-lines').replaceChildren(
        el('div', { class: 'c-line c-comment' }, '#!/usr/bin/env bash'),
        el('div', { class: 'c-line c-comment' }, '# any of these will reach me'),
        el('div', { class: 'c-line' }, ' '),
        c.email && line('email', c.email, `mailto:${c.email}`, copyBtn(c.email, 'Email')),
        c.github && line('github', `github.com/${c.github}`, `https://github.com/${c.github}`),
        c.linkedin && line('linkedin', `in/${c.linkedin}`, `https://www.linkedin.com/in/${c.linkedin}`),
        c.phone && line('phone', c.phone, `tel:${c.phone.replace(/[^0-9+]/g, '')}`),
        profile.resume && line('resume', profile.resume.split('/').pop(), profile.resume),
        el('div', { class: 'c-line' }, ' '),
        el('div', { class: 'c-line c-run' }, '$ ./contact.sh --say-hello', el('span', { class: 'type-caret', 'aria-hidden': 'true' })),
    );
}
