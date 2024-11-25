// Chat UI Elements and State
let isOpen = false;
let messages = [{
    id: '1',
    content: "Hi! I'm the Echoline AI assistant. How can I help you today?",
    sender: 'bot',
    timestamp: new Date()
}];
let isTyping = false;

// Function to call Chat API
async function getChatResponse(message) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }

    const data = await response.json();
    return data.message;
}

// Initialize chat elements
function initializeChat() {
    // Create chat container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    chatContainer.innerHTML = `
        <button class="chat-toggle-btn">
            <i class="fas fa-comment"></i>
        </button>
        <div class="chat-window ${isOpen ? 'open' : ''}">
            <div class="chat-header">
                <h3>Echoline Assistant</h3>
                <button class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="chat-messages"></div>
            <form class="chat-form">
                <input type="text" placeholder="Type your message..." class="chat-input">
                <button type="submit" class="send-btn">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </form>
        </div>
    `;

    // Add to body
    document.body.appendChild(chatContainer);

    // Get elements
    const toggleBtn = chatContainer.querySelector('.chat-toggle-btn');
    const closeBtn = chatContainer.querySelector('.close-btn');
    const chatWindow = chatContainer.querySelector('.chat-window');
    const chatForm = chatContainer.querySelector('.chat-form');
    const chatInput = chatContainer.querySelector('.chat-input');
    const messagesContainer = chatContainer.querySelector('.chat-messages');

    // Event listeners
    toggleBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        chatWindow.classList.toggle('open');
        if (isOpen) {
            chatInput.focus();
            scrollToBottom();
        }
    });

    closeBtn.addEventListener('click', () => {
        isOpen = false;
        chatWindow.classList.remove('open');
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message || isTyping) return;

        // Add user message
        addMessage({
            id: Date.now().toString(),
            content: message,
            sender: 'user',
            timestamp: new Date()
        });

        chatInput.value = '';
        isTyping = true;

        try {
            // Show typing indicator
            showTypingIndicator();

            // Get response from API
            const botResponse = await getChatResponse(message);

            // Remove typing indicator and add bot response
            removeTypingIndicator();
            addMessage({
                id: Date.now().toString(),
                content: botResponse,
                sender: 'bot',
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Chat error:', error);
            removeTypingIndicator();
            addMessage({
                id: Date.now().toString(),
                content: "I'm sorry, I couldn't process your request. Please try again.",
                sender: 'bot',
                timestamp: new Date(),
                status: 'error'
            });
        } finally {
            isTyping = false;
            scrollToBottom();
        }
    });

    // Initial messages render
    renderMessages();
}

function addMessage(message) {
    messages.push(message);
    renderMessages();
    scrollToBottom();
}

function renderMessages() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = messages.map(msg => `
        <div class="message ${msg.sender} ${msg.status || ''}">
            <div class="message-content">${msg.content}</div>
            <div class="message-timestamp">${formatTimestamp(msg.timestamp)}</div>
        </div>
    `).join('');
}

function showTypingIndicator() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message bot typing';
    typingIndicator.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    messagesContainer.appendChild(typingIndicator);
    scrollToBottom();
}

function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function scrollToBottom() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function formatTimestamp(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeChat);
