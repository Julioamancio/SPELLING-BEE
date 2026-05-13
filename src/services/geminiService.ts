import { GoogleGenAI, Type } from "@google/genai";
import { Word, Difficulty } from "../types";

export interface BulkWordInput {
  text: string;
}

// Lazy initialization of GoogleGenAI
let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Settings > Secrets panel.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function processBulkWords(words: string[]): Promise<Partial<Word>[]> {
  if (words.length === 0) return [];

  try {
    const ai = getGenAI();
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following list of English words for a Spelling Bee competition. 
      For each word, provide:
      1. The word itself.
      2. A simple IPA pronunciation.
      3. The meaning in Portuguese.
      4. Difficulty level (EASY, MEDIUM, or HARD) based on spelling complexity for a middle school student.
      
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

    const resultText = response.text || '[]';
    const results = JSON.parse(resultText);

    return results.map((w: any) => ({
      ...w,
      id: crypto.randomUUID()
    }));
  } catch (error) {
    console.error("Error processing words with Gemini:", error);
    // Return partial results or empty list on error
    return [];
  }
}
