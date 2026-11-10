# nestchao.github.io

Personal portfolio of **Imam Mahdi Ali Ang Attuko** ([@nestchao](https://github.com/nestchao)), a terminal/IDE-themed site with an interactive hero terminal, live GitHub stats, filterable projects, a `git log` timeline and a Markdown blog.

Plain HTML, CSS and JavaScript (ES modules). **No build step**: GitHub Pages serves the files exactly as they are in this repo.

## Features

- **Interactive terminal**: types an intro, then accepts commands (`help`, `projects`, `open 1`, `grep kotlin`, `skills`, `cd contact`, `theme light`, `sudo hire-me`…). Supports Tab completion and ↑/↓ history.
- **Command palette**: `Ctrl K` / `⌘K` (or `/`) to jump anywhere, copy your email, toggle the theme or open a project.
- **Live GitHub stats**: repos, stars, followers, top languages and recently pushed repos from the public GitHub API, cached for an hour, with a fallback message if the API is rate-limited.
- **Projects**: category filter chips with animated re-layout (GSAP Flip) and a `grep` search box. Cards have a 3D tilt and a cursor spotlight.
- **Experience as `git log`**: the timeline rail draws itself as you scroll.
- **Blog**: Markdown posts rendered with marked, sanitised with DOMPurify, highlighted with highlight.js.
- **Light/dark theme**: follows the OS preference and remembers the visitor's choice.
- **Accessible**: keyboard navigable, visible focus rings, and `prefers-reduced-motion` turns all animation off.

## Editing content

All the text lives in `data/`, so you rarely need to touch HTML:

| File | Contents |
| --- | --- |
| `data/profile.json` | name, rotating `roles`, status line, bio (`about`), `facts`, `skills`, contact links, résumé path |
| `data/projects.json` | project cards: `title`, `description`, `github`, `tags`, `categories` (drive the filter chips), `featured`, and an optional `image` (projects without one get a generated placeholder) |
| `data/experience.json` | timeline entries: `date`, `type` (`education` or `work`), `title`, `company`, `description` |
| `data/posts.json` | blog index: `slug`, `title`, `date` (YYYY-MM-DD), `summary`, `tags`, `minutes` |

### Adding a blog post

1. Write `posts/<slug>.md` in Markdown (code fences get syntax highlighting).
2. Add an entry with the same `slug` to `data/posts.json`.
3. Commit and push. It appears in the blog section and at `post.html?slug=<slug>`.

## Running locally

The site loads JSON with `fetch`, so open it through a local server rather than double-clicking `index.html`:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000. On Windows you can also run `run.bat`.

## Project structure

```
index.html          single-page portfolio
post.html           blog post reader
css/tokens.css      colour/spacing tokens (dark + light themes)
css/main.css        all component styles
js/main.js          entry point: loads data, renders, wires interactions
js/sections.js      renders about, skills, projects (+ filters), git log, blog list, contact
js/terminal.js      the interactive terminal (add commands to the `commands` table)
js/github.js        GitHub API stats
js/palette.js       Ctrl/⌘K command palette
js/fx.js            animations, hero canvas, scroll tracking
js/theme.js         light/dark theme
js/blog.js          blog post page
js/util.js          DOM and misc helpers
data/               content (JSON)
posts/              blog posts (Markdown)
assets/             screenshots and résumé
vendor/             third-party libraries (see below)
```

## Third-party libraries

Vendored in `vendor/` so the site doesn't depend on a CDN:

- [GSAP 3.13](https://gsap.com) with ScrollTrigger, Flip and ScrambleText ([standard "no charge" license](https://gsap.com/standard-license))
- [marked 15](https://marked.js.org) (MIT)
- [DOMPurify 3](https://github.com/cure53/DOMPurify) (Apache-2.0 / MPL-2.0)
- [highlight.js 11](https://highlightjs.org) (BSD-3-Clause)

Fonts: Inter and JetBrains Mono from Google Fonts.

Design inspired by open-source terminal portfolios such as [rishmi5h/terminal](https://github.com/rishmi5h/terminal) and [Kielx/terminal-portfolio](https://github.com/Kielx/terminal-portfolio). The code here is original.
