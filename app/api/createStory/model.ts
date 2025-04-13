import { UUID } from "crypto";

// Story data interface
export interface Story {
  story_id: UUID;
  title: string;
  background: string | null;
  character_num: number;
  created_at: Date;
  updated_at: Date;
  user_id: UUID;
}

// Character data interface
export interface Character {
  character_id: UUID;
  story_id: UUID;
  name: string;
  character: string | null;
  background: string | null;
  created_at: Date;
  updated_at: Date;
}

// Create story request interface
export interface CreateStoryRequest {
  title: string;
  background?: string;
  character_num: number;
  user_id: UUID;
  characters?: {
    name: string;
    character?: string;
    background?: string;
  }[];
}

// Create story response interface
export interface CreateStoryResponse {
  success: boolean;
  story_id: UUID;
  message: string;
}

// Update story request interface
export interface UpdateStoryRequest {
  title: string;
  background?: string;
  character_num: number;
  characters: CharacterUpdate[];
  deleted_character_ids?: UUID[];
}

// Update character interface
export interface CharacterUpdate {
  character_id: UUID;
  name: string;
  character?: string;
  background?: string;
}

// Update story response interface
export interface UpdateStoryResponse {
  success: boolean;
  message: string;
}

// Get story response interface
export interface GetStoryResponse {
  story: Story;
  characters: Character[];
}

// Delete story response interface
export interface DeleteStoryResponse {
  success: boolean;
  message: string;
}

// Direct character creation request interface
export interface DirectCharacterCreateRequest {
  character_id: UUID;
  story_id: UUID;
  name: string;
  character?: string;
  background?: string;
}

// Direct character creation response interface
export interface DirectCharacterCreateResponse {
  success: boolean;
  message: string;
  character_id?: UUID;
}
