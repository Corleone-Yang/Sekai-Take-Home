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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export class StoryService {
  /**
   * Create story with corresponding number of characters
   */
  static async createStory(
    data: CreateStoryRequest
  ): Promise<CreateStoryResponse> {
    try {
      // Call stored procedure to create story and characters
      const { data: result, error } = await supabase.rpc(
        "create_story_with_characters",
        {
          p_title: data.title,
          p_background: data.background || "",
          p_character_num: data.character_num,
          p_user_id: data.user_id,
        }
      );

      if (error) throw error;

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
      // Start database transaction
      const { error: txnError } = await supabase.rpc("begin_transaction");
      if (txnError) throw txnError;

      try {
        // 1. Update basic story information and character count
        const { error: updateStoryError } = await supabase.rpc(
          "update_story_with_characters",
          {
            p_story_id: storyId,
            p_title: data.title,
            p_background: data.background || "",
            p_character_num: data.character_num,
            p_deleted_character_ids: data.deleted_character_ids || [],
          }
        );

        if (updateStoryError) throw updateStoryError;

        // 2. Update retained character information
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

        // Commit transaction
        const { error: commitError } = await supabase.rpc("commit_transaction");
        if (commitError) throw commitError;

        return {
          success: true,
          message: "Story and characters updated successfully",
        };
      } catch (error) {
        // Rollback transaction
        await supabase.rpc("rollback_transaction");
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
      // Call stored procedure to get story and characters
      const { data: result, error } = await supabase.rpc(
        "get_story_with_characters",
        {
          p_story_id: storyId,
        }
      );

      if (error) throw error;

      return result as GetStoryResponse;
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
      // Call stored procedure to delete story
      const { data: result, error } = await supabase.rpc("delete_story", {
        p_story_id: storyId,
      });

      if (error) throw error;

      if (!result) {
        return {
          success: false,
          message: "Story does not exist or deletion failed",
        };
      }

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
