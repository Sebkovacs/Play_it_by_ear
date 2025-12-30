

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Scenarios, Player, Award, UserStats, PlaystyleAttributes, Moment, PlayerRole, TopicPack } from "../types";

// Helper to get fresh instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Robust generation wrapper with retry
const safeGenerate = async (model: string, contents: string, config: any, retries = 2): Promise<any> => {
    const ai = getAI();
    try {
        return await ai.models.generateContent({ model, contents, config });
    } catch (e: any) {
        // Retry on 500 (Internal Error) or 503 (Service Unavailable)
        if (retries > 0 && (e.message?.includes("500") || e.status === 500 || e.status === 503)) {
            console.warn(`Gemini ${e.status || '500'} Error, retrying (${retries} left)...`);
            await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
            return safeGenerate(model, contents, config, retries - 1);
        }
        throw e;
    }
};

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

export const generateGameScenarios = async (topics: string[], pack: TopicPack = TopicPack.STANDARD): Promise<Scenarios> => {
  try {
    // Fallback only if absolutely no inputs exist
    const promptInputs = topics.length > 0 ? topics.join(" | ") : "Random";
    
    let styleGuide = "";
    switch (pack) {
        case TopicPack.SCIFI:
            styleGuide = "THEME: Sci-Fi, Fantasy, Space, Magic, Cyberpunk. (e.g., 'Summoning a Demon' vs 'Debugging Code').";
            break;
        case TopicPack.NSFW:
            styleGuide = "THEME: Adult Life, Dating Disasters, Nightlife, Risky Behavior. Keep it PG-13 but spicy/suggestive.";
            break;
        case TopicPack.HISTORY:
            styleGuide = "THEME: Historical Events, Ancient Civilizations, Time Travel. (e.g., 'Building the Pyramids' vs 'Stacking Boxes').";
            break;
        case TopicPack.FOODIE:
            styleGuide = "THEME: Cooking, Fine Dining, Weird Foods, Kitchen Nightmares.";
            break;
        default:
            styleGuide = "THEME: Everyday Life, Relatable awkward situations, chores, social events.";
            break;
    }

    const prompt = `
      System Instruction: You are a comedy writer designed to create hilarious misunderstandings.
      
      PLAYER_INPUTS: "${promptInputs}"
      ${styleGuide}
      
      TASK:
      Create a "Sitcom Misunderstanding" for a social deduction game. 
      Two groups of people are having a conversation. They think they are talking about the same thing, but they are talking about two different (but similar) things.
      
      CRITICAL RULES FOR "FUN":
      1. **KEEP IT SIMPLE & RELATABLE:** Do NOT use complex logic.
      2. **HIGH OVERLAP:** The two scenarios must share 80% of the same vocabulary (verbs, adjectives).
      3. **THE TWIST:** The 20% difference should change the context hilariously.
      
      GOOD EXAMPLES:
      - "Going on a First Date" vs "Job Interview" (Nervous, hoping they like me, dressed up, asked questions).
      - "Getting a Haircut" vs "Mowing the Lawn" (It was getting too long, I cut it short, used a buzzer, looks neat now).
      - "Cooking a Turkey" vs "Performing Surgery" (It took hours, I had to cut it open, used a sharp knife, everyone was watching).
      - "Wrestling a Bear" vs "Cuddling a Puppy" (It was mostly fur and teeth, I was pinned down, lots of growling).

      OUTPUT JSON matching the schema:
      - topic: A 2-4 word summary.
      - scenarioA: Red Team's activity.
      - scenarioB: Blue Team's activity.
      - openingQuestion: A vague question that fits BOTH perfectly.
    `;

    const response = await safeGenerate("gemini-3-flash-preview", prompt, {
        responseMimeType: "application/json",
        responseSchema: scenarioSchema,
        // Removed systemInstruction from config to improve stability with JSON schema
    });

    const text = response.text;
    if (!text) throw new Error("No response text received.");
    return JSON.parse(text) as Scenarios;

  } catch (error) {
    console.error("Gemini API Error in generateGameScenarios:", error);
    // Fallback if API fails completely
    return {
        topic: "Backup: Coffee vs Tea",
        scenarioA: "Drinking Coffee",
        scenarioB: "Drinking Tea",
        openingQuestion: "How do you take it?"
    };
  }
};

// --- CHECK TOPIC SIMILARITY (The Gambit) ---

export const verifyTopicGuess = async (actualTopic: string, userGuess: string): Promise<boolean> => {
    try {
        const prompt = `
            Game: 'Play It By Ear' (Social Deduction).
            
            Secret Topic: "${actualTopic}"
            Outsider's Guess: "${userGuess}"
            
            Task: Is the guess close enough to count as correct?
            - YES if it's a synonym, specific example, or clearly refers to the same concept.
            - NO if it's too vague or unrelated.
            
            Return JSON with a boolean 'match'.
        `;
        
        const schema: Schema = {
            type: Type.OBJECT,
            properties: { match: { type: Type.BOOLEAN } },
            required: ["match"]
        };

        const response = await safeGenerate("gemini-3-flash-preview", prompt, {
             responseMimeType: "application/json", 
             responseSchema: schema 
        });

        const result = JSON.parse(response.text || '{"match": false}');
        return result.match;
    } catch (e) {
        console.error("Verification Error:", e);
        // Fallback: simple string includes check
        return actualTopic.toLowerCase().includes(userGuess.toLowerCase()) || userGuess.toLowerCase().includes(actualTopic.toLowerCase());
    }
};

// --- END GAME AWARDS / RATE YOUR MATES ---

export const generateEndGameAwards = async (
  players: Player[],
  descriptors: Record<string, string[]>,
  reasons: Record<string, string[]>
): Promise<Record<string, Award>> => {
  try {
    const playerSummaries = players.map(p => {
        const tags = descriptors[p.id] || [];
        const voteHistory = reasons[p.id] || [];
        const mvpCount = voteHistory.filter(r => r.includes("MVP")).length;
        const susCount = voteHistory.filter(r => r.includes("Suspicion")).length;
        
        return `Player: ${p.name} (ID: ${p.id})
        - Tags: ${tags.join(', ') || "None"}
        - MVP Votes: ${mvpCount}
        - Sus Votes: ${susCount}`;
    }).join('\n\n');

    const prompt = `
      System Instruction: You are the HOST of the Award Ceremony.
      
      Player Data:
      ${playerSummaries}

      Task:
      Give each player a fun "Superlative" award.
      
      Guidelines:
      1. **Tone:** Playful, celebratory, slightly roasting (friendly).
      2. **Content:** Base it on their tags and votes.
      3. **Output:** A list of awards.
      
      Output JSON matching the schema.
    `;

    // Wrapped in an object to be safer for JSON schema generation
    const responseSchema: Schema = {
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
                    },
                    required: ["playerId", "title", "description", "emoji"]
                }
            }
        },
        required: ["awards"]
    };

    const response = await safeGenerate("gemini-3-flash-preview", prompt, {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
    });

    const data = JSON.parse(response.text || "{}");
    const awardsList = data.awards || [];
    
    const resultMap: Record<string, Award> = {};
    
    // Map back using IDs if possible, or index fallback if IDs match order (but ID is safer)
    awardsList.forEach((award: any) => {
        if (award.playerId) {
            resultMap[award.playerId] = {
                title: award.title,
                description: award.description,
                emoji: award.emoji
            };
        }
    });
    
    // Fill gaps
    players.forEach(p => {
        if (!resultMap[p.id]) {
            resultMap[p.id] = { title: "Participation Trophy", description: "Thanks for showing up!", emoji: "🎗️" };
        }
    });

    return resultMap;
  } catch (error) {
    console.error("End Game Award Error:", error);
    return {};
  }
};

// --- ADVANCED PERSONA & NARRATIVE ---

export const generatePersona = async (stats: UserStats, awards: any[]): Promise<{ title: string, description: string, archetype: string, attributes: PlaystyleAttributes }> => {
    try {
        const prompt = `
          Create a "Party Persona" based on this player's stats.
          
          Stats:
          - Games: ${stats.gamesPlayed}
          - Wins: ${stats.wins}
          - Awards: ${awards.map(a => a.title).join(', ')}
          
          Task:
          1. Determine their vibe.
          2. Score 5 Attributes (0-100): chaos, smarts, vibes, stealth, luck.
          3. Assign a Fun Archetype.
          4. Write a 1-sentence bio.

          Output JSON.
        `;
        
        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                archetype: { type: Type.STRING },
                attributes: {
                    type: Type.OBJECT,
                    properties: {
                        chaos: { type: Type.NUMBER },
                        smarts: { type: Type.NUMBER },
                        vibes: { type: Type.NUMBER },
                        stealth: { type: Type.NUMBER },
                        luck: { type: Type.NUMBER }
                    },
                    required: ["chaos", "smarts", "vibes", "stealth", "luck"]
                }
            },
            required: ["title", "description", "archetype", "attributes"]
        };

        const response = await safeGenerate("gemini-3-flash-preview", prompt, {
            responseMimeType: "application/json", 
            responseSchema: schema 
        });
        
        const res = JSON.parse(response.text || "{}");
        return {
            title: res.title || "Party Guest",
            description: res.description || "Ready to mingle.",
            archetype: res.archetype || "Newcomer",
            attributes: res.attributes || { chaos: 50, smarts: 50, vibes: 50, stealth: 50, luck: 50 }
        };
    } catch (e) {
        return { 
            title: "Party Guest", 
            description: "Ready to mingle.", 
            archetype: "Newcomer",
            attributes: { chaos: 50, smarts: 50, vibes: 50, stealth: 50, luck: 50 } 
        };
    }
};

// SCOUTING REPORT
export const generateScoutingReport = async (stats: UserStats): Promise<string> => {
    try {
        if (!stats.relationships || Object.keys(stats.relationships).length === 0) {
            return "No play history found.";
        }

        const rels = Object.values(stats.relationships)
            .sort((a,b) => b.gamesPlayed - a.gamesPlayed)
            .slice(0, 5)
            .map(r => `Vs ${r.playerName}: Played ${r.gamesPlayed}. Won together ${r.winsWith}. Accused me ${r.accusedMe} times.`)
            .join('\n');

        const prompt = `
            You are a Sports Commentator for a party game.
            
            Data:
            ${rels}
            
            TASK:
            Write a 2-sentence summary of who this player loves to play with and who is their rival.
            Keep it punchy and fun.
        `;

        const response = await safeGenerate("gemini-3-flash-preview", prompt, {
            responseMimeType: "text/plain"
        });

        return response.text || "Analysis pending.";

    } catch (e) {
        return "Analysis pending.";
    }
};

// MOMENT GENERATION
export const generateMoment = async (role: PlayerRole, topic: string, won: boolean, reason: string): Promise<Moment> => {
    try {
        const prompt = `
            Create a "Highlight Reel" title for this game moment.
            
            Context:
            - Role: ${role}
            - Topic: ${topic}
            - Result: ${won ? "WON" : "LOST"}
            - Details: ${reason}
            
            Create:
            1. title: A catchy YouTube-style title.
            2. summary: A short description.
            3. emoji: ONE relevant emoji.
            
            Return JSON.
        `;

        const schema: Schema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                emoji: { type: Type.STRING }
            },
            required: ["title", "summary", "emoji"]
        };

        const response = await safeGenerate("gemini-3-flash-preview", prompt, {
            responseMimeType: "application/json", 
            responseSchema: schema 
        });

        const res = JSON.parse(response.text || "{}");
        
        return {
            id: Date.now().toString(),
            title: res.title || "Big Play",
            summary: res.summary || `Played as ${role} regarding ${topic}`,
            emoji: res.emoji || "🎬",
            topic: topic,
            role: role,
            timestamp: Date.now(),
            isPinned: false
        };

    } catch (e) {
        return {
             id: Date.now().toString(),
             title: "Game Highlight",
             summary: `Game about ${topic}`,
             emoji: "🎮",
             topic,
             role,
             timestamp: Date.now(),
             isPinned: false
        };
    }
};

export const generateAwards = async () => ({});