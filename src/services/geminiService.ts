import { Word, Difficulty } from "../types";

export interface BulkWordInput {
  text: string;
}

export async function processBulkWords(words: string[]): Promise<Partial<Word>[]> {
  if (words.length === 0) return [];

  try {
    const response = await fetch('/api/words/bulk-process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ words })
    });

    if (!response.ok) {
      throw new Error(`Failed to process words: ${response.statusText}`);
    }

    const { results } = await response.json();
    return results.map((w: any) => ({
      ...w,
      id: crypto.randomUUID()
    }));
  } catch (error) {
    console.error("Error processing words via API:", error);
    // Return partial results or empty list on error
    return [];
  }
}
