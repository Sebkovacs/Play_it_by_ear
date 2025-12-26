
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Scenarios, Player, Award, UserStats } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- SCENARIO GENERATION ---

const scenarioSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    scenarioA: { type: Type.STRING },
    scenarioB: { type: Type.STRING },
    openingQuestion: { type: Type.STRING },
    topic: { type: Type.STRING }
  },
  required: ["scenarioA", "scenarioB", "topic", "openingQuestion"],
};

export const generateGameScenarios = async (topic?: string): Promise<Scenarios> => {
  try {
    const promptTopic = topic ? topic : "a gathering involving a box";
    
    const prompt = `
      You are the Game Master for "It By Ear".
      The Topic is: "${promptTopic}".

      Generate two scenarios that are COMPLETELY DIFFERENT in context, but allow for SIMILAR vague conversation.
      
      A: Serious/High Stakes/Dramatic.
      B: Absurd/Gross/Silly/Trivial.
      Opening: A vague question that fits BOTH.

      Example: 
      A: "performing open heart surgery"
      B: "stuffing a thanksgiving turkey"
      Opening: "Alright, who wants to make the first incision?"
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scenarioSchema,
        systemInstruction: "You are a clever, dry-humored game designer. Keep scenarios distinct but compatible.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text received.");
    return JSON.parse(text) as Scenarios;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// --- ROUND AWARDS (Legacy/Optional) ---
export const generateAwards = async (players: Player[], scenarios: Scenarios, winnerName: string): Promise<Record<string, Award>> => {
     // Simplified for round awards to keep flow fast
     return {}; 
};

// --- END GAME AWARDS (Based on Voting) ---

export const generateEndGameAwards = async (
  players: Player[],
  descriptors: Record<string, string[]>,
  reasons: Record<string, string[]>
): Promise<Record<string, Award>> => {
  try {
    // Construct a summary for the AI
    const playerSummaries = players.map(p => {
        const tags = descriptors[p.id] || [];
        const comments = reasons[p.id] || [];
        return `Player: ${p.name} (ID: ${p.id})
        - Tags received: ${tags.join(', ')}
        - Peer Comments: ${comments.join(' | ')}`;
    }).join('\n\n');

    const prompt = `
      Based on the social feedback below, generate a Sarcastic, Funny, or Savage award for EACH player.
      
      Players Data:
      ${playerSummaries}

      Return a JSON List corresponding to the players order above.
      Each award needs: 'title' (short, punchy), 'description' (why they got it, referencing the tags/comments), and an 'emoji'.
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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: listSchema },
    });

    const listData = JSON.parse(response.text || "[]");
    const resultMap: Record<string, Award> = {};
    
    players.forEach((p, index) => {
        if (listData[index]) {
            resultMap[p.id] = listData[index];
        } else {
            resultMap[p.id] = { title: "The Ghost", description: "Functionally invisible.", emoji: "👻" };
        }
    });

    return resultMap;
  } catch (error) {
    console.error("End Game Award Error:", error);
    return {};
  }
};

// --- PERSONA GENERATION (Persistent Profile) ---

export const generatePersona = async (stats: UserStats, awards: any[]): Promise<{ title: string, description: string }> => {
    try {
        const prompt = `
          Analyze this player's history and generate a "Vibe Title" and a "Roast Bio".
          
          Stats: ${stats.gamesPlayed} games, ${stats.wins} wins.
          Past Awards: ${awards.map(a => a.title).join(', ')}.
          
          Output JSON: { "title": "e.g. The Chaos Agent", "description": "e.g. Known for being loud and wrong." }
        `;
        
        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
            }
        };

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        
        return JSON.parse(response.text || `{"title": "The NPC", "description": "Just existing."}`);
    } catch (e) {
        return { title: "The Unknown", description: "Mystery player." };
    }
};
