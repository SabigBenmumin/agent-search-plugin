import { App, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, Notice, MarkdownView, Editor, TFile, TFolder } from 'obsidian';

interface ChatPluginSettings {
    openRouterKey: string;
    model: string;
    apiUrl: string;
    chatPattern: string;
    searchMode: 'fulltext' | 'semantic';
    maxSearchResults: number;
    enableSearchAgent: boolean;
    enableFunctionCalling: boolean;
}

const DEFAULT_SETTINGS: ChatPluginSettings = {
    openRouterKey: '',
    model: 'anthropic/claude-3.5-sonnet',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    chatPattern: '```ai-chat\n{query}\n```',
    searchMode: 'fulltext',
    maxSearchResults: 10,
    enableSearchAgent: true,
    enableFunctionCalling: true
}

const VIEW_TYPE_CHAT = 'chat-view';

interface Message {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string | any;
    tool_call_id?: string;
    tool_calls?: any[];
}

interface SearchResult {
    file: TFile;
    content: string;
    score: number;
    matches: string[];
}

// Define available tools for function calling
const AVAILABLE_TOOLS = [
    {
        type: "function",
        function: {
            name: "read_note",
            description: "อ่านเนื้อหาของ note ในวอลท์ Obsidian โดยระบุชื่อไฟล์หรือพาธ",
            parameters: {
                type: "object",
                properties: {
                    file_path: {
                        type: "string",
                        description: "พาธหรือชื่อไฟล์ของ note ที่ต้องการอ่าน เช่น 'Project Notes/Ideas.md' หรือ 'Daily Note.md'"
                    }
                },
                required: ["file_path"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "list_files",
            description: "แสดงรายการไฟล์ทั้งหมดในโฟลเดอร์ หรือแสดงโครงสร้างวอลท์",
            parameters: {
                type: "object",
                properties: {
                    folder_path: {
                        type: "string",
                        description: "พาธของโฟลเดอร์ที่ต้องการดูรายการไฟล์ ถ้าไม่ระบุจะแสดงทุกไฟล์ในวอลท์"
                    },
                    include_folders: {
                        type: "boolean",
                        description: "แสดงโฟลเดอร์ด้วยหรือไม่ (default: true)"
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "edit_file",
            description: "แก้ไขเนื้อหาของไฟล์ที่มีอยู่ สามารถแทนที่ทั้งหมดหรือเพิ่มเติมได้",
            parameters: {
                type: "object",
                properties: {
                    file_path: {
                        type: "string",
                        description: "พาธของไฟล์ที่ต้องการแก้ไข"
                    },
                    content: {
                        type: "string",
                        description: "เนื้อหาใหม่ที่ต้องการเขียน"
                    },
                    mode: {
                        type: "string",
                        enum: ["replace", "append", "prepend"],
                        description: "วิธีการแก้ไข: replace=แทนที่ทั้งหมด, append=เพิ่มท้ายไฟล์, prepend=เพิ่มต้นไฟล์"
                    }
                },
                required: ["file_path", "content", "mode"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_file",
            description: "สร้างไฟล์ใหม่พร้อมเนื้อหา",
            parameters: {
                type: "object",
                properties: {
                    file_path: {
                        type: "string",
                        description: "พาธและชื่อไฟล์ที่ต้องการสร้าง ต้องลงท้ายด้วย .md"
                    },
                    content: {
                        type: "string",
                        description: "เนื้อหาของไฟล์"
                    }
                },
                required: ["file_path", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_folder",
            description: "สร้างโฟลเดอร์ใหม่ในวอลท์",
            parameters: {
                type: "object",
                properties: {
                    folder_path: {
                        type: "string",
                        description: "พาธของโฟลเดอร์ที่ต้องการสร้าง"
                    }
                },
                required: ["folder_path"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "rename_file",
            description: "เปลี่ยนชื่อไฟล์ในวอลท์",
            parameters: {
                type: "object",
                properties: {
                    old_path: {
                        type: "string",
                        description: "พาธปัจจุบันของไฟล์"
                    },
                    new_name: {
                        type: "string",
                        description: "ชื่อใหม่ของไฟล์ (ไม่รวม extension หากเป็น .md)"
                    }
                },
                required: ["old_path", "new_name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "rename_folder",
            description: "เปลี่ยนชื่อโฟลเดอร์ในวอลท์",
            parameters: {
                type: "object",
                properties: {
                    old_path: {
                        type: "string",
                        description: "พาธปัจจุบันของโฟลเดอร์"
                    },
                    new_name: {
                        type: "string",
                        description: "ชื่อใหม่ของโฟลเดอร์"
                    }
                },
                required: ["old_path", "new_name"]
            }
        }
    }
];

class ChatView extends ItemView {
    plugin: ChatPlugin;
    messages: Message[] = [];
    chatContainer: HTMLElement;
    inputContainer: HTMLElement;
    textArea: HTMLTextAreaElement;
    sendButton: HTMLButtonElement;
    newChatButton: HTMLButtonElement;
    searchToggle: HTMLInputElement | null = null;
    agentToggle: HTMLInputElement | null = null;
    headerContainer: HTMLElement;
    statusBar: HTMLElement;

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

        // Header with controls
        this.headerContainer = container.createDiv({ cls: 'chat-header' });
        
        this.headerContainer.createEl('h3', {
            text: 'AI Chat',
            cls: 'chat-title'
        });

        const buttonContainer = this.headerContainer.createDiv({ cls: 'chat-header-buttons' });

        // Search Agent Toggle
        if (this.plugin.settings.enableSearchAgent) {
            const toggleContainer = buttonContainer.createDiv({ cls: 'toggle-container' });
            toggleContainer.createEl('label', { 
                text: '🔍 Search',
                cls: 'toggle-label'
            });
            this.searchToggle = toggleContainer.createEl('input', {
                type: 'checkbox',
                cls: 'toggle-checkbox'
            });
            this.searchToggle.checked = true;
            this.searchToggle.addEventListener('change', () => this.updateStatusBar());
        }

        // Function Calling Toggle
        if (this.plugin.settings.enableFunctionCalling) {
            const agentContainer = buttonContainer.createDiv({ cls: 'toggle-container' });
            agentContainer.createEl('label', { 
                text: '🤖 Agent',
                cls: 'toggle-label'
            });
            this.agentToggle = agentContainer.createEl('input', {
                type: 'checkbox',
                cls: 'toggle-checkbox'
            });
            this.agentToggle.checked = true;
            this.agentToggle.addEventListener('change', () => this.updateStatusBar());
            
            agentContainer.setAttribute('title', 'เปิดใช้ AI Agent ที่สามารถสร้าง/แก้ไขไฟล์ได้');
        }

        this.newChatButton = buttonContainer.createEl('button', {
            text: '🔄 New Chat',
            cls: 'chat-new-button'
        });

        this.newChatButton.addEventListener('click', () => this.startNewChat());

        // Status bar
        this.statusBar = container.createDiv({ cls: 'chat-status-bar' });
        this.updateStatusBar();

        // Chat messages container
        this.chatContainer = container.createDiv({ cls: 'chat-messages' });

        // Input container
        this.inputContainer = container.createDiv({ cls: 'chat-input-container' });
        
        this.textArea = this.inputContainer.createEl('textarea', {
            cls: 'chat-input',
            attr: {
                placeholder: 'พิมพ์ข้อความหรือคำถามเกี่ยวกับ notes ของคุณ...',
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

    updateStatusBar() {
        if (!this.statusBar) return;
        
        const isSearchEnabled = this.searchToggle?.checked ?? false;
        const isAgentEnabled = this.agentToggle?.checked ?? false;
        
        let status = '💬 Chat Mode';
        const features = [];
        
        if (isSearchEnabled) features.push('Search');
        if (isAgentEnabled) features.push('Agent Tools');
        
        if (features.length > 0) {
            status = `✨ ${features.join(' + ')} Active`;
            this.statusBar.addClass('status-active');
        } else {
            this.statusBar.removeClass('status-active');
        }
        
        this.statusBar.setText(status);
    }

    startNewChat() {
        this.messages = [];
        this.chatContainer.empty();
        new Notice('เริ่มการสนทนาใหม่');
    }

    addStyles() {
        const existingStyle = document.getElementById('chat-plugin-styles');
        if (existingStyle) return;

        const style = document.createElement('style');
        style.id = 'chat-plugin-styles';
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
            .chat-header-buttons {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            .toggle-container {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px 8px;
                background-color: var(--background-secondary);
                border-radius: 4px;
            }
            .toggle-label {
                font-size: 0.85em;
                margin: 0;
            }
            .toggle-checkbox {
                cursor: pointer;
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
            .chat-status-bar {
                padding: 6px 10px;
                margin-bottom: 10px;
                border-radius: 4px;
                background-color: var(--background-secondary);
                font-size: 0.85em;
                text-align: center;
            }
            .chat-status-bar.status-active {
                background-color: var(--interactive-accent);
                color: white;
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
            .chat-message-tool {
                align-self: flex-start;
                background-color: var(--background-primary);
                border-left: 3px solid var(--color-orange);
                font-size: 0.9em;
                max-width: 90%;
            }
            .tool-call-header {
                font-weight: 600;
                color: var(--color-orange);
                margin-bottom: 4px;
            }
            .tool-call-result {
                font-family: monospace;
                font-size: 0.85em;
                opacity: 0.8;
                white-space: pre-wrap;
            }
            .search-results-info {
                font-size: 0.85em;
                padding: 8px;
                margin-top: 8px;
                background-color: var(--background-primary);
                border-radius: 4px;
                border-left: 3px solid var(--interactive-accent);
            }
            .search-result-item {
                margin: 4px 0;
                padding: 4px;
                font-size: 0.9em;
            }
            .search-result-link {
                color: var(--text-accent);
                text-decoration: none;
                font-weight: 500;
                cursor: pointer;
            }
            .search-result-link:hover {
                text-decoration: underline;
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
            const isSearchEnabled = this.searchToggle?.checked ?? false;
            const isAgentEnabled = this.agentToggle?.checked ?? false;

            let searchResults: SearchResult[] | null = null;

            // Search vault if enabled
            if (isSearchEnabled && this.plugin.settings.enableSearchAgent) {
                searchResults = await this.plugin.searchVault(message);
            }

            // Call AI with or without function calling
            if (isAgentEnabled && this.plugin.settings.enableFunctionCalling) {
                await this.handleAgenticChat(message, searchResults);
            } else {
                await this.handleSimpleChat(message, searchResults);
            }

        } catch (error) {
            new Notice('เกิดข้อผิดพลาด: ' + error.message);
            console.error('API Error:', error);
        } finally {
            this.sendButton.disabled = false;
        }
    }

    async handleSimpleChat(userMessage: string, searchResults: SearchResult[] | null) {
        let response: string;
        
        if (searchResults && searchResults.length > 0) {
            response = await this.callOpenRouterWithContext(userMessage, searchResults);
        } else {
            response = await this.callOpenRouter();
        }

        this.messages.push({ role: 'assistant', content: response });
        this.addMessageToView('assistant', response, searchResults);
    }

    async handleAgenticChat(userMessage: string, searchResults: SearchResult[] | null) {
        let conversationMessages: Message[] = [];
        
        // Build system prompt
        const systemPrompt = this.buildSystemPrompt(searchResults);
        conversationMessages.push({ role: 'system', content: systemPrompt });
        
        // Add conversation history (excluding system messages)
        const historyMessages = this.messages.filter(m => m.role !== 'system');
        conversationMessages.push(...historyMessages);

        let continueLoop = true;
        let iterationCount = 0;
        const maxIterations = 10;

        while (continueLoop && iterationCount < maxIterations) {
            iterationCount++;

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
                    messages: conversationMessages,
                    tools: AVAILABLE_TOOLS,
                    tool_choice: 'auto'
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`API Error: ${response.status} - ${error}`);
            }

            const data = await response.json();
            const assistantMessage = data.choices[0].message;

            // Add assistant message to conversation
            conversationMessages.push(assistantMessage);

            // Check if there are tool calls
            if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                // Execute each tool call
                for (const toolCall of assistantMessage.tool_calls) {
                    const toolResult = await this.executeTool(toolCall);
                    
                    // Show tool execution in UI
                    this.addToolCallToView(toolCall, toolResult);

                    // Add tool result to conversation
                    conversationMessages.push({
                        role: 'tool',
                        content: toolResult.content,
                        tool_call_id: toolResult.tool_call_id
                    });
                }
            } else {
                // No more tool calls, show final response
                continueLoop = false;
                
                if (assistantMessage.content) {
                    this.messages.push({ role: 'assistant', content: assistantMessage.content });
                    this.addMessageToView('assistant', assistantMessage.content, searchResults);
                }
            }
        }

        if (iterationCount >= maxIterations) {
            new Notice('⚠️ Agent reached maximum iterations');
        }
    }

    buildSystemPrompt(searchResults: SearchResult[] | null): string {
        let prompt = `You are a helpful AI assistant integrated into Obsidian. You have access to tools to read, create, edit files and folders in the user's vault.

Important guidelines:
- Always confirm before making destructive changes
- When creating files, use clear, descriptive names
- Follow markdown best practices
- Be helpful and proactive in organizing information`;

        if (searchResults && searchResults.length > 0) {
            prompt += '\n\n--- Relevant notes from vault ---\n\n';
            searchResults.forEach((result, idx) => {
                prompt += `[Note ${idx + 1}: ${result.file.basename}]\n`;
                prompt += `Path: ${result.file.path}\n`;
                prompt += result.content.substring(0, 800) + '...\n\n';
            });
            prompt += '--- End of search results ---';
        }

        return prompt;
    }

    async executeTool(toolCall: any): Promise<any> {
        const functionName = toolCall.function.name;
        let args: any = {};
        
        try {
            args = JSON.parse(toolCall.function.arguments);
        } catch (e) {
            return {
                tool_call_id: toolCall.id,
                content: `Error parsing arguments: ${e.message}`
            };
        }

        let result: string;

        try {
            switch (functionName) {
                case 'read_note':
                    result = await this.plugin.toolReadNote(args.file_path);
                    break;
                case 'list_files':
                    result = await this.plugin.toolListFiles(args.folder_path, args.include_folders);
                    break;
                case 'edit_file':
                    result = await this.plugin.toolEditFile(args.file_path, args.content, args.mode);
                    break;
                case 'create_file':
                    result = await this.plugin.toolCreateFile(args.file_path, args.content);
                    break;
                case 'create_folder':
                    result = await this.plugin.toolCreateFolder(args.folder_path);
                    break;
                case 'rename_file':
                    result = await this.plugin.toolRenameFile(args.old_path, args.new_name);
                    break;
                case 'rename_folder':
                    result = await this.plugin.toolRenameFolder(args.old_path, args.new_name);
                    break;
                default:
                    result = `Error: Unknown tool '${functionName}'`;
            }
        } catch (error) {
            result = `Error executing ${functionName}: ${error.message}`;
        }

        return {
            tool_call_id: toolCall.id,
            content: result
        };
    }

    addToolCallToView(toolCall: any, result: any) {
        const messageDiv = this.chatContainer.createDiv({
            cls: 'chat-message chat-message-tool'
        });

        const header = messageDiv.createDiv({ cls: 'tool-call-header' });
        let args: any = {};
        try {
            args = JSON.parse(toolCall.function.arguments);
        } catch (e) {
            args = {};
        }
        
        let headerText = `🛠️ ${toolCall.function.name}`;
        if (args.file_path) headerText += ` → ${args.file_path}`;
        else if (args.folder_path) headerText += ` → ${args.folder_path}`;
        
        header.setText(headerText);

        const resultDiv = messageDiv.createDiv({ cls: 'tool-call-result' });
        const displayContent = result.content.substring(0, 500);
        resultDiv.setText(displayContent + (result.content.length > 500 ? '...' : ''));

        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    addMessageToView(role: 'user' | 'assistant', content: string, searchResults?: SearchResult[] | null) {
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

        // Add search results info
        if (role === 'assistant' && searchResults && searchResults.length > 0) {
            const resultsInfo = messageDiv.createDiv({ cls: 'search-results-info' });
            resultsInfo.createEl('div', { 
                text: `📚 ค้นพบ ${searchResults.length} notes ที่เกี่ยวข้อง:`,
                cls: 'search-results-header'
            });
            
            searchResults.slice(0, 5).forEach(result => {
                const item = resultsInfo.createDiv({ cls: 'search-result-item' });
                const link = item.createEl('a', {
                    text: `• ${result.file.basename}`,
                    cls: 'search-result-link'
                });
                
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.plugin.app.workspace.openLinkText(result.file.path, '', false);
                });
            });
        }

        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    async callOpenRouter(): Promise<string> {
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
                messages: this.messages
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async callOpenRouterWithContext(userMessage: string, searchResults: SearchResult[]): Promise<string> {
        let context = '';
        if (searchResults.length > 0) {
            context = '--- Context from your notes ---\n\n';
            searchResults.forEach((result, idx) => {
                context += `[Note ${idx + 1}: ${result.file.basename}]\n`;
                context += result.content.substring(0, 1000) + '...\n\n';
            });
            context += '--- End of context ---\n\n';
        }

        const systemPrompt: Message = {
            role: 'system',
            content: 'You are a helpful assistant that answers questions based on the user\'s Obsidian notes. Use the provided context from their notes to give accurate, relevant answers.'
        };

        const userPromptWithContext: Message = {
            role: 'user',
            content: context + 'Question: ' + userMessage
        };

        const messagesToSend = [systemPrompt, ...this.messages.slice(0, -1), userPromptWithContext];

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
                messages: messagesToSend
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

        this.registerView(
            VIEW_TYPE_CHAT,
            (leaf) => new ChatView(leaf, this)
        );

        this.addRibbonIcon('message-circle', 'Open AI Chat', () => {
            this.activateView();
        });

        this.addCommand({
            id: 'open-chat-view',
            name: 'Open Chat View',
            callback: () => {
                this.activateView();
            }
        });

        this.addCommand({
            id: 'ask-ai-in-note',
            name: 'Ask AI in Note',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                await this.processAIQueryInNote(editor, view);
            }
        });

        this.registerMarkdownCodeBlockProcessor('ai-chat', async (source, el, ctx) => {
            await this.renderAIChatBlock(source, el);
        });

        this.addSettingTab(new ChatSettingTab(this.app, this));
    }

    // Tool implementations
    async toolReadNote(filePath: string): Promise<string> {
        try {
            let file = this.app.vault.getAbstractFileByPath(filePath);
            
            if (!file || !(file instanceof TFile)) {
                // Try to find by name
                const files = this.app.vault.getMarkdownFiles();
                const found = files.find(f => 
                    f.basename === filePath || 
                    f.basename === filePath.replace('.md', '') ||
                    f.path === filePath
                );
                
                if (!found) {
                    return `Error: File '${filePath}' not found. Available files: ${files.slice(0, 10).map(f => f.basename).join(', ')}...`;
                }
                
                file = found;
            }
            
            const content = await this.app.vault.cachedRead(file as TFile);
            return `File: ${file.path}\n\n${content}`;
        } catch (error) {
            return `Error reading file: ${error.message}`;
        }
    }

    async toolListFiles(folderPath?: string, includeFolders: boolean = true): Promise<string> {
        try {
            const files = this.app.vault.getMarkdownFiles();
            let result = '📁 Files in vault:\n\n';
            
            if (folderPath) {
                const filtered = files.filter(f => f.path.startsWith(folderPath));
                
                if (filtered.length === 0) {
                    return `No files found in folder '${folderPath}'. Check folder name or try without folder path.`;
                }
                
                filtered.forEach(file => {
                    result += `- ${file.path}\n`;
                });
                
                return result + `\nTotal: ${filtered.length} files`;
            } else {
                // Group by folder
                const folderMap = new Map<string, TFile[]>();
                
                files.forEach(file => {
                    const folder = file.parent?.path || 'root';
                    if (!folderMap.has(folder)) {
                        folderMap.set(folder, []);
                    }
                    folderMap.get(folder)!.push(file);
                });
                
                folderMap.forEach((files, folder) => {
                    if (includeFolders) {
                        result += `\n📂 ${folder}/\n`;
                    }
                    files.forEach(file => {
                        result += `  - ${file.basename}\n`;
                    });
                });
                
                return result + `\n\nTotal: ${files.length} files in ${folderMap.size} folders`;
            }
        } catch (error) {
            return `Error listing files: ${error.message}`;
        }
    }

    async toolEditFile(filePath: string, content: string, mode: 'replace' | 'append' | 'prepend'): Promise<string> {
        try {
            let file = this.app.vault.getAbstractFileByPath(filePath);
            
            if (!file || !(file instanceof TFile)) {
                // Try to find by name
                const files = this.app.vault.getMarkdownFiles();
                const found = files.find(f => 
                    f.basename === filePath || 
                    f.basename === filePath.replace('.md', '') ||
                    f.path === filePath
                );
                
                if (!found) {
                    return `Error: File '${filePath}' not found. Use create_file to create a new file.`;
                }
                
                file = found;
            }
            
            let newContent: string;
            
            if (mode === 'replace') {
                newContent = content;
            } else {
                const existingContent = await this.app.vault.cachedRead(file as TFile);
                
                if (mode === 'append') {
                    newContent = existingContent + '\n\n' + content;
                } else { // prepend
                    newContent = content + '\n\n' + existingContent;
                }
            }
            
            await this.app.vault.modify(file as TFile, newContent);
            
            new Notice(`✅ Updated: ${(file as TFile).basename}`);
            return `Successfully ${mode}d content to '${(file as TFile).path}'. New length: ${newContent.length} characters.`;
        } catch (error) {
            return `Error editing file: ${error.message}`;
        }
    }

    async toolCreateFile(filePath: string, content: string): Promise<string> {
        try {
            // Ensure .md extension
            if (!filePath.endsWith('.md')) {
                filePath += '.md';
            }
            
            // Check if file already exists
            const existingFile = this.app.vault.getAbstractFileByPath(filePath);
            if (existingFile) {
                return `Error: File '${filePath}' already exists. Use edit_file to modify it.`;
            }
            
            // Create parent folders if needed
            const pathParts = filePath.split('/');
            if (pathParts.length > 1) {
                const folderPath = pathParts.slice(0, -1).join('/');
                const folder = this.app.vault.getAbstractFileByPath(folderPath);
                
                if (!folder) {
                    try {
                        await this.app.vault.createFolder(folderPath);
                    } catch (e) {
                        // Folder might already exist, continue
                    }
                }
            }
            
            await this.app.vault.create(filePath, content);
            
            new Notice(`✅ Created: ${pathParts[pathParts.length - 1]}`);
            return `Successfully created file '${filePath}' with ${content.length} characters`;
        } catch (error) {
            return `Error creating file: ${error.message}`;
        }
    }

    async toolCreateFolder(folderPath: string): Promise<string> {
        try {
            const existing = this.app.vault.getAbstractFileByPath(folderPath);
            
            if (existing) {
                return `Folder '${folderPath}' already exists`;
            }
            
            await this.app.vault.createFolder(folderPath);
            
            new Notice(`✅ Created folder: ${folderPath}`);
            return `Successfully created folder '${folderPath}'`;
        } catch (error) {
            // Check if error is because folder already exists
            if (error.message.includes('already exists')) {
                return `Folder '${folderPath}' already exists`;
            }
            return `Error creating folder: ${error.message}`;
        }
    }

    async toolRenameFile(oldPath: string, newName: string): Promise<string> {
        try {
            let file = this.app.vault.getAbstractFileByPath(oldPath);
            
            if (!file || !(file instanceof TFile)) {
                // Try to find by name
                const files = this.app.vault.getMarkdownFiles();
                const found = files.find(f => 
                    f.basename === oldPath || 
                    f.basename === oldPath.replace('.md', '') ||
                    f.path === oldPath
                );
                
                if (!found) {
                    return `Error: File '${oldPath}' not found. Available files: ${files.slice(0, 10).map(f => f.basename).join(', ')}...`;
                }
                
                file = found;
            }
            
            // Ensure .md extension if not provided
            let finalNewName = newName;
            if (!finalNewName.endsWith('.md')) {
                finalNewName += '.md';
            }
            
            // Get the parent folder path
            const parentPath = (file as TFile).parent?.path;
            const newPath = parentPath ? `${parentPath}/${finalNewName}` : finalNewName;
            
            // Check if new name already exists
            const existingFile = this.app.vault.getAbstractFileByPath(newPath);
            if (existingFile) {
                return `Error: File name '${finalNewName}' already exists in this folder`;
            }
            
            await this.app.vault.rename(file as TFile, newPath);
            
            new Notice(`✅ Renamed: ${(file as TFile).basename} → ${finalNewName}`);
            return `Successfully renamed '${(file as TFile).basename}' to '${finalNewName}'`;
        } catch (error) {
            return `Error renaming file: ${error.message}`;
        }
    }

    async toolRenameFolder(oldPath: string, newName: string): Promise<string> {
        try {
            const folder = this.app.vault.getAbstractFileByPath(oldPath);
            
            if (!folder) {
                return `Error: Folder '${oldPath}' not found`;
            }
            
            if (!(folder instanceof TFolder)) {
                return `Error: '${oldPath}' is not a folder`;
            }
            
            // Get parent folder path
            const parentPath = folder.parent?.path;
            const newPath = parentPath ? `${parentPath}/${newName}` : newName;
            
            // Check if new name already exists
            const existingFolder = this.app.vault.getAbstractFileByPath(newPath);
            if (existingFolder) {
                return `Error: Folder name '${newName}' already exists in this parent folder`;
            }
            
            await this.app.vault.rename(folder as TFolder, newPath);
            
            new Notice(`✅ Renamed folder: ${folder.name} → ${newName}`);
            return `Successfully renamed folder '${folder.name}' to '${newName}'`;
        } catch (error) {
            return `Error renaming folder: ${error.message}`;
        }
    }

    async searchVault(query: string): Promise<SearchResult[]> {
        const files = this.app.vault.getMarkdownFiles();
        const results: SearchResult[] = [];

        for (const file of files) {
            const content = await this.app.vault.cachedRead(file);
            const score = this.calculateRelevanceScore(query, content, file.basename);

            if (score > 0) {
                results.push({
                    file,
                    content,
                    score,
                    matches: this.extractMatches(query, content)
                });
            }
        }

        results.sort((a, b) => b.score - a.score);
        return results.slice(0, this.settings.maxSearchResults);
    }

    calculateRelevanceScore(query: string, content: string, title: string): number {
        const queryLower = query.toLowerCase();
        const contentLower = content.toLowerCase();
        const titleLower = title.toLowerCase();

        let score = 0;

        if (titleLower.includes(queryLower)) {
            score += 10;
        }

        if (contentLower.includes(queryLower)) {
            score += 5;
        }

        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
        queryWords.forEach(word => {
            const wordCount = (contentLower.match(new RegExp(word, 'g')) || []).length;
            score += wordCount * 0.5;
        });

        return score;
    }

    extractMatches(query: string, content: string): string[] {
        const queryLower = query.toLowerCase();
        const lines = content.split('\n');
        const matches: string[] = [];

        lines.forEach(line => {
            if (line.toLowerCase().includes(queryLower)) {
                matches.push(line.trim());
            }
        });

        return matches.slice(0, 3);
    }

    async processAIQueryInNote(editor: Editor, view: MarkdownView) {
        if (!this.settings.openRouterKey) {
            new Notice('กรุณาตั้งค่า OpenRouter API Key ในการตั้งค่า');
            return;
        }

        const cursor = editor.getCursor();
        const content = editor.getValue();
        
        const pattern = /```ai-chat\n([\s\S]*?)\n```/g;
        let match;
        let foundBlock = false;

        while ((match = pattern.exec(content)) !== null) {
            const blockStart = match.index;
            const blockEnd = blockStart + match[0].length;
            const query = match[1].trim();
            
            const cursorPos = editor.posToOffset(cursor);
            if (cursorPos >= blockStart && cursorPos <= blockEnd) {
                foundBlock = true;
                
                const afterBlock = content.substring(blockEnd);
                const answerPattern = /\n\n```ai-answer\n([\s\S]*?)\n```/;
                const answerMatch = afterBlock.match(answerPattern);
                
                if (answerMatch && afterBlock.indexOf(answerMatch[0]) === 0) {
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

    async renderAIChatBlock(source: string, el: HTMLElement) {
        const container = el.createDiv({ cls: 'ai-chat-block' });
        
        const queryDiv = container.createDiv({ cls: 'ai-chat-query' });
        queryDiv.createEl('strong', { text: '❓ คำถาม: ' });
        queryDiv.createEl('span', { text: source });

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
            if (leaf) {
                await leaf.setViewState({ type: VIEW_TYPE_CHAT, active: true });
            }
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

        containerEl.createEl('h2', { text: 'AI Chat Plugin Settings' });

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

        containerEl.createEl('h3', { text: 'Agent Features' });

        new Setting(containerEl)
            .setName('Enable Function Calling')
            .setDesc('เปิดใช้งาน AI Agent ที่สามารถสร้าง/แก้ไขไฟล์ได้ (ต้องใช้ model ที่รองรับ function calling)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableFunctionCalling)
                .onChange(async (value) => {
                    this.plugin.settings.enableFunctionCalling = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Enable Search Agent')
            .setDesc('เปิดใช้งานการค้นหา notes และให้ AI ตอบจากเนื้อหาใน vault')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableSearchAgent)
                .onChange(async (value) => {
                    this.plugin.settings.enableSearchAgent = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', { text: 'Search Settings' });

        new Setting(containerEl)
            .setName('Search Mode')
            .setDesc('เลือกวิธีการค้นหา')
            .addDropdown(dropdown => dropdown
                .addOption('fulltext', 'Full-text Search (ไม่ต้องใช้ Vector DB)')
                .addOption('semantic', 'Semantic Search (ต้องใช้ Embeddings)')
                .setValue(this.plugin.settings.searchMode)
                .onChange(async (value) => {
                    this.plugin.settings.searchMode = value as 'fulltext' | 'semantic';
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Max Search Results')
            .setDesc('จำนวน notes สูงสุดที่จะส่งให้ AI วิเคราะห์')
            .addSlider(slider => slider
                .setLimits(3, 20, 1)
                .setValue(this.plugin.settings.maxSearchResults)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.maxSearchResults = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', { text: 'วิธีใช้งาน' });
        
        const instructions = containerEl.createEl('div', { cls: 'setting-item-description' });
        instructions.innerHTML = `
            <h4>🤖 Agent Mode (Function Calling):</h4>
            <p><strong>เปิด Agent Toggle ใน Chat View</strong> แล้ว AI จะสามารถ:</p>
            <ul>
                <li>📖 <strong>อ่านไฟล์:</strong> "อ่านไฟล์ Project Ideas ให้หน่อย"</li>
                <li>📝 <strong>สร้างไฟล์:</strong> "สร้างไฟล์ Meeting Notes สำหรับวันนี้"</li>
                <li>📝 <strong>แก้ชื่อไฟล์:</strong> "เปลี่ยนชื่อไฟล์ Meeting Notes สำหรับวันนี้โดยเพิ่มวันที่"</li>
                <li>✏️ <strong>แก้ไขไฟล์:</strong> "เพิ่ม task ใหม่ในไฟล์ TODO"</li>
                <li>📁 <strong>จัดการโฟลเดอร์:</strong> "สร้างโฟลเดอร์สำหรับ project ใหม่"</li>
                <li>🔍 <strong>แสดงรายการ:</strong> "มีไฟล์อะไรบ้างในโฟลเดอร์ Projects"</li>
            </ul>

            <h4>🔍 Search Agent Mode:</h4>
            <ol>
                <li>เปิด Chat View และเปิด toggle "🔍 Search"</li>
                <li>ถามคำถามเกี่ยวกับเนื้อหาใน notes เช่น:
                    <ul>
                        <li>"สรุปสิ่งที่ผมเขียนเกี่ยวกับ machine learning"</li>
                        <li>"มีข้อมูลอะไรเกี่ยวกับ Python ใน notes บ้าง"</li>
                        <li>"หา notes ที่พูดถึงการทำ API"</li>
                    </ul>
                </li>
                <li>AI จะค้นหา notes ที่เกี่ยวข้องและตอบจากเนื้อหาจริง</li>
            </ol>

            <h4>💬 วิธีใช้ AI ใน Note:</h4>
            <p><strong>1. สร้างคำถาม:</strong></p>
            <pre>\`\`\`ai-chat
คำถามของคุณที่นี่
\`\`\`</pre>
            <p><strong>2. วางเคอร์เซอร์ใน block</strong> แล้วใช้คำสั่ง "Ask AI in Note" (Ctrl/Cmd + P)</p>
            <p><strong>3. คำตอบจะปรากฏใต้คำถาม:</strong></p>
            <pre>\`\`\`ai-answer
คำตอบจาก AI
\`\`\`</pre>

            <h4>⚠️ หมายเหตุสำคัญ:</h4>
            <ul>
                <li><strong>Function Calling</strong> ต้องใช้กับ models ที่รองรับ เช่น Claude 3.5 Sonnet, GPT-4</li>
                <li>สามารถใช้ทั้ง Search และ Agent พร้อมกันได้</li>
                <li>การใช้ Agent Mode จะใช้ tokens มากกว่าปกติ</li>
            </ul>
        `;
    }
}