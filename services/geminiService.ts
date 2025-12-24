import { HistoricalEvent } from "../types";


export const fetchEventDetailsBatch = async (eventNames: string[]): Promise<HistoricalEvent[]> => {
  if (eventNames.length === 0) return [];

  try {
    const response = await fetch('/api/events/batch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventNames }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Gemini Batch API Error:", error);
    throw error;
  }
};
