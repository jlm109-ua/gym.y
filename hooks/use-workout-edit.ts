"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Workout {
    id: string
    date: string
    session_type: "PUSH" | "PULL" | "LEG"
    muscle_tags: string[]
    user_id: string
}

interface UpdateWorkoutData {
    session_type?: "PUSH" | "PULL" | "LEG"
    muscle_tags?: string[]
}

export function useWorkoutEdit() {
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const updateWorkout = async (workoutId: string, updateData: UpdateWorkoutData) => {
        setLoading(true)
        try {
            const { data, error } = await supabase.from("workouts").update(updateData).eq("id", workoutId).select().single()

            if (error) {
                throw error
            }

            toast({
                title: "Entrenamiento actualizado",
                description: "Los cambios se han guardado correctamente",
            })

            return data
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Error al actualizar el entrenamiento"
            console.error("Error updating workout:", error)
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
            throw error
        } finally {
            setLoading(false)
        }
    }

    const getWorkout = async (workoutId: string) => {
        try {
            const { data, error } = await supabase.from("workouts").select("*").eq("id", workoutId).single()

            if (error) {
                throw error
            }

            return data
        } catch (error) {
            console.error("Error fetching workout:", error)
            throw error
        }
    }

    return {
        updateWorkout,
        getWorkout,
        loading,
    }
}
