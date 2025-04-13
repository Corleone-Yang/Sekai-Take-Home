import { NextRequest, NextResponse } from "next/server";
import { CreateStoryRequest } from "./model";
import { StoryService } from "./service";

/**
 * Create Story API
 * POST /api/createStory
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const requestData: CreateStoryRequest = await request.json();

    // Validate request data
    if (
      !requestData.title ||
      !requestData.character_num ||
      !requestData.user_id
    ) {
      return NextResponse.json(
        { error: "Title, character count, and user ID cannot be empty" },
        { status: 400 }
      );
    }

    // Validate character data if provided
    if (requestData.characters) {
      const invalidCharacters = requestData.characters.some(
        (char) => !char.name
      );
      if (invalidCharacters) {
        return NextResponse.json(
          { error: "All characters must have names" },
          { status: 400 }
        );
      }
    }

    try {
      // Call service to create story
      const result = await StoryService.createStory(requestData);
      return NextResponse.json(result);
    } catch (serviceError) {
      console.error("Service layer error:", serviceError);
      return NextResponse.json(
        {
          error: "Story creation service error",
          details: (serviceError as Error).message,
          stack:
            process.env.NODE_ENV === "development"
              ? (serviceError as Error).stack
              : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Create story API error:", error);
    return NextResponse.json(
      {
        error: "Failed to create story",
        details: (error as Error).message,
        stack:
          process.env.NODE_ENV === "development"
            ? (error as Error).stack
            : undefined,
      },
      { status: 500 }
    );
  }
}
