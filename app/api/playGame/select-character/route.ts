import { NextRequest, NextResponse } from "next/server";
import { SelectPlayerCharacterRequest } from "../model";
import { playGameService } from "../service";

// Select player character endpoint
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    const selectRequest: SelectPlayerCharacterRequest = {
      story_id: body.story_id,
      character_id: body.character_id,
      user_id: body.user_id,
    };

    const response = await playGameService.selectPlayerCharacter(selectRequest);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error selecting character:", error);
    return NextResponse.json(
      { error: "Failed to select character" },
      { status: 500 }
    );
  }
}
