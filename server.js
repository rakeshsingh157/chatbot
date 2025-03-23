import axios from 'axios';
import dotenv from 'dotenv';
import readline from 'readline';
import say from 'say';
import express from 'express';
import multer from 'multer';
import path from 'path';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
const app = express();
const port = process.env.PORT || 3000;

let chatHistory = [];

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const processTasks = async (taskInput) => {
    try {
        const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent`;

        const fullConversation = chatHistory.join("\n") + `\nYOU: ${taskInput}\nECHOSEAL: `;

        const response = await axios.post(
            API_URL,
            {
                contents: [{
                    parts: [{
                        text: `Chatbot Role:
                                always answers in just 1-2 lines
                                You are Echoseal, the AI assistant for the Echoseal app. Your primary function is to provide accurate and concise responses regarding Echoseal's features, AI detection capabilities, and user support.

                                General FAQs:
                                🔹 What is Echoseal? – Echoseal is an AI detection tool that identifies fake AI-generated content.
                                🔹 How does Echoseal work? – It uses advanced AI algorithms and forensic techniques to analyze and verify authenticity.
                                🔹 Is Echoseal free? – The basic detection feature is free, while advanced features may require a premium plan.

                                Response Guidelines:
                                ✅ Keep responses short and precise.
                                ✅ Adapt to the user’s language.
                                ✅ Maintain a friendly and engaging tone as a female chatbot.

                                Chat history:
                                ${fullConversation}`
                    }]
                }],
                model: "models/gemini-1.5-pro"
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': geminiApiKey,
                },
            }
        );

        const responseContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return responseContent ? responseContent.trim() : "⚠ No valid response.";
    } catch (error) {
        console.error("⚠ ERROR IN API CALL:", error.response?.data || error.message || error);
        throw error;
    }
};

// ✅ Offline Speech Synthesis using "say"
const speak = async (text) => {
    return new Promise((resolve, reject) => {
        say.speak(text, 'Microsoft Zira Desktop', 1.0, (err) => {
            if (err) {
                console.error("⚠ ERROR IN OFFLINE SPEECH SYNTHESIS:", err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// Express route to handle text input
app.use(express.json());

app.post('/chat', async (req, res) => {
    const taskInput = req.body.message;

    if (!taskInput) {
        return res.status(400).send({ error: "Message is required" });
    }

    try {
        const response = await processTasks(taskInput);

        // Speak the response (optional, can be disabled for web)
        await speak(response);

        // Chat history store karna
        chatHistory.push(`YOU: ${taskInput}`);
        chatHistory.push(`Echoseal: ${response}`);

        res.send({ response: response });
    } catch (error) {
        console.error("⚠ UNEXPECTED ERROR OCCURRED:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

// Express route to handle file uploads
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const taskInput = `Analyze the file located at: ${filePath} for AI generated content. Tell me your analysis.`;

    try {
        const response = await processTasks(taskInput);

        // Speak the response (optional)
        await speak(response);

        // Chat history store karna
        chatHistory.push(`YOU: File Uploaded: ${req.file.originalname}`);
        chatHistory.push(`Echoseal: ${response}`);

        res.send({ response: response });
    } catch (error) {
        console.error("⚠ UNEXPECTED ERROR OCCURRED:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});