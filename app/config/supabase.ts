import { createClient } from "@supabase/supabase-js";

// These env vars are required for the app to work
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface GameSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  scenario_state: any;
  character: any;
  history: string[];
}

export interface User {
  id: string;
  email: string;
  display_name: string;
}

// Helper functions for database operations

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getUserSessions(userId: string) {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as GameSession[];
}

export async function createGameSession(
  userId: string,
  title: string,
  initialScenario: any,
  character: any
) {
  const { data, error } = await supabase
    .from("game_sessions")
    .insert([
      {
        user_id: userId,
        title,
        scenario_state: initialScenario,
        character,
        history: [initialScenario.description],
      },
    ])
    .select();

  if (error) throw error;
  return data[0] as GameSession;
}

export async function updateGameSession(
  sessionId: string,
  updates: Partial<GameSession>
) {
  const { data, error } = await supabase
    .from("game_sessions")
    .update(updates)
    .eq("id", sessionId)
    .select();

  if (error) throw error;
  return data[0] as GameSession;
}
