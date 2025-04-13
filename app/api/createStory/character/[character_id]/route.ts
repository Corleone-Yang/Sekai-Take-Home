import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// 初始化supabaseAdmin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
);

// 更新角色信息的API路由
export async function PATCH(
  request: NextRequest,
  { params }: { params: { character_id: string } }
) {
  try {
    const characterId = params.character_id;
    const updateData = await request.json();

    // 只允许更新isplayer属性，防止恶意修改
    const validUpdateData = {
      ...(updateData.isplayer !== undefined && {
        isplayer: updateData.isplayer,
      }),
      updated_at: new Date().toISOString(),
    };

    // 更新数据库中的角色信息
    const { data, error } = await supabaseAdmin
      .from("characters")
      .update(validUpdateData)
      .eq("character_id", characterId)
      .select();

    if (error) {
      console.error("Error updating character:", error);
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
    console.error("Error in PATCH request:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
