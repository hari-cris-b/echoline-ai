const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Handle POST request
    if (req.method === 'POST') {
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
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
