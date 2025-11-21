# Quick Start Guide

Get started with AI Chat & Agent in 5 minutes!

## Step 1: Install (Choose One Method)

### Method A: From Community Plugins (Recommended)
1. Open Obsidian Settings
2. Go to **Community Plugins** → Turn off Safe Mode
3. Click **Browse**
4. Search for "**AI Chat & Agent**"
5. Click **Install**, then **Enable**

### Method B: Manual Installation
1. Download latest release from [GitHub](https://github.com/SabigBenmumin/agent-search-plugin/releases)
2. Extract files to `.obsidian/plugins/ai-chat-agent/`
3. Reload Obsidian
4. Enable plugin in Settings → Community Plugins

## Step 2: Get API Key

1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up (free tier available)
3. Go to **API Keys** section
4. Click **Create Key**
5. Copy your key (starts with `sk-or-...`)

## Step 3: Configure Plugin

1. Open Obsidian Settings
2. Go to **AI Chat & Agent** (under Community Plugins)
3. Paste your API key in **OpenRouter API Key** field
4. (Optional) Change **Model** if desired
   - Default: `anthropic/claude-3.5-sonnet` (recommended)
   - Other options: `openai/gpt-4-turbo`, `google/gemini-pro`
5. Close settings

## Step 4: Start Chatting!

### Open Chat View
- Click the **chat icon** (💬) in the left sidebar
- Or press `Ctrl/Cmd + P` and search for "Open Chat View"

### Your First Query

Try this simple example:
```
Hello! Can you help me organize my notes?
```

## Common Use Cases

### 1. Search Your Notes
**Toggle ON: 🔍 Search**

Example:
```
What have I written about productivity?
```

The AI will:
- Search your vault
- Find relevant notes
- Provide answers based on YOUR content
- Show which notes were used

### 2. Create New Notes
**Toggle ON: 🤖 Agent**

Example:
```
Create a daily note for today with sections for:
- Goals
- Tasks
- Notes
- Reflection
```

### 3. Edit Existing Notes
**Toggle ON: 🤖 Agent**

Example:
```
Add "Buy groceries" to my TODO list
```

### 4. Browse Your Vault
**Toggle ON: 🤖 Agent**

Example:
```
What files are in my Projects folder?
```

### 5. Ask Questions In-Note

In any note, type:
```markdown
\`\`\`ai-chat
Summarize this note in 3 bullet points
\`\`\`
```

Then:
1. Place cursor in the block
2. Press `Ctrl/Cmd + P`
3. Search for "Ask AI in Note"
4. Press Enter

Answer appears below!

## Understanding the Toggles

### 🔍 Search Toggle
- **ON**: AI searches your vault for context
- **OFF**: AI uses only general knowledge
- Use for: Questions about your notes

### 🤖 Agent Toggle  
- **ON**: AI can create/edit files
- **OFF**: AI can only chat
- Use for: File operations, organization

### Best Practices
- Turn ON Search for questions: "What did I learn about X?"
- Turn ON Agent for actions: "Create a new note about X"
- Turn BOTH ON for complex tasks: "Based on my notes, create a summary"
- Turn BOTH OFF for general chat: "Explain quantum physics"

## Settings Explained

### Essential Settings

**OpenRouter API Key** (Required)
- Your API key from OpenRouter
- Stored securely in Obsidian

**Model** (Optional)
- Default: `anthropic/claude-3.5-sonnet`
- Best for function calling and quality
- Change if you prefer other models

### Advanced Settings

**Enable Function Calling**
- Allows Agent mode to work
- Requires compatible model (Claude, GPT-4)
- Default: ON

**Enable Search Agent**
- Allows searching your vault
- Default: ON

**Max Search Results**
- How many notes to use as context
- Range: 3-20
- Higher = more context but slower
- Default: 10

## Troubleshooting

### "Please set OpenRouter API Key"
→ Add your API key in Settings

### Agent mode not working
→ Check you're using a compatible model:
- ✅ `anthropic/claude-3.5-sonnet`
- ✅ `anthropic/claude-3-opus`
- ✅ `openai/gpt-4-turbo`
- ✅ `openai/gpt-4`
- ❌ Most other models

### Search finds nothing
→ Try simpler, broader keywords

### "API Error: 401"
→ Your API key is invalid or expired

### "API Error: 429"
→ You hit rate limits. Wait or upgrade OpenRouter plan

### Plugin not appearing
→ Restart Obsidian and check Community Plugins

## Cost & Usage

### Free Tier
- OpenRouter offers free credits for testing
- Limited requests per day
- Good for trying the plugin

### Paid Usage
- Pay-as-you-go pricing
- ~$0.01-0.10 per conversation (varies by model)
- Check [OpenRouter pricing](https://openrouter.ai/docs#pricing)

### Reducing Costs
- Use cheaper models for simple tasks
- Turn OFF Search when not needed
- Use shorter conversations
- Claude Haiku is cheapest, Opus is most expensive

## Tips for Best Results

### Writing Good Prompts

**Good:**
```
Create a meeting notes template with sections for attendees, agenda, 
discussion points, action items, and next steps
```

**Better:**
```
Based on my previous meeting notes, create a template that matches 
my style and includes the sections I commonly use
```

### Using Search Effectively

**Specific:**
```
What did I write about React hooks in my programming notes?
```

**Broad:**
```
Find all my thoughts on web development
```

### Agent Mode Best Practices

- Be specific about file names and locations
- Ask AI to confirm before major changes
- Check results after file operations
- Use relative paths: "Projects/Ideas.md" not "/full/path/"

## Next Steps

### Learn More
- Read the [full README](README.md) for detailed features
- Check [examples](https://github.com/SabigBenmumin/agent-search-plugin/discussions) in Discussions
- Watch tutorial videos (coming soon)

### Get Help
- [Report bugs](https://github.com/SabigBenmumin/agent-search-plugin/issues)
- [Ask questions](https://github.com/SabigBenmumin/agent-search-plugin/discussions)
- Check [FAQ](https://github.com/SabigBenmumin/agent-search-plugin/wiki/FAQ) (coming soon)

### Contribute
- Star the [GitHub repo](https://github.com/SabigBenmumin/agennt-search-plugin)
- Share with other Obsidian users
- [Contribute code](CONTRIBUTING.md)

---

**Ready to supercharge your note-taking? Start chatting! 🚀**