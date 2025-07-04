"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

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

export function useExercises() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const createExercise = async (exerciseData: Partial<Exercise>) => {
    setLoading(true)
    try {
      // Get current max position for the workout
      const { data: maxPos } = await supabase
        .from("exercises")
        .select("position")
        .eq("workout_id", exerciseData.workout_id!)
        .order("position", { ascending: false })
        .limit(1)
        .single()

      const nextPosition = (maxPos?.position || 0) + 1

      const { data, error } = await supabase
        .from("exercises")
        .insert({
          workout_id: exerciseData.workout_id!,
          name: exerciseData.name!,
          sets: exerciseData.sets!,
          weights: exerciseData.weights || "",
          notes: exerciseData.notes || null,
          position: nextPosition,
          is_linked_to_previous: exerciseData.is_linked_to_previous || false,
        })
        .select("id, workout_id, name, sets, weights, notes, position, is_linked_to_previous, created_at")
        .single()

      if (error) {
        throw error
      }

      toast({
        title: "Ejercicio añadido",
        description: "El ejercicio se ha añadido correctamente",
      })

      return data
    } catch (error) {
      console.error("Error creating exercise:", error)
      toast({
        title: "Error",
        description: "No se pudo añadir el ejercicio",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateExercise = async (id: string, exerciseData: Partial<Exercise>) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("exercises")
        .update({
          name: exerciseData.name,
          sets: exerciseData.sets,
          weights: exerciseData.weights,
          notes: exerciseData.notes || null,
          is_linked_to_previous: exerciseData.is_linked_to_previous,
        })
        .eq("id", id)
        .select("id, workout_id, name, sets, weights, notes, position, is_linked_to_previous, created_at")
        .single()

      if (error) {
        throw error
      }

      toast({
        title: "Ejercicio actualizado",
        description: "Los cambios se han guardado correctamente",
      })

      return data
    } catch (error) {
      console.error("Error updating exercise:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el ejercicio",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteExercise = async (id: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from("exercises").delete().eq("id", id)

      if (error) {
        throw error
      }

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
      throw error
    } finally {
      setLoading(false)
    }
  }

  const reorderExercises = async (exercises: Exercise[]) => {
    setLoading(true)
    try {
      // Update positions for all exercises
      const updates = exercises.map((exercise, index) => ({
        id: exercise.id,
        position: index + 1,
      }))

      // Execute all updates
      const promises = updates.map(({ id, position }) => supabase.from("exercises").update({ position }).eq("id", id))

      const results = await Promise.all(promises)

      // Check if any update failed
      const errors = results.filter((result) => result.error)
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} exercises`)
      }

      toast({
        title: "Ejercicios reordenados",
        description: "El orden se ha actualizado correctamente",
      })

      return true
    } catch (error) {
      console.error("Error reordering exercises:", error)
      toast({
        title: "Error",
        description: "No se pudo reordenar los ejercicios",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    createExercise,
    updateExercise,
    deleteExercise,
    reorderExercises,
    loading,
  }
}
