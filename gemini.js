const { GoogleGenerativeAI } = require("@google/generative-ai");
const https = require('https');
const fs = require('fs');

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// For text-only input, use the gemini-pro model
async function runGeminiPro (prompt) {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro"});
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  return text;
}

//for text and image input, use the gemini-pro-vision model
// Converts local file information to a GoogleGenerativeAI.Part object.
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType
    },
  };
}

async function runGeminiVision(prompt,path,mimeType) {
  // For text-and-image input (multimodal), use the gemini-pro-vision model
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
  const imageParts = [
    fileToGenerativePart(path, mimeType),
  ];
  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  return text;
}

module.exports = { runGeminiPro, runGeminiVision}