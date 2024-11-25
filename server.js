import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Reset rate limiter counts every minute
setInterval(() => {
    rateLimiter.callsInLastMinute = 0;
    rateLimiter.lastMinuteReset = Date.now();
}, 60000);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
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
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        res.json({ message: text });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'An error occurred while processing your request.'
        });
    }
});

// Catch-all route to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
