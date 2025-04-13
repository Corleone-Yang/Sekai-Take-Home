import { NextRequest, NextResponse } from "next/server";
import { DirectCharacterCreateRequest } from "../createStory/model";
import { StoryService } from "../createStory/service";

/**
 * Character API
 * POST /api/character - Create/update a character
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const requestData: DirectCharacterCreateRequest = await request.json();

    // Validate request data
    if (!requestData.story_id || !requestData.name) {
      return NextResponse.json(
        { error: "Story ID and name are required" },
        { status: 400 }
      );
    }

    // Call service to create/update character
    const result = await StoryService.directCreateOrUpdateCharacter(
      requestData
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Character API error:", error);
    return NextResponse.json(
      {
        error: "Failed to create/update character",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
