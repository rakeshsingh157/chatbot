import axios from 'axios';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let chatHistory = [];

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

const askTask = () => {
    rl.question("YOU: ", async (taskInput) => {
        if (taskInput.toLowerCase() === "exit") {
            console.log("\n👋 Bye! Conversation Ended.");
            rl.close();
            return;
        }

        try {
            const response = await processTasks(taskInput);
            console.log(`Echoseal: ${response}\n`);

            // Chat history store karna
            chatHistory.push(`YOU: ${taskInput}`);
            chatHistory.push(`Echoseal: ${response}`);
        } catch (error) {
            console.error("⚠ UNEXPECTED ERROR OCCURRED:", error);
        }

        askTask();
    });
};

askTask();