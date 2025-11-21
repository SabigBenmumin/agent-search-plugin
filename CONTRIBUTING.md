# Contributing to AI Chat & Agent

First off, thank you for considering contributing to AI Chat & Agent! It's people like you that make this plugin better for everyone.

## Code of Conduct

This project and everyone participating in it is governed by respect and professionalism. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**
```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. Windows 10, macOS 13]
 - Obsidian Version: [e.g. 1.4.5]
 - Plugin Version: [e.g. 1.0.0]
 - Model Used: [e.g. Claude 3.5 Sonnet]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title** describing the enhancement
- **Detailed description** of the proposed functionality
- **Use cases** explaining why this would be useful
- **Possible implementation** if you have ideas

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the coding standards below
3. **Test thoroughly** - ensure all features still work
4. **Update documentation** if needed
5. **Commit with clear messages** explaining what and why
6. **Push to your fork** and submit a pull request

**Pull Request Template:**
```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tested in development environment
- [ ] Tested in actual Obsidian vault
- [ ] Tested with multiple AI models
- [ ] No console errors
- [ ] All existing features still work

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have tested my code thoroughly
```

## Development Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Obsidian installed
- Git

### Setup Steps

1. **Clone your fork:**
```bash
git clone https://github.com/YOUR_USERNAME/obsidian-ai-chat-agent.git
cd obsidian-ai-chat-agent
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create a test vault:**
```bash
# Create a new Obsidian vault for testing
# Link your plugin folder to the vault's plugins directory
mkdir -p /path/to/test-vault/.obsidian/plugins/ai-chat-agent
ln -s $(pwd) /path/to/test-vault/.obsidian/plugins/ai-chat-agent
```

4. **Start development:**
```bash
npm run dev
```

This will:
- Watch for file changes
- Automatically rebuild
- Output to `main.js`

5. **Test in Obsidian:**
- Open your test vault
- Enable the plugin
- Test your changes
- Check console for errors

### Project Structure

```
obsidian-ai-chat-agent/
├── main.ts              # Main plugin code
├── manifest.json        # Plugin metadata
├── package.json         # NPM dependencies
├── tsconfig.json        # TypeScript config
├── esbuild.config.mjs   # Build configuration
└── README.md            # Documentation
```

## Coding Standards

### TypeScript Style

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use meaningful variable names
- Add JSDoc comments for public methods
- Use async/await over promises where possible

**Example:**
```typescript
/**
 * Searches the vault for notes matching the query
 * @param query - The search query string
 * @returns Array of matching notes with relevance scores
 */
async searchVault(query: string): Promise<SearchResult[]> {
    const files = this.app.vault.getMarkdownFiles();
    const results: SearchResult[] = [];
    // ... implementation
    return results;
}
```

### Code Organization

- Keep functions focused and small
- Separate concerns (UI, API calls, data processing)
- Use classes for related functionality
- Extract complex logic into helper functions

### Error Handling

- Always handle API errors gracefully
- Show user-friendly error messages
- Log detailed errors to console
- Never expose API keys or sensitive data

**Example:**
```typescript
try {
    const result = await this.callAPI(query);
    return result;
} catch (error) {
    new Notice('Failed to get AI response. Check console for details.');
    console.error('API Error:', error);
    throw error;
}
```

### UI Guidelines

- Follow Obsidian's design patterns
- Use CSS variables for theming
- Ensure dark mode compatibility
- Make UI responsive
- Add appropriate loading states

## Testing

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] Chat interface opens and closes properly
- [ ] Messages send and display correctly
- [ ] Search mode finds relevant notes
- [ ] Agent mode can create files
- [ ] Agent mode can edit files
- [ ] Agent mode can list files
- [ ] In-note queries work
- [ ] Settings save and load correctly
- [ ] Plugin works with different models
- [ ] No console errors or warnings
- [ ] Works in both light and dark themes
- [ ] Toggles (Search, Agent) work correctly

### Edge Cases to Test

- Empty vault
- Very large vault (1000+ notes)
- Long conversation history
- API errors/timeouts
- Invalid API keys
- Network disconnection
- Rapid consecutive queries

## Documentation

### Code Comments

- Comment complex algorithms
- Explain non-obvious decisions
- Document function parameters and return values
- Add TODO comments for future improvements

### README Updates

If your changes affect user-facing features:
- Update relevant sections in README.md
- Add examples if applicable
- Update screenshots if UI changed
- Add to changelog section

## Git Commit Messages

Write clear, descriptive commit messages:

**Good examples:**
```
Add conversation export feature
Fix search results not displaying
Update README with new examples
Improve error handling in API calls
```

**Bad examples:**
```
Update
Fix bug
Changes
WIP
```

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Example:**
```
feat: Add conversation export to markdown

- Add export button to chat interface
- Support exporting with or without search results
- Include timestamp in exported files

Closes #42
```

## Review Process

1. **Automated checks** will run on your PR
2. **Maintainer review** - expect feedback within a few days
3. **Address feedback** - make requested changes
4. **Approval** - once approved, PR will be merged
5. **Release** - changes will be included in next version

## Questions?

- Open an issue for questions
- Tag maintainers if urgent
- Check existing issues and discussions
- Be patient and respectful

## Recognition

Contributors will be:
- Listed in release notes
- Credited in README.md
- Appreciated in the community!

---

Thank you for contributing! 🎉