import { NextRequest, NextResponse } from "next/server";
import { generateGeminiResponse } from "../../../config/gemini";
import { SendMessageRequest } from "../model";
import { playGameService } from "../service";

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
        // Generate a direct response using Gemini
        const prompt = `
You are a helpful AI assistant in a text-based game. 
Respond to the following message from a player in a friendly and engaging way:

Player message: "${body.message}"

Your response should be 1-2 sentences and conversational in tone.
`;

        const geminiResponse = await generateGeminiResponse(prompt);

        return NextResponse.json({
          responses: [
            {
              character_id: "test-character-id",
              character_name: "Game Assistant",
              content: geminiResponse,
              timestamp: new Date(),
            },
          ],
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
