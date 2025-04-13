import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { generateGeminiResponse } from "../../../config/gemini";
import { SendMessageRequest } from "../model";
import { playGameService } from "../service";

// 初始化supabaseAdmin
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
        // Initialize with generic character names
        let firstCharacter = {
          character_id: "test-character-id-1",
          character_name: "Character 1", // Generic name instead of hardcoded
          content: "",
          timestamp: new Date(),
        };

        let secondCharacter = {
          character_id: "test-character-id-2",
          character_name: "Character 2", // Generic name instead of hardcoded
          content: "",
          timestamp: new Date(Date.now() + 1000),
        };

        // Use character info from request body if available
        if (
          body.character_info &&
          body.character_info.npc_characters &&
          body.character_info.npc_characters.length > 0
        ) {
          if (body.character_info.npc_characters[0]) {
            firstCharacter.character_id =
              body.character_info.npc_characters[0].id ||
              firstCharacter.character_id;
            firstCharacter.character_name =
              body.character_info.npc_characters[0].name ||
              firstCharacter.character_name;
          }

          if (body.character_info.npc_characters[1]) {
            secondCharacter.character_id =
              body.character_info.npc_characters[1].id ||
              secondCharacter.character_id;
            secondCharacter.character_name =
              body.character_info.npc_characters[1].name ||
              secondCharacter.character_name;
          }
        }

        // Always try to get real characters from database regardless of request info
        try {
          // Try to find a story with family/parent-related characters
          const { data: stories, error: storyError } = await supabaseAdmin
            .from("stories")
            .select("*")
            .limit(5); // Get a few stories to find better matching ones

          if (!storyError && stories && stories.length > 0) {
            // Loop through stories to find appropriate characters
            for (const story of stories) {
              const { data: characters, error: charError } = await supabaseAdmin
                .from("characters")
                .select("*")
                .eq("story_id", story.story_id);

              if (!charError && characters && characters.length > 1) {
                // If we have multiple characters in a story, use them
                if (characters[0]) {
                  firstCharacter.character_id = characters[0].character_id;
                  firstCharacter.character_name = characters[0].name;
                }

                if (characters[1]) {
                  secondCharacter.character_id = characters[1].character_id;
                  secondCharacter.character_name = characters[1].name;
                }

                // Exit the loop once we've found suitable characters
                break;
              }
            }
          }
        } catch (dbError) {
          console.error("Error fetching characters from database:", dbError);
          // Continue with generic character names if DB fails
        }

        // Generate a direct response using appropriate character roles
        const prompt = `
You are simulating characters in an interactive conversation.
The player is roleplaying as another character and you are generating responses for these characters.

Create responses for these two characters:
- ${firstCharacter.character_name}
- ${secondCharacter.character_name}

Character responses should reflect:
- A personality that matches their name and likely role in the story
- Appropriate knowledge and background for their character type
- Any context from the conversation so far
- Direct reaction to the player's message: "${body.message}"

IMPORTANT: 
- Respond in first person as each character
- Keep responses conversational and brief (1-3 sentences each)
- Do not include character names as labels - the system will add them automatically
- Format as two separate paragraphs, one for each character
`;

        const geminiResponse = await generateGeminiResponse(prompt);

        // Split the gemini response to create responses from two different characters
        const responseLines = geminiResponse.split("\n\n");

        // Update the character responses with the content from Gemini
        firstCharacter.content =
          responseLines[0] ||
          geminiResponse.substring(0, geminiResponse.length / 2);
        secondCharacter.content =
          responseLines[1] ||
          "I find this all quite amusing! Let me show you around, but don't be surprised if we run into some... unexpected adventures.";

        return NextResponse.json({
          responses: [firstCharacter, secondCharacter],
        });
      } catch (geminiError) {
        console.error("Error using Gemini for test message:", geminiError);
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
      console.error("Error processing message:", error);
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
    console.error("Error parsing request:", parseError);
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
