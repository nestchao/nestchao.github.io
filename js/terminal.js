// Interactive hero terminal: an intro sequence that types itself, then a live
// prompt with commands, history (↑/↓) and Tab completion.
import { el, safeUrl, scrollToSection, copyText, reducedMotion } from './util.js';
import { setTheme, toggleTheme } from './theme.js';
import { filterProjects } from './sections.js';
import { getGitHubStats } from './github.js';

const BANNER = String.raw`
             _      _
 _ _  ___ __| |_ __| |_  __ _ ___
| ' \/ -_|_-<  _/ _| ' \/ _' / _ \
|_||_\___/__/\__\__|_||_\__,_\___/`;

const SECTIONS = ['home', 'about', 'github', 'projects', 'experience', 'blog', 'contact'];
const FILES = ['about.md', 'skills.json', 'projects/', 'experience.log', 'blog/', 'contact.sh', 'resume.pdf'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function initTerminal(ctx) {
    const body = document.getElementById('terminal-body');
    const out = document.getElementById('terminal-output');
    const form = document.getElementById('terminal-form');
    const input = document.getElementById('terminal-input');
    if (!body || !out || !form || !input) return null;

    const { profile, projects, experience, posts } = ctx;
    const contact = profile.contact || {};
    const history = [];
    let historyIndex = 0;
    let introRunning = false;
    let skipIntro = reducedMotion();

    /* ---------- output helpers ---------- */
    const span = (cls, text) => el('span', { class: cls }, text);
    const link = (text, href, cls = '') =>
        el('a', { href: safeUrl(href), class: cls, ...(String(href).startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }, text);
    const action = (text, fn) =>
        el('a', { href: '#', onclick: (e) => { e.preventDefault(); fn(); } }, text);

    const scrollDown = () => { body.scrollTop = body.scrollHeight; };
    function print(...parts) {
        const line = el('div', { class: 't-line' }, parts.length ? parts : ' ');
        out.append(line);
        scrollDown();
        return line;
    }
    const blank = () => print();

    const promptNode = () =>
        el('span', { class: 'prompt' },
            span('p-user', 'visitor'), span('p-at', '@'), span('p-host', 'nestchao'), span('p-path', ':~'), span('p-sign', '$'));

    function echo(cmd) {
        const typed = span('t-typed', cmd);
        print(promptNode(), typed).classList.add('t-cmd');
        return typed;
    }

    /* ---------- commands ---------- */
    const goto = (id) => {
        scrollToSection(id);
        return print(span('t-dim', `→ jumped to #${id}`));
    };
    const jumpHint = (id, label = id) => print(span('t-dim', '→ '), action(`open ${label} section`, () => scrollToSection(id)));

    const commands = {
        help: {
            desc: 'list available commands',
            run() {
                const rows = Object.entries(commands).filter(([, c]) => !c.hidden);
                print(span('t-muted', 'Available commands:'));
                const grid = el('div', { class: 't-grid' });
                for (const [name, c] of rows) grid.append(span('t-accent', name + (c.args ? ` ${c.args}` : '')), span('t-muted', c.desc));
                print(grid);
                print(span('t-dim', 'Tip: Tab completes, ↑/↓ browse history, Ctrl+L clears. Ctrl+K opens the command palette.'));
            },
        },
        whoami: {
            desc: 'who is this?',
            run() {
                print(span('t-strong', profile.name), span('t-muted', ` · ${profile.title}`));
                if (profile.location) print(span('t-dim', `${profile.location} · `), span('t-accent', profile.status || ''));
            },
        },
        about: {
            desc: 'a short bio',
            run() {
                print(profile.description || '');
                if (profile.about?.interests) print(span('t-muted', profile.about.interests));
                jumpHint('about', 'about.ts');
            },
        },
        skills: {
            desc: 'languages, frameworks & tools',
            run() {
                const grid = el('div', { class: 't-grid' });
                for (const g of profile.skills || []) grid.append(span('t-cyan', g.category), span('', (g.items || []).join(', ')));
                print(grid);
            },
        },
        projects: {
            desc: 'list my projects',
            run() {
                projects.forEach((p, i) => {
                    print(span('t-yellow', `[${i + 1}] `), span('t-strong', p.title), p.featured ? span('t-accent', ' ★') : '');
                    print(span('t-dim', `    ${(p.tags || []).join(' · ')}`));
                });
                print(span('t-dim', 'Run '), span('t-accent', 'open <n>'), span('t-dim', ' to view the source, or '), span('t-accent', 'grep <term>'), span('t-dim', ' to filter.'));
            },
        },
        open: {
            desc: 'open a project on GitHub',
            args: '<n>',
            complete: () => projects.map((_, i) => String(i + 1)),
            run([n]) {
                const p = projects[Number(n) - 1];
                if (!p) return print(span('t-red', `open: no project #${n || '?'}. Try `), span('t-accent', 'projects'));
                print(span('t-muted', 'opening '), link(p.github, p.github));
                window.open(safeUrl(p.github), '_blank', 'noopener');
            },
        },
        grep: {
            desc: 'search projects',
            args: '<term>',
            run(args) {
                const term = args.join(' ').trim();
                if (!term) return print(span('t-red', 'usage: grep <term>'));
                const hits = projects
                    .map((p, i) => ({ p, i }))
                    .filter(({ p }) => [p.title, p.description, ...(p.tags || []), ...(p.categories || [])].join(' ').toLowerCase().includes(term.toLowerCase()));
                if (!hits.length) return print(span('t-dim', `(no matches for "${term}")`));
                hits.forEach(({ p, i }) => print(span('t-yellow', `[${i + 1}] `), p.title));
                const search = document.getElementById('project-search');
                if (search) search.value = term;
                filterProjects({ category: 'All', query: term });
                jumpHint('projects', 'filtered projects');
            },
        },
        experience: {
            desc: 'education & work, as a git log',
            run() {
                for (const e of experience) {
                    print(span('t-yellow', `* ${e.date.padEnd(22)}`), span('t-strong', e.title));
                    print(span('t-dim', `  ${e.company}`));
                }
                jumpHint('experience', 'git log');
            },
        },
        blog: {
            desc: 'latest posts',
            run() {
                if (!posts.length) return print(span('t-dim', 'No posts yet.'));
                for (const p of posts) print(span('t-dim', `${p.date}  `), link(p.title, `post.html?slug=${encodeURIComponent(p.slug)}`));
            },
        },
        github: {
            desc: 'live GitHub stats',
            run() {
                const s = getGitHubStats();
                if (!s) {
                    print(span('t-muted', 'stats are loading or unavailable. Profile: '), link(`github.com/${contact.github}`, `https://github.com/${contact.github}`));
                    return;
                }
                print(span('t-cyan', 'repos     '), String(s.repos));
                print(span('t-cyan', 'stars     '), String(s.stars));
                print(span('t-cyan', 'followers '), String(s.followers));
                print(span('t-cyan', 'languages '), s.languages.map((l) => l.name).join(', '));
                jumpHint('github', 'stats');
            },
        },
        contact: {
            desc: 'ways to reach me',
            run() {
                if (contact.email) print(span('t-cyan', 'email    '), link(contact.email, `mailto:${contact.email}`));
                if (contact.github) print(span('t-cyan', 'github   '), link(`github.com/${contact.github}`, `https://github.com/${contact.github}`));
                if (contact.linkedin) print(span('t-cyan', 'linkedin '), link(`in/${contact.linkedin}`, `https://www.linkedin.com/in/${contact.linkedin}`));
                print(span('t-dim', 'Run '), span('t-accent', 'email'), span('t-dim', ' to copy my address.'));
            },
        },
        email: {
            desc: 'copy my email address',
            async run() {
                if (!contact.email) return print(span('t-red', 'no email configured'));
                const ok = await copyText(contact.email);
                print(ok ? span('t-accent', `✓ copied ${contact.email}`) : span('t-muted', contact.email));
            },
        },
        resume: {
            desc: 'open my résumé (PDF)',
            run() {
                const url = profile.resume || 'assets/resume.pdf';
                print(span('t-muted', 'opening '), link('resume.pdf', url));
                window.open(safeUrl(url), '_blank', 'noopener');
            },
        },
        theme: {
            desc: 'switch colour theme',
            args: '[light|dark]',
            complete: () => ['light', 'dark'],
            run([mode]) {
                const next = mode === 'light' || mode === 'dark' ? setTheme(mode) : toggleTheme();
                print(span('t-muted', 'theme set to '), span('t-accent', next));
            },
        },
        cd: {
            desc: 'jump to a section',
            args: '<section>',
            complete: () => SECTIONS,
            run([target = '~']) {
                const id = target.replace(/^[~./]+/, '').replace(/\/$/, '') || 'home';
                const alias = { stats: 'github', log: 'experience', projects: 'projects' }[id] || id;
                if (!SECTIONS.includes(alias)) return print(span('t-red', `cd: no such section: ${target}`));
                goto(alias);
            },
        },
        ls: {
            desc: 'list files',
            run([dir]) {
                if (dir && /^projects\/?$/.test(dir)) {
                    return print(...projects.map((p) => span('t-yellow t-item', p.slug || p.title)));
                }
                print(...FILES.map((f) => span(`t-item ${f.endsWith('/') ? 't-cyan' : f.endsWith('.sh') ? 't-accent' : ''}`, f)));
            },
            complete: () => ['projects/'],
        },
        cat: {
            desc: 'print a file',
            args: '<file>',
            complete: () => FILES.filter((f) => !f.endsWith('/')),
            run([file]) {
                switch (file) {
                    case 'about.md': return commands.about.run([]);
                    case 'skills.json': {
                        const obj = Object.fromEntries((profile.skills || []).map((g) => [g.category, g.items]));
                        return print(span('t-muted', JSON.stringify(obj, null, 2)));
                    }
                    case 'experience.log': return commands.experience.run([]);
                    case 'contact.sh': return commands.contact.run([]);
                    case 'resume.pdf': return print(span('t-dim', 'binary file. Try '), span('t-accent', 'resume'));
                    case undefined: return print(span('t-red', 'usage: cat <file>'));
                    default: return print(span('t-red', `cat: ${file}: No such file or directory`));
                }
            },
        },
        clear: { desc: 'clear the screen', run() { out.replaceChildren(); } },
        history: {
            desc: 'show command history',
            run() { history.forEach((h, i) => print(span('t-dim', String(i + 1).padStart(3) + '  '), h)); },
        },
        banner: { desc: 'print the banner', hidden: true, run() { print(el('div', { class: 't-ascii' }, BANNER)); } },
        echo: { desc: 'print text', hidden: true, run(args) { print(args.join(' ')); } },
        pwd: { desc: 'print working directory', hidden: true, run() { print(`/home/visitor/${location.hostname || 'nestchao.github.io'}`); } },
        date: { desc: 'print the date', hidden: true, run() { print(new Date().toString()); } },
        palette: {
            desc: 'open the command palette',
            hidden: true,
            run() { document.getElementById('palette-open')?.click(); },
        },
        sudo: {
            desc: 'with great power…',
            hidden: true,
            async run(args) {
                const what = args.join(' ');
                print(span('t-muted', '[sudo] password for visitor: '), span('t-dim', '********'));
                await sleep(skipIntro ? 0 : 450);
                if (what === 'hire-me' || what === 'hire me') {
                    print(span('t-accent', '✓ permission granted.'), ' Excellent decision.');
                    if (contact.email) print(span('t-muted', 'Opening a draft to '), link(contact.email, `mailto:${contact.email}?subject=${encodeURIComponent("Let's work together")}`));
                } else {
                    print(span('t-red', 'visitor is not in the sudoers file. This incident will be reported.'));
                    print(span('t-dim', 'hint: try '), span('t-accent', 'sudo hire-me'));
                }
            },
        },
        'rm': { desc: '', hidden: true, run() { print(span('t-red', 'rm: permission denied. Nice try, though.')); } },
        exit: { desc: '', hidden: true, run() { print(span('t-muted', "There's no escape. Try "), span('t-accent', 'help'), span('t-muted', '.')); } },
        vim: { desc: '', hidden: true, run() { print(span('t-muted', 'Entering vim… just kidding. Nobody would ever get out.')); } },
    };
    // aliases
    commands.ll = { ...commands.ls, hidden: true };
    commands.cls = { ...commands.clear, hidden: true };
    commands['?'] = { ...commands.help, hidden: true };
    commands.goto = { ...commands.cd, hidden: true };

    async function run(raw, { record = true } = {}) {
        const line = raw.trim();
        if (!line) return;
        if (record) { history.push(line); historyIndex = history.length; }
        const [name, ...args] = line.split(/\s+/);
        const cmd = commands[name.toLowerCase()];
        if (!cmd) {
            print(span('t-red', `command not found: ${name}`), span('t-dim', '. Type '), span('t-accent', 'help'), span('t-dim', '.'));
            return;
        }
        try {
            await cmd.run(args);
        } catch (err) {
            print(span('t-red', `error: ${err.message}`));
        }
    }

    /* ---------- tab completion ---------- */
    function complete() {
        const value = input.value;
        const parts = value.split(/\s+/);
        let candidates;
        let prefix;
        if (parts.length <= 1) {
            prefix = parts[0] || '';
            candidates = Object.keys(commands).filter((c) => !commands[c].hidden || c === 'sudo');
        } else {
            const cmd = commands[parts[0].toLowerCase()];
            prefix = parts[parts.length - 1];
            candidates = cmd?.complete ? cmd.complete() : [];
        }
        const matches = candidates.filter((c) => c.startsWith(prefix.toLowerCase()));
        if (matches.length === 1) {
            parts[parts.length - 1] = matches[0];
            input.value = parts.join(' ') + (parts.length === 1 && !matches[0].endsWith('/') ? ' ' : '');
        } else if (matches.length > 1) {
            echo(value);
            print(...matches.map((m) => span('t-cyan t-item', m)));
            // extend to the common prefix
            let common = matches[0];
            for (const m of matches) while (!m.startsWith(common)) common = common.slice(0, -1);
            parts[parts.length - 1] = common;
            input.value = parts.join(' ');
        }
    }

    /* ---------- intro ---------- */
    async function typeCommand(cmd) {
        const typed = echo('');
        if (skipIntro) { typed.textContent = cmd; return; }
        for (const ch of cmd) {
            if (skipIntro) { typed.textContent = cmd; return; }
            typed.textContent += ch;
            scrollDown();
            await sleep(38 + Math.random() * 55);
        }
        await sleep(skipIntro ? 0 : 260);
    }

    async function intro() {
        introRunning = true;
        form.hidden = true;
        print(el('div', { class: 't-ascii', 'aria-hidden': 'true' }, BANNER));
        print(span('t-dim', `Welcome! Last login: ${new Date().toDateString()} from your browser`));
        blank();

        const steps = [
            ['whoami', () => commands.whoami.run([])],
            ['cat about.md --short', () => print(profile.description || '')],
            ['ls projects/', () => commands.ls.run(['projects/'])],
        ];
        for (const [cmd, fn] of steps) {
            await typeCommand(cmd);
            fn();
            blank();
            if (!skipIntro) await sleep(380);
        }
        print(span('t-muted', 'Type '), span('t-accent', 'help'), span('t-muted', ' to see what else this terminal can do, or click a command: '),
            action('projects', () => submit('projects')), ' ', action('skills', () => submit('skills')), ' ', action('contact', () => submit('contact')));
        introRunning = false;
        form.hidden = false;
        scrollDown();
    }

    function submit(value) {
        echo(value);
        return run(value).then(scrollDown);
    }

    /* ---------- events ---------- */
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = input.value;
        input.value = '';
        if (!value.trim()) { echo(''); return; }
        submit(value);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            complete();
        } else if (e.key === 'ArrowUp') {
            if (!history.length) return;
            e.preventDefault();
            historyIndex = Math.max(0, historyIndex - 1);
            input.value = history[historyIndex] || '';
            requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            historyIndex = Math.min(history.length, historyIndex + 1);
            input.value = history[historyIndex] || '';
        } else if (e.key.toLowerCase() === 'l' && e.ctrlKey) {
            e.preventDefault();
            out.replaceChildren();
        } else if (e.key.toLowerCase() === 'c' && e.ctrlKey && !window.getSelection()?.toString()) {
            e.preventDefault();
            echo(input.value + '^C');
            input.value = '';
        }
    });

    // Click anywhere in the terminal to focus the prompt (and skip the intro).
    body.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        if (window.getSelection()?.toString()) return;
        skipIntro = true;
        if (!introRunning) input.focus({ preventScroll: true });
    });

    intro().then(() => {
        if (document.activeElement === document.body && skipIntro && !reducedMotion()) input.focus({ preventScroll: true });
    });

    return { run: submit };
}
