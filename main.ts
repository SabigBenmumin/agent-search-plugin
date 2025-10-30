import { App, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, Notice, MarkdownView, Editor } from 'obsidian';

interface ChatPluginSettings {
    openRouterKey: string;
    model: string;
    apiUrl: string;
    chatPattern: string;
}

const DEFAULT_SETTINGS: ChatPluginSettings = {
    openRouterKey: '',
    model: 'anthropic/claude-3.5-sonnet',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    chatPattern: '```ai-chat\n{query}\n```'
}

const VIEW_TYPE_CHAT = 'chat-view';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

class ChatView extends ItemView {
    plugin: ChatPlugin;
    messages: Message[] = [];
    chatContainer: HTMLElement;
    inputContainer: HTMLElement;
    textArea: HTMLTextAreaElement;
    sendButton: HTMLButtonElement;
    newChatButton: HTMLButtonElement;
    headerContainer: HTMLElement;

    constructor(leaf: WorkspaceLeaf, plugin: ChatPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE_CHAT;
    }

    getDisplayText(): string {
        return 'AI Chat';
    }

    getIcon(): string {
        return 'message-circle';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('chat-view-container');

        // Header with New Chat button
        this.headerContainer = container.createDiv({ cls: 'chat-header' });
        
        const title = this.headerContainer.createEl('h3', {
            text: 'AI Chat',
            cls: 'chat-title'
        });

        this.newChatButton = this.headerContainer.createEl('button', {
            text: '🔄 New Chat',
            cls: 'chat-new-button'
        });

        this.newChatButton.addEventListener('click', () => this.startNewChat());

        // Chat messages container
        this.chatContainer = container.createDiv({ cls: 'chat-messages' });

        // Input container
        this.inputContainer = container.createDiv({ cls: 'chat-input-container' });
        
        this.textArea = this.inputContainer.createEl('textarea', {
            cls: 'chat-input',
            attr: {
                placeholder: 'พิมพ์ข้อความของคุณ...',
                rows: '3'
            }
        });

        this.sendButton = this.inputContainer.createEl('button', {
            text: 'ส่ง',
            cls: 'chat-send-button'
        });

        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        this.textArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.addStyles();
    }

    startNewChat() {
        this.messages = [];
        this.chatContainer.empty();
        new Notice('เริ่มการสนทนาใหม่');
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .chat-view-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                padding: 10px;
            }
            .chat-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid var(--background-modifier-border);
            }
            .chat-title {
                margin: 0;
                font-size: 1.2em;
            }
            .chat-new-button {
                padding: 6px 12px;
                background-color: var(--interactive-normal);
                color: var(--text-normal);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9em;
            }
            .chat-new-button:hover {
                background-color: var(--interactive-hover);
            }
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                margin-bottom: 10px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .chat-message {
                padding: 10px;
                border-radius: 8px;
                max-width: 80%;
                word-wrap: break-word;
            }
            .chat-message-user {
                align-self: flex-end;
                background-color: var(--interactive-accent);
                color: white;
            }
            .chat-message-assistant {
                align-self: flex-start;
                background-color: var(--background-secondary);
            }
            .chat-input-container {
                display: flex;
                gap: 10px;
                align-items: flex-end;
            }
            .chat-input {
                flex: 1;
                padding: 8px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                resize: vertical;
                min-height: 60px;
                background-color: var(--background-primary);
                color: var(--text-normal);
            }
            .chat-send-button {
                padding: 8px 16px;
                background-color: var(--interactive-accent);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                height: 40px;
            }
            .chat-send-button:hover {
                background-color: var(--interactive-accent-hover);
            }
            .chat-send-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .chat-message pre {
                background-color: var(--background-primary);
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
            }
            .chat-message code {
                background-color: var(--background-primary);
                padding: 2px 4px;
                border-radius: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    async sendMessage() {
        const message = this.textArea.value.trim();
        if (!message) return;

        if (!this.plugin.settings.openRouterKey) {
            new Notice('กรุณาตั้งค่า OpenRouter API Key ในการตั้งค่า');
            return;
        }

        // Add user message
        this.messages.push({ role: 'user', content: message });
        this.addMessageToView('user', message);
        this.textArea.value = '';
        this.sendButton.disabled = true;

        try {
            const response = await this.callOpenRouter(message);
            this.messages.push({ role: 'assistant', content: response });
            this.addMessageToView('assistant', response);
        } catch (error) {
            new Notice('เกิดข้อผิดพลาด: ' + error.message);
            console.error('API Error:', error);
        } finally {
            this.sendButton.disabled = false;
        }
    }

    addMessageToView(role: 'user' | 'assistant', content: string) {
        const messageDiv = this.chatContainer.createDiv({
            cls: `chat-message chat-message-${role}`
        });
        
        // Simple markdown rendering
        const formattedContent = content
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
        
        messageDiv.innerHTML = formattedContent;
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    async callOpenRouter(userMessage: string): Promise<string> {
        const response = await fetch(this.plugin.settings.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.plugin.settings.openRouterKey}`,
                'HTTP-Referer': 'https://obsidian.md',
                'X-Title': 'Obsidian Chat Plugin'
            },
            body: JSON.stringify({
                model: this.plugin.settings.model,
                messages: this.messages.concat([{ role: 'user', content: userMessage }])
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async onClose() {
        // Cleanup
    }
}

export default class ChatPlugin extends Plugin {
    settings: ChatPluginSettings;

    async onload() {
        await this.loadSettings();

        // Register the view
        this.registerView(
            VIEW_TYPE_CHAT,
            (leaf) => new ChatView(leaf, this)
        );

        // Add ribbon icon
        this.addRibbonIcon('message-circle', 'Open AI Chat', () => {
            this.activateView();
        });

        // Add command to open chat view
        this.addCommand({
            id: 'open-chat-view',
            name: 'Open Chat View',
            callback: () => {
                this.activateView();
            }
        });

        // Add command to ask AI in note
        this.addCommand({
            id: 'ask-ai-in-note',
            name: 'Ask AI in Note',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                await this.processAIQueryInNote(editor, view);
            }
        });

        // Register code block processor for ai-chat pattern
        this.registerMarkdownCodeBlockProcessor('ai-chat', async (source, el, ctx) => {
            await this.renderAIChatBlock(source, el, ctx);
        });

        // Add settings tab
        this.addSettingTab(new ChatSettingTab(this.app, this));
    }

    async processAIQueryInNote(editor: Editor, view: MarkdownView) {
        if (!this.settings.openRouterKey) {
            new Notice('กรุณาตั้งค่า OpenRouter API Key ในการตั้งค่า');
            return;
        }

        const cursor = editor.getCursor();
        const content = editor.getValue();
        
        // Find ai-chat code blocks
        const pattern = /```ai-chat\n([\s\S]*?)\n```/g;
        let match;
        let foundBlock = false;

        while ((match = pattern.exec(content)) !== null) {
            const blockStart = match.index;
            const blockEnd = blockStart + match[0].length;
            const query = match[1].trim();
            
            // Check if cursor is in this block
            const cursorPos = editor.posToOffset(cursor);
            if (cursorPos >= blockStart && cursorPos <= blockEnd) {
                foundBlock = true;
                
                // Check if answer already exists
                const afterBlock = content.substring(blockEnd);
                const answerPattern = /\n\n```ai-answer\n([\s\S]*?)\n```/;
                const answerMatch = afterBlock.match(answerPattern);
                
                if (answerMatch && afterBlock.indexOf(answerMatch[0]) === 0) {
                    // Update existing answer
                    new Notice('กำลังอัพเดตคำตอบ...');
                    const answer = await this.callOpenRouter(query);
                    const newAnswer = `\n\n\`\`\`ai-answer\n${answer}\n\`\`\``;
                    const replaceEnd = blockEnd + answerMatch[0].length;
                    
                    editor.replaceRange(
                        match[0] + newAnswer,
                        editor.offsetToPos(blockStart),
                        editor.offsetToPos(replaceEnd)
                    );
                } else {
                    // Add new answer
                    new Notice('กำลังถาม AI...');
                    const answer = await this.callOpenRouter(query);
                    const answerBlock = `\n\n\`\`\`ai-answer\n${answer}\n\`\`\``;
                    
                    editor.replaceRange(
                        match[0] + answerBlock,
                        editor.offsetToPos(blockStart),
                        editor.offsetToPos(blockEnd)
                    );
                }
                
                break;
            }
        }

        if (!foundBlock) {
            // Create new query block at cursor
            const selectedText = editor.getSelection();
            const query = selectedText || 'คำถามของคุณที่นี่';
            const newBlock = `\`\`\`ai-chat\n${query}\n\`\`\`\n\n`;
            
            if (selectedText) {
                editor.replaceSelection(newBlock);
                new Notice('สร้าง AI query block แล้ว - ใช้คำสั่ง "Ask AI in Note" อีกครั้งเพื่อรับคำตอบ');
            } else {
                editor.replaceRange(newBlock, cursor);
                new Notice('สร้าง AI query block แล้ว - แก้ไขคำถามแล้วใช้คำสั่งอีกครั้ง');
            }
        }
    }

    async renderAIChatBlock(source: string, el: HTMLElement, ctx: any) {
        const container = el.createDiv({ cls: 'ai-chat-block' });
        
        const queryDiv = container.createDiv({ cls: 'ai-chat-query' });
        queryDiv.createEl('strong', { text: '❓ คำถาม: ' });
        queryDiv.createEl('span', { text: source });

        // Add custom styles for the block
        if (!document.querySelector('#ai-chat-styles')) {
            const style = document.createElement('style');
            style.id = 'ai-chat-styles';
            style.textContent = `
                .ai-chat-block {
                    border: 2px solid var(--interactive-accent);
                    border-radius: 8px;
                    padding: 12px;
                    margin: 10px 0;
                    background-color: var(--background-secondary);
                }
                .ai-chat-query {
                    color: var(--text-normal);
                    font-size: 0.95em;
                }
                .ai-answer-block {
                    border: 2px solid var(--color-green);
                    border-radius: 8px;
                    padding: 12px;
                    margin: 10px 0;
                    background-color: var(--background-secondary);
                }
                .ai-answer-content {
                    color: var(--text-normal);
                    margin-top: 8px;
                    line-height: 1.6;
                }
            `;
            document.head.appendChild(style);
        }
    }

    async callOpenRouter(query: string): Promise<string> {
        const response = await fetch(this.settings.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.settings.openRouterKey}`,
                'HTTP-Referer': 'https://obsidian.md',
                'X-Title': 'Obsidian Chat Plugin'
            },
            body: JSON.stringify({
                model: this.settings.model,
                messages: [
                    { role: 'user', content: query }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHAT);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getRightLeaf(false);
            await leaf?.setViewState({ type: VIEW_TYPE_CHAT, active: true });
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class ChatSettingTab extends PluginSettingTab {
    plugin: ChatPlugin;

    constructor(app: App, plugin: ChatPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Chat Plugin Settings' });

        new Setting(containerEl)
            .setName('OpenRouter API Key')
            .setDesc('ใส่ OpenRouter API Key ของคุณ')
            .addText(text => text
                .setPlaceholder('sk-or-...')
                .setValue(this.plugin.settings.openRouterKey)
                .onChange(async (value) => {
                    this.plugin.settings.openRouterKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Model')
            .setDesc('เลือก AI model ที่ต้องการใช้')
            .addText(text => text
                .setPlaceholder('anthropic/claude-3.5-sonnet')
                .setValue(this.plugin.settings.model)
                .onChange(async (value) => {
                    this.plugin.settings.model = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('p', {
            text: 'รุ่นที่แนะนำ: anthropic/claude-3.5-sonnet, openai/gpt-4, google/gemini-pro',
            cls: 'setting-item-description'
        });

        containerEl.createEl('h3', { text: 'วิธีใช้ AI ใน Note:' });
        
        const instructions = containerEl.createEl('div', { cls: 'setting-item-description' });
        instructions.innerHTML = `
            <p><strong>1. สร้างคำถาม:</strong></p>
            <pre>
\`\`\`ai-chat
คำถามของคุณที่นี่
\`\`\`
            </pre>
            <p><strong>2. วางเคอร์เซอร์ใน code block</strong> แล้วใช้คำสั่ง "Ask AI in Note" (Ctrl/Cmd + P)</p>
            <p><strong>3. คำตอบจะปรากฏใต้คำถาม:</strong></p>
            <pre>
\`\`\`ai-answer
คำตอบจาก AI
\`\`\`
            </pre>
            <p>💡 <strong>เคล็ดลับ:</strong> เลือกข้อความแล้วใช้คำสั่ง "Ask AI in Note" เพื่อสร้าง query block ทันที</p>
        `;
    }
}