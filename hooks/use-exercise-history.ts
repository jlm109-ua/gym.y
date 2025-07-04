"use client"

import { useState, useEffect } from "react"
import { supabase, DEFAULT_USER_ID } from "@/lib/supabase"

interface ExerciseHistoryItem {
    name: string
    frequency: number
    lastUsed: string
    avgSets: string
    avgWeight: string
}

export function useExerciseHistory(sessionType?: "PUSH" | "PULL" | "LEG") {
    const [exercises, setExercises] = useState<ExerciseHistoryItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (sessionType) {
            fetchExerciseHistory()
        } else {
            setExercises([])
            setLoading(false)
        }
    }, [sessionType])

    const fetchExerciseHistory = async () => {
        setLoading(true)
        try {
            // Fetch exercises from workouts of the same session type
            const { data: exercisesData, error } = await supabase
                .from("exercises")
                .select(`
          name,
          sets,
          weights,
          created_at,
          workout:workouts!inner(
            session_type,
            date,
            user_id
          )
        `)
                .eq("workout.user_id", DEFAULT_USER_ID)
                .eq("workout.session_type", sessionType)
                .order("created_at", { ascending: false })

            if (error) {
                throw error
            }

            // Process and group exercises by name
            const exerciseMap = new Map<
                string,
                {
                    frequency: number
                    lastUsed: string
                    sets: string[]
                    weights: string[]
                }
            >()

            exercisesData?.forEach((exercise: any) => {
                const name = exercise.name
                if (!exerciseMap.has(name)) {
                    exerciseMap.set(name, {
                        frequency: 0,
                        lastUsed: exercise.workout.date,
                        sets: [],
                        weights: [],
                    })
                }

                const exerciseData = exerciseMap.get(name)!
                exerciseData.frequency++

                // Keep the most recent date
                if (new Date(exercise.workout.date) > new Date(exerciseData.lastUsed)) {
                    exerciseData.lastUsed = exercise.workout.date
                }

                // Collect sets and weights for averaging
                if (exercise.sets) {
                    exerciseData.sets.push(exercise.sets)
                }
                if (exercise.weights && exercise.weights !== "Sin Peso") {
                    exerciseData.weights.push(exercise.weights)
                }
            })

            // Convert to array and calculate averages
            const processedExercises: ExerciseHistoryItem[] = Array.from(exerciseMap.entries())
                .map(([name, data]) => {
                    // Calculate average sets (extract first number from formats like "4x12")
                    const avgSets =
                        data.sets.length > 0
                            ? Math.round(
                                data.sets.reduce((sum, sets) => {
                                    const match = sets.match(/^(\d+)/)
                                    return sum + (match ? Number.parseInt(match[1]) : 0)
                                }, 0) / data.sets.length,
                            ).toString()
                            : "4"

                    // Calculate most common weight pattern
                    const avgWeight =
                        data.weights.length > 0
                            ? data.weights[0] // Use most recent weight as reference
                            : ""

                    return {
                        name,
                        frequency: data.frequency,
                        lastUsed: data.lastUsed,
                        avgSets,
                        avgWeight,
                    }
                })
                .sort((a, b) => {
                    // Sort by frequency first, then by recency
                    if (b.frequency !== a.frequency) {
                        return b.frequency - a.frequency
                    }
                    return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
                })

            setExercises(processedExercises)
        } catch (error) {
            console.error("Error fetching exercise history:", error)
            setExercises([])
        } finally {
            setLoading(false)
        }
    }

    return {
        exercises,
        loading,
        refetch: fetchExerciseHistory,
    }
}
