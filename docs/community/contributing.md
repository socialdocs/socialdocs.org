---
sidebar_position: 1
title: Contributing to SocialDocs
description: How to contribute to this documentation project
last_verified: 2026-10-15
verified_against: "Repository contents, package.json, .github/workflows/checks.yml, CONTRIBUTING.md and LICENSE on gh-pages (2026-10-15)"
---

# Contributing to SocialDocs

SocialDocs is a community-driven project. We welcome contributions from everyone interested in improving Fediverse developer documentation.

## Ways to Contribute

### 1. Report Issues

Found an error or have a suggestion?

- [Open an issue on GitHub](https://github.com/socialdocs/socialdocs.org/issues)
- Describe the problem or suggestion clearly
- Include links to relevant pages

### 2. Fix Errors

See a typo or mistake?

1. Click "Edit this page" at the bottom of any doc
2. Make your changes in GitHub
3. Submit a pull request

### 3. Write New Content

Want to add new documentation?

1. Fork the repository
2. Create your content following our style guide
3. Submit a pull request

### 4. Improve Examples

Code examples can always be improved:

- Fix outdated or broken code
- Move security-relevant snippets into tested code under `examples/`
- Add comments where the code isn't obvious

## Content Guidelines

### Style

- **Be concise**: Developers scan documentation
- **Use examples**: Show, don't just tell
- **Be accurate**: Test code examples
- **Stay current**: Update for spec changes

### Structure

```markdown
---
sidebar_position: 1
title: Your Page Title
description: Brief description for SEO
last_verified: 2026-10-15
verified_against: "Mastodon 4.7.3 source, RFC 9421"
---

# Your Page Title

Introduction paragraph.

## Main Section

Content, with every MUST/SHOULD linked to its spec section and every
platform claim linked to that platform's source or docs.
```

Add `last_verified` and `verified_against` only after you have checked the page's claims against their sources; pages without them show a "not yet verified" notice. See [CONTRIBUTING.md](https://github.com/socialdocs/socialdocs.org/blob/gh-pages/CONTRIBUTING.md) for the full field list.

### Code Examples

Code samples are **JavaScript/TypeScript on Node.js 22+**. That is what most of the site already uses, and it keeps one tested code path instead of several untested ones.

- **Security-critical code** (signature verification, signing, origin checks, safe fetching) lives in [`examples/`](https://github.com/socialdocs/socialdocs.org/tree/gh-pages/examples), has tests that run in CI, and is embedded into pages from there — never typed inline.
- **Other languages**: don't add parallel samples. Point readers to a maintained library on the [ecosystem pages](/docs/ecosystem/libraries-overview), whose examples are checked against the real packages.
- Snippets must use real APIs of real packages; CI checks that every package and repository named in the docs exists.
- Use meaningful names, comment the non-obvious parts, and show error handling where it matters.

## Development Setup

### Prerequisites

- Node.js 22+
- npm

### Local Development

```bash
git clone https://github.com/socialdocs/socialdocs.org.git
cd socialdocs.org
npm ci
npm start
```

The site will be available at `http://localhost:3000`.

### Checks

These run in CI on every pull request; run them locally first:

```bash
npm run build      # fails on broken internal links
npm run typecheck
node scripts/check-references.mjs   # every package and repo named in the docs must exist
cd examples/verify-requests && npm ci && node --test   # tested security code
```

External links are checked with [lychee](https://github.com/lycheeverse/lychee) (config in `lychee.toml`).

## File Structure

```
docs/
├── getting-started/   # Beginner guides
├── concepts/          # Linked Data background
├── specs/             # Protocol specifications
├── guides/            # Implementation guides, by task
├── security/          # Verification, origin rules, keys
├── reference/         # Glossary and security reference
├── ecosystem/         # Software & libraries
├── tools/             # Testing & debugging tools
└── community/         # Community resources
examples/              # Tested code embedded in the docs
scripts/               # CI checks and stats generation
```

## Pull Request Process

1. **Create a branch**: `feature/your-feature-name`
2. **Make changes**: Follow the style guide
3. **Test locally**: Ensure the site builds
4. **Submit PR**: Describe your changes
5. **Address feedback**: Respond to reviews

### PR Checklist

- [ ] Claims are checked against their sources, and linked
- [ ] Code examples work (security code is tested in `examples/`)
- [ ] CI checks pass (build, references, links)
- [ ] `last_verified` / `verified_against` updated on pages you re-checked

## Getting Help

- **Questions**: Open a GitHub issue
- **Discussion**: Join [SocialHub](https://socialhub.activitypub.rocks/)

Contributors are listed on the repository's GitHub contributors page.

## Code of Conduct

Be respectful, inclusive and constructive — see the [Code of Conduct section of CONTRIBUTING.md](https://github.com/socialdocs/socialdocs.org/blob/gh-pages/CONTRIBUTING.md#code-of-conduct).

## License

By contributing you agree that documentation is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) and code examples under [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0), matching the [LICENSE](https://github.com/socialdocs/socialdocs.org/blob/gh-pages/LICENSE) file.

---

Thank you for helping make Fediverse development more accessible!
