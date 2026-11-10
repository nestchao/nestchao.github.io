# How this site works: a terminal portfolio in vanilla JS

I wanted my portfolio to feel like the place I spend most of my day: an editor and a terminal. I also wanted it to stay simple to host on GitHub Pages, so there's **no framework and no build step**. Every file you see in the repo is the file the browser runs.

## Content lives in JSON

All of the text on the home page comes from a few small files:

| File | What it holds |
| --- | --- |
| `data/profile.json` | name, roles, bio, skills, contact links |
| `data/projects.json` | project cards (title, description, screenshot, tags, categories) |
| `data/experience.json` | the `git log` timeline |
| `data/posts.json` | the list of blog posts |

Updating the site usually means editing one of those files and pushing.

## Rendering without innerHTML

The sections are built with a tiny helper that creates DOM nodes instead of concatenating HTML strings, so nothing in the data can accidentally become markup:

```javascript
export function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
        else node.setAttribute(key, value);
    }
    node.append(...children);
    return node;
}
```

## The terminal is a small command interpreter

Each command is an object with a description and a `run` function. Tab completion, history and the `help` output are all derived from that one table:

```javascript
const commands = {
    whoami: { desc: 'who is this?', run() { print(profile.name); } },
    theme:  { desc: 'switch theme', args: '[light|dark]', run([mode]) { setTheme(mode); } },
};
```

Try `sudo hire-me` in the terminal on the home page. 😉

## Motion, with an off switch

Animations use [GSAP](https://gsap.com) (ScrollTrigger for the scroll effects, Flip for the project filter, ScrambleText for the headings). If your system is set to *reduce motion*, all of it is skipped and the content renders in its final state.

## Writing a new post

1. Add a Markdown file to `posts/`, for example `posts/my-post.md`.
2. Add an entry to `data/posts.json` with the same `slug`, a `title`, `date`, `summary` and `tags`.
3. Push. The post shows up in the blog section and at `post.html?slug=my-post`.
