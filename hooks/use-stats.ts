"use client"

import { useState, useEffect } from "react"
import { supabase, DEFAULT_USER_ID } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface ExerciseStats {
    name: string
    maxWeight: string
    repsAtMaxWeight: number
    maxReps: number
    weightAtMaxReps: string
    totalSets: number
    sessionTypes: string[]
    totalWorkouts: number
    averageWeight: string
    lastPerformed: string
}

interface WorkoutStats {
    totalWorkouts: number
    totalExercises: number
    totalSets: number
    workoutsByType: Record<string, number>
    exercisesByMuscle: Record<string, number>
    workoutsThisMonth: number
    workoutsThisWeek: number
}

interface RawExerciseData {
    id: string
    name: string
    sets: string
    weights: string
    is_linked_to_previous: boolean // ✅ Añadir este campo
    workout: {
        session_type: string
        date: string
        muscle_tags: string[]
    }
}

export function useStats() {
    const [exerciseStats, setExerciseStats] = useState<ExerciseStats[]>([])
    const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            setLoading(true)
            setError(null)

            // Fetch all exercises with their workout data
            const { data: exercisesData, error: exercisesError } = await supabase
                .from("exercises")
                .select(`
          id,
          name,
          sets,
          weights,
          is_linked_to_previous,
          workout:workouts!inner(
            session_type,
            date,
            muscle_tags,
            user_id
          )
        `) // ✅ Incluir is_linked_to_previous
                .eq("workout.user_id", DEFAULT_USER_ID)

            if (exercisesError) {
                throw exercisesError
            }

            // Fetch workout stats
            const { data: workoutsData, error: workoutsError } = await supabase
                .from("workouts")
                .select("id, session_type, date, muscle_tags")
                .eq("user_id", DEFAULT_USER_ID)

            if (workoutsError) {
                throw workoutsError
            }

            // Flatten exercisesData so each exercise has a single workout object (not array)
            const flatExercisesData: RawExerciseData[] = (exercisesData || []).map((exercise: any) => {
                // If workout is an array, take the first one (should only be one due to inner join)
                const workoutObj = Array.isArray(exercise.workout) ? exercise.workout[0] : exercise.workout
                return {
                    ...exercise,
                    workout: workoutObj,
                }
            })

            // Process the data
            const processedExerciseStats = processExerciseStats(flatExercisesData)
            const processedWorkoutStats = processWorkoutStats(workoutsData, flatExercisesData)

            setExerciseStats(processedExerciseStats)
            setWorkoutStats(processedWorkoutStats)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error al cargar las estadísticas"
            setError(errorMessage)
            console.error("Error fetching stats:", err)
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const processExerciseStats = (exercises: RawExerciseData[]): ExerciseStats[] => {
        const exerciseMap = new Map<
            string,
            {
                weights: number[]
                reps: number[]
                sets: number
                sessionTypes: Set<string>
                workouts: Set<string>
                dates: string[]
            }
        >()

        // Group exercises by name
        exercises.forEach((exercise) => {
            const name = exercise.name
            if (!exerciseMap.has(name)) {
                exerciseMap.set(name, {
                    weights: [],
                    reps: [],
                    sets: 0,
                    sessionTypes: new Set(),
                    workouts: new Set(),
                    dates: [],
                })
            }

            const exerciseData = exerciseMap.get(name)!

            // Parse sets (e.g., "4x12" or "4")
            const setsMatch = exercise.sets.match(/^(\d+)(?:x(\d+))?$/)
            if (setsMatch) {
                const numSets = Number.parseInt(setsMatch[1])
                const reps = setsMatch[2] ? Number.parseInt(setsMatch[2]) : 0

                exerciseData.sets += numSets
                if (reps > 0) {
                    exerciseData.reps.push(reps)
                }
            }

            // Parse weights (e.g., "40kg,45kg,50kg" or "40,45,50")
            if (exercise.weights && exercise.weights !== "Sin Peso" && exercise.weights !== "Barra") {
                const weights = exercise.weights
                    .replace(/kg/g, "")
                    .split(",")
                    .map((w) => Number.parseFloat(w.trim()))
                    .filter((w) => !isNaN(w))

                exerciseData.weights.push(...weights)
            }

            exerciseData.sessionTypes.add(exercise.workout.session_type)
            exerciseData.workouts.add(exercise.workout.date)
            exerciseData.dates.push(exercise.workout.date)
        })

        // Convert to ExerciseStats array
        return Array.from(exerciseMap.entries())
            .map(([name, data]) => {
                const maxWeight = data.weights.length > 0 ? Math.max(...data.weights) : 0
                const maxReps = data.reps.length > 0 ? Math.max(...data.reps) : 0
                const averageWeight =
                    data.weights.length > 0 ? data.weights.reduce((a, b) => a + b, 0) / data.weights.length : 0

                // Find reps at max weight (simplified - using max reps for now)
                const repsAtMaxWeight = maxReps

                // Find weight at max reps (simplified - using average weight for now)
                const weightAtMaxReps = averageWeight

                const lastPerformed =
                    data.dates.length > 0
                        ? new Date(Math.max(...data.dates.map((d) => new Date(d).getTime()))).toISOString().split("T")[0]
                        : ""

                return {
                    name,
                    maxWeight: maxWeight > 0 ? `${maxWeight}kg` : "Sin peso",
                    repsAtMaxWeight,
                    maxReps,
                    weightAtMaxReps: weightAtMaxReps > 0 ? `${weightAtMaxReps.toFixed(1)}kg` : "Sin peso",
                    totalSets: data.sets,
                    sessionTypes: Array.from(data.sessionTypes),
                    totalWorkouts: data.workouts.size,
                    averageWeight: averageWeight > 0 ? `${averageWeight.toFixed(1)}kg` : "Sin peso",
                    lastPerformed,
                }
            })
            .sort((a, b) => b.totalSets - a.totalSets) // Sort by total sets descending
    }

    const processWorkoutStats = (workouts: any[], exercises: RawExerciseData[]): WorkoutStats => {
        const now = new Date()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const workoutsByType: Record<string, number> = {}
        const exercisesByMuscle: Record<string, number> = {}
        let workoutsThisMonth = 0
        let workoutsThisWeek = 0

        workouts.forEach((workout) => {
            const workoutDate = new Date(workout.date)

            // Count by type
            workoutsByType[workout.session_type] = (workoutsByType[workout.session_type] || 0) + 1

            // Count by muscle groups
            workout.muscle_tags?.forEach((muscle: string) => {
                exercisesByMuscle[muscle] = (exercisesByMuscle[muscle] || 0) + 1
            })

            // Count this month and week
            if (workoutDate >= startOfMonth) {
                workoutsThisMonth++
            }
            if (workoutDate >= startOfWeek) {
                workoutsThisWeek++
            }
        })

        return {
            totalWorkouts: workouts.length,
            totalExercises: new Set(exercises.map((e) => e.name)).size,
            totalSets: exercises.reduce((total, exercise) => {
                const setsMatch = exercise.sets.match(/^(\d+)/)
                return total + (setsMatch ? Number.parseInt(setsMatch[1]) : 0)
            }, 0),
            workoutsByType,
            exercisesByMuscle,
            workoutsThisMonth,
            workoutsThisWeek,
        }
    }

    const getTopExercises = (limit = 5) => {
        return exerciseStats.slice(0, limit)
    }

    const getExercisesBySessionType = (sessionType: string) => {
        return exerciseStats.filter((exercise) => exercise.sessionTypes.includes(sessionType))
    }

    const getRecentExercises = (days = 30) => {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)

        return exerciseStats
            .filter((exercise) => new Date(exercise.lastPerformed) >= cutoffDate)
            .sort((a, b) => new Date(b.lastPerformed).getTime() - new Date(a.lastPerformed).getTime())
    }

    return {
        exerciseStats,
        workoutStats,
        loading,
        error,
        refetch: fetchStats,
        // Helper functions
        getTopExercises,
        getExercisesBySessionType,
        getRecentExercises,
    }
}
