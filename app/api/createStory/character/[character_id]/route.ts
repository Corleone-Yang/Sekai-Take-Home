import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Initialize supabaseAdmin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
);

// API route for updating character information
export async function PATCH(
  request: NextRequest,
  { params }: { params: { character_id: string } }
) {
  try {
    const characterId = params.character_id;
    const updateData = await request.json();

    // Only allow updating isplayer property to prevent malicious modifications
    const validUpdateData = {
      ...(updateData.isplayer !== undefined && {
        isplayer: updateData.isplayer,
      }),
      updated_at: new Date().toISOString(),
    };

    // Update character information in the database
    const { data, error } = await supabaseAdmin
      .from("characters")
      .update(validUpdateData)
      .eq("character_id", characterId)
      .select();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update character", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Character updated successfully", data },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
