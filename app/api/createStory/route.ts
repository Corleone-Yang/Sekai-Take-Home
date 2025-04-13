import { UUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { CreateStoryRequest, UpdateStoryRequest } from "./model";
import { StoryService } from "./service";

/**
 * Create Story API
 * POST /api/stories
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

/**
 * Story-related API route handlers
 * GET, PUT, DELETE /api/stories/[storyId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const storyId = params.storyId as UUID;

    // Get story information
    const result = await StoryService.getStory(storyId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get story API error:", error);
    return NextResponse.json(
      { error: "Failed to get story", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const storyId = params.storyId as UUID;

    // Parse request body
    const requestData: UpdateStoryRequest = await request.json();

    // Validate request data
    if (!requestData.title || !requestData.character_num) {
      return NextResponse.json(
        { error: "Title and character count cannot be empty" },
        { status: 400 }
      );
    }

    // Update story
    const result = await StoryService.updateStory(storyId, requestData);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update story API error:", error);
    return NextResponse.json(
      { error: "Failed to update story", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const storyId = params.storyId as UUID;

    // Delete story
    const result = await StoryService.deleteStory(storyId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Delete story API error:", error);
    return NextResponse.json(
      { error: "Failed to delete story", details: (error as Error).message },
      { status: 500 }
    );
  }
}
