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
    estimated_1rm: string
    progression_rate: string
    total_volume: number
}

interface SessionStats {
    total_sessions: number
    this_month: number
    last_session: string
    days_since_last: number
    total_volume_month: number
    avg_exercises_per_session: number
    session_distribution: Array<{
        session_type: string
        count: number
        total_volume: number
    }>
}

interface WellnessStats {
    avg_energy: number
    avg_stress: number
    avg_sleep_hours: number
    avg_sleep_quality: number
    avg_muscle_soreness: number
    avg_motivation: number
    wellness_trend: Array<{
        date: string
        energy: number
        stress: number
        sleep_quality: number
        motivation: number
    }>
}

interface PerformanceStats {
    strength_progression: Array<{
        exercise: string
        progression_percentage: number
        current_1rm: number
        previous_1rm: number
    }>
    volume_trends: Array<{
        week: string
        total_volume: number
        session_count: number
        avg_intensity: number
    }>
    frequency_analysis: Array<{
        muscle_group: string
        weekly_frequency: number
        recommended_frequency: number
        status: "optimal" | "low" | "high"
    }>
}

interface Alert {
    type: "warning" | "info" | "success"
    title: string
    message: string
    metric: string
}

export function useStats() {
    const [exerciseStats, setExerciseStats] = useState<ExerciseStats[]>([])
    const [sessionStats, setSessionStats] = useState<SessionStats | null>(null)
    const [wellnessStats, setWellnessStats] = useState<WellnessStats | null>(null)
    const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null)
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const calculateEstimated1RM = (weight: number, reps: number): number => {
        // Fórmula de Epley: 1RM = weight × (1 + reps/30)
        // El 1RM nunca puede ser menor que el peso levantado
        const calculated1RM = weight * (1 + reps / 30)
        return Math.max(calculated1RM, weight)
    }

    const fetchStats = async () => {
        setLoading(true)
        try {
            // First, get all workouts for the user
            const { data: workoutsData, error: workoutsError } = await supabase
                .from("workouts")
                .select("id, date, session_type")
                .eq("user_id", DEFAULT_USER_ID)
                .order("date", { ascending: false })

            if (workoutsError) throw workoutsError

            // Then get exercises with workout info
            const { data: exercisesData, error: exercisesError } = await supabase
                .from("exercises")
                .select(`
          name,
          sets,
          weights,
          created_at,
          workout_id,
          workouts!inner(
            session_type,
            date,
            user_id
          )
        `)
                .eq("workouts.user_id", DEFAULT_USER_ID)
                .order("created_at", { ascending: false })

            if (exercisesError) throw exercisesError

            // Process exercise statistics with 1RM and progression
            const exerciseMap = new Map<string, any>()

            exercisesData?.forEach((exercise: any) => {
                const name = exercise.name
                if (!exerciseMap.has(name)) {
                    exerciseMap.set(name, {
                        name,
                        session_type: exercise.workouts.session_type,
                        frequency: 0,
                        weights: [],
                        sets: [],
                        reps: [],
                        dates: [],
                        volumes: [],
                        maxWeightSets: [], // Para almacenar todas las series con peso máximo
                    })
                }

                const exerciseData = exerciseMap.get(name)
                exerciseData.frequency++
                exerciseData.dates.push(exercise.workouts.date)

                // Parse sets and reps first
                const setsMatch = exercise.sets?.match(/^(\d+)/)
                const repsMatches = exercise.sets?.match(/(\d+)/g)

                if (setsMatch && repsMatches && exercise.weights && exercise.weights !== "Sin Peso") {
                    const numSets = Number.parseInt(setsMatch[1])
                    exerciseData.sets.push(numSets)

                    // Parse weights
                    const weights = exercise.weights
                        .replace(/kg/g, "")
                        .split(",")
                        .map((w: string) => Number.parseFloat(w.trim()))
                        .filter((w: number) => !isNaN(w))

                    if (weights.length > 0) {
                        exerciseData.weights.push(...weights)

                        // Calculate total reps and volume
                        const totalReps = repsMatches.slice(1).reduce((sum: number, rep: string) => sum + Number.parseInt(rep), 0)
                        exerciseData.reps.push(totalReps)

                        const avgWeight: number = weights.reduce((a: number, b: number) => a + b, 0) / weights.length
                        const volume = totalReps * avgWeight
                        exerciseData.volumes.push(volume)

                        // Store each set with its weight and reps for max weight analysis
                        const repsPerSet: number[] = repsMatches.slice(1).map((rep: string) => Number.parseInt(rep))

                        interface MaxWeightSet {
                            weight: number
                            reps: number
                            date: string
                        }

                        // If we have the same number of weights as sets, pair them directly
                        if (weights.length === repsPerSet.length) {
                            weights.forEach((weight: number, index: number) => {
                                const reps: number = repsPerSet[index]
                                if (reps > 0 && reps <= 15) {
                                    interface MaxWeightSet {
                                        weight: number
                                        reps: number
                                        date: string
                                    }
                                    const maxWeightSet: MaxWeightSet = {
                                        weight: weight,
                                        reps: reps,
                                        date: exercise.workouts.date as string,
                                    }
                                    exerciseData.maxWeightSets.push(maxWeightSet)
                                }
                            })
                        } else if (weights.length === 1) {
                            // If only one weight for all sets, use it for all
                            repsPerSet.forEach((reps) => {
                                if (reps > 0 && reps <= 15) {
                                    exerciseData.maxWeightSets.push({
                                        weight: weights[0],
                                        reps: reps,
                                        date: exercise.workouts.date,
                                    })
                                }
                            })
                        } else {
                            // Fallback: distribute weights as evenly as possible
                            repsPerSet.forEach((reps, index) => {
                                const weightIndex = Math.min(index, weights.length - 1)
                                if (reps > 0 && reps <= 15) {
                                    exerciseData.maxWeightSets.push({
                                        weight: weights[weightIndex],
                                        reps: reps,
                                        date: exercise.workouts.date,
                                    })
                                }
                            })
                        }
                    }
                }
            })

            // Convert to final format with enhanced metrics
            const processedExerciseStats: ExerciseStats[] = Array.from(exerciseMap.values()).map((data) => {
                const maxWeight = data.weights.length > 0 ? Math.max(...data.weights) : 0
                const avgWeight =
                    data.weights.length > 0 ? data.weights.reduce((a: number, b: number) => a + b, 0) / data.weights.length : 0

                // Calculate 1RM using the maximum weight and its corresponding reps
                let estimated1RM = 0
                if (data.maxWeightSets.length > 0) {
                    // Find the absolute maximum weight used
                    const absoluteMaxWeight = Math.max(...data.maxWeightSets.map((set: any) => set.weight))

                    // Find all sets that used this maximum weight
                    const maxWeightSets = data.maxWeightSets.filter((set: any) => set.weight === absoluteMaxWeight)

                    if (maxWeightSets.length > 0) {
                        // Use the set with the most reps at max weight (typically the first set)
                        const bestMaxWeightSet = maxWeightSets.reduce((best: any, current: any) =>
                            current.reps > best.reps ? current : best,
                        )

                        estimated1RM = calculateEstimated1RM(bestMaxWeightSet.weight, bestMaxWeightSet.reps)
                    }
                }

                const totalVolume = data.volumes.reduce((a: number, b: number) => a + b, 0)

                // Calculate progression rate comparing first and last max weight 1RMs
                let progressionRate = "N/A"
                if (data.maxWeightSets.length >= 2) {
                    // Sort by date to get chronological order
                    const sortedSets = data.maxWeightSets.sort(
                        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
                    )

                    // Get first and last max weights
                    const firstMaxWeight = Math.max(
                        ...sortedSets.slice(0, Math.ceil(sortedSets.length / 4)).map((set: any) => set.weight),
                    )
                    const lastMaxWeight = Math.max(
                        ...sortedSets.slice(-Math.ceil(sortedSets.length / 4)).map((set: any) => set.weight),
                    )

                    if (firstMaxWeight !== lastMaxWeight) {
                        // Find representative sets for first and last periods
                        const firstPeriodSet = sortedSets.find((set: any) => set.weight === firstMaxWeight)
                        const lastPeriodSet = sortedSets
                            .slice()
                            .reverse()
                            .find((set: any) => set.weight === lastMaxWeight)

                        if (firstPeriodSet && lastPeriodSet) {
                            const first1RM = calculateEstimated1RM(firstPeriodSet.weight, firstPeriodSet.reps)
                            const last1RM = calculateEstimated1RM(lastPeriodSet.weight, lastPeriodSet.reps)

                            const progression = ((last1RM - first1RM) / first1RM) * 100
                            progressionRate = `${progression > 0 ? "+" : ""}${progression.toFixed(1)}%`
                        }
                    }
                }

                return {
                    name: data.name,
                    session_type: data.session_type,
                    frequency: data.frequency,
                    max_weight: maxWeight > 0 ? `${maxWeight}kg` : "N/A",
                    avg_weight: avgWeight > 0 ? `${avgWeight.toFixed(1)}kg` : "N/A",
                    avg_sets:
                        data.sets.length > 0
                            ? (data.sets.reduce((a: number, b: number) => a + b, 0) / data.sets.length).toFixed(1)
                            : "N/A",
                    last_performed: data.dates.sort().reverse()[0],
                    estimated_1rm: estimated1RM > 0 ? `${estimated1RM.toFixed(1)}kg` : "N/A",
                    progression_rate: progressionRate,
                    total_volume: totalVolume,
                }
            })

            setExerciseStats(processedExerciseStats)

            // Process session statistics
            if (workoutsData && workoutsData.length > 0) {
                const now = new Date()
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                const thisMonthWorkouts = workoutsData.filter((w) => new Date(w.date) >= startOfMonth)

                const lastSession = workoutsData[0]
                const daysSinceLast = Math.floor((now.getTime() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24))

                // Session distribution with enhanced metrics
                const distribution = workoutsData.reduce((acc: any, workout) => {
                    if (!acc[workout.session_type]) {
                        acc[workout.session_type] = {
                            count: 0,
                            total_volume: 0,
                        }
                    }

                    // Sumar volumen total de todos los ejercicios de este tipo
                    const volumeForThisSession = processedExerciseStats
                        .filter((stat) => stat.session_type === workout.session_type)
                        .reduce((sum, stat) => sum + stat.total_volume, 0)

                    acc[workout.session_type].count++
                    acc[workout.session_type].total_volume += volumeForThisSession

                    return acc
                }, {})

                const sessionDistribution = Object.entries(distribution).map(([session_type, data]: [string, any]) => ({
                    session_type,
                    count: data.count,
                    total_volume: data.total_volume,
                }))

                // Calculate total volume for this month
                const monthlyVolume = processedExerciseStats
                    .filter((stat) => thisMonthWorkouts.some((w) => new Date(w.date).getMonth() === now.getMonth()))
                    .reduce((sum, stat) => sum + stat.total_volume, 0)

                setSessionStats({
                    total_sessions: workoutsData.length,
                    this_month: thisMonthWorkouts.length,
                    last_session: lastSession.date,
                    days_since_last: daysSinceLast,
                    total_volume_month: monthlyVolume,
                    avg_exercises_per_session: processedExerciseStats.length / workoutsData.length,
                    session_distribution: sessionDistribution,
                })
            }

            // Fetch wellness statistics
            const { data: wellnessData, error: wellnessError } = await supabase
                .from("wellness_tracking")
                .select("*")
                .eq("user_id", DEFAULT_USER_ID)
                .order("date", { ascending: false })
                .limit(30)

            if (!wellnessError && wellnessData && wellnessData.length > 0) {
                const avgEnergy = wellnessData.reduce((sum, w) => sum + (w.energy_level || 0), 0) / wellnessData.length
                const avgStress = wellnessData.reduce((sum, w) => sum + (w.stress_level || 0), 0) / wellnessData.length
                const avgSleepHours = wellnessData.reduce((sum, w) => sum + (w.sleep_hours || 0), 0) / wellnessData.length
                const avgSleepQuality = wellnessData.reduce((sum, w) => sum + (w.sleep_quality || 0), 0) / wellnessData.length
                const avgMuscleSoreness =
                    wellnessData.reduce((sum, w) => sum + (w.muscle_soreness || 0), 0) / wellnessData.length
                const avgMotivation = wellnessData.reduce((sum, w) => sum + (w.motivation_level || 0), 0) / wellnessData.length

                const wellnessTrend = wellnessData
                    .slice(0, 14)
                    .reverse()
                    .map((w) => ({
                        date: new Date(w.date).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
                        energy: w.energy_level || 0,
                        stress: w.stress_level || 0,
                        sleep_quality: w.sleep_quality || 0,
                        motivation: w.motivation_level || 0,
                    }))

                setWellnessStats({
                    avg_energy: avgEnergy,
                    avg_stress: avgStress,
                    avg_sleep_hours: avgSleepHours,
                    avg_sleep_quality: avgSleepQuality,
                    avg_muscle_soreness: avgMuscleSoreness,
                    avg_motivation: avgMotivation,
                    wellness_trend: wellnessTrend,
                })
            }

            // Generate performance analysis and alerts
            const generatedAlerts: Alert[] = []

            // Check for strength progression alerts
            const strongProgressors = processedExerciseStats.filter((stat) => {
                const progression = Number.parseFloat(stat.progression_rate.replace("%", "").replace("+", ""))
                return !isNaN(progression) && progression > 15
            })

            if (strongProgressors.length > 0) {
                generatedAlerts.push({
                    type: "success",
                    title: "Excelente Progreso",
                    message: `Has mejorado significativamente en ${strongProgressors.length} ejercicios este mes`,
                    metric: "strength_progression",
                })
            }

            // Check for wellness alerts
            if (wellnessStats) {
                if (wellnessStats.avg_energy < 5) {
                    generatedAlerts.push({
                        type: "warning",
                        title: "Energía Baja",
                        message: "Tu nivel de energía promedio está por debajo de 5. Considera revisar tu descanso y nutrición.",
                        metric: "energy",
                    })
                }

                if (wellnessStats.avg_stress > 7) {
                    generatedAlerts.push({
                        type: "warning",
                        title: "Estrés Elevado",
                        message: "Tu nivel de estrés promedio es alto. Esto puede afectar tu recuperación.",
                        metric: "stress",
                    })
                }

                if (wellnessStats.avg_sleep_hours < 7) {
                    generatedAlerts.push({
                        type: "info",
                        title: "Sueño Insuficiente",
                        message: "Estás durmiendo menos de 7 horas en promedio. El sueño es crucial para la hipertrofia.",
                        metric: "sleep",
                    })
                }
            }

            // Check for training frequency
            if (sessionStats && sessionStats.days_since_last > 7) {
                generatedAlerts.push({
                    type: "warning",
                    title: "Inactividad Prolongada",
                    message: `Han pasado ${sessionStats.days_since_last} días desde tu último entrenamiento.`,
                    metric: "frequency",
                })
            }

            setAlerts(generatedAlerts)
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
        wellnessStats,
        performanceStats,
        alerts,
        loading,
        exportStatsPDF,
        refetch: fetchStats,
    }
}
