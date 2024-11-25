import { GoogleGenerativeAI } from '@google/generative-ai';

// Function to handle CORS headers
const setCorsHeaders = (req, res) => {
    // Get the origin from the request headers
    const origin = req.headers.origin || 'https://echoline-ai.vercel.app';
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
};

// Rate limiting configuration
const rateLimiter = {
    lastCall: 0,
    minInterval: 2000, // 2 seconds between messages
    callsInLastMinute: 0,
    maxCallsPerMinute: 20,
    lastMinuteReset: Date.now()
};

// Reset rate limiter counts every minute
setInterval(() => {
    rateLimiter.callsInLastMinute = 0;
    rateLimiter.lastMinuteReset = Date.now();
}, 60000);

const SYSTEM_PROMPT = `You are an AI chatbot assistant for Echoline AI, a company that provides AI-powered chat solutions for businesses. Your role is to:
1. Answer questions about our services, pricing, and features
2. Help potential customers understand our offerings
3. Provide professional and concise responses
4. Guide users to appropriate pricing plans
5. Explain our AI capabilities and integration options

About Echoline AI:
- Leading provider of AI chatbot solutions for businesses
- Specializes in custom AI training and instant deployment
- Offers seamless integration with existing systems
- Provides 24/7 automated customer support

Features:
- Custom AI Training
- Instant Setup (under 5 minutes)
- Multi-platform Integration
- Analytics Dashboard
- Secure Data Handling

Pricing Plans:
- Basic: $29/month (Essential features)
- Professional: $59/month (Advanced features)
- Enterprise: $99/month (Full feature set)
- Custom: Contact for custom solutions

If a visitor asks about unrelated topics, politely guide them back to discussing our services and solutions.`;

class ChatError extends Error {
    constructor(message, type) {
        super(message);
        this.type = type;
        this.name = 'ChatError';
    }
}

if (!process.env.GOOGLE_API_KEY) {
    throw new ChatError('Missing API key', 'api_key');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Main Handler
export default async function handler(req, res) {
    // Handle CORS headers
    if (setCorsHeaders(req, res)) {
        return;
    }

    try {
        const { message } = req.body;
        if (!message?.trim()) {
            throw new ChatError('Message is required', 'validation');
        }

        const now = Date.now();

        // Check time since last message
        const timeSinceLastCall = now - rateLimiter.lastCall;
        if (timeSinceLastCall < rateLimiter.minInterval) {
            throw new ChatError(
                `Please wait ${Math.ceil((rateLimiter.minInterval - timeSinceLastCall) / 1000)} seconds before sending another message`,
                'rate_limit'
            );
        }

        // Check calls per minute
        if (now - rateLimiter.lastMinuteReset > 60000) {
            rateLimiter.callsInLastMinute = 0;
            rateLimiter.lastMinuteReset = now;
        }

        if (rateLimiter.callsInLastMinute >= rateLimiter.maxCallsPerMinute) {
            throw new ChatError(
                'Message limit reached. Please wait a minute before sending more messages.',
                'rate_limit'
            );
        }

        // Update rate limiter
        rateLimiter.lastCall = now;
        rateLimiter.callsInLastMinute++;

        // Generate response with context
        const prompt = `${SYSTEM_PROMPT}\n\nUser: ${message}\nAssistant:`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text) {
            throw new ChatError('No response received', 'empty_response');
        }

        res.status(200).json({ response: text });
    } catch (error) {
        console.error('Chat API Error:', error);
        const statusCode = error.type === 'validation' ? 400 : 500;
        const message = error.type === 'api_key' ? 'Internal server error' : error.message;
        
        res.status(statusCode).json({
            error: message,
            type: error.type || 'unknown',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
