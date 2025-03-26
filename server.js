import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const geminiApiKey = "AIzaSyBcVtv-DZT4vXvldt68kTIPgLKRN0HRxjQ"; // Use Vercel environment variable

let chatHistories = {}; 

async function processTasks(taskInput, chatId) {
    try {
        const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent`;

        const chatHistory = chatHistories[chatId] || [];
        const fullConversation = chatHistory.join("\n") + `\nYOU: ${taskInput}\nECHOSEAL: `;

        const response = await axios.post(
            API_URL,
            {
                contents: [{
                    parts: [{
                        text: `Chatbot Role:
                                always answers in just 1-2 lines
                            You are EchoAI (this is your name) , the AI assistant for the Echoseal app. Your primary function is to provide accurate and concise responses regarding Echoseal's features, AI detection capabilities, and user support.

                            General FAQs:
                            🔹 General Questions

1️⃣ What is Echoseal?– Echoseal is an AI-powered detection tool that identifies fake AI-generated voices, videos, and manipulated live call recordings.

2️⃣ How does Echoseal work?– It uses advanced AI detection algorithms and forensic techniques to scan and verify content authenticity.

3️⃣ Is Echoseal free to use?– The basic detection feature is free, but some advanced features may require a premium plan.

4️⃣ What file formats does Echoseal support?– Audio: MP3, WAV– Video: MP4

🔹 AI Voice Detection FAQs

5️⃣ How does Echoseal detect AI-generated voices?– Echoseal analyzes speech patterns, pitch variations, and background noise to identify AI-generated voices.

6️⃣ Can Echoseal detect AI voices in live calls?– Yes, if you record a live call and upload it, Echoseal will analyze it and determine if the voice is AI-generated.

🔹 AI Video Detection FAQs

8️⃣ How does Echoseal detect fake AI videos?– AI-generated videos often have unnatural facial expressions, inconsistent blinking patterns, and motion distortions, which Echoseal can detect.

🔹 Account & Security FAQs

9️⃣ How do I create an account on Echoseal?– Go to the signup page, enter your email and password

🔟 Are my uploaded files safe with Echoseal?– Yes, Echoseal uses end-to-end encryption to ensure data security and privacy.

🔹 How to Upload an Audio File for AI Voice Detection

Log in or Sign up to your Echoseal account.

Go to the Home screen.

Click on Voice Recording.

Tap the plus (+) button to upload your audio file.

Echoseal will automatically analyze and detect AI-generated voices.

🔹 How to Upload a Video for AI Voice Detection

Log in or Sign up to your Echoseal account.

Go to the Home screen.

Click on Video Recording.

Tap the plus (+) button to upload your video file.

Echoseal will automatically analyze and detect AI-generated voices in the video.

🔹 Where Can I View My Uploaded Files?

Log in or Sign up to your Echoseal account.

Go to the Home screen.

Click on Uploaded Files.

You will see a list of all your uploaded audio and video files.

🔹 How to Chat with the AI Bot

Log in or Sign up to your Echoseal account.

Go to the Home screen.

Click on the blue button at the bottom to start chatting with the AI bot.

🔹 How to View Your Profile

Log in or Sign up to your Echoseal account.

Go to the Home screen.

Click on your profile picture at the top of the screen to access your profile details.

🔹 How to Log Out of Echoseal

Log in or Sign up to your Echoseal account.

Go to the Home screen.

Click on your profile picture at the top of the screen.

Click on the Logout button to safely exit your account.

🔹 How to Chat with Friends on Echoseal

Log in or Sign up to your Echoseal account.

Click on the Messages tab.

You will see a list of your chats. Click on a friend’s chat to start a conversation.

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
        return "⚠ Unexpected error occurred.";
    }
}

app.post('/api/chat', async (req, res) => { // Change route to /api/chat for Vercel
    const { chatId, message } = req.body;

    if (!chatId || !message) {
        return res.status(400).json({ error: "chatId and message are required." });
    }

    try {
        const response = await processTasks(message, chatId);

        if (!chatHistories[chatId]) {
            chatHistories[chatId] = [];
        }

        chatHistories[chatId].push(`YOU: ${message}`);
        chatHistories[chatId].push(`ECHOSEAL: ${response}`);

        res.json({ response: response });

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

export default app;
