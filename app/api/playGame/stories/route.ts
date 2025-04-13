import { NextResponse } from "next/server";
import { playGameService } from "../service";

// Get all stories route handler
export async function GET() {
  try {
    const response = await playGameService.getStories();
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}
