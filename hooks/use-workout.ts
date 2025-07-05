"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"

interface Workout {
  id: string
  date: string
  session_type: "PUSH" | "PULL" | "LEG"
  muscle_tags: string[]
  user_id: string
}

interface Exercise {
  id: string
  workout_id: string
  name: string
  sets: string
  weights: string
  notes?: string
  position: number
  is_linked_to_previous: boolean
}

export function useWorkout(date: string) {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)

  const { toast } = useToast()

  useEffect(() => {
    fetchWorkout()
  }, [date])

  const fetchWorkout = async () => {
    setLoading(true)
    try {
      // Fetch workout
      const { data: workoutData, error: workoutError } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", DEFAULT_USER_ID)
        .eq("date", date)
        .single()

      if (workoutError && workoutError.code !== "PGRST116") {
        throw workoutError
      }

      // Fetch exercises if workout exists
      let exercisesData: Exercise[] = []
      if (workoutData) {
        const { data: exercises, error: exercisesError } = await supabase
          .from("exercises")
          .select("id, workout_id, name, sets, weights, notes, position, is_linked_to_previous, created_at")
          .eq("workout_id", workoutData.id)
          .order("position", { ascending: true })

        if (exercisesError) {
          throw exercisesError
        }

        exercisesData = exercises || []
      }

      setWorkout(workoutData)
      setExercises(exercisesData)
    } catch (error) {
      console.error("Error fetching workout:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el entrenamiento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createWorkout = async (workoutData: Partial<Workout>) => {
    try {
      const { data, error } = await supabase
        .from("workouts")
        .insert({
          user_id: DEFAULT_USER_ID,
          date,
          session_type: workoutData.session_type!,
          muscle_tags: workoutData.muscle_tags || [],
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      setWorkout(data)
      toast({
        title: "Entrenamiento creado",
        description: "El entrenamiento se ha creado correctamente",
      })
    } catch (error) {
      console.error("Error creating workout:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el entrenamiento",
        variant: "destructive",
      })
    }
  }

  const updateWorkout = async (workoutData: Partial<Workout>) => {
    try {
      if (!workout) return

      const { data, error } = await supabase.from("workouts").update(workoutData).eq("id", workout.id).select().single()

      if (error) {
        throw error
      }

      setWorkout(data)
      toast({
        title: "Entrenamiento actualizado",
        description: "Los cambios se han guardado correctamente",
      })
    } catch (error) {
      console.error("Error updating workout:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el entrenamiento",
        variant: "destructive",
      })
    }
  }

  const deleteExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase.from("exercises").delete().eq("id", exerciseId)

      if (error) {
        throw error
      }

      setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId))
      toast({
        title: "Ejercicio eliminado",
        description: "El ejercicio se ha eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting exercise:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el ejercicio",
        variant: "destructive",
      })
    }
  }

  return {
    workout,
    exercises,
    loading,
    createWorkout,
    updateWorkout,
    deleteExercise,
    refetch: fetchWorkout,
  }
}
