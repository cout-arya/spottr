const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testSDK() {
    const genAI = new GoogleGenerativeAI(process.env.gemini_key);
    try {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent("Hello world");
        console.log("Success with text-embedding-004", result.embedding.values.slice(0, 3));
    } catch (e) {
        console.error("SDK Error:", e.message);
    }
}
testSDK();
