import { GoogleGenAI, Type } from "@google/genai";
import { Word, Difficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface BulkWordInput {
  text: string;
}

export async function processBulkWords(words: string[]): Promise<Partial<Word>[]> {
  if (words.length === 0) return [];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following list of English words for a Spelling Bee competition. 
    For each word, provide:
    1. The word itself.
    2. A simple IPA pronunciation.
    3. The meaning in Portuguese.
    4. Difficulty level (Easy, Medium, or Hard) based on spelling complexity for a middle school student.
    
    Words: ${words.join(", ")}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            pronunciation: { type: Type.STRING },
            meaning: { type: Type.STRING },
            difficulty: { 
              type: Type.STRING,
              enum: [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD]
            }
          },
          required: ["text", "pronunciation", "meaning", "difficulty"]
        }
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '[]');
    return result.map((w: any) => ({
      ...w,
      id: crypto.randomUUID()
    }));
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return [];
  }
}
