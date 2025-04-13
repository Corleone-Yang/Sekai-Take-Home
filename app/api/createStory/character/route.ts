import { NextRequest, NextResponse } from "next/server";
import { DirectCharacterCreateRequest } from "../model";
import { StoryService } from "../service";

/**
 * Character API - Create or update a character
 * POST /api/createStory/character
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const requestData: DirectCharacterCreateRequest = await request.json();

    // Validate request data
    if (!requestData.story_id || !requestData.name) {
      return NextResponse.json(
        { error: "Story ID and character name are required" },
        { status: 400 }
      );
    }

    // Create or update character
    const result = await StoryService.directCreateOrUpdateCharacter(
      requestData
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Character API error:", error);
    return NextResponse.json(
      {
        error: "Failed to create or update character",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
