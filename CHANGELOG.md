# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Semantic search with embeddings
- Conversation export/import
- Custom tool definitions
- Multi-file batch operations
- Voice input support
- Image analysis (when supported by models)

## [1.0.0] - 2024-01-XX (Initial Release)

### Added
- **AI Chat Interface** - Interactive chat view in sidebar
  - Message history within sessions
  - Markdown rendering in responses
  - Copy code blocks functionality
  - Scroll to latest message
  
- **Search Agent Mode** - AI searches your vault for context
  - Full-text search through all notes
  - Configurable search results (3-20 notes)
  - Source note references in responses
  - Click-to-open linked notes
  
- **Function Calling Agent Mode** - AI can interact with your vault
  - `read_note` - Read any note by path or name
  - `create_file` - Create new notes with content
  - `edit_file` - Modify existing notes (replace/append/prepend)
  - `list_files` - Browse vault structure
  - `create_folder` - Organize vault with folders
  - Real-time tool execution feedback
  - Safety confirmations for operations
  
- **In-Note AI Queries** - Embed AI queries in your notes
  - `ai-chat` code blocks for questions
  - `ai-answer` blocks for responses
  - Update answers with one command
  - Persistent Q&A in notes
  
- **Settings & Configuration**
  - OpenRouter API key management
  - Model selection (Claude, GPT-4, Gemini, etc.)
  - Toggle search and agent features
  - Configurable search parameters
  - API URL customization
  
- **UI Features**
  - Chat/Search/Agent mode toggles
  - Status bar showing active features
  - New chat button to reset conversation
  - Dark mode support
  - Responsive design
  
- **Developer Features**
  - TypeScript codebase
  - esbuild for fast compilation
  - Development mode with hot reload
  - Comprehensive error handling

### Technical Details
- **Supported Models**: Any OpenRouter-compatible model
  - Recommended: Claude 3.5 Sonnet (best function calling)
  - Also tested: GPT-4 Turbo, GPT-4, Gemini Pro
- **Minimum Obsidian Version**: 0.15.0
- **Platform Support**: Desktop and mobile
- **Dependencies**: None (all bundled)

### Documentation
- Comprehensive README with examples
- Contributing guidelines
- Release guide for developers
- MIT License

### Known Limitations
- Semantic search not yet implemented (planned)
- Function calling requires compatible models
- Rate limits depend on OpenRouter plan
- No offline mode (requires API connection)

---

## Version History Format

Each version will document:
- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security improvements

---

## How to Update

Users with the plugin installed will receive automatic update notifications in Obsidian.

To manually check for updates:
1. Settings → Community Plugins
2. Find "AI Chat & Agent"
3. Click "Check for updates"

---

## Links

- [GitHub Repository](https://github.com/SabigBenmumin/agent-search-plugin)
- [Issue Tracker](https://github.com/SabigBenmumin/agent-search-plugin/issues)
- [Discussions](https://github.com/SabigBenmumin/agent-search-plugin/discussions)

---

## Notes for Future Releases

### Version 1.1.0 Ideas
- Export conversations to notes
- Import conversations
- Custom keyboard shortcuts
- Conversation templates
- Better mobile UI

### Version 1.2.0 Ideas
- Semantic search with embeddings
- Vector database integration
- Similar note recommendations
- Auto-tagging suggestions

### Version 2.0.0 Ideas
- Custom tool creation API
- Plugin extension system
- Workflow automation
- Team collaboration features