# 🤖 AI Chat & Agent for Obsidian

An intelligent AI-powered Obsidian plugin that brings smart search, agentic capabilities, and function calling to your vault. Chat with Claude, GPT-4, or Gemini to search, analyze, create, and manage your notes—all without leaving Obsidian.

**Languages:** English · 🇹🇭 Thai

---

## ✨ Features

### 💬 AI Chat View
- Dedicated chat sidebar powered by OpenRouter API
- Support for multiple AI models (Claude 3.5 Sonnet, GPT-4, Gemini Pro, etc.)
- Context-aware conversations with your vault
- Real-time message rendering with markdown support

### 🔍 Vault Search Agent
- Semantic & full-text search of your notes
- AI automatically searches and includes relevant context
- Answers questions based on YOUR vault content
- Shows source notes for transparency
- Configurable max search results

### 🤖 Function Calling / Agentic Mode
AI can autonomously:
- **📖 Read notes** - "Read my project notes"
- **📝 Create files** - "Create a meeting notes template"
- **✏️ Edit files** - "Add a new task to my TODO"
- **📁 Manage folders** - "Create a Projects folder"
- **🔍 Browse vault** - "List all files in the Archives folder"

Multi-turn interactions with tool use loops for complex tasks.

### 📄 In-Note AI Queries
Write inline AI queries directly in your notes:
```markdown
`​`​`ai-chat
Summarize this note in 3 bullet points
`​`​`
```

Then use the **"Ask AI in Note"** command to get instant answers.

### 🎛️ Smart Toggles
- **🔍 Search Toggle**: Enable/disable vault search for context
- **🤖 Agent Toggle**: Enable/disable file operations
- Use both or separately depending on your needs

---

## 🚀 Quick Start

### Installation

**From Community Plugins (Recommended)**
1. Open Obsidian → Settings → Community Plugins
2. Turn off Safe Mode
3. Click Browse, search for "**AI Chat & Agent**"
4. Install and enable

**Manual Installation**
1. Download latest `main.js`, `manifest.json`, `styles.css` from [releases](https://github.com/SabigBenmumin/agent-search-plugin/releases)
2. Create folder: `.obsidian/plugins/vault-agent-search/`
3. Copy files into that folder
4. Restart Obsidian & enable in Community Plugins

### Setup (2 minutes)

1. **Get API Key**
   - Visit [OpenRouter.ai](https://openrouter.ai)
   - Sign up (free tier available)
   - Create an API key from the dashboard

2. **Configure Plugin**
   - Obsidian Settings → Community Plugins → AI Chat & Agent
   - Paste API key in **OpenRouter API Key** field
   - (Optional) Change model if desired
   - Save and close

3. **Start Using**
   - Click the 💬 icon in left sidebar (or Ctrl+P → "Open Chat View")
   - Start chatting!

---

## 💡 Usage Examples

### Search Your Notes
```
"What have I written about productivity systems?"
```
→ AI searches vault, finds relevant notes, answers from YOUR content

### Create & Organize
```
"Create a folder structure for my new project with folders for 
Research, Planning, and Execution"
```
→ Agent creates folders and provides confirmation

### Edit & Update
```
"Add the following points to my GOALS note:
- Learn TypeScript
- Complete Obsidian plugin
- Review architecture"
```
→ Agent appends content to your note

### Ask In-Note
Place your cursor in this block and run "Ask AI in Note" command:
```markdown
`​`​`ai-chat
How can I improve this paragraph?
`​`​`
```

---

## ⚙️ Configuration

### Essential Settings

| Setting | Default | Description |
|---------|---------|-------------|
| **OpenRouter API Key** | — | Your API key (required) |
| **Model** | `anthropic/claude-3.5-sonnet` | AI model to use |
| **Enable Function Calling** | ON | Allow AI to create/edit files |
| **Enable Search Agent** | ON | Allow vault search |
| **Max Search Results** | 10 | Number of notes to use as context (3-20) |

### Recommended Models

**Best Overall:** `anthropic/claude-3.5-sonnet`
- Excellent at function calling
- Good balance of quality and cost
- Highly recommended for Agent mode

**Best for Speed:** `anthropic/claude-3-haiku`
- Fastest and cheapest
- Good for simple queries

**Most Powerful:** `openai/gpt-4-turbo` or `openai/gpt-4`
- Highest quality but more expensive
- Better for complex reasoning

**Good Alternative:** `google/gemini-pro`
- Fast and capable
- Competitive pricing

---

## 🎯 When to Use Each Mode

### Chat Only (Both toggles OFF)
Best for: General knowledge questions
```
"Explain quantum computing in simple terms"
"What's the difference between async and await?"
```

### Search Only (🔍 ON, 🤖 OFF)
Best for: Questions about your notes
```
"What have I learned about React?"
"Summarize my notes on productivity"
```

### Agent Only (🤖 ON, 🔍 OFF)
Best for: File operations
```
"Create a new note for today's meeting"
"Add a section to my README"
```

### Both Enabled (🔍 ON, 🤖 ON)
Best for: Complex tasks combining context and actions
```
"Based on my project notes, create a summary document"
"Find my Python learning notes and create a study guide"
```

---

## 📝 API & Pricing

### OpenRouter
- **Free tier**: Limited free credits for testing
- **Pay-as-you-go**: Typically $0.01-0.10 per conversation
- **No subscription required**
- **Supports 100+ models**

View pricing: https://openrouter.ai/docs#pricing

### Cost Examples (approximate)
- Simple question: $0.001-0.01
- Complex multi-turn with function calling: $0.05-0.20
- Search with long context: $0.02-0.10

### Reducing Costs
- Use Claude Haiku for simple tasks (cheapest)
- Disable Search when not needed
- Keep conversations focused
- Use shorter prompts

---

## 🔧 Technical Details

### Built With
- **TypeScript** - Strict type safety
- **Obsidian API** - Native plugin integration
- **esbuild** - Fast bundling
- **OpenRouter API** - Multi-model LLM access

### Requirements
- **Obsidian** v0.15.0 or later
- **Node.js** 16+ (for development)
- **Internet connection** (for API calls)
---

## 🛠️ Development

### Setup
```bash
npm install
```

### Development Mode (Watch)
```bash
npm run dev
```
- Watches for changes and rebuilds
- Output: `main.js`

### Production Build
```bash
npm run build
```
- Full build with type checking
- Output: `main.js`

### Testing
1. Copy `main.js`, `manifest.json`, `styles.css` to:
   ```
   <VaultPath>/.obsidian/plugins/vault-agent-search/
   ```
2. Reload Obsidian
3. Enable in Community Plugins

---

## 🐛 Troubleshooting

### "Please set OpenRouter API Key"
**Solution**: Add your API key in plugin settings

### Agent mode isn't working
**Solution**: Use a compatible model:
- ✅ Claude 3.5 Sonnet, Claude 3 Opus
- ✅ GPT-4, GPT-4 Turbo
- ✅ Gemini Pro
- ❌ Most other models don't support function calling

### Search finds nothing
**Solution**: Try broader, simpler keywords

### API errors (401, 429, etc.)
- **401**: Invalid API key
- **429**: Rate limited (wait or upgrade)
- **500**: OpenRouter server error (try again later)

### File operations aren't working
**Solution**: 
- Ensure Agent toggle is ON
- Check model supports function calling
- Use valid file paths: "folder/note.md"
- Confirm file doesn't already exist (for create)

### Performance issues
**Solution**:
- Reduce Max Search Results setting
- Use faster model (Haiku instead of Sonnet)
- Disable Search if not needed
- Close other plugins

---

## 📚 Advanced Tips

### Writing Effective Prompts

**Weak:**
```
"Help me with my notes"
```

**Strong:**
```
"Based on my project management notes, create a weekly 
planning template matching my preferred structure 
(Goals, Tasks, Notes, Reflections)"
```

### Using Search Effectively
- Be specific: "notes about React" not "my notes"
- Use domain keywords: "TypeScript decorators" vs "programming"
- Broader terms find more: "web development" vs "web dev testing"

### Organizing with Agent
```
"Create this folder structure:
Projects/
├── 2025/
│   ├── WebApp/
│   ├── CLI/
│   └── Docs/
├── Learning/
└── Archive/"
```

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📖 Resources

- **[Quick Start Guide](QUICK_START.md)** - Get running in 5 minutes
- **[Full Documentation](https://github.com/SabigBenmumin/agent-search-plugin/wiki)** - Complete reference
- **[Discussions](https://github.com/SabigBenmumin/agent-search-plugin/discussions)** - Ask questions
- **[Issues](https://github.com/SabigBenmumin/agent-search-plugin/issues)** - Report bugs
- **[Obsidian Plugin Docs](https://docs.obsidian.md)** - Plugin development reference
- **[OpenRouter API Docs](https://openrouter.ai/docs)** - API reference

---

## ⚠️ Privacy & Security

### Data Handling
- **Search**: Your note content is sent to OpenRouter/chosen API
- **Function Calling**: File operations happen locally
- **API Keys**: Stored securely in Obsidian's data store
- **No cloud storage**: Plugin doesn't upload your vault

### Best Practices
- Keep API keys private; don't share them
- Review what data gets sent with Search enabled
- Disable Search if sensitive information in notes
- Use free credits for testing before paid usage

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- [Obsidian](https://obsidian.md) - Amazing note-taking app
- [OpenRouter](https://openrouter.ai) - Multi-model LLM API
- [Claude](https://anthropic.com) - AI model powering most features
- [Community](https://github.com/SabigBenmumin/agent-search-plugin/discussions) - Feedback and ideas

---

## 📞 Support & Feedback

Have questions or ideas?
- 💬 [GitHub Discussions](https://github.com/SabigBenmumin/agent-search-plugin/discussions)
- 🐛 [Report Issues](https://github.com/SabigBenmumin/agent-search-plugin/issues)
- ⭐ [Star on GitHub](https://github.com/SabigBenmumin/agent-search-plugin) to show support

---

**Happy note-taking with AI! 🚀**

Made with ❤️ for Obsidian users by [Sabig Benmumin](https://github.com/SabigBenmumin)
