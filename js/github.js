// Live GitHub stats from the public REST API (no token; 60 req/h per IP).
// Responses are cached for an hour in localStorage to stay well under the limit.
import { $, el, icon, store, langColor, relativeTime, reducedMotion, safeUrl } from './util.js';

const CACHE_TTL = 60 * 60 * 1000;
const API = 'https://api.github.com';

let cachedStats = null;
export const getGitHubStats = () => cachedStats;

async function fetchStats(user) {
    const key = `gh:${user}`;
    const cached = store.get(key);
    if (cached && Date.now() - cached.t < CACHE_TTL) return cached.data;

    const opts = { headers: { Accept: 'application/vnd.github+json' } };
    const [userRes, reposRes] = await Promise.all([
        fetch(`${API}/users/${encodeURIComponent(user)}`, opts),
        fetch(`${API}/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`, opts),
    ]);
    if (!userRes.ok || !reposRes.ok) throw new Error(`GitHub API: HTTP ${userRes.status}/${reposRes.status}`);
    const [profile, repos] = await Promise.all([userRes.json(), reposRes.json()]);

    const own = repos.filter((r) => !r.fork);
    const stars = own.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    const forks = own.reduce((sum, r) => sum + (r.forks_count || 0), 0);

    const langCounts = {};
    for (const r of own) if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    const total = Object.values(langCounts).reduce((a, b) => a + b, 0) || 1;
    const sortedLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);
    const top = sortedLangs.slice(0, 6).map(([name, count]) => ({ name, pct: (count / total) * 100 }));
    const restCount = sortedLangs.slice(6).reduce((sum, [, c]) => sum + c, 0);
    if (restCount) top.push({ name: 'Other', pct: (restCount / total) * 100 });

    const data = {
        repos: profile.public_repos ?? own.length,
        followers: profile.followers ?? 0,
        stars,
        forks,
        since: profile.created_at ? new Date(profile.created_at).getFullYear() : null,
        url: profile.html_url || `https://github.com/${user}`,
        languages: top,
        recent: own.slice(0, 4).map((r) => ({
            name: r.name,
            url: r.html_url,
            description: r.description || '',
            language: r.language,
            stars: r.stargazers_count || 0,
            pushed: r.pushed_at,
        })),
    };
    store.set(key, { t: Date.now(), data });
    return data;
}

function countUp(node, target) {
    const gsap = window.gsap;
    if (!gsap || reducedMotion()) { node.textContent = target; return; }
    const obj = { v: 0 };
    gsap.to(obj, {
        v: target,
        duration: 1.6,
        ease: 'power3.out',
        onUpdate: () => { node.textContent = Math.round(obj.v); },
        scrollTrigger: window.ScrollTrigger ? { trigger: node, start: 'top 90%', once: true } : undefined,
    });
}

function render(data, user) {
    const stats = [
        ['repos', data.repos, 'file', 'public repos'],
        ['stars', data.stars, 'star', 'stars earned'],
        ['followers', data.followers, 'github', 'followers'],
        ['since', data.since ?? '-', 'branch', 'coding on GitHub since'],
    ];
    $('#gh-stats').replaceChildren(
        ...stats.map(([key, value, ic, label]) => {
            const valueNode = el('span', { class: 'stat-value' }, key === 'since' ? String(value) : '0');
            const card = el('div', { class: 'stat', 'data-spotlight': true }, valueNode, el('span', { class: 'stat-label' }, icon(ic), label));
            if (key !== 'since') countUp(valueNode, Number(value) || 0);
            return card;
        }),
    );

    const langsPanel = $('#gh-langs');
    const bar = el('div', { class: 'lang-bar', role: 'img', 'aria-label': `Languages: ${data.languages.map((l) => `${l.name} ${l.pct.toFixed(0)}%`).join(', ')}` },
        data.languages.map((l) => el('span', { style: { width: `${l.pct}%`, '--c': langColor(l.name) } })),
    );
    langsPanel.replaceChildren(
        el('h3', { class: 'panel-title' }, '// top languages (by repo)'),
        bar,
        el('ul', { class: 'lang-list' },
            data.languages.map((l) => el('li', {}, el('i', { style: { '--c': langColor(l.name) } }), l.name, el('span', { class: 'pct' }, `${l.pct.toFixed(1)}%`))),
        ),
    );
    const gsap = window.gsap;
    if (gsap && !reducedMotion()) {
        gsap.from(bar.children, {
            scaleX: 0, duration: 1, ease: 'power3.out', stagger: 0.08,
            scrollTrigger: window.ScrollTrigger ? { trigger: bar, start: 'top 90%', once: true } : undefined,
        });
    }

    $('#gh-repos').replaceChildren(
        el('h3', { class: 'panel-title' }, '// recently pushed'),
        el('ul', { class: 'repo-list' },
            data.recent.map((r) =>
                el('li', {},
                    el('a', { class: 'repo', href: safeUrl(r.url), target: '_blank', rel: 'noopener noreferrer' },
                        el('span', { class: 'repo-name' }, icon('file'), r.name),
                        r.description && el('p', { class: 'repo-desc' }, r.description),
                        el('span', { class: 'repo-meta' },
                            r.language && el('span', {}, el('i', { style: { '--c': langColor(r.language) } }), r.language),
                            el('span', {}, icon('star'), String(r.stars)),
                            r.pushed && el('span', {}, `updated ${relativeTime(r.pushed)}`),
                        ),
                    ),
                ),
            ),
        ),
        el('p', { class: 'gh-note' }, 'source: ', el('a', { href: safeUrl(data.url), target: '_blank', rel: 'noopener noreferrer', class: 't-cyan' }, `api.github.com/users/${user}`)),
    );
}

function renderError(user) {
    const gh = $('#gh');
    gh.replaceChildren(
        el('div', { class: 'gh-error', role: 'status' },
            el('p', { style: { margin: 0 } }, el('span', { class: 't-red' }, 'error: '), 'the GitHub API is unavailable right now (rate limit or network).'),
            el('p', { style: { margin: '8px 0 0' } }, '$ open ', el('a', { href: `https://github.com/${encodeURIComponent(user)}`, target: '_blank', rel: 'noopener noreferrer' }, `github.com/${user}`)),
        ),
    );
}

export async function initGitHub(user) {
    const gh = $('#gh');
    try {
        const data = await fetchStats(user);
        cachedStats = data;
        render(data, user);
    } catch (err) {
        console.warn('[github]', err.message);
        renderError(user);
    } finally {
        gh.setAttribute('aria-busy', 'false');
    }
}
