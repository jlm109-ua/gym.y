"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { generateStatsPDF } from "@/lib/pdf-generator"

interface ExerciseStats {
    name: string
    session_type: string
    frequency: number
    max_weight: string
    avg_weight: string
    avg_sets: string
    last_performed: string
}

interface SessionStats {
    total_sessions: number
    this_month: number
    last_session: string
    days_since_last: number
    session_distribution: Array<{
        session_type: string
        count: number
    }>
}

interface ProgressStats {
    weight_progress: Array<{
        date: string
        weight: number
    }>
}

export function useStats() {
    const [exerciseStats, setExerciseStats] = useState<ExerciseStats[]>([])
    const [sessionStats, setSessionStats] = useState<SessionStats | null>(null)
    const [progressStats, setProgressStats] = useState<ProgressStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        setLoading(true)
        try {
            // Fetch exercise statistics
            const { data: exercisesData, error: exercisesError } = await supabase
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

            if (exercisesError) throw exercisesError

            // Process exercise statistics
            const exerciseMap = new Map<string, any>()

            exercisesData?.forEach((exercise: any) => {
                const name = exercise.name
                if (!exerciseMap.has(name)) {
                    exerciseMap.set(name, {
                        name,
                        session_type: exercise.workout.session_type,
                        frequency: 0,
                        weights: [],
                        sets: [],
                        dates: [],
                    })
                }

                const exerciseData = exerciseMap.get(name)
                exerciseData.frequency++
                exerciseData.dates.push(exercise.workout.date)

                // Parse weights
                if (exercise.weights && exercise.weights !== "Sin Peso") {
                    const weights = exercise.weights
                        .replace(/kg/g, "")
                        .split(",")
                        .map((w: string) => Number.parseFloat(w.trim()))
                        .filter((w: number) => !isNaN(w))
                    exerciseData.weights.push(...weights)
                }

                // Parse sets
                const setsMatch = exercise.sets?.match(/^(\d+)/)
                if (setsMatch) {
                    exerciseData.sets.push(Number.parseInt(setsMatch[1]))
                }
            })

            // Convert to final format
            const processedExerciseStats: ExerciseStats[] = Array.from(exerciseMap.values()).map((data) => ({
                name: data.name,
                session_type: data.session_type,
                frequency: data.frequency,
                max_weight: data.weights.length > 0 ? `${Math.max(...data.weights)}kg` : "N/A",
                avg_weight:
                    data.weights.length > 0
                        ? `${(data.weights.reduce((a: number, b: number) => a + b, 0) / data.weights.length).toFixed(1)}kg`
                        : "N/A",
                avg_sets:
                    data.sets.length > 0
                        ? (data.sets.reduce((a: number, b: number) => a + b, 0) / data.sets.length).toFixed(1)
                        : "N/A",
                last_performed: data.dates.sort().reverse()[0],
            }))

            setExerciseStats(processedExerciseStats)

            // Fetch session statistics
            const { data: workoutsData, error: workoutsError } = await supabase
                .from("workouts")
                .select("id, date, session_type")
                .eq("user_id", DEFAULT_USER_ID)
                .order("date", { ascending: false })

            if (workoutsError) throw workoutsError

            if (workoutsData && workoutsData.length > 0) {
                const now = new Date()
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                const thisMonthWorkouts = workoutsData.filter((w) => new Date(w.date) >= startOfMonth)

                const lastSession = workoutsData[0]
                const daysSinceLast = Math.floor((now.getTime() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24))

                // Session distribution
                const distribution = workoutsData.reduce((acc: any, workout) => {
                    acc[workout.session_type] = (acc[workout.session_type] || 0) + 1
                    return acc
                }, {})

                const sessionDistribution = Object.entries(distribution).map(([session_type, count]) => ({
                    session_type,
                    count: count as number,
                }))

                setSessionStats({
                    total_sessions: workoutsData.length,
                    this_month: thisMonthWorkouts.length,
                    last_session: lastSession.date,
                    days_since_last: daysSinceLast,
                    session_distribution: sessionDistribution,
                })
            }

            // Fetch progress statistics
            const { data: progressData, error: progressError } = await supabase
                .from("physical_progress")
                .select("date, weight")
                .eq("user_id", DEFAULT_USER_ID)
                .order("date", { ascending: true })

            if (!progressError && progressData) {
                setProgressStats({
                    weight_progress: progressData.map((p) => ({
                        date: new Date(p.date).toLocaleDateString("es-ES", {
                            month: "short",
                            day: "numeric",
                        }),
                        weight: p.weight,
                    })),
                })
            }
        } catch (error) {
            console.error("Error fetching stats:", error)
        } finally {
            setLoading(false)
        }
    }

    const exportStatsPDF = async () => {
        try {
            if (!exerciseStats || exerciseStats.length === 0) {
                return { success: false, error: "No hay estadísticas para exportar" }
            }

            // Generate PDF
            const doc = generateStatsPDF(exerciseStats, sessionStats)
            doc.save(`estadisticas-${new Date().toISOString().split("T")[0]}.pdf`)

            return { success: true }
        } catch (error) {
            console.error("Error exporting stats:", error)
            return { success: false, error: "Error al exportar estadísticas" }
        }
    }

    return {
        exerciseStats,
        sessionStats,
        progressStats,
        loading,
        exportStatsPDF,
        refetch: fetchStats,
    }
}
