# Play Game API Documentation

## Overview
This API enables users to play interactive story-based games with multiple AI characters using LangGraph's multi-agent architecture. Each character possesses both long-term and short-term memory systems.

## Game Flow
1. User selects a story
2. User chooses a character to play (sets `is_player` to true)
3. Game starts with the selected story context and characters

## Endpoints

### 1. Get Available Stories
```
GET /api/playGame/stories
```
Returns a list of available stories for selection.

**Response:**
```json
{
  "stories": [
    {
      "story_id": "uuid",
      "title": "Story Title",
      "background": "Brief description of the story",
      "character_num": 4,
      "preview_image": "url_to_image"
    }
  ]
}
```

### 2. Get Characters for Story
```
GET /api/playGame/characters/{story_id}
```
Returns all characters associated with the selected story.

**Response:**
```json
{
  "characters": [
    {
      "character_id": "uuid",
      "name": "Character Name",
      "background": "Character background information",
      "avatar": "url_to_avatar",
      "is_player": false
    }
  ]
}
```

### 3. Select Player Character
```
POST /api/playGame/select-character
```

**Request Body:**
```json
{
  "story_id": "uuid",
  "character_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "game_session_id": "uuid"
}
```

### 4. Send Message
```
POST /api/playGame/chat
```

**Request Body:**
```json
{
  "game_session_id": "uuid",
  "message": "Player's message"
}
```

**Response:**
```json
{
  "responses": [
    {
      "character_id": "uuid",
      "character_name": "Character Name",
      "message": "Character's response",
      "timestamp": "ISO timestamp"
    }
  ]
}
```

## Multi-Agent System Architecture

### Memory System

#### Memory Flow Architecture

The memory system follows a structured flow:

1. **Dialog Context** - Raw conversation data from player and character interactions
2. **LLM Gateway** - Processes raw dialog and extracts relevant information
3. **Memory Pools** - Organized storage for different types of processed memories
4. **Forget Gateway** - Mechanism for memory consolidation and forgetting

#### Long-Term Memory
- **Content:** Story background, character personalities, world context
- **Implementation:** 
  - Initially loaded from database (character backgrounds, story settings)
  - Processed through LLM Gateway to extract key information
  - Stored in Long Term Memory Pool as embeddings in a vector database
  - Retrieved contextually when needed during gameplay
  - Relatively stable with infrequent updates

#### Short-Term Memory
- **Content:** Recent conversation history and important interaction details
- **Implementation:**
  - Dialog Context flows through LLM Gateway for processing
  - Processed information stored in Short Term Memory Pool
  - Employs Forget Gateway mechanism for extended conversations:
    - When memory exceeds threshold, passes through Forget Gateway
    - Important information is retained, less relevant details discarded
    - Memory pool is updated with consolidated information

### Memory Processing Components

1. **LLM Gateway:**
   - Functions as the primary processor for incoming information
   - Analyzes dialog context and long-term memory
   - Extracts key insights, emotions, and important details
   - Routes processed information to appropriate memory pools

2. **Memory Pools:**
   - Structured storage for processed memories
   - Long Term Memory Pool: Stable character and world knowledge
   - Short Term Memory Pool: Recent interactions and dynamic context
   - Both pools contribute to character decision-making

3. **Forget Gateway:**
   - Specifically handles memory consolidation for short-term memory
   - Triggered when short-term memory exceeds capacity threshold
   - Uses LLM to evaluate importance of each memory element
   - Consolidates important information and discards less relevant details
   - Returns condensed memory to update the Short Term Memory Pool

### Agent Interaction Flow
1. Player sends message
2. Message is added to Dialog Context
3. Dialog Context and Long Term Memory (loaded from DB) are processed by LLM Gateway
4. LLM Gateway outputs feed both memory pools:
   - Short Term Memory Pool for recent conversation context
   - Long Term Memory Pool for updated character understanding
5. When Short Term Memory becomes too large, Forget Gateway processes and consolidates it
6. Each character agent generates a response based on the processed memory pools
7. Responses are returned to the player in appropriate sequence

### Memory Management
1. **Memory Processing Pipeline:**
   - Raw inputs → LLM summarization → Key information extraction → Storage
   
2. **Forgetting Mechanism:**
   - Triggered when conversation exceeds defined threshold
   - LLM ranks information by importance to character/plot
   - Condensed summary replaces detailed history
   - Critical plot points and character information are preserved

3. **Memory Retrieval:**
   - Contextual retrieval based on current conversation
   - Dynamic blending of long-term character knowledge with short-term context
   - Importance-based scoring determines which memories influence responses

## Implementation Architecture

### Service Layer

The service layer implements game logic and manages interactions between characters using a multi-agent architecture. The primary components are:

1. **PlayGameService**: Main service that handles:
   - Story and character retrieval
   - Player character selection
   - Game session management
   - Message processing through the multi-agent system

2. **Memory Management**: 
   - Long-term memories load from database and provide stable character knowledge
   - Short-term memories track recent conversations
   - Memory pool keeps only essential information through LLM processing

3. **Multi-Agent System**: Using a graph-based architecture with:
   - **LLM Gateway Node**: Processes dialog and extracts key information
   - **Forget Gateway Node**: Consolidates memories when they exceed thresholds
   - **Character Agent Nodes**: Generate responses based on personality and memory

### API Layer

The REST API exposes the following endpoints:

1. **GET /api/playGame/stories**
   - Returns all available stories for selection

2. **GET /api/playGame/characters/{story_id}**
   - Returns all characters for a specific story

3. **POST /api/playGame/select-character**
   - Selects a player character and initiates a game session
   - Creates memory pools for all characters in the story

4. **POST /api/playGame/chat**
   - Processes player messages
   - Runs the multi-agent system to generate NPC responses
   - Returns responses from all relevant characters

### Data Model

1. **GameSession**: Tracks active game sessions
   - Links stories, characters, and player information
   - Manages session state

2. **Memory Types**:
   - **BaseMemory**: Common properties for all memories
   - **LongTermMemory**: Character background, personality, goals
   - **ShortTermMemory**: Recent conversations with importance ranking

3. **CharacterAgentState**: Internal state for each character agent
   - Combines personality, background, and memory pools
   - Maintains conversation context

### LangGraph Implementation

The multi-agent system is implemented using a LangGraph-style directed graph:

1. **Graph Structure**:
   ```
   LLM Gateway → Forget Gateway → Character 1 → Character 2 → ... → Character N
   ```

2. **Data Flow**:
   - Player message enters the system
   - LLM Gateway processes and extracts key information
   - Forget Gateway consolidates memories if needed
   - Each character agent generates a contextually appropriate response
   - Responses return to the player in sequence

3. **Memory Processing**:
   - Dialog context and character info pass through LLM Gateway
   - Gateway extracts important information and updates memory pools
   - When memory exceeds thresholds, Forget Gateway consolidates
   - Character agents access processed memories for response generation

### Production Considerations

1. **LLM Integration**:
   - Replace mock implementations with actual LLM API calls
   - Optimize prompts for each component (Gateway, Memory, Character)
   - Consider batching requests to improve performance

2. **Database Implementation**:
   - Replace in-memory storage with proper database
   - Use vector database for semantic memory retrieval
   - Implement efficient caching for frequently accessed data

3. **Scaling**:
   - Process memory updates asynchronously
   - Consider serverless functions for character agent execution
   - Implement rate limiting for API endpoints

4. **Monitoring**:
   - Track memory growth and consolidation
   - Monitor LLM token usage
   - Measure response times and user engagement

## Implementation Considerations
- LangGraph manages agent coordination and turn-taking
- Vector database for efficient memory storage and retrieval
- Memory processing should occur asynchronously to maintain response speed
- Character personalities should remain consistent throughout the game
- Memory pools should be character-specific to maintain distinct personalities
- LLM Gateway and Forget Gateway can use the same LLM with different prompting strategies
