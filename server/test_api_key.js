require('dotenv').config();
const axios = require('axios');

async function testKey() {
    const key = process.env.OPENROUTER_API_KEY;
    console.log("Key loaded:", key ? "YES (Length: " + key.length + ")" : "NO");

    if (!key) {
        console.error("ERROR: No API Key found in .env");
        return;
    }

    try {
        console.log("Attempting API call to OpenRouter...");
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "mistralai/mistral-7b-instruct:free",
                messages: [{ role: "user", content: "Test" }],
            },
            {
                headers: {
                    "Authorization": `Bearer ${key}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                },
            }
        );
        console.log("SUCCESS: API Call worked!");
        console.log("Response:", response.data.choices[0].message.content);
    } catch (error) {
        console.error("FAILURE: API Call failed.");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

testKey();
