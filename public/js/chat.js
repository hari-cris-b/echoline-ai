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
        <button class="chat-toggle-btn" id="chatToggleBtn">
            <i class="fas fa-comment"></i>
        </button>
        <div class="chat-window ${isOpen ? 'open' : ''}" id="chatWindow">
            <div class="chat-header">
                <h3>Echoline Assistant</h3>
                <button class="close-btn" id="closeChatBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="chat-messages" id="chatMessages"></div>
            <form class="chat-form" id="chatForm">
                <input type="text" placeholder="Type your message..." class="chat-input" id="chatInput">
                <button type="submit" class="send-btn">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </form>
        </div>
    `;

    // Add to body
    document.body.appendChild(chatContainer);

    // Initial welcome message
    addMessage("Hi! I'm Echoline's AI assistant. How can I help you today?", 'bot');

    // Toggle chat window
    document.getElementById('chatToggleBtn')?.addEventListener('click', () => {
        document.getElementById('chatWindow')?.classList.toggle('open');
    });

    document.getElementById('closeChatBtn')?.addEventListener('click', () => {
        document.getElementById('chatWindow')?.classList.remove('open');
    });

    // Handle form submission
    document.getElementById('chatForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const message = document.getElementById('chatInput').value.trim();
        if (!message || isTyping) return;

        // Clear input
        document.getElementById('chatInput').value = '';
        isTyping = true;

        try {
            // Add user message
            addMessage(message, 'user');

            // Show typing indicator
            showTypingIndicator();

            // Get API URL based on environment
            const apiUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:3000/api/chat'
                : 'https://echoline-ai.vercel.app/api/chat';

            // Send message to API
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            // Remove typing indicator
            removeTypingIndicator();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            // Add bot response
            addMessage(data.response || data.message, 'bot');

        } catch (error) {
            console.error('Chat error:', error);
            // Remove typing indicator
            removeTypingIndicator();
            // Show error message
            addMessage(
                'Sorry, I encountered an error. Please try again later.',
                'bot',
                'error'
            );
        } finally {
            isTyping = false;
        }
    });

    // Function to add a message to the chat
    function addMessage(text, sender, status = '') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender} ${status}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;
        
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'message-timestamp';
        timestampDiv.textContent = new Date().toLocaleTimeString();
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timestampDiv);
        
        document.getElementById('chatMessages')?.appendChild(messageDiv);
        document.getElementById('chatMessages')?.scrollTo(0, document.getElementById('chatMessages').scrollHeight);
    }

    // Function to show typing indicator
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator message bot';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        indicator.id = 'typing-indicator';
        document.getElementById('chatMessages')?.appendChild(indicator);
        document.getElementById('chatMessages')?.scrollTo(0, document.getElementById('chatMessages').scrollHeight);
    }

    // Function to remove typing indicator
    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeChat);
