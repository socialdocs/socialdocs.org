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

- Node.js 18+
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

All contributions are licensed under MIT, matching the project license.

---

Thank you for helping make Fediverse development more accessible!
