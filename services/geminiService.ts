import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Scenarios, Player, Award } from "../types";

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

export const generateAwards = async (
  players: Player[], 
  scenarios: Scenarios, 
  winnerName: string
): Promise<Record<string, Award>> => {
  try {
    const prompt = `
      The game "It By Ear" has just ended.
      Scenario A was: "${scenarios.scenarioA}".
      Scenario B was: "${scenarios.scenarioB}".
      The Winner was: ${winnerName}.

      Players:
      ${players.map(p => `- ${p.name} (Role: ${p.role})`).join('\n')}

      Generate a funny, sarcastic, or congratulatory "Award" for EACH player based on their role and the scenarios.
      The award should have a 'title' (max 5 words), a 'description' (max 1 sentence), and a relevant 'emoji'.
      
      Return a JSON object where keys are the Player IDs and values are the award objects.
    `;
    
    const awardSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        awards: {
          type: Type.ARRAY,
          items: {
             type: Type.OBJECT,
             properties: {
                playerId: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                emoji: { type: Type.STRING }
             }
          }
        }
      }
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: awardSchema
      },
    });

    const text = response.text;
    if (!text) return {};

    const data = JSON.parse(text);
    const resultMap: Record<string, Award> = {};
    
    // Map array back to object keyed by ID for easier lookup
    // We have to map manually because we can't enforce dynamic keys in schema easily with player IDs that vary
    // So we asked for an array of objects with playerId inside
    if (data.awards) {
        data.awards.forEach((item: any) => {
            // Find correct ID by matching name or assuming the model followed instructions order.
            // Ideally the model outputs the ID we passed in.
            // We'll pass the list of players to the prompt so it knows the mapping.
            // Let's rely on the model returning the IDs we provide in the text context implicitly?
            // Actually, better to pass the IDs in the prompt text explicitly.
        });
    }
    
    // Correction: To ensure ID matching, let's just parse the JSON array and map it.
    // We will assume the model uses the Names to generate, but we need to link back to IDs.
    // Let's try a different schema structure that is safer.
    
    // Simplified approach: Just ask for an array of awards in the same order as the players list provided.
    const simplePrompt = `
      Players List (in order):
      ${players.map(p => p.name).join(', ')}

      Scenarios: ${scenarios.scenarioA} vs ${scenarios.scenarioB}.
      Winner: ${winnerName}.

      Generate a JSON list of awards, one for each player IN THE SAME ORDER as listed above.
    `;
    
    const listSchema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                emoji: { type: Type.STRING }
            }
        }
    };

     const listResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: simplePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: listSchema
      },
    });

    const listData = JSON.parse(listResponse.text || "[]");
    
    players.forEach((p, index) => {
        if (listData[index]) {
            resultMap[p.id] = listData[index];
        } else {
            resultMap[p.id] = { title: "Participation Award", description: "You were definitely there.", emoji: "😐" };
        }
    });

    return resultMap;

  } catch (error) {
    console.error("Award Generation Error:", error);
    return {};
  }
};