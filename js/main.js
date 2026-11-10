// Entry point: load data, render sections, then wire up interactivity.
import { fetchJSON } from './util.js';
import { initTheme } from './theme.js';
import { renderHero, renderAbout, renderSkills, renderProjects, renderExperience, renderPosts, renderContact } from './sections.js';
import { initTerminal } from './terminal.js';
import { initGitHub } from './github.js';
import { initPalette } from './palette.js';
import { initFx } from './fx.js';

if (window.gsap) {
    const plugins = [window.ScrollTrigger, window.Flip, window.ScrambleTextPlugin].filter(Boolean);
    window.gsap.registerPlugin(...plugins);
} else {
    // No animation library: show everything in its final state.
    document.documentElement.classList.remove('motion');
}

initTheme();

const load = (url, fallback) => fetchJSON(url).catch((err) => {
    console.warn('[data]', err.message);
    return fallback;
});

const [profile, projects, experience, posts] = await Promise.all([
    load('data/profile.json', {}),
    load('data/projects.json', []),
    load('data/experience.json', []),
    load('data/posts.json', []),
]);
posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));

renderHero(profile);
renderAbout(profile);
renderSkills(profile);
renderProjects(projects);
renderExperience(experience);
renderPosts(posts);
renderContact(profile);

initFx({ roles: profile.roles || [profile.title].filter(Boolean) });
initTerminal({ profile, projects, experience, posts });
initPalette({ profile, projects, posts });
initGitHub(profile.contact?.github || 'nestchao');
