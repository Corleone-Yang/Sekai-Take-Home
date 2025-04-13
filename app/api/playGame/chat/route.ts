import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { generateGeminiResponse } from "../../../config/gemini";
import { SendMessageRequest } from "../model";
import { playGameService } from "../service";

// Initialize supabaseAdmin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
);

// Chat message endpoint
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    const messageRequest: SendMessageRequest = {
      game_session_id: body.game_session_id,
      message: body.message,
    };

    // If this is a direct message test without a game session
    if (body.game_session_id === "test-session-id") {
      try {
        // Get story information if available in the request
        const storyId = body.story_id;
        const playerCharacterId = body.player_character_id;

        // Variables to store character and story information
        let storyInfo = null;
        let allCharacters = [];
        let npcCharacters = [];

        // Try to get real story and characters from database
        try {
          // If story_id is provided, get that specific story
          if (storyId) {
            const { data: story, error: storyError } = await supabaseAdmin
              .from("stories")
              .select("*")
              .eq("story_id", storyId)
              .single();

            if (!storyError && story) {
              storyInfo = story;

              // Get all characters for this story
              const { data: characters, error: charError } = await supabaseAdmin
                .from("characters")
                .select("*")
                .eq("story_id", storyId);

              if (!charError && characters && characters.length > 0) {
                allCharacters = characters;

                // Filter out player character if specified
                if (playerCharacterId) {
                  npcCharacters = characters.filter(
                    (char) => char.character_id !== playerCharacterId
                  );
                } else {
                  // If no player character ID is specified, check the isplayer flag
                  npcCharacters = characters.filter(
                    (char) => char.isplayer !== true
                  );
                }
              }
            }
          } else {
            // If no specific story, get a random one with multiple characters
            const { data: stories, error: storyError } = await supabaseAdmin
              .from("stories")
              .select("*")
              .order("character_num", { ascending: false }) // Prefer stories with more characters
              .limit(5);

            if (!storyError && stories && stories.length > 0) {
              // Find a story with multiple characters
              for (const story of stories) {
                const { data: characters, error: charError } =
                  await supabaseAdmin
                    .from("characters")
                    .select("*")
                    .eq("story_id", story.story_id);

                if (!charError && characters && characters.length > 1) {
                  storyInfo = story;
                  allCharacters = characters;
                  npcCharacters = characters;
                  break;
                }
              }
            }
          }
        } catch (dbError) {
          console.error(
            "Error fetching story/characters from database:",
            dbError
          );
        }

        // If no characters found in database, use request info or default values
        if (npcCharacters.length === 0) {
          // Use character info from request body if available
          if (
            body.character_info &&
            body.character_info.npc_characters &&
            body.character_info.npc_characters.length > 0
          ) {
            npcCharacters = body.character_info.npc_characters.map((char) => ({
              character_id: char.id,
              name: char.name,
            }));
          } else {
            // Default to two generic characters
            npcCharacters = [
              {
                character_id: "test-character-id-1",
                name: "Character 1",
              },
              {
                character_id: "test-character-id-2",
                name: "Character 2",
              },
            ];
          }
        }

        // Determine how many NPCs should respond (all available NPCs)
        const responseCount = npcCharacters.length;

        // Generate the prompt for Gemini based on available characters
        const characterList = npcCharacters
          .map((char) => `- ${char.name}`)
          .join("\n");

        // Generate a direct response using appropriate character roles
        const prompt = `
You are simulating characters in an interactive conversation.
The player is roleplaying as a character and you are generating responses for ${responseCount} other characters.

Create responses for these characters:
${characterList}

Character responses should reflect:
- A personality that matches their name and likely role in the story
- Appropriate knowledge and background for their character type
- Any context from the conversation so far
- Direct reaction to the player's message: "${body.message}"

IMPORTANT: 
- Respond in first person as each character
- Keep responses conversational and brief (1-3 sentences each)
- Do not include character names as labels - the system will add them automatically
- Format as ${responseCount} separate paragraphs, one for each character in the order listed above
`;

        const geminiResponse = await generateGeminiResponse(prompt);

        // Split the gemini response into separate character responses
        const responseLines = geminiResponse.split("\n\n");

        // Create response objects for each NPC character
        const characterResponses = npcCharacters.map((char, index) => {
          // Get the corresponding response text, or generate a fallback if missing
          const responseText =
            responseLines[index] ||
            `I'm ${char.name}. I'm here to interact with you in this story.`;

          return {
            character_id: char.character_id,
            character_name: char.name,
            content: responseText,
            timestamp: new Date(Date.now() + index * 500), // Stagger timestamps
          };
        });

        return NextResponse.json({
          responses: characterResponses,
        });
      } catch (geminiError) {
        return NextResponse.json(
          {
            error: "Failed to generate test response",
            message: "Could not connect to Gemini API",
            detail:
              geminiError instanceof Error
                ? geminiError.message
                : String(geminiError),
          },
          { status: 500 }
        );
      }
    }

    // Normal processing with game session
    try {
      const response = await playGameService.processMessage(messageRequest);
      return NextResponse.json(response);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to process message",
          message: error instanceof Error ? error.message : "Unknown error",
          detail: "Make sure the game session exists and is active",
        },
        { status: 500 }
      );
    }
  } catch (parseError) {
    return NextResponse.json(
      {
        error: "Invalid request",
        message: "Could not parse request body",
        detail:
          parseError instanceof Error ? parseError.message : String(parseError),
      },
      { status: 400 }
    );
  }
}
