import { NextRequest, NextResponse } from "next/server";
import { SendMessageRequest } from "../model";
import { playGameService } from "../service";

// Chat message endpoint
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    const messageRequest: SendMessageRequest = {
      game_session_id: body.game_session_id,
      message: body.message,
    };

    const response = await playGameService.processMessage(messageRequest);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing message:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
