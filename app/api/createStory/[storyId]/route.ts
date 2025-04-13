import { UUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { UpdateStoryRequest } from "../model";
import { StoryService } from "../service";

/**
 * Story-related API route handlers
 * GET, PUT, DELETE /api/createStory/[storyId]
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
