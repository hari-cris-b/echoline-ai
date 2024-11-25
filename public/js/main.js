// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Navigation scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Navbar scroll effect
const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        header.classList.remove('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});

// Form submission handling
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    // Add input validation styles
    const inputs = contactForm.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        // Remove error class when user starts typing
        input.addEventListener('input', function() {
            input.classList.remove('error');
            const errorSpan = input.nextElementSibling;
            if (errorSpan && errorSpan.classList.contains('error-message')) {
                errorSpan.remove();
            }
        });

        // Add error class and message on invalid input
        input.addEventListener('invalid', function(e) {
            e.preventDefault();
            input.classList.add('error');
            
            // Remove existing error message if any
            const existingError = input.nextElementSibling;
            if (existingError && existingError.classList.contains('error-message')) {
                existingError.remove();
            }
            
            // Add error message
            const errorSpan = document.createElement('span');
            errorSpan.classList.add('error-message');
            errorSpan.textContent = input.validationMessage;
            input.insertAdjacentElement('afterend', errorSpan);
        });
    });

    // Form submission
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Disable submit button and show loading state
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        try {
            // Collect form data
            const formData = {
                name: contactForm.querySelector('input[name="name"]').value,
                email: contactForm.querySelector('input[name="email"]').value,
                company: contactForm.querySelector('input[name="company"]').value,
                message: contactForm.querySelector('textarea[name="message"]').value
            };

            // Send email using EmailJS
            await emailjs.send(
                'service_fne3sly',
                'template_czv2ip4',
                {
                    from_name: formData.name,
                    from_email: formData.email,
                    company: formData.company,
                    message: formData.message,
                }
            );

            // Show success message
            const successMessage = document.createElement('div');
            successMessage.classList.add('success-message');
            successMessage.textContent = 'Thank you for your message! We will get back to you soon.';
            contactForm.insertAdjacentElement('beforebegin', successMessage);

            // Reset form
            contactForm.reset();

            // Remove success message after 5 seconds
            setTimeout(() => {
                successMessage.remove();
            }, 5000);

        } catch (error) {
            console.error('EmailJS Error:', error);
            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.classList.add('error-message');
            errorMessage.textContent = 'Sorry, something went wrong. Please try again later.';
            contactForm.insertAdjacentElement('beforebegin', errorMessage);

            // Remove error message after 5 seconds
            setTimeout(() => {
                errorMessage.remove();
            }, 5000);

        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}

// Pricing toggle (if you want to add monthly/yearly pricing)
function initPricingToggle() {
    const toggle = document.querySelector('.pricing-toggle');
    const prices = document.querySelectorAll('.price');
    
    if (toggle) {
        toggle.addEventListener('change', () => {
            prices.forEach(price => {
                price.classList.toggle('yearly');
            });
        });
    }
}

// Initialize pricing toggle
initPricingToggle();

// Add animation on scroll
function reveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('active');
        }
    });
}

window.addEventListener('scroll', reveal);

// Chatbot toggle
function initChatbot() {
    const chatbotButton = document.createElement('button');
    chatbotButton.className = 'chatbot-toggle';
    chatbotButton.innerHTML = '<i class="fas fa-comment"></i>';
    document.body.appendChild(chatbotButton);
    
    const chatbotContainer = document.createElement('div');
    chatbotContainer.className = 'chatbot-container';
    chatbotContainer.innerHTML = `
        <div class="chatbot-header">
            <h3>Chat with Us</h3>
            <button class="chatbot-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="chatbot-messages">
            <div class="message bot">
                Hello! How can I help you today?
            </div>
        </div>
        <div class="chatbot-input">
            <input type="text" placeholder="Type your message...">
            <button type="button"><i class="fas fa-paper-plane"></i></button>
        </div>
    `;
    
    document.body.appendChild(chatbotContainer);
    
    // Toggle chatbot visibility
    chatbotButton.addEventListener('click', () => {
        chatbotContainer.classList.toggle('active');
        if (chatbotContainer.classList.contains('active')) {
            chatbotContainer.querySelector('input').focus();
        }
    });
    
    // Close chatbot
    const closeButton = chatbotContainer.querySelector('.chatbot-close');
    closeButton.addEventListener('click', () => {
        chatbotContainer.classList.remove('active');
    });

    // Handle message sending
    const chatbotInput = chatbotContainer.querySelector('.chatbot-input');
    const input = chatbotInput.querySelector('input');
    const sendButton = chatbotInput.querySelector('button');
    const chatbotMessages = chatbotContainer.querySelector('.chatbot-messages');

    function addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = content;
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    async function getBotResponse(message) {
        try {
            const response = await fetch('https://windsurf-project-jvqhwgyr6-hari-krishnans-projects-d364269a.vercel.app/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error Details:', errorData);
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error getting bot response:', error);
            return "I apologize, but I'm having trouble connecting to our services. Please try again later or contact our support team.";
        }
    }

    async function handleMessage() {
        const message = input.value.trim();
        if (!message) return;
        
        // Disable input while processing
        input.disabled = true;
        sendButton.disabled = true;
        
        // Add user message
        addMessage('user', message);
        
        // Clear input
        input.value = '';
        
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot typing';
        typingIndicator.innerHTML = '<i class="fas fa-ellipsis-h"></i>';
        chatbotMessages.appendChild(typingIndicator);
        
        try {
            // Get response from API
            const response = await getBotResponse(message);
            
            // Remove typing indicator
            typingIndicator.remove();
            
            // Add bot response
            addMessage('bot', response);
        } catch (error) {
            console.error('Chat error:', error);
            typingIndicator.remove();
            addMessage('bot', 'I apologize, but I encountered an error. Please try again later.');
        } finally {
            // Re-enable input
            input.disabled = false;
            sendButton.disabled = false;
            input.focus();
        }
    }

    // Handle enter key
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleMessage();
        }
    });

    // Handle send button click
    sendButton.addEventListener('click', () => {
        handleMessage();
    });
}

// Initialize chatbot
initChatbot();
