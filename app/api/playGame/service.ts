import { createClient } from "@supabase/supabase-js";
import { UUID, randomUUID } from "crypto";
import { generateGeminiResponse } from "../../config/gemini";
// Note: For a production implementation, you would need to install and properly import LangGraph
// Since we don't have the actual package installed, we'll mock the interface
// import { StateGraph } from "langchain/langgraph";

// Mock StateGraph implementation
class MockStateGraph {
  nodes: Record<string, any> = {};
  edges: [string, string][] = [];

  constructor(public config: any) {}

  addNode(name: string, config: any) {
    this.nodes[name] = config;
  }

  addEdge(from: string, to: string) {
    this.edges.push([from, to]);
  }

  compile() {
    return {
      invoke: async (state: any) => {
        // Simplified implementation of the graph execution
        let currentState = { ...state };

        // First execute LLM Gateway
        if (this.nodes.llmGateway) {
          currentState = await this.nodes.llmGateway.execute(currentState);
        }

        // Then execute Forget Gateway
        if (this.nodes.forgetGateway) {
          currentState = await this.nodes.forgetGateway.execute(currentState);
        }

        // Finally execute each character node in sequence
        const characterNodeKeys = Object.keys(this.nodes).filter((k) =>
          k.startsWith("character_")
        );
        for (const nodeKey of characterNodeKeys) {
          currentState = await this.nodes[nodeKey].execute(currentState);
        }

        return currentState;
      },
    };
  }
}

import { Character, Story } from "../createStory/model";
import {
  CharacterAgentState,
  DialogMessage,
  ForgetGatewayRequest,
  ForgetGatewayResponse,
  GameSession,
  GetCharactersForStoryResponse,
  GetStoriesResponse,
  LLMGatewayRequest,
  LLMGatewayResponse,
  LongTermMemory,
  MemoryType,
  SelectPlayerCharacterRequest,
  SelectPlayerCharacterResponse,
  SendMessageRequest,
  SendMessageResponse,
  ShortTermMemory,
} from "./model";

// Mock database functions (replace with actual DB implementation)
const mockDB = {
  stories: new Map<UUID, Story>(),
  characters: new Map<UUID, Character>(),
  sessions: new Map<UUID, GameSession>(),
  longTermMemories: new Map<UUID, LongTermMemory[]>(),
  shortTermMemories: new Map<UUID, ShortTermMemory[]>(),
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
);

// Game Service Class
export class PlayGameService {
  // Get all available stories
  async getStories(): Promise<GetStoriesResponse> {
    try {
      // Get stories from Supabase
      const { data: stories, error } = await supabaseAdmin
        .from("stories")
        .select("*");

      if (error) {
        console.error("Error fetching stories:", error);
        throw error;
      }

      return { stories: stories || [] };
    } catch (error) {
      console.error("Failed to fetch stories:", error);
      // Fallback to mock data if there's an error
      const stories = Array.from(mockDB.stories.values());
      return { stories };
    }
  }

  // Get characters for a specific story
  async getCharactersForStory(
    storyId: UUID
  ): Promise<GetCharactersForStoryResponse> {
    try {
      // Get characters from Supabase
      const { data: characters, error } = await supabaseAdmin
        .from("characters")
        .select("*")
        .eq("story_id", storyId);

      if (error) {
        console.error("Error fetching characters for story:", error);
        throw error;
      }

      return { characters: characters || [] };
    } catch (error) {
      console.error("Failed to fetch characters for story:", error);
      // Fallback to mock data if there's an error
      const characters = Array.from(mockDB.characters.values()).filter(
        (char) => char.story_id === storyId
      );
      return { characters };
    }
  }

  // Select a character for the player and create a game session
  async selectPlayerCharacter(
    request: SelectPlayerCharacterRequest
  ): Promise<SelectPlayerCharacterResponse> {
    try {
      const { story_id, character_id, user_id } = request;

      // Check if the story and character exist
      const story = mockDB.stories.get(story_id);
      const character = mockDB.characters.get(character_id);

      if (!story || !character) {
        return {
          success: false,
          game_session_id: "" as UUID,
          message: "Story or character not found",
        };
      }

      // Create a new game session
      const session_id = randomUUID();
      const newSession: GameSession = {
        session_id,
        story_id,
        player_character_id: character_id,
        user_id,
        created_at: new Date(),
        updated_at: new Date(),
        active: true,
      };

      // Update the character to be the player character
      // In a real implementation, this would be a database update
      const updatedCharacter = { ...character, isplayer: true };
      mockDB.characters.set(character_id, updatedCharacter);

      // Store the session
      mockDB.sessions.set(session_id, newSession);

      // Initialize memory for all characters in the story
      await this.initializeCharacterMemories(story_id, session_id);

      return {
        success: true,
        game_session_id: session_id,
        message: "Game session created successfully",
      };
    } catch (error) {
      console.error("Error selecting player character:", error);
      return {
        success: false,
        game_session_id: "" as UUID,
        message: "Failed to create game session",
      };
    }
  }

  // Initialize memories for all characters in a story
  private async initializeCharacterMemories(
    storyId: UUID,
    sessionId: UUID
  ): Promise<void> {
    // Try to get characters from Supabase database first
    let characters: Character[] = [];
    try {
      // Get characters from database
      const { data: dbCharacters, error } = await supabaseAdmin
        .from("characters")
        .select("*")
        .eq("story_id", storyId);

      if (error) throw error;

      if (dbCharacters && dbCharacters.length > 0) {
        // Transform to Character type
        characters = dbCharacters.map((char) => ({
          character_id: char.character_id as UUID,
          story_id: char.story_id as UUID,
          name: char.name,
          character: char.character,
          background: char.background,
          created_at: new Date(char.created_at),
          updated_at: new Date(char.updated_at),
        }));
      }
    } catch (dbError) {
      console.error(
        "Error fetching characters from DB for memory initialization:",
        dbError
      );
      // Fallback to mock data if database access fails
      characters = Array.from(mockDB.characters.values()).filter(
        (char) => char.story_id === storyId
      );
    }

    // For each character, initialize long-term memories
    for (const character of characters) {
      const longTermMemories: LongTermMemory[] = [
        // Character background memory
        {
          memory_id: randomUUID(),
          session_id: sessionId,
          character_id: character.character_id,
          type: MemoryType.LONG_TERM,
          content: character.background || "",
          category: "background",
          created_at: new Date(),
          importance: 10, // Highest importance
        },
        // Character personality memory
        {
          memory_id: randomUUID(),
          session_id: sessionId,
          character_id: character.character_id,
          type: MemoryType.LONG_TERM,
          content: character.character || "",
          category: "personality",
          created_at: new Date(),
          importance: 10, // Highest importance
        },
      ];

      // Try to add relationship memories between characters
      const otherCharacters = characters.filter(
        (c) => c.character_id !== character.character_id
      );

      for (const otherChar of otherCharacters) {
        // Create a simple relationship memory
        longTermMemories.push({
          memory_id: randomUUID(),
          session_id: sessionId,
          character_id: character.character_id,
          type: MemoryType.LONG_TERM,
          content: `${otherChar.name} is another character in this story.`,
          category: "relationship",
          created_at: new Date(),
          importance: 8,
        });
      }

      // Store the memories
      mockDB.longTermMemories.set(character.character_id, longTermMemories);
      mockDB.shortTermMemories.set(character.character_id, []);
    }
  }

  // Process a player message and get responses from all NPCs
  async processMessage(
    request: SendMessageRequest
  ): Promise<SendMessageResponse> {
    try {
      const { game_session_id, message } = request;

      // Get the game session
      const session = mockDB.sessions.get(game_session_id);
      if (!session || !session.active) {
        throw new Error("Game session not found or inactive");
      }

      // First try to get characters from database
      let storyCharacters: Character[] = [];
      try {
        // Get characters from Supabase database
        const { data: characters, error } = await supabaseAdmin
          .from("characters")
          .select("*")
          .eq("story_id", session.story_id);

        if (error) throw error;
        if (characters && characters.length > 0) {
          // Transform to Character type
          storyCharacters = characters.map((char) => ({
            character_id: char.character_id as UUID,
            story_id: char.story_id as UUID,
            name: char.name,
            character: char.character,
            background: char.background,
            created_at: new Date(char.created_at),
            updated_at: new Date(char.updated_at),
            isplayer: char.isplayer || false,
          }));
        }
      } catch (dbError) {
        console.error("Error fetching characters from DB:", dbError);
        // Fallback to mock data
        storyCharacters = Array.from(mockDB.characters.values()).filter(
          (char) => char.story_id === session.story_id
        );
      }

      // Get the player character
      const playerCharacter = storyCharacters.find(
        (char) => char.character_id === session.player_character_id
      );

      if (!playerCharacter) {
        throw new Error("Player character not found");
      }

      // Create a dialog message from the player
      const playerMessage: DialogMessage = {
        character_id: playerCharacter.character_id,
        character_name: playerCharacter.name,
        content: message,
        timestamp: new Date(),
      };

      // Run the LangGraph to get responses from all NPCs
      const responses = await this.runGameGraph(
        session,
        storyCharacters,
        playerMessage
      );

      return { responses };
    } catch (error) {
      console.error("Error processing message:", error);
      throw new Error("Failed to process message");
    }
  }

  // LangGraph implementation for multi-agent gameplay
  private async runGameGraph(
    session: GameSession,
    characters: Character[],
    playerMessage: DialogMessage
  ): Promise<DialogMessage[]> {
    try {
      // Setup the LangGraph agents and workflow
      const builder = new MockStateGraph({
        channels: {
          dialog: {
            value: [] as DialogMessage[],
          },
          characterStates: {
            value: {} as Record<UUID, CharacterAgentState>,
          },
        },
      });

      // Initialize character states
      const characterStates: Record<UUID, CharacterAgentState> = {};
      for (const character of characters) {
        // Skip the player character - we don't need an agent for them
        if (
          character.character_id === session.player_character_id ||
          character.isplayer === true
        ) {
          continue;
        }

        // Get memories for this character
        const longTermMemories =
          mockDB.longTermMemories.get(character.character_id) || [];
        const shortTermMemories =
          mockDB.shortTermMemories.get(character.character_id) || [];

        // Create agent state
        characterStates[character.character_id] = {
          character_id: character.character_id,
          character_name: character.name,
          personality: character.character || "",
          background: character.background || "",
          long_term_memories: longTermMemories,
          short_term_memories: shortTermMemories,
          current_context: [playerMessage], // Start with the player's message
        };
      }

      // Create LLM Gateway node
      builder.addNode("llmGateway", {
        execute: async (state) => {
          // This would call an actual LLM API in production
          const characterIds = Object.keys(
            state.characterStates.value
          ) as UUID[];

          // Update each character's state with processed memories
          const updatedStates = { ...state.characterStates.value };

          for (const characterId of characterIds) {
            const charState = updatedStates[characterId];

            // Mock LLM Gateway processing
            const gatewayResult: LLMGatewayResponse =
              await this.mockLLMGatewayProcessing({
                dialog_context: charState.current_context,
                long_term_memory: charState.long_term_memories,
                character_id: characterId,
              });

            // Update memories
            updatedStates[characterId] = {
              ...charState,
              long_term_memories: gatewayResult.processed_long_term,
              short_term_memories: [
                ...charState.short_term_memories,
                ...gatewayResult.processed_short_term,
              ],
            };
          }

          return { characterStates: updatedStates, dialog: state.dialog.value };
        },
      });

      // Create Forget Gateway node (only runs when memory threshold is exceeded)
      builder.addNode("forgetGateway", {
        execute: async (state) => {
          const characterIds = Object.keys(
            state.characterStates.value
          ) as UUID[];
          const MEMORY_THRESHOLD = 20; // After 20 messages, start forgetting

          // Update each character's state with consolidated memories if needed
          const updatedStates = { ...state.characterStates.value };

          for (const characterId of characterIds) {
            const charState = updatedStates[characterId];

            // Check if we need to forget
            if (charState.short_term_memories.length > MEMORY_THRESHOLD) {
              // Mock Forget Gateway processing
              const forgetResult: ForgetGatewayResponse =
                await this.mockForgetGatewayProcessing({
                  short_term_memories: charState.short_term_memories,
                  character_id: characterId,
                  threshold: MEMORY_THRESHOLD,
                });

              // Update with consolidated memories
              updatedStates[characterId] = {
                ...charState,
                short_term_memories: forgetResult.consolidated_memories,
              };
            }
          }

          return { characterStates: updatedStates, dialog: state.dialog.value };
        },
      });

      // Create Character Response nodes for each NPC
      for (const character of characters) {
        // Skip the player character
        if (character.character_id === session.player_character_id) {
          continue;
        }

        builder.addNode(`character_${character.character_id}`, {
          execute: async (state) => {
            const charState =
              state.characterStates.value[character.character_id];
            if (!charState) return state;

            // Generate response for this character (would use LLM in production)
            const response = await this.mockCharacterResponse(charState);

            // Add to dialog
            const updatedDialog = [...state.dialog.value, response];

            // Update character state to include this response in context
            const updatedStates = { ...state.characterStates.value };
            updatedStates[character.character_id] = {
              ...charState,
              current_context: [...charState.current_context, response],
            };

            return { dialog: updatedDialog, characterStates: updatedStates };
          },
        });
      }

      // Define the flow
      // First process memories through LLM Gateway
      builder.addEdge("llmGateway", "forgetGateway");

      // Then check for memory consolidation
      const characterIds = characters
        .filter((char) => char.character_id !== session.player_character_id)
        .map((char) => char.character_id);

      // Connect Forget Gateway to each character response node
      for (const characterId of characterIds) {
        builder.addEdge("forgetGateway", `character_${characterId}`);
      }

      // Connect character nodes in a chain for sequential responses
      for (let i = 0; i < characterIds.length - 1; i++) {
        builder.addEdge(
          `character_${characterIds[i]}`,
          `character_${characterIds[i + 1]}`
        );
      }

      // Compile the graph
      const graph = builder.compile();

      // Start with initial state
      const initialState = {
        dialog: [playerMessage],
        characterStates,
      };

      // Run the graph
      const result = await graph.invoke(initialState);

      // Return all responses except the player's initial message
      return result.dialog.slice(1);
    } catch (error) {
      console.error("Error in game graph:", error);
      return [];
    }
  }

  // Mock implementations (would be replaced with actual LLM calls in production)
  private async mockLLMGatewayProcessing(
    request: LLMGatewayRequest
  ): Promise<LLMGatewayResponse> {
    try {
      // Extract the latest dialog message
      const latestMessage =
        request.dialog_context[request.dialog_context.length - 1];

      // Create a short-term memory from the latest dialog
      const newShortTermMemory: ShortTermMemory = {
        memory_id: randomUUID(),
        session_id: randomUUID(), // In production, this would be the actual session ID
        character_id: request.character_id,
        type: MemoryType.SHORT_TERM,
        content: latestMessage.content,
        created_at: new Date(),
        importance: 5, // Medium importance
        turn_number: request.dialog_context.length,
        forgotten: false,
      };

      // For more complex implementations, we could use Gemini to analyze the importance
      // of memories and assign importance scores
      const characterMemoriesPrompt = `
Extract the most important information from this message that a character should remember:
"${latestMessage.content}"

Output only a brief summary of what should be remembered, in 1-2 sentences maximum.
`;

      try {
        // Generate a more meaningful memory with Gemini
        const enhancedMemory = await generateGeminiResponse(
          characterMemoriesPrompt
        );

        // Update the memory content with the enhanced version
        newShortTermMemory.content = enhancedMemory;
        newShortTermMemory.importance = 7; // Higher importance for processed memory
      } catch (error) {
        console.error("Error enhancing memory with Gemini:", error);
        // If Gemini fails, we'll use the original content
      }

      return {
        processed_long_term: request.long_term_memory, // No changes to long-term memory
        processed_short_term: [newShortTermMemory],
      };
    } catch (error) {
      console.error("Error in LLM Gateway processing:", error);

      // Fallback to basic processing
      const latestMessage =
        request.dialog_context[request.dialog_context.length - 1];

      const newShortTermMemory: ShortTermMemory = {
        memory_id: randomUUID(),
        session_id: randomUUID(),
        character_id: request.character_id,
        type: MemoryType.SHORT_TERM,
        content: latestMessage.content,
        created_at: new Date(),
        importance: 5,
        turn_number: request.dialog_context.length,
        forgotten: false,
      };

      return {
        processed_long_term: request.long_term_memory,
        processed_short_term: [newShortTermMemory],
      };
    }
  }

  private async mockForgetGatewayProcessing(
    request: ForgetGatewayRequest
  ): Promise<ForgetGatewayResponse> {
    try {
      // Extract memories that need consolidation
      const { short_term_memories, threshold } = request;
      const toKeep = Math.floor(threshold / 2);

      // Keep first few and last few memories
      const firstMemories = short_term_memories.slice(0, toKeep);
      const lastMemories = short_term_memories.slice(-toKeep);

      // Get middle memories for consolidation
      const middleStartIdx = toKeep;
      const middleEndIdx = short_term_memories.length - toKeep;

      if (middleStartIdx < middleEndIdx) {
        const middleMemories = short_term_memories.slice(
          middleStartIdx,
          middleEndIdx
        );

        // Create a consolidated memory using Gemini
        const memoryConsolidationPrompt = `
Summarize the following information into a concise and memorable summary:

${middleMemories.map((memory) => `- ${memory.content}`).join("\n")}

Provide a single paragraph summary (2-3 sentences) that captures the most important points.
`;

        try {
          // Generate a consolidated memory with Gemini
          const consolidatedContent = await generateGeminiResponse(
            memoryConsolidationPrompt
          );

          // Create the consolidated memory
          const consolidatedMemory: ShortTermMemory = {
            memory_id: randomUUID(),
            session_id: short_term_memories[0].session_id,
            character_id: request.character_id,
            type: MemoryType.SHORT_TERM,
            content: consolidatedContent,
            created_at: new Date(),
            importance: 8, // Higher importance for consolidated memory
            turn_number: middleStartIdx,
            forgotten: true, // Marked as processed by forget gateway
          };

          return {
            consolidated_memories: [
              ...firstMemories,
              consolidatedMemory,
              ...lastMemories,
            ],
          };
        } catch (error) {
          console.error("Error consolidating memories with Gemini:", error);
          // Fall through to basic consolidation if Gemini fails
        }

        // Fallback consolidated memory
        const consolidatedMemory: ShortTermMemory = {
          memory_id: randomUUID(),
          session_id: short_term_memories[0].session_id,
          character_id: request.character_id,
          type: MemoryType.SHORT_TERM,
          content: `Conversation summary of turns ${middleStartIdx} to ${middleEndIdx}.`,
          created_at: new Date(),
          importance: 7,
          turn_number: middleStartIdx,
          forgotten: true,
        };

        return {
          consolidated_memories: [
            ...firstMemories,
            consolidatedMemory,
            ...lastMemories,
          ],
        };
      }

      // If there's not enough to consolidate, just return the original memories
      return {
        consolidated_memories: short_term_memories,
      };
    } catch (error) {
      console.error("Error in Forget Gateway processing:", error);

      // Return original memories if there's an error
      return {
        consolidated_memories: request.short_term_memories,
      };
    }
  }

  private async mockCharacterResponse(
    state: CharacterAgentState
  ): Promise<DialogMessage> {
    try {
      // Get the latest player message
      const playerMessage =
        state.current_context[state.current_context.length - 1];

      // Try to get the most up-to-date character information from Supabase
      let characterName = state.character_name;
      let characterPersonality = state.personality;
      let characterBackground = state.background;

      try {
        const { data: characterData, error } = await supabaseAdmin
          .from("characters")
          .select("*")
          .eq("character_id", state.character_id)
          .single();

        if (!error && characterData) {
          characterName = characterData.name;
          characterPersonality = characterData.character || state.personality;
          characterBackground = characterData.background || state.background;
        }
      } catch (dbError) {
        console.error("Error fetching updated character data:", dbError);
        // Continue with existing state data if DB fetch fails
      }

      // Extract relevant long-term memories (personality, background, relationships)
      const longTermPersonality = state.long_term_memories
        .filter((mem) => mem.category === "personality")
        .map((mem) => mem.content)
        .join("\n");

      const longTermBackground = state.long_term_memories
        .filter((mem) => mem.category === "background")
        .map((mem) => mem.content)
        .join("\n");

      const relationshipMemories = state.long_term_memories
        .filter((mem) => mem.category === "relationship")
        .map((mem) => `- ${mem.content}`)
        .join("\n");

      // Get recent short-term memories (most recent conversations)
      // Sort by importance and recency
      const recentShortTermMemories = state.short_term_memories
        .sort(
          (a, b) => b.importance - a.importance || b.turn_number - a.turn_number
        )
        .slice(0, 5)
        .map((mem) => `- ${mem.content}`)
        .join("\n");

      // Create a comprehensive prompt for Gemini that follows the memory architecture
      const prompt = `
You are roleplaying as a character named "${characterName}" in an interactive story.

LONG-TERM MEMORY (permanent character information):
- Personality: ${longTermPersonality || characterPersonality}
- Background: ${longTermBackground || characterBackground}
${relationshipMemories ? `- Relationships:\n${relationshipMemories}` : ""}

SHORT-TERM MEMORY (recent events and conversations):
${recentShortTermMemories || "No recent memories yet."}

CURRENT DIALOG CONTEXT:
The player just said: "${playerMessage.content}"

IMPORTANT: Your response MUST fully embody this character's personality and background. You ARE this character - not an AI pretending to be one. Think, feel, and respond exactly as ${characterName} would, based on their unique traits and experiences.

Respond in first person as ${characterName}, incorporating:
1. Your personality traits from long-term memory
2. Relevant background knowledge
3. Any pertinent short-term memories of recent interactions
4. Natural reaction to the current dialog

Keep your response concise (1-3 sentences) and conversational.
Do not use quotation marks or labels for who is speaking.
`;

      // Call Gemini API to generate a response
      const response = await generateGeminiResponse(prompt);

      return {
        character_id: state.character_id,
        character_name: characterName,
        content: response,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error generating character response:", error);

      // Fallback response if Gemini fails
      return {
        character_id: state.character_id,
        character_name: state.character_name,
        content: `I'm not sure how to respond to that right now.`,
        timestamp: new Date(),
      };
    }
  }
}

export const playGameService = new PlayGameService();

// Initialize mock data for testing
// This is used as a fallback when the Supabase database is not available
const initMockData = async () => {
  try {
    // Add some sample stories if none exist
    const { stories } = await playGameService.getStories();

    if (stories.length === 0) {
      // Initialize mock data with sample stories

      // Sample story 1
      const story1Id = randomUUID();
      mockDB.stories.set(story1Id, {
        story_id: story1Id,
        title: "The Enchanted Forest",
        background:
          "A magical forest where animals talk and trees whisper secrets.",
        character_num: 3,
        created_at: new Date(),
        updated_at: new Date(),
        user_id: "user-123" as UUID,
      });

      // Sample story 2
      const story2Id = randomUUID();
      mockDB.stories.set(story2Id, {
        story_id: story2Id,
        title: "Space Adventures",
        background: "Explore the galaxy with a crew of intrepid explorers.",
        character_num: 4,
        created_at: new Date(),
        updated_at: new Date(),
        user_id: "user-123" as UUID,
      });

      // Add characters for story 1
      const char1Id = randomUUID();
      mockDB.characters.set(char1Id, {
        character_id: char1Id,
        story_id: story1Id,
        name: "Forest Ranger",
        character:
          "Brave, knowledgeable about the forest, and protective of nature.",
        background:
          "Grew up near the forest and has been its guardian for years.",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const char2Id = randomUUID();
      mockDB.characters.set(char2Id, {
        character_id: char2Id,
        story_id: story1Id,
        name: "Wise Owl",
        character: "Ancient, wise, and somewhat mysterious. Speaks in riddles.",
        background:
          "Has lived in the forest for centuries and knows all its secrets.",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const char3Id = randomUUID();
      mockDB.characters.set(char3Id, {
        character_id: char3Id,
        story_id: story1Id,
        name: "Mischievous Fox",
        character: "Clever, tricky, and playful. Always looking for adventure.",
        background: "Known for playing pranks on other forest creatures.",
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Add characters for story 2
      const char4Id = randomUUID();
      mockDB.characters.set(char4Id, {
        character_id: char4Id,
        story_id: story2Id,
        name: "Ship Captain",
        character:
          "Decisive, experienced, and fair. Takes responsibility seriously.",
        background: "Veteran of many space expeditions.",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const char5Id = randomUUID();
      mockDB.characters.set(char5Id, {
        character_id: char5Id,
        story_id: story2Id,
        name: "Ship Engineer",
        character:
          "Technical genius, slightly antisocial, focused on machines.",
        background: "Can fix anything with minimal resources.",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const char6Id = randomUUID();
      mockDB.characters.set(char6Id, {
        character_id: char6Id,
        story_id: story2Id,
        name: "Ship Doctor",
        character: "Compassionate, detail-oriented, and somewhat sarcastic.",
        background: "Has treated ailments from all over the galaxy.",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const char7Id = randomUUID();
      mockDB.characters.set(char7Id, {
        character_id: char7Id,
        story_id: story2Id,
        name: "Alien Navigator",
        character:
          "Intuitive, mysterious, has unique perspectives on space travel.",
        background: "From a species with natural navigation abilities.",
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  } catch (error) {
    // Error handling for mock data initialization
  }
};

// Initialize mock data
initMockData();
