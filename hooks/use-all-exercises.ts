"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"

interface ExerciseWithWorkout {
    id: string
    name: string
    sets: string
    weights: string
    notes?: string
    position: number
    is_linked_to_previous: boolean
    created_at: string
    workout: {
        id: string
        date: string
        session_type: "PUSH" | "PULL" | "LEG"
        muscle_tags: string[]
    }
}

interface UniqueExercise extends ExerciseWithWorkout {
    frequency: number
    lastUsed: string
    sessionTypes: string[]
}

export function useAllExercises() {
    const [exercises, setExercises] = useState<ExerciseWithWorkout[]>([])
    const [uniqueExercises, setUniqueExercises] = useState<UniqueExercise[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        fetchAllExercises()
    }, [])

    const fetchAllExercises = async () => {
        try {
            setLoading(true)
            setError(null)

            const { data: exercisesData, error: exercisesError } = await supabase
                .from("exercises")
                .select(`
          id,
          name,
          sets,
          weights,
          notes,
          position,
          is_linked_to_previous,
          created_at,
          workout:workouts!inner(
            id,
            date,
            session_type,
            muscle_tags,
            user_id
          )
        `)
                .eq("workout.user_id", DEFAULT_USER_ID)
                .order("created_at", { ascending: false })

            if (exercisesError) {
                throw exercisesError
            }

            const allExercises =
                (exercisesData || []).map((exercise: any) => ({
                    ...exercise,
                    // If workout is an array, take the first element
                    workout: Array.isArray(exercise.workout) ? exercise.workout[0] : exercise.workout,
                }))
            setExercises(allExercises)

            // Process unique exercises
            const uniqueExercisesMap = new Map<string, UniqueExercise>()

            allExercises.forEach((exercise) => {
                const name = exercise.name.toLowerCase().trim()

                if (!uniqueExercisesMap.has(name)) {
                    // First occurrence - use this as the base
                    uniqueExercisesMap.set(name, {
                        ...exercise,
                        frequency: 1,
                        lastUsed: exercise.workout.date,
                        sessionTypes: [exercise.workout.session_type],
                    })
                } else {
                    // Update existing entry
                    const existing = uniqueExercisesMap.get(name)!
                    existing.frequency++

                    // Keep the most recent data
                    if (new Date(exercise.workout.date) > new Date(existing.lastUsed)) {
                        existing.lastUsed = exercise.workout.date
                        existing.id = exercise.id // Update to most recent ID for editing
                        existing.sets = exercise.sets
                        existing.weights = exercise.weights
                        existing.notes = exercise.notes
                        existing.workout = exercise.workout
                        existing.created_at = exercise.created_at
                        existing.position = exercise.position
                        existing.is_linked_to_previous = exercise.is_linked_to_previous
                    }

                    // Add session type if not already included
                    if (!existing.sessionTypes.includes(exercise.workout.session_type)) {
                        existing.sessionTypes.push(exercise.workout.session_type)
                    }
                }
            })

            // Convert to array and sort alphabetically
            const uniqueExercisesArray = Array.from(uniqueExercisesMap.values()).sort((a, b) =>
                a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
            )

            setUniqueExercises(uniqueExercisesArray)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error al cargar los ejercicios"
            setError(errorMessage)
            console.error("Error fetching all exercises:", err)
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const updateExercise = async (id: string, exerciseData: Partial<ExerciseWithWorkout>) => {
        try {
            const { data, error } = await supabase
                .from("exercises")
                .update({
                    name: exerciseData.name,
                    sets: exerciseData.sets,
                    weights: exerciseData.weights,
                    notes: exerciseData.notes || null,
                })
                .eq("id", id)
                .select(`
          id,
          name,
          sets,
          weights,
          notes,
          position,
          is_linked_to_previous,
          created_at,
          workout:workouts!inner(
            id,
            date,
            session_type,
            muscle_tags
          )
        `)
                .single()

            if (error) {
                throw error
            }

            // Refresh all data to update unique exercises
            await fetchAllExercises()

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
        }
    }

    const deleteExercise = async (id: string) => {
        try {
            const { error } = await supabase.from("exercises").delete().eq("id", id)

            if (error) {
                throw error
            }

            // Refresh all data to update unique exercises
            await fetchAllExercises()

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
        }
    }

    const filterExercises = (searchTerm = "", sessionType = "all", dateRange: { start?: string; end?: string } = {}) => {
        return uniqueExercises.filter((exercise) => {
            // Filter by search term
            if (searchTerm && !exercise.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false
            }

            // Filter by session type
            if (sessionType !== "all" && !exercise.sessionTypes.includes(sessionType as "PUSH" | "PULL" | "LEG")) {
                return false
            }

            // Filter by date range (using lastUsed date)
            if (dateRange.start && exercise.lastUsed < dateRange.start) {
                return false
            }
            if (dateRange.end && exercise.lastUsed > dateRange.end) {
                return false
            }

            return true
        })
    }

    const getExerciseStats = () => {
        const totalExercises = exercises.length
        const uniqueExercisesCount = uniqueExercises.length
        const sessionTypes = {
            PUSH: exercises.filter((ex) => ex.workout.session_type === "PUSH").length,
            PULL: exercises.filter((ex) => ex.workout.session_type === "PULL").length,
            LEG: exercises.filter((ex) => ex.workout.session_type === "LEG").length,
        }
        const supersetExercises = exercises.filter((ex) => ex.is_linked_to_previous).length

        return {
            totalExercises,
            uniqueExercises: uniqueExercisesCount,
            sessionTypes,
            supersetExercises,
        }
    }

    return {
        exercises,
        uniqueExercises,
        loading,
        error,
        updateExercise,
        deleteExercise,
        filterExercises,
        getExerciseStats,
        refetch: fetchAllExercises,
    }
}
