import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Scenarios } from "../types";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the response schema for strict JSON output
const scenarioSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    scenarioA: {
      type: Type.STRING,
      description: "Scenario A: The Serious/Formal context. A specific event where people must behave politely or professionally. About 1 sentence.",
    },
    scenarioB: {
      type: Type.STRING,
      description: "Scenario B: The Absurd/Casual context. A ridiculous or chaotic event that theoretically shares the same physical actions or vague phrases as A. About 1 sentence.",
    },
    topic: {
        type: Type.STRING,
        description: "The topic used for generation."
    }
  },
  required: ["scenarioA", "scenarioB", "topic"],
};

export const generateGameScenarios = async (topic?: string): Promise<Scenarios> => {
  try {
    const promptTopic = topic ? topic : "a gathering involving a box";
    
    const prompt = `
      You are the Game Master for "It By Ear".
      The User Topic is: "${promptTopic}".

      Generate two scenarios that are COMPLETELY DIFFERENT in context, but allow for SIMILAR vague conversation.
      
      CRITICAL RULE: Both scenarios must involve similar physical actions or emotional tones so players can confuse them.
      
      1. Scenario A (Serious): A high-stakes, formal, or somber event (e.g., "Diffusing a bomb", "A heart surgery", "A funeral").
      2. Scenario B (Absurd): A low-stakes, silly, or gross event (e.g., "Changing a diaper", "Carving a pumpkin", "Assembling IKEA furniture").

      Example match: 
      A: "performing open heart surgery"
      B: "stuffing a thanksgiving turkey"
      (Shared vague phrases: "It's so slippery", "Put your hand inside", "Don't mess this up").
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scenarioSchema,
        systemInstruction: "You are a clever game designer creating scenarios for a social deduction game.",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    const data = JSON.parse(text) as Scenarios;
    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};