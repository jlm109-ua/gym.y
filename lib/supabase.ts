import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      workouts: {
        Row: {
          id: string
          user_id: string
          date: string
          session_type: "PUSH" | "PULL" | "LEG"
          muscle_tags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          session_type: "PUSH" | "PULL" | "LEG"
          muscle_tags?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          session_type?: "PUSH" | "PULL" | "LEG"
          muscle_tags?: string[]
          created_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          workout_id: string
          name: string
          sets: string
          weights: string
          notes: string | null
          position: number
          is_linked_to_previous: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          name: string
          sets: string
          weights?: string
          notes?: string | null
          position?: number
          is_linked_to_previous?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          name?: string
          sets?: string
          weights?: string
          notes?: string | null
          position?: number
          is_linked_to_previous?: boolean
          created_at?: string
        }
      }
      physical_progress: {
        Row: {
          id: string
          user_id: string
          date: string
          weight: number | null
          height: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          weight?: number | null
          height?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          weight?: number | null
          height?: number | null
          created_at?: string
        }
      }
      exercise_templates: {
        Row: {
          id: string
          name: string
          session_type: "PUSH" | "PULL" | "LEG"
          muscle_tags: string[]
          is_global: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          session_type: "PUSH" | "PULL" | "LEG"
          muscle_tags?: string[]
          is_global?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          session_type?: "PUSH" | "PULL" | "LEG"
          muscle_tags?: string[]
          is_global?: boolean
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          theme: "light" | "dark"
          primary_color: "blue" | "red" | "green" | "purple" | "orange"
          updated_at: string
        }
        Insert: {
          id?: string
          theme?: "light" | "dark"
          primary_color?: "blue" | "red" | "green" | "purple" | "orange"
          updated_at?: string
        }
        Update: {
          id?: string
          theme?: "light" | "dark"
          primary_color?: "blue" | "red" | "green" | "purple" | "orange"
          updated_at?: string
        }
      }
    }
  }
}

// Constante para el usuario único (UUID válido)
export const DEFAULT_USER_ID = "550e8400-e29b-41d4-a716-446655440000"
