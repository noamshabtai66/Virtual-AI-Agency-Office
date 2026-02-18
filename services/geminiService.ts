
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export const getGeminiResponse = async (
  prompt: string, 
  systemInstruction: string,
  onStream?: (text: string) => void
): Promise<string> => {
  // Always initialize with the direct named parameter for API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    // Directly access .text property from GenerateContentResponse
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "שגיאה בתקשורת עם השרת. אנא נסה שנית.";
  }
};
