import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta2/models/chat-bison-001:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GOOGLE_API_KEY}`
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "system",
                        parts: [{
                            text: "You are an AI chatbot assistant for Echoline AI, a company that provides AI-powered chat solutions for businesses. You help answer questions about our services, pricing, and features. Be professional, helpful, and concise. Our pricing plans start at $29/month for basic features and go up to $99/month for premium features. We offer custom enterprise solutions as well."
                        }]
                    },
                    {
                        role: "user",
                        parts: [{
                            text: message
                        }]
                    }
                ],
                safetySettings: [{
                    category: "HARM_CATEGORY_DEROGATORY",
                    threshold: "BLOCK_NONE"
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    candidateCount: 1,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response format from API');
        }

        res.json({ response: data.candidates[0].content.parts[0].text });
    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ 
            error: 'Failed to get response',
            message: error.message 
        });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
