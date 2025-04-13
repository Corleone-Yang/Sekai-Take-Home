import { createClient } from "@supabase/supabase-js";
import { UUID } from "crypto";
import {
  CreateStoryRequest,
  CreateStoryResponse,
  DeleteStoryResponse,
  GetStoryResponse,
  UpdateStoryRequest,
  UpdateStoryResponse,
} from "./model";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

// 初始化两个客户端：一个用于普通操作，一个用于管理员操作
// 普通客户端 - 使用匿名密钥，遵循 RLS 策略
const supabaseAnon = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// 管理员客户端 - 使用服务角色密钥，可以绕过 RLS 策略
// 注意：服务角色密钥必须是服务器端环境变量，不能暴露给客户端
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : supabaseAnon;

export class StoryService {
  /**
   * Create story with corresponding number of characters
   */
  static async createStory(
    data: CreateStoryRequest
  ): Promise<CreateStoryResponse> {
    try {
      console.log("Creating story with user_id:", data.user_id); // 添加日志以便调试

      // 使用管理员客户端绕过 RLS
      const { data: result, error } = await supabaseAdmin.rpc(
        "create_story_with_characters",
        {
          // 参数名称需要匹配 schema.sql 中定义的参数名称
          title_param: data.title,
          background_param: data.background || "",
          character_num_param: data.character_num,
          user_id_param: data.user_id,
        }
      );

      if (error) {
        console.error("RPC error details:", error); // 添加详细错误日志
        throw error;
      }

      return {
        success: true,
        story_id: result as UUID,
        message: `Story created successfully, ${data.character_num} characters have been automatically generated`,
      };
    } catch (error) {
      console.error("Failed to create story:", error);
      throw error;
    }
  }

  /**
   * Update story and character information
   */
  static async updateStory(
    storyId: UUID,
    data: UpdateStoryRequest
  ): Promise<UpdateStoryResponse> {
    try {
      // Start database transaction - 这部分可能需要修改或移除，视乎 Supabase 的事务支持
      // const { error: txnError } = await supabase.rpc("begin_transaction");
      // if (txnError) throw txnError;

      try {
        // 更新故事和角色数量 - 这里需要实现 schema.sql 中对应功能
        // 目前 schema.sql 中没有对应的更新函数，需要自行实现 CRUD 操作

        // 更新故事信息
        const { error: updateStoryError } = await supabase
          .from("stories")
          .update({
            title: data.title,
            background: data.background || "",
            character_num: data.character_num,
            updated_at: new Date(),
          })
          .eq("story_id", storyId);

        if (updateStoryError) throw updateStoryError;

        // 删除指定的角色
        if (
          data.deleted_character_ids &&
          data.deleted_character_ids.length > 0
        ) {
          const { error: deleteCharError } = await supabase
            .from("characters")
            .delete()
            .in("character_id", data.deleted_character_ids)
            .eq("story_id", storyId);

          if (deleteCharError) throw deleteCharError;
        }

        // 获取当前角色数量
        const { data: characterCount, error: countError } = await supabase
          .from("characters")
          .select("character_id", { count: "exact" })
          .eq("story_id", storyId);

        if (countError) throw countError;

        // 如果需要创建更多角色
        const currentCount = characterCount ? characterCount.length : 0;
        if (currentCount < data.character_num) {
          // 调用存储过程创建新角色
          const { error: createCharsError } = await supabase.rpc(
            "create_characters_for_story",
            {
              story_id_param: storyId,
              character_count: data.character_num - currentCount,
            }
          );

          if (createCharsError) throw createCharsError;
        }

        // 2. 更新保留的角色信息
        if (data.characters && data.characters.length > 0) {
          for (const char of data.characters) {
            const { error: updateCharError } = await supabase
              .from("characters")
              .update({
                name: char.name,
                character: char.character || "",
                background: char.background || "",
                updated_at: new Date(),
              })
              .eq("character_id", char.character_id)
              .eq("story_id", storyId);

            if (updateCharError) throw updateCharError;
          }
        }

        return {
          success: true,
          message: "Story and characters updated successfully",
        };
      } catch (error) {
        throw error;
      }
    } catch (error) {
      console.error("Failed to update story:", error);
      throw error;
    }
  }

  /**
   * Get story and all character information
   */
  static async getStory(storyId: UUID): Promise<GetStoryResponse> {
    try {
      // 获取故事信息
      const { data: storyData, error: storyError } = await supabase
        .from("stories")
        .select("*")
        .eq("story_id", storyId)
        .single();

      if (storyError) throw storyError;

      // 获取相关角色信息
      const { data: charactersData, error: charError } = await supabase
        .from("characters")
        .select("*")
        .eq("story_id", storyId);

      if (charError) throw charError;

      return {
        story: storyData,
        characters: charactersData || [],
      };
    } catch (error) {
      console.error("Failed to get story:", error);
      throw error;
    }
  }

  /**
   * Delete story (characters will be automatically deleted via CASCADE)
   */
  static async deleteStory(storyId: UUID): Promise<DeleteStoryResponse> {
    try {
      // 删除故事（级联删除会自动删除角色）
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("story_id", storyId);

      if (error) throw error;

      return {
        success: true,
        message: "Story and its characters have been successfully deleted",
      };
    } catch (error) {
      console.error("Failed to delete story:", error);
      throw error;
    }
  }
}
