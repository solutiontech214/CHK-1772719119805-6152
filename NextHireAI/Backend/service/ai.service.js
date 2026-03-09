const { GoogleGenAI }=require("@google/genai");

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

async function makeRequest() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: "explain the theory of relativity in simple terms",
  });
  console.log(response.text);
}

module.exports = makeRequest;