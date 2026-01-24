
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateQuestionsForRole = async (roleTitle: string, description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 professional interview questions for the role of ${roleTitle}. Role description: ${description}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              duration: { type: Type.NUMBER, description: "Seconds to answer" }
            },
            required: ["text", "duration"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating questions:", error);
    return [];
  }
};
