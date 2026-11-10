// Light/dark theme. The initial value is set by the inline script in <head>
// (stored choice, else the OS preference) so there is no flash on load.
const root = document.documentElement;
const listeners = new Set();

export const getTheme = () => (root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

export function setTheme(theme, { persist = true } = {}) {
    const next = theme === 'light' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'light' ? '#f5f6f8' : '#0a0d12');
    if (persist) {
        try { localStorage.setItem('theme', next); } catch { /* storage unavailable */ }
    }
    listeners.forEach((fn) => fn(next));
    return next;
}

export const toggleTheme = () => setTheme(getTheme() === 'light' ? 'dark' : 'light');
export const onThemeChange = (fn) => listeners.add(fn);

export function initTheme() {
    // Stored as a raw string so the inline <head> script can read it directly.
    setTheme(getTheme(), { persist: false });

    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

    // Follow OS changes until the visitor picks a theme explicitly.
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        let explicit = null;
        try { explicit = localStorage.getItem('theme'); } catch { /* ignore */ }
        if (!explicit) setTheme(e.matches ? 'light' : 'dark', { persist: false });
    });
}
