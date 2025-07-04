"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface ExerciseTemplate {
  id: string
  name: string
  session_type: "PUSH" | "PULL" | "LEG"
  muscle_tags: string[]
  is_global: boolean
}

export function useExerciseTemplates(sessionType?: "PUSH" | "PULL" | "LEG") {
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [sessionType])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const query = supabase.from("exercise_templates").select("*")

      if (sessionType) {
        query.eq("session_type", sessionType)
      }

      const { data, error } = await query

      if (error) throw error

      // Asegura que muscle_tags es siempre un array (por si Supabase lo guarda como texto)
      const normalized = data.map((template) => ({
        ...template,
        muscle_tags: Array.isArray(template.muscle_tags)
          ? template.muscle_tags
          : template.muscle_tags?.split(",").map((tag: string) => tag.trim()) ?? [],
      }))

      setTemplates(normalized)
    } catch (error) {
      console.error("Error fetching templates:", error)
    } finally {
      setLoading(false)
    }
  }

  return {
    templates,
    loading,
    refetch: fetchTemplates,
  }
}
