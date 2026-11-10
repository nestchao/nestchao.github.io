// Small shared helpers. Everything that touches data from JSON goes through
// el()/text nodes, so no data string is ever parsed as HTML.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const reducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Create an element.
 * el('a', { class: 'x', href: '#', onclick: fn }, 'text', otherNode)
 * Attribute values are set via setAttribute / properties, never innerHTML.
 */
export function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
        if (value === undefined || value === null || value === false) continue;
        if (key === 'class') node.className = value;
        else if (key === 'style' && typeof value === 'object') {
            for (const [prop, v] of Object.entries(value)) {
                if (prop.startsWith('--')) node.style.setProperty(prop, v);
                else node.style[prop] = v;
            }
        }
        else if (key === 'dataset') Object.assign(node.dataset, value);
        else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
        else if (value === true) node.setAttribute(key, '');
        else node.setAttribute(key, String(value));
    }
    append(node, children);
    return node;
}

function append(node, children) {
    for (const child of children.flat(Infinity)) {
        if (child === undefined || child === null || child === false) continue;
        node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
}

const SVG_NS = 'http://www.w3.org/2000/svg';
/** <svg class="icon"><use href="#i-name"/></svg> from the sprite in index.html */
export function icon(name, cls = 'icon') {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', cls);
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
}

export async function fetchJSON(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return res.json();
}

/** localStorage wrapper that never throws (private mode, blocked storage…) */
export const store = {
    get(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch { return fallback; }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
    },
};

/** Only allow http(s)/mailto/tel and relative URLs into href attributes. */
export function safeUrl(url) {
    const value = String(url || '').trim();
    if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return '#';
    return value;
}

/** Short deterministic hex "commit hash" for a string. */
export function shortHash(input) {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

let toastTimer;
export function toast(message) {
    const node = $('#toast');
    if (!node) return;
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 2200);
}

export async function copyText(value) {
    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch {
        // Fallback for browsers without async clipboard permission
        const area = el('textarea', { style: { position: 'fixed', opacity: '0' } }, value);
        document.body.append(area);
        area.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        area.remove();
        return ok;
    }
}

export function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return false;
    target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
    return true;
}

export function relativeTime(dateString) {
    const then = new Date(dateString).getTime();
    if (Number.isNaN(then)) return '';
    const diff = (Date.now() - then) / 1000;
    const units = [
        ['year', 31536000], ['month', 2592000], ['week', 604800],
        ['day', 86400], ['hour', 3600], ['minute', 60],
    ];
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    for (const [unit, secs] of units) {
        if (Math.abs(diff) >= secs) return rtf.format(-Math.round(diff / secs), unit);
    }
    return 'just now';
}

export function formatDate(dateString) {
    const d = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
}

// GitHub linguist-ish colours for common languages
export const LANG_COLORS = {
    Java: '#b07219', Kotlin: '#A97BFF', Python: '#3572A5', 'C++': '#f34b7d',
    C: '#555555', 'C#': '#178600', Dart: '#00B4AB', JavaScript: '#f1e05a',
    TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#663399', Shell: '#89e051',
    PowerShell: '#012456', Go: '#00ADD8', Rust: '#dea584', Swift: '#F05138',
    PHP: '#4F5D95', Ruby: '#701516', 'Jupyter Notebook': '#DA5B0B', Vue: '#41b883',
};
export const langColor = (lang) => LANG_COLORS[lang] || 'var(--faint)';
