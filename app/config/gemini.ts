/**
 * Gemini API client for generating AI responses
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export interface GeminiRequestContent {
  parts: { text: string }[];
}

export interface GeminiRequest {
  contents: GeminiRequestContent[];
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

/**
 * Generates a response from the Gemini API
 */
export async function generateGeminiResponse(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated from Gemini API");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error generating response from Gemini:", error);
    throw error;
  }
}

/**
 * Creates a dynamic prompt for the adventure game
 */
export function createGamePrompt(
  character: any,
  action: string,
  history: string[],
  scenario: any
): string {
  // Format character information
  const characterInfo = `
Character Name: ${character.name}
Level: ${character.stats.level}
Abilities:
- Strength: ${character.abilities.strength}
- Dexterity: ${character.abilities.dexterity}
- Constitution: ${character.abilities.constitution}
- Intelligence: ${character.abilities.intelligence}
- Wisdom: ${character.abilities.wisdom}
- Charisma: ${character.abilities.charisma}
`;

  // Format recent history (last 5 turns)
  const recentHistory = history.slice(-5).join("\n");

  // Create the prompt
  return `
You are the Dungeon Master for a text-based D&D-style adventure game. Generate an engaging response to the player's action and provide 4 possible options for what they can do next.

Current location: ${scenario.location}
Current scenario: ${scenario.description}

${characterInfo}

Recent game history:
${recentHistory}

Player's action: ${action}

Generate a response that:
1. Describes what happens when the player performs this action
2. Takes into account the character's abilities (higher ability scores should have a higher chance of success)
3. Continues the adventure in an engaging way
4. Ends with 4 specific options for what the player can do next

Format your response as a JSON object with two fields:
- "response": The narrative description of what happens
- "options": An array of 4 strings representing the possible next actions

Only return valid JSON without any other text.
`;
}
