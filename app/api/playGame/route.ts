import { NextRequest, NextResponse } from "next/server";

// NOTE: This file is no longer used for API routes.
// The API endpoints have been moved to dedicated route files:
// - GET /api/playGame/stories: app/api/playGame/stories/route.ts
// - GET /api/playGame/characters/[storyId]: app/api/playGame/characters/[storyId]/route.ts
// - POST /api/playGame/select-character: app/api/playGame/select-character/route.ts
// - POST /api/playGame/chat: app/api/playGame/chat/route.ts

// Fallback handler for any requests to this path
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      message: "Please use the dedicated API endpoints",
      endpoints: {
        "GET /api/playGame/stories": "Get all available stories",
        "GET /api/playGame/characters/:storyId":
          "Get characters for a specific story",
        "POST /api/playGame/select-character":
          "Select a character for the player",
        "POST /api/playGame/chat": "Send a message in the game",
      },
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      message: "Please use the dedicated API endpoints",
      endpoints: {
        "POST /api/playGame/select-character":
          "Select a character for the player",
        "POST /api/playGame/chat": "Send a message in the game",
      },
    },
    { status: 200 }
  );
}
