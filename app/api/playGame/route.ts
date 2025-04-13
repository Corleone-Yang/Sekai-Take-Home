import { UUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { SelectPlayerCharacterRequest, SendMessageRequest } from "./model";
import { playGameService } from "./service";

// Get available stories endpoint
export async function GET(request: NextRequest) {
  try {
    // Check the path to determine which endpoint to call
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const endpoint = pathParts[pathParts.length - 1];

    // If requesting stories
    if (endpoint === "stories") {
      const response = await playGameService.getStories();
      return NextResponse.json(response);
    }

    // If requesting characters for a story
    const storyIdMatch = url.pathname.match(/\/characters\/([^\/]+)/);
    if (storyIdMatch) {
      const storyId = storyIdMatch[1] as UUID;
      const response = await playGameService.getCharactersForStory(storyId);
      return NextResponse.json(response);
    }

    // If no valid endpoint matched
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  } catch (error) {
    console.error("Error in GET request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

// Select player character endpoint
export async function POST(request: NextRequest) {
  try {
    // Check the path to determine which endpoint to call
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const endpoint = pathParts[pathParts.length - 1];

    // Parse the request body
    const body = await request.json();

    // If selecting a character
    if (endpoint === "select-character") {
      const selectRequest: SelectPlayerCharacterRequest = {
        story_id: body.story_id,
        character_id: body.character_id,
        user_id: body.user_id,
      };

      const response = await playGameService.selectPlayerCharacter(
        selectRequest
      );
      return NextResponse.json(response);
    }

    // If sending a message
    if (endpoint === "chat") {
      const messageRequest: SendMessageRequest = {
        game_session_id: body.game_session_id,
        message: body.message,
      };

      const response = await playGameService.processMessage(messageRequest);
      return NextResponse.json(response);
    }

    // If no valid endpoint matched
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
