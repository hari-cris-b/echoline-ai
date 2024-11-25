// Constants and Configuration
const CONFIG = {
    API_URL: 'https://windsurf-project-18c9u5kuq-hari-krishnans-projects-d364269a.vercel.app/api/chat',
    ANIMATION_THRESHOLD: 150,
    DEBOUNCE_DELAY: 100,
    ERROR_MESSAGES: {
        network: 'Network error. Please check your connection.',
        api_key: 'Service temporarily unavailable.',
        rate_limit: 'Please wait before sending another message.',
        validation: 'Please enter a valid message.',
        empty_response: 'No response received. Please try again.',
        unknown: 'An error occurred. Please try again.'
    }
};

// Utility Functions
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const createElement = (tag, className, text = '') => {
    const element = document.createElement(tag);
    element.className = className;
    if (text) element.textContent = text;
    return element;
};

// Smooth Scrolling
const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector(anchor.getAttribute('href'))?.scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
};

// Form Validation
const initFormValidation = () => {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;

    const inputs = contactForm.querySelectorAll('input, textarea');
    const handleInput = (input) => {
        input.classList.remove('error');
        const errorElement = input.nextElementSibling;
        if (errorElement?.classList.contains('error-message')) {
            errorElement.remove();
        }
    };

    inputs.forEach(input => {
        input.addEventListener('input', () => handleInput(input));
    });

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('error');
                const errorMessage = createElement('div', 'error-message', `${input.placeholder} is required`);
                if (!input.nextElementSibling?.classList.contains('error-message')) {
                    input.parentNode.insertBefore(errorMessage, input.nextSibling);
                }
            }
        });

        if (isValid) {
            // Handle form submission
            const formData = new FormData(contactForm);
            // Add your form submission logic here
        }
    });
};

// Pricing Toggle
const initPricingToggle = () => {
    const toggle = document.querySelector('.pricing-toggle input');
    if (!toggle) return;

    const updatePrices = (isYearly) => {
        document.querySelectorAll('.price').forEach(price => {
            const monthly = price.getAttribute('data-monthly');
            const yearly = price.getAttribute('data-yearly');
            price.textContent = isYearly ? yearly : monthly;
        });
    };

    toggle.addEventListener('change', (e) => updatePrices(e.target.checked));
};

// Scroll Animation
const reveal = debounce(() => {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        
        if (elementTop < windowHeight - CONFIG.ANIMATION_THRESHOLD) {
            element.classList.add('active');
        }
    });
}, CONFIG.DEBOUNCE_DELAY);

// Chatbot
const initChatbot = () => {
    const chatbotToggle = document.querySelector('.chatbot-toggle');
    const chatbotContainer = document.querySelector('.chatbot-container');
    const chatbotClose = document.querySelector('.chatbot-close');
    if (!chatbotToggle || !chatbotContainer) return;

    let isProcessing = false;
    const messageQueue = [];
    const chatbotInput = chatbotContainer.querySelector('.chatbot-input');
    const sendButton = chatbotInput.querySelector('button');
    const chatbotMessages = chatbotContainer.querySelector('.chatbot-messages');
    const input = chatbotInput.querySelector('input');

    const addMessage = (type, content) => {
        const messageDiv = createElement('div', `message ${type}`, content);
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    };

    const showTypingIndicator = () => {
        const typingDiv = createElement('div', 'message bot typing');
        for (let i = 0; i < 3; i++) {
            typingDiv.appendChild(createElement('i', 'fas fa-circle'));
        }
        chatbotMessages.appendChild(typingDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        return typingDiv;
    };

    const processMessageQueue = async () => {
        if (isProcessing || messageQueue.length === 0) return;
        
        isProcessing = true;
        const message = messageQueue.shift();
        const typingIndicator = showTypingIndicator();
        
        try {
            addMessage('user', message);
            sendButton.disabled = true;
            
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(CONFIG.ERROR_MESSAGES[error.type] || CONFIG.ERROR_MESSAGES.unknown);
            }

            const data = await response.json();
            typingIndicator.remove();
            addMessage('bot', data.response);
        } catch (error) {
            console.error('Chat Error:', error);
            typingIndicator.remove();
            addMessage('error', error.message || CONFIG.ERROR_MESSAGES.unknown);
        } finally {
            sendButton.disabled = false;
            isProcessing = false;
            processMessageQueue();
        }
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        const message = input.value.trim();
        if (!message || isProcessing) return;

        input.value = '';
        messageQueue.push(message);
        processMessageQueue();
    };

    chatbotToggle.addEventListener('click', () => {
        chatbotContainer.classList.toggle('active');
        if (chatbotContainer.classList.contains('active')) {
            input.focus();
        }
    });

    chatbotClose.addEventListener('click', () => {
        chatbotContainer.classList.remove('active');
    });

    chatbotInput.addEventListener('submit', handleSubmit);
    sendButton.addEventListener('click', handleSubmit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    });
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initFormValidation();
    initPricingToggle();
    initChatbot();
    reveal();
    window.addEventListener('scroll', reveal);
});
