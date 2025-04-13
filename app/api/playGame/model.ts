import { UUID } from "crypto";
import { Character, Story } from "../createStory/model";

// Game session interface
export interface GameSession {
  session_id: UUID;
  story_id: UUID;
  player_character_id: UUID;
  created_at: Date;
  updated_at: Date;
  user_id: UUID;
  active: boolean;
}

// Memory types
export enum MemoryType {
  LONG_TERM = "long_term",
  SHORT_TERM = "short_term",
}

// Base memory interface
export interface BaseMemory {
  memory_id: UUID;
  session_id: UUID;
  character_id: UUID;
  created_at: Date;
  importance: number; // 1-10 scale
}

// Long term memory (character background, personality, etc.)
export interface LongTermMemory extends BaseMemory {
  type: MemoryType.LONG_TERM;
  content: string;
  category: "background" | "personality" | "relationship" | "goal";
  embedding?: number[]; // Vector embedding for retrieval
}

// Short term memory (conversation history, events)
export interface ShortTermMemory extends BaseMemory {
  type: MemoryType.SHORT_TERM;
  content: string;
  turn_number: number;
  forgotten: boolean; // If true, has been processed by Forget Gateway
}

// Dialog message
export interface DialogMessage {
  character_id: UUID;
  character_name: string;
  content: string;
  timestamp: Date;
}

// API Request/Response interfaces

// Get available stories request/response
export interface GetStoriesResponse {
  stories: Story[];
}

// Get characters for story request/response
export interface GetCharactersForStoryRequest {
  story_id: UUID;
}

export interface GetCharactersForStoryResponse {
  characters: Character[];
}

// Select player character request/response
export interface SelectPlayerCharacterRequest {
  story_id: UUID;
  character_id: UUID;
  user_id: UUID;
}

export interface SelectPlayerCharacterResponse {
  success: boolean;
  game_session_id: UUID;
  message: string;
}

// Character info for test sessions
export interface CharacterInfo {
  npc_characters: {
    id: UUID;
    name: string;
  }[];
}

// Send message request/response
export interface SendMessageRequest {
  game_session_id: UUID;
  message: string;
  character_info?: CharacterInfo; // Optional character info for test sessions
  story_id?: UUID; // Optional story ID for test sessions
  player_character_id?: UUID; // Optional player character ID for test sessions
}

export interface SendMessageResponse {
  responses: DialogMessage[];
}

// LangGraph Agent Interfaces

// Character agent state
export interface CharacterAgentState {
  character_id: UUID;
  character_name: string;
  personality: string;
  background: string;
  long_term_memories: LongTermMemory[];
  short_term_memories: ShortTermMemory[];
  current_context: DialogMessage[];
}

// LLM Gateway processing request
export interface LLMGatewayRequest {
  dialog_context: DialogMessage[];
  long_term_memory: LongTermMemory[];
  character_id: UUID;
}

export interface LLMGatewayResponse {
  processed_long_term: LongTermMemory[];
  processed_short_term: ShortTermMemory[];
}

// Forget Gateway processing request
export interface ForgetGatewayRequest {
  short_term_memories: ShortTermMemory[];
  character_id: UUID;
  threshold: number; // Number of memories that triggers forgetting
}

export interface ForgetGatewayResponse {
  consolidated_memories: ShortTermMemory[];
}
