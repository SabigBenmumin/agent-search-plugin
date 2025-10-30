import { App, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, Notice } from 'obsidian';

interface ChatPluginSettings {
    openRouterKey: string;
    model: string;
    apiUrl: string;
}

const DEFAULT_SETTINGS: ChatPluginSettings = {
    openRouterKey: '',
    model: 'anthropic/claude-3.5-sonnet',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions'
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

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .chat-view-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                padding: 10px;
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

        // Add command
        this.addCommand({
            id: 'open-chat-view',
            name: 'Open Chat View',
            callback: () => {
                this.activateView();
            }
        });

        // Add settings tab
        this.addSettingTab(new ChatSettingTab(this.app, this));
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHAT);

        if (leaves.length > 0) {
            // View already exists, reveal it
            leaf = leaves[0];
        } else {
            // Create new view
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
    }
}