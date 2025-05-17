import { GoogleGenAI } from "@google/genai";

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);

export const generateSummary = async (text: string): Promise<string> => {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Please provide a concise summary of the following text, highlighting the key points and main ideas. Keep the summary clear and informative:

${text}`,
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    if (!response.text) {
      throw new Error("No summary generated");
    }

    return response.text;
  } catch (error) {
    console.error("Error generating summary:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
    throw new Error("Failed to generate summary");
  }
};
