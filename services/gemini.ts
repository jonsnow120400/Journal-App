import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const getVibeCheck = async (text: string): Promise<string> => {
  if (!ai) return "AI key missing 🤖";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a trendy, supportive, and slightly chaotic Gen Z bestie. 
      Read this journal entry and give a 1-2 sentence "vibe check" or supportive insight. 
      Use slang (like "slay", "bet", "no cap", "main character energy") and emojis appropriately but don't overdo it to the point of cringe.
      Be concise.
      
      Journal Entry: "${text}"`,
    });
    
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Brain freeze 🥶 Try again later.";
  }
};