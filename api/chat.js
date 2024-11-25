import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Rate limiting configuration
const rateLimiter = {
    lastCall: 0,
    minInterval: 2000, // 2 seconds between messages
    callsInLastMinute: 0,
    maxCallsPerMinute: 20,
    lastMinuteReset: Date.now()
};

// Function to handle CORS headers
const setCorsHeaders = (req, res) => {
    // Get the origin from the request headers
    const origin = req.headers.origin || '*';
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://echoline-ai.vercel.app'
    ];

    // Set CORS headers based on origin
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', 'https://echoline-ai.vercel.app');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
};

// System prompt for chatbot
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
- Multi-language Support
- Analytics Dashboard
- Secure Data Handling
- 24/7 Availability

If a visitor asks about unrelated topics, politely guide them back to discussing Echoline AI's services and features.`;

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

export default async function handler(req, res) {
    // Handle CORS
    if (setCorsHeaders(req, res)) return;

    try {
        // Only allow POST method
        if (req.method !== 'POST') {
            throw new ChatError('Method not allowed', 'method_not_allowed');
        }

        const { message } = req.body;
        if (!message) {
            throw new ChatError('Message is required', 'invalid_request');
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

        res.status(200).json({
            message: response.text(),
            status: 'success'
        });

    } catch (error) {
        console.error('Chat API Error:', error);

        const statusCode = error instanceof ChatError ? 400 : 500;
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        const errorType = error instanceof ChatError ? error.type : 'internal_error';

        res.status(statusCode).json({
            error: errorMessage,
            type: errorType,
            status: 'error'
        });
    }
}
