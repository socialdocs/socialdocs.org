# SocialDocs

**The comprehensive developer resource for ActivityPub and the Fediverse.**

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fsocialdocs.org)](https://socialdocs.org)
[![License: CC BY-SA 4.0](https://img.shields.io/badge/Docs-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![License: AGPL-3.0](https://img.shields.io/badge/Code-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## About

SocialDocs provides documentation, guides, and tools for developers building with ActivityPub — the W3C standard powering the decentralized social web with 13+ million users across Mastodon, Lemmy, PeerTube, Pixelfed, and more.

**What you'll find:**
- **Getting Started** — Beginner-friendly guides to federation concepts
- **Protocol Specs** — ActivityPub, ActivityStreams, WebFinger, HTTP Signatures
- **Implementation Guides** — Step-by-step tutorials for common patterns
- **API Reference** — Object types, activity types, endpoints
- **Ecosystem Directory** — Server software, libraries, tools
- **Developer Tools** — Validators, inspectors, debugging tips

## Contributing

We welcome contributions from the Fediverse community! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Quick contribution ideas:**
- Fix typos or clarify explanations
- Add code examples in different languages
- Document platform-specific quirks
- Improve diagrams and visuals
- Add new implementation guides

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build
```

The site runs at `http://localhost:3000`. Changes hot-reload automatically.

## Project Structure

```
socialdocs.org/
├── docs/                  # Documentation content
│   ├── getting-started/   # Beginner guides
│   ├── specs/             # Protocol specifications
│   ├── guides/            # Implementation tutorials
│   ├── reference/         # API reference
│   ├── ecosystem/         # Software directory
│   ├── tools/             # Developer tools
│   └── community/         # Community resources
├── blog/                  # Blog posts
├── src/
│   ├── pages/             # Custom pages (homepage)
│   └── css/               # Global styles
├── static/                # Static assets
└── docusaurus.config.ts   # Site configuration
```

## Tech Stack

- [Docusaurus 3](https://docusaurus.io/) — Static site generator
- [React](https://react.dev/) — UI components
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [GitHub Pages](https://pages.github.com/) — Hosting

## Community

- **Website**: [socialdocs.org](https://socialdocs.org)
- **SocialHub**: [socialhub.activitypub.rocks](https://socialhub.activitypub.rocks/)
- **W3C SocialCG**: [w3.org/community/socialcg](https://www.w3.org/community/socialcg/)

## License

Documentation content is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Code examples are licensed under [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0), consistent with the Fediverse ecosystem.

---

**Built for the Fediverse community.**
