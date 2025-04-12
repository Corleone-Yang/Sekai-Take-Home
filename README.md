# Sekai Take-Home Project

An interactive, text-based, AI-powered Dungeons & Dragons style game built with Next.js and Supabase.

## Architecture Overview

This project implements a D&D-style interactive adventure game with the following components:

### Frontend (Next.js App Router)
- **Page-based routing** for different game sections
- **React components** for UI rendering
- **Client-side state management** for game interactions
- **Tailwind CSS** for styling

### Backend (Supabase)
- **Authentication** for user management
- **PostgreSQL database** for game data storage
- **Row-level security** for data protection
- **Real-time updates** for game state changes

### AI Integration (Google Gemini)
- **Dynamic storytelling** using Gemini's generative AI
- **Character-aware responses** that factor in player abilities
- **Fallback system** for offline/error scenarios
- **Context-sensitive generation** based on game history

### Game Flow
1. User creates an account or logs in
2. User creates a character with customizable abilities
3. User selects a character to start/continue an adventure
4. The game presents scenarios with multiple options
5. User makes choices that affect the story progression
6. The Gemini API generates context-aware responses or falls back to local generation
7. The system uses character stats to determine outcomes
8. Game state is persisted for future sessions

## Project Structure

```
/app
  /api
    /generate - AI response generation endpoint
  /character
    /create - Character creation page
    /select - Character selection page 
  /components
    - AdventureGame.tsx - Main game component
    - Auth.tsx - Authentication component
    - CharacterInfo.tsx - Character stats display
    - ScenarioDisplay.tsx - Game scenario display
    - UserInput.tsx - Player input handling
  /db
    - schema.sql - Database schema for Supabase
  /lib
    - supabase.ts - Supabase client and database functions
    - gemini.ts - Google Gemini API client and prompt generation
  /types
    - database.ts - TypeScript interfaces for database models
  /adventure - Main gameplay page
  /login - Authentication page
  /page.tsx - Home page
  /layout.tsx - Root layout
  /globals.css - Global styles with Tailwind
```

## Data Model

### Character
- Basic info (name, level)
- Abilities (strength, dexterity, intelligence, wisdom, charisma, constitution)
- Stats (health, mana, experience)
- Inventory (items with properties)

### Game Session
- Connected to a character
- Current scenario state
- Game history with timestamps
- Session metadata

### Game Scenario
- Description text
- Location information
- Available options
- Context data for game logic

## Features

- **Interactive storytelling** with AI-generated responses
- **Character creation** with customizable abilities
- **Character progression** with experience and leveling
- **Persistent game sessions** to continue adventures
- **Dynamic scenario generation** based on character choices
- **Ability-based outcome determination** for realistic gameplay
- **Inventory management** for items and equipment
- **User authentication** and session management
- **Responsive design** for all devices
- **AI-powered narration** using Google Gemini API

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn
- Supabase account
- Google Gemini API key

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Supabase Setup

1. Create a new Supabase project
2. Set up authentication with email/password
3. Run the SQL commands from `app/db/schema.sql` in the Supabase SQL editor to create the necessary tables and security policies

### Gemini API Setup

1. Get a Google Gemini API key from https://ai.google.dev/
2. Add your API key to the `.env.local` file
3. The application will automatically use Gemini for response generation when available

## License

[Include your license information here]