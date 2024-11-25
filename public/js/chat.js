// Chat UI Elements
const chatButton = document.createElement('button');
const chatWindow = document.createElement('div');
let isOpen = false;
let messages = [];
let isTyping = false;

// Initialize chat elements
function initializeChat() {
    // Style chat button
    chatButton.className = 'chat-button';
    chatButton.innerHTML = '<i class="fas fa-comment"></i>';
    chatButton.onclick = toggleChat;
    chatButton.style.zIndex = '9999'; // Ensure button is always visible

    // Style chat window
    chatWindow.className = 'chat-window';
    chatWindow.style.zIndex = '9998'; // Ensure window is below button but above other content
    chatWindow.innerHTML = `
        <div class="chat-header">
            <h3>Echoline Assistant</h3>
            <button class="close-button"><i class="fas fa-times"></i></button>
        </div>
        <div class="chat-messages"></div>
        <form class="chat-input-form">
            <input type="text" placeholder="Type your message..." class="chat-input">
            <button type="submit" class="send-button"><i class="fas fa-paper-plane"></i></button>
        </form>
    `;

    // Add elements to body
    document.body.appendChild(chatButton);
    document.body.appendChild(chatWindow);

    // Add event listeners
    chatWindow.querySelector('.close-button').onclick = toggleChat;
    chatWindow.querySelector('.chat-input-form').onsubmit = handleSendMessage;

    // Add initial message
    addMessage("Hi! I'm your Echoline assistant. How can I help you today?", 'bot');
}

function toggleChat() {
    isOpen = !isOpen;
    chatWindow.style.display = isOpen ? 'flex' : 'none';
    if (isOpen) {
        chatWindow.querySelector('.chat-input').focus();
    }
}

function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    messageDiv.innerHTML = content;
    
    const messagesContainer = chatWindow.querySelector('.chat-messages');
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function handleSendMessage(e) {
    e.preventDefault();
    if (isTyping) return;

    const input = chatWindow.querySelector('.chat-input');
    const message = input.value.trim();
    if (!message) return;

    // Clear input
    input.value = '';

    // Add user message
    addMessage(message, 'user');

    // Show typing indicator
    isTyping = true;
    addMessage('<div class="typing-indicator"><span></span><span></span><span></span></div>', 'bot');

    try {
        // Send to backend and get response
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error('Failed to get response');
        }

        const data = await response.json();
        
        // Remove typing indicator and add bot response
        const messagesContainer = chatWindow.querySelector('.chat-messages');
        messagesContainer.removeChild(messagesContainer.lastChild);
        addMessage(data.response, 'bot');
    } catch (error) {
        console.error('Chat error:', error);
        const messagesContainer = chatWindow.querySelector('.chat-messages');
        messagesContainer.removeChild(messagesContainer.lastChild);
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    } finally {
        isTyping = false;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeChat);
