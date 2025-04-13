import { UUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { playGameService } from "../../service";

// Get characters for a specific story
export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const storyId = params.storyId as UUID;
    const response = await playGameService.getCharactersForStory(storyId);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching characters:", error);
    return NextResponse.json(
      { error: "Failed to fetch characters" },
      { status: 500 }
    );
  }
}
