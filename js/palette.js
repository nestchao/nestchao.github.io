// Command palette (Ctrl/⌘ + K): fuzzy search over sections, actions,
// projects and blog posts.
import { $, el, icon, safeUrl, scrollToSection, copyText, toast } from './util.js';
import { toggleTheme, getTheme } from './theme.js';

/** Subsequence fuzzy match → score (higher is better) or -1. */
function fuzzy(query, text) {
    if (!query) return 0;
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    const idx = t.indexOf(q);
    if (idx !== -1) return 100 - idx;
    let ti = 0; let score = 0; let streak = 0;
    for (const ch of q) {
        const found = t.indexOf(ch, ti);
        if (found === -1) return -1;
        streak = found === ti ? streak + 1 : 0;
        score += 1 + streak;
        ti = found + 1;
    }
    return score;
}

export function initPalette({ profile, projects, posts }) {
    const root = $('#palette');
    const input = $('#palette-input');
    const list = $('#palette-list');
    const opener = $('#palette-open');
    if (!root || !input || !list) return;

    const contact = profile?.contact || {};
    const open = (url) => window.open(safeUrl(url), '_blank', 'noopener');

    const items = [
        ...[
            ['about', 'About me', 'about.ts'],
            ['github', 'GitHub stats', 'stats.json'],
            ['projects', 'Projects', 'projects/'],
            ['experience', 'Experience', 'git log'],
            ['blog', 'Blog', 'blog/'],
            ['contact', 'Contact', 'contact.sh'],
        ].map(([id, label, hint]) => ({ group: 'Go to', label, hint, icon: 'arrow', run: () => scrollToSection(id) })),
        { group: 'Actions', label: 'Toggle light / dark theme', hint: () => `now: ${getTheme()}`, icon: 'sun', run: toggleTheme },
        contact.email && {
            group: 'Actions', label: 'Copy email address', hint: contact.email, icon: 'copy',
            run: async () => toast((await copyText(contact.email)) ? 'Email copied to clipboard' : contact.email),
        },
        { group: 'Actions', label: 'Open résumé (PDF)', hint: 'resume.pdf', icon: 'download', run: () => open(profile?.resume || 'assets/resume.pdf') },
        {
            group: 'Actions', label: 'Focus the terminal', hint: 'type help', icon: 'terminal',
            run: () => { scrollToSection('home'); setTimeout(() => $('#terminal-input')?.focus({ preventScroll: true }), 400); },
        },
        contact.github && { group: 'Links', label: 'GitHub profile', hint: `@${contact.github}`, icon: 'github', run: () => open(`https://github.com/${contact.github}`) },
        contact.linkedin && { group: 'Links', label: 'LinkedIn', hint: 'linkedin.com', icon: 'linkedin', run: () => open(`https://www.linkedin.com/in/${contact.linkedin}`) },
        ...(projects || []).map((p) => ({ group: 'Projects', label: p.title, hint: (p.tags || []).slice(0, 2).join(' · '), icon: 'github', keywords: (p.tags || []).join(' '), run: () => open(p.github) })),
        ...(posts || []).map((p) => ({ group: 'Blog', label: p.title, hint: p.date, icon: 'file', keywords: (p.tags || []).join(' '), run: () => { location.href = `post.html?slug=${encodeURIComponent(p.slug)}`; } })),
    ].filter(Boolean);

    let results = [];
    let selected = 0;
    let lastFocus = null;

    function render() {
        const q = input.value.trim();
        results = items
            .map((item) => ({ item, score: Math.max(fuzzy(q, item.label), fuzzy(q, `${item.group} ${item.keywords || ''}`) - 5) }))
            .filter((r) => r.score >= 0)
            .sort((a, b) => (q ? b.score - a.score : 0))
            .map((r) => r.item);
        selected = Math.min(selected, Math.max(0, results.length - 1));

        const nodes = [];
        let group = null;
        results.forEach((item, i) => {
            if (!q && item.group !== group) {
                group = item.group;
                nodes.push(el('li', { class: 'palette-group', role: 'presentation' }, group));
            }
            const hint = typeof item.hint === 'function' ? item.hint() : item.hint;
            nodes.push(el('li', {
                class: 'palette-item', role: 'option', id: `pal-${i}`,
                'aria-selected': String(i === selected),
                onclick: () => choose(i),
                onpointermove: () => { if (selected !== i) { selected = i; updateSelection(); } },
            }, icon(item.icon), el('span', {}, item.label), hint && el('small', {}, hint)));
        });
        if (!results.length) nodes.push(el('li', { class: 'palette-empty' }, `No results for "${q}"`));
        list.replaceChildren(...nodes);
        input.setAttribute('aria-activedescendant', results.length ? `pal-${selected}` : '');
    }

    function updateSelection() {
        list.querySelectorAll('.palette-item').forEach((node) => {
            const on = node.id === `pal-${selected}`;
            node.setAttribute('aria-selected', String(on));
            if (on) node.scrollIntoView({ block: 'nearest' });
        });
        input.setAttribute('aria-activedescendant', `pal-${selected}`);
    }

    function choose(i) {
        const item = results[i];
        if (!item) return;
        close();
        item.run();
    }

    function openPalette() {
        if (!root.hidden) return;
        lastFocus = document.activeElement;
        root.hidden = false;
        input.value = '';
        selected = 0;
        render();
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => input.focus());
    }

    function close() {
        if (root.hidden) return;
        root.hidden = true;
        document.body.style.overflow = '';
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    }

    opener?.addEventListener('click', openPalette);
    root.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    input.addEventListener('input', () => { selected = 0; render(); });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); selected = (selected + 1) % Math.max(1, results.length); updateSelection(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); selected = (selected - 1 + results.length) % Math.max(1, results.length); updateSelection(); }
        else if (e.key === 'Enter') { e.preventDefault(); choose(selected); }
        else if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'Tab') { e.preventDefault(); } // keep focus trapped in the dialog
    });

    document.addEventListener('keydown', (e) => {
        const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (root.hidden) openPalette(); else close();
        } else if (e.key === '/' && !typing && root.hidden) {
            e.preventDefault();
            openPalette();
        }
    });

    // Show the right shortcut on Apple devices
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
        const kbd = $('.kbd-hint');
        if (kbd) kbd.textContent = '⌘K';
    }
}
