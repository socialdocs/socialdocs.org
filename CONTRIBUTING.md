# Contributing to SocialDocs

Thank you for helping improve ActivityPub documentation for the Fediverse community!

## Ways to Contribute

### Content Improvements
- **Fix errors** — Typos, outdated info, broken links
- **Clarify explanations** — Make concepts easier to understand
- **Add examples** — Code samples in different languages
- **Document quirks** — Platform-specific behaviors (Mastodon, Lemmy, etc.)

### New Content
- **Implementation guides** — Step-by-step tutorials
- **Platform docs** — Document Fediverse software
- **Blog posts** — Tutorials, case studies, news

### Technical
- **Improve diagrams** — SVG graphics, flowcharts
- **Accessibility** — Screen reader support, keyboard navigation
- **Performance** — Faster builds, smaller bundles

## Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR-USERNAME/socialdocs.org.git
cd socialdocs.org
npm install
npm start
```

### 2. Find Something to Work On

- Check [open issues](https://github.com/socialdocs/socialdocs.org/issues)
- Look for `good first issue` or `help wanted` labels
- Or just fix something you notice while reading the docs

### 3. Make Your Changes

**Documentation** lives in `docs/`:
```
docs/
├── getting-started/   # Intro guides
├── specs/             # Protocol specs
├── guides/            # How-to tutorials
├── reference/         # API reference
├── ecosystem/         # Software directory
├── tools/             # Developer tools
└── community/         # Community info
```

**Blog posts** go in `blog/` with format:
```
blog/YYYY-MM-DD-slug.md
```

### 4. Submit a Pull Request

1. Create a branch: `git checkout -b fix/typo-in-actors`
2. Make changes and commit: `git commit -m "Fix typo in actors documentation"`
3. Push: `git push origin fix/typo-in-actors`
4. Open a PR with a clear description

## Content Guidelines

### Writing Style
- **Be concise** — Developers skim; get to the point
- **Show, don't tell** — Code examples over long explanations
- **Assume competence** — Readers know programming, not necessarily ActivityPub
- **Link liberally** — Reference specs, other docs, external resources

### Code Examples
- Use realistic, working examples
- Include the language identifier in code blocks
- Add comments for non-obvious parts
- Test examples when possible

```javascript
// Good: Shows real usage
const actor = await fetch(actorUrl, {
  headers: { 'Accept': 'application/activity+json' }
}).then(r => r.json());

// Bad: Too abstract
const result = doActivityPubThing(input);
```

### Markdown Format
- Use ATX headings (`#`, `##`, `###`)
- Add frontmatter with `title`, `description`, `sidebar_position`
- Keep lines under 100 characters when practical

```markdown
---
sidebar_position: 1
title: Your Page Title
description: Brief description for SEO
---

# Your Page Title

Content here...
```

### Diagrams
We use inline SVG for diagrams with these conventions:
- Brand color: `#6364FF`
- Use `currentColor` for text (dark mode support)
- Keep viewBox reasonable (400-600px width)
- Include gradients for visual interest

## Review Process

1. **Automated checks** — Build must pass
2. **Content review** — Accuracy and clarity
3. **Merge** — Maintainer approves and merges

Most PRs are reviewed within a few days.

## Code of Conduct

Be respectful. The Fediverse is built on cooperation and openness. We expect the same in contributions.

- Be welcoming to newcomers
- Accept constructive criticism
- Focus on what's best for the community

## Questions?

- Open an issue for discussion
- Ask on [SocialHub](https://socialhub.activitypub.rocks/)
- Check existing docs at [socialdocs.org](https://socialdocs.org)

---

**Every contribution helps developers build a better Fediverse.**
