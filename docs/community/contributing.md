---
sidebar_position: 1
title: Contributing to SocialDocs
description: How to contribute to this documentation project
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

- Add missing language examples
- Fix outdated code
- Add more comments

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
---

# Your Page Title

Introduction paragraph.

## Main Section

Content here.

### Subsection

More detailed content.

## Code Examples

Code samples are **JavaScript/TypeScript on Node.js 22+**. That is what most of the site already uses, and it keeps one tested code path instead of several untested ones.

- **Security-critical code** (signature verification, signing, origin checks, safe fetching) lives in [`examples/`](https://github.com/socialdocs/socialdocs.org/tree/gh-pages/examples), has tests that run in CI, and is embedded into pages from there — never typed inline.
- **Other languages**: don't add parallel samples. Point readers to a maintained library on the [ecosystem pages](/docs/ecosystem/libraries-overview), whose examples are checked against the real packages.
- Snippets must use real APIs of real packages; CI checks that every package and repository named in the docs exists.

\`\`\`javascript
// Always include comments
function example() {
  return 'working code';
}
\`\`\`

## Next Steps

- Link to related pages
- Suggest what to read next
```

### Code Examples

- Include working, tested code
- Use meaningful variable names
- Add comments for complex logic
- Show both success and error cases
- Include multiple language tabs when useful

## Development Setup

### Prerequisites

- Node.js 22+
- npm or yarn

### Local Development

```bash
# Clone the repository
git clone https://github.com/socialdocs/socialdocs.org.git
cd socialdocs.org

# Install dependencies
npm install

# Start dev server
npm start
```

The site will be available at `http://localhost:3000`.

### Building

```bash
npm run build
```

### Testing Links

```bash
npm run build
npm run serve
```

## File Structure

```
docs/
├── getting-started/     # Beginner guides
├── specs/              # Protocol specifications
│   ├── activitypub/
│   ├── activitystreams/
│   ├── webfinger/
│   └── http-signatures/
├── guides/             # Implementation guides
├── reference/          # API reference
├── ecosystem/          # Software & libraries
├── tools/              # Developer tools
└── community/          # Community resources
```

## Pull Request Process

1. **Create a branch**: `feature/your-feature-name`
2. **Make changes**: Follow the style guide
3. **Test locally**: Ensure the site builds
4. **Submit PR**: Describe your changes
5. **Address feedback**: Respond to reviews

### PR Checklist

- [ ] Content is accurate
- [ ] Code examples work
- [ ] Links are valid
- [ ] Spelling/grammar checked
- [ ] Follows style guide

## Getting Help

- **Questions**: Open a GitHub issue
- **Discussion**: Join [SocialHub](https://socialhub.activitypub.rocks/)
- **Chat**: Find us on the Fediverse

## Recognition

Contributors are recognized in:

- GitHub contributors list
- Annual acknowledgments

## Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/). Be respectful, inclusive, and constructive.

## License

By contributing you agree that documentation is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) and code examples under [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0), matching the [LICENSE](https://github.com/socialdocs/socialdocs.org/blob/gh-pages/LICENSE) file.

---

Thank you for helping make Fediverse development more accessible!
