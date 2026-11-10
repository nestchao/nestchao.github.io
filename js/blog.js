// Blog post reader for post.html?slug=…
// Only slugs listed in data/posts.json are fetched; Markdown is rendered by
// marked and sanitised by DOMPurify before it touches the DOM.
import { $, el, icon, fetchJSON, formatDate } from './util.js';
import { initTheme } from './theme.js';

function notFound(slug) {
    document.title = 'Post not found · nestchao';
    $('#post').replaceChildren(
        el('div', { class: 'post-header' },
            el('p', { class: 'section-index' }, '404'),
            el('h1', {}, 'cat: no such post'),
            el('p', { class: 't-muted' }, slug ? `"${slug}" isn't in data/posts.json.` : 'No post was specified.'),
        ),
        el('a', { class: 'btn btn-primary', href: 'index.html#blog' }, icon('arrow'), 'back to all posts'),
    );
}

async function renderPost() {
    const slug = new URLSearchParams(location.search).get('slug') || '';
    let posts = [];
    try { posts = await fetchJSON('data/posts.json'); } catch (err) { console.warn(err); }
    posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const index = posts.findIndex((p) => p.slug === slug);
    const post = posts[index];
    if (!post) return notFound(slug);

    let markdown = '';
    try {
        const res = await fetch(`posts/${encodeURIComponent(post.slug)}.md`, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        markdown = await res.text();
    } catch (err) {
        console.warn(err);
        return notFound(slug);
    }

    // Strip a leading "# Title" line: the title comes from posts.json.
    markdown = markdown.replace(/^\s*#\s+.*\n/, '');
    const words = markdown.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 220));

    const html = window.DOMPurify.sanitize(window.marked.parse(markdown, { gfm: true }));
    const prose = el('div', { class: 'prose' });
    prose.innerHTML = html; // sanitised above
    prose.querySelectorAll('a[href^="http"]').forEach((a) => { a.target = '_blank'; a.rel = 'noopener noreferrer'; });
    if (window.hljs) prose.querySelectorAll('pre code').forEach((block) => window.hljs.highlightElement(block));

    document.title = `${post.title} · nestchao`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', post.summary || post.title);

    const newer = posts[index - 1];
    const older = posts[index + 1];
    $('#post').replaceChildren(
        el('header', { class: 'post-header' },
            el('div', { class: 'post-meta' },
                el('time', { datetime: post.date }, formatDate(post.date)),
                el('span', {}, `${minutes} min read`),
            ),
            el('h1', {}, post.title),
            el('div', { class: 'tags' }, (post.tags || []).map((t) => el('span', { class: 'tag' }, `#${t}`))),
        ),
        prose,
        el('nav', { class: 'post-nav', 'aria-label': 'More posts' },
            older ? el('a', { href: `post.html?slug=${encodeURIComponent(older.slug)}` }, `← ${older.title}`) : el('span'),
            newer ? el('a', { href: `post.html?slug=${encodeURIComponent(newer.slug)}` }, `${newer.title} →`) : el('a', { href: 'index.html#blog' }, 'all posts →'),
        ),
    );
}

initTheme();
document.getElementById('year').textContent = new Date().getFullYear();
renderPost();
