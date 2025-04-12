export interface Character {
  id: string;
  user_id: string;
  name: string;
  abilities: {
    strength: number;
    dexterity: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    constitution: number;
  };
  stats: {
    level: number;
    experience: number;
    health: number;
    max_health: number;
    mana: number;
    max_mana: number;
  };
  inventory: InventoryItem[];
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: "weapon" | "armor" | "potion" | "scroll" | "key" | "misc";
  properties?: Record<string, any>;
  quantity: number;
}

export interface GameSession {
  id: string;
  user_id: string;
  title: string;
  character_id: string;
  created_at: string;
  updated_at: string;
  scenario_state: GameScenario;
  history: GameHistoryEntry[];
}

export interface GameScenario {
  id: string;
  description: string;
  location: string;
  options: string[];
  context?: Record<string, any>;
}

export interface GameHistoryEntry {
  id: string;
  timestamp: string;
  type: "narration" | "player_action" | "system_message";
  content: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  settings: UserSettings;
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  notifications_enabled: boolean;
  difficulty: "easy" | "normal" | "hard";
}
