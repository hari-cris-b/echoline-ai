import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Rate limiting configuration (per-instance, will reset on cold starts)
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

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Rate limiting checks
        const now = Date.now();
        if (now - rateLimiter.lastCall < rateLimiter.minInterval) {
            return res.status(429).json({ 
                error: 'Too many requests',
                message: 'Please wait before sending another message.'
            });
        }

        if (now - rateLimiter.lastMinuteReset > 60000) {
            rateLimiter.callsInLastMinute = 0;
            rateLimiter.lastMinuteReset = now;
        }

        if (rateLimiter.callsInLastMinute >= rateLimiter.maxCallsPerMinute) {
            return res.status(429).json({ 
                error: 'Rate limit exceeded',
                message: 'You have exceeded the maximum number of messages per minute.'
            });
        }

        // Update rate limiting
        rateLimiter.lastCall = now;
        rateLimiter.callsInLastMinute++;

        // Generate chat response
        const prompt = `${SYSTEM_PROMPT}\n\nUser: ${message}\nAssistant:`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ message: text });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'An error occurred while processing your request.'
        });
    }
}
