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

// Initialize two clients: one for normal operations, one for admin operations
// Normal client - using anonymous key, follows RLS policies
const supabaseAnon = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Admin client - using service role key, can bypass RLS policies
// Note: Service role key must be a server-side environment variable, cannot be exposed to the client
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
      console.log("Creating story with user_id:", data.user_id); // Add log for debugging

      // Use admin client to bypass RLS
      const { data: result, error } = await supabaseAdmin.rpc(
        "create_story_with_characters",
        {
          // Parameter names must match those defined in schema.sql
          title_param: data.title,
          background_param: data.background || "",
          character_num_param: data.character_num,
          user_id_param: data.user_id,
        }
      );

      if (error) {
        console.error("RPC error details:", error); // Add detailed error log
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
      // Start database transaction - this part may need to be modified or removed, depending on Supabase's transaction support
      // const { error: txnError } = await supabase.rpc("begin_transaction");
      // if (txnError) throw txnError;

      try {
        // Update story and character count - need to implement corresponding functionality in schema.sql
        // Currently schema.sql doesn't have corresponding update functions, need to implement CRUD operations manually

        // Update story information
        const { error: updateStoryError } = await supabaseAdmin
          .from("stories")
          .update({
            title: data.title,
            background: data.background || "",
            character_num: data.character_num,
            updated_at: new Date(),
          })
          .eq("story_id", storyId);

        if (updateStoryError) throw updateStoryError;

        // Delete specified characters
        if (
          data.deleted_character_ids &&
          data.deleted_character_ids.length > 0
        ) {
          const { error: deleteCharError } = await supabaseAdmin
            .from("characters")
            .delete()
            .in("character_id", data.deleted_character_ids)
            .eq("story_id", storyId);

          if (deleteCharError) throw deleteCharError;
        }

        // Get current character count
        const { data: characterCount, error: countError } = await supabaseAdmin
          .from("characters")
          .select("character_id", { count: "exact" })
          .eq("story_id", storyId);

        if (countError) throw countError;

        // If need to create more characters
        const currentCount = characterCount ? characterCount.length : 0;
        if (currentCount < data.character_num) {
          // Call stored procedure to create new characters
          const { error: createCharsError } = await supabaseAdmin.rpc(
            "create_characters_for_story",
            {
              story_id_param: storyId,
              character_count: data.character_num - currentCount,
            }
          );

          if (createCharsError) throw createCharsError;
        }

        // 2. Update retained character information
        if (data.characters && data.characters.length > 0) {
          for (const char of data.characters) {
            const { error: updateCharError } = await supabaseAdmin
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
      // Get story information
      const { data: storyData, error: storyError } = await supabaseAdmin
        .from("stories")
        .select("*")
        .eq("story_id", storyId)
        .single();

      if (storyError) throw storyError;

      // Get related character information
      const { data: charactersData, error: charError } = await supabaseAdmin
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
      // Delete story (cascade will automatically delete characters)
      const { error } = await supabaseAdmin
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
