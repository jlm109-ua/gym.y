"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"

interface WorkoutDay {
    id: string
    date: string
    session_type: "PUSH" | "PULL" | "LEG"
    muscle_tags: string[]
    exercise_count: number
    total_sets: number
}

interface CalendarStats {
    totalWorkouts: number
    currentStreak: number
    longestStreak: number
    workoutsThisMonth: number
    averageWorkoutsPerWeek: number
}

export function useCalendar() {
    const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
    const [calendarStats, setCalendarStats] = useState<CalendarStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        fetchCalendarData()
    }, [])

    const fetchCalendarData = async () => {
        try {
            setLoading(true)
            setError(null)

            // Fetch workouts with exercise counts
            const { data: workoutsData, error: workoutsError } = await supabase
                .from("workouts")
                .select(`
          id,
          date,
          session_type,
          muscle_tags,
          exercises(id, sets, is_linked_to_previous)
        `)
                .eq("user_id", DEFAULT_USER_ID)
                .order("date", { ascending: true })

            if (workoutsError) {
                throw workoutsError
            }

            // Process workout data
            const processedWorkouts: WorkoutDay[] = (workoutsData || []).map((workout: any) => {
                const exerciseCount = workout.exercises?.length || 0
                const totalSets =
                    workout.exercises?.reduce((total: number, exercise: any) => {
                        const setsMatch = exercise.sets?.match(/^(\d+)/)
                        return total + (setsMatch ? Number.parseInt(setsMatch[1]) : 0)
                    }, 0) || 0

                return {
                    id: workout.id,
                    date: workout.date,
                    session_type: workout.session_type,
                    muscle_tags: workout.muscle_tags || [],
                    exercise_count: exerciseCount,
                    total_sets: totalSets,
                }
            })

            const stats = calculateCalendarStats(processedWorkouts)

            setWorkoutDays(processedWorkouts)
            setCalendarStats(stats)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error al cargar el calendario"
            setError(errorMessage)
            console.error("Error fetching calendar data:", err)
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const calculateCalendarStats = (workouts: WorkoutDay[]): CalendarStats => {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        // Sort workouts by date
        const sortedWorkouts = [...workouts].sort(
            (a, b) => new Date(a.date + "T12:00:00").getTime() - new Date(b.date + "T12:00:00").getTime(),
        )

        // Calculate current streak
        let currentStreak = 0
        let longestStreak = 0
        let tempStreak = 0

        const workoutDates = new Set(sortedWorkouts.map((w) => w.date))

        // Check current streak (working backwards from today)
        const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        while (true) {
            const dateStr = checkDate.toISOString().split("T")[0]
            if (workoutDates.has(dateStr)) {
                currentStreak++
            } else {
                break
            }
            checkDate.setDate(checkDate.getDate() - 1)
        }

        // Calculate longest streak
        let lastDate: Date | null = null
        for (const workout of sortedWorkouts) {
            const currentDate = new Date(workout.date + "T12:00:00")

            if (lastDate && currentDate.getTime() - lastDate.getTime() <= 24 * 60 * 60 * 1000 * 2) {
                // Within 2 days (allowing for rest days)
                tempStreak++
            } else {
                longestStreak = Math.max(longestStreak, tempStreak)
                tempStreak = 1
            }

            lastDate = currentDate
        }
        longestStreak = Math.max(longestStreak, tempStreak)

        // Workouts this month
        const workoutsThisMonth = workouts.filter((w) => {
            const workoutDate = new Date(w.date + "T12:00:00")
            return workoutDate >= startOfMonth
        }).length

        // Average workouts per week (last 4 weeks)
        const fourWeeksAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 28)
        const recentWorkouts = workouts.filter((w) => {
            const workoutDate = new Date(w.date + "T12:00:00")
            return workoutDate >= fourWeeksAgo
        }).length
        const averageWorkoutsPerWeek = recentWorkouts / 4

        return {
            totalWorkouts: workouts.length,
            currentStreak,
            longestStreak,
            workoutsThisMonth,
            averageWorkoutsPerWeek: Math.round(averageWorkoutsPerWeek * 10) / 10,
        }
    }

    const hasWorkout = (date: string): boolean => {
        return workoutDays.some((workout) => workout.date === date)
    }

    const getWorkoutForDate = (date: string): WorkoutDay | undefined => {
        return workoutDays.find((workout) => workout.date === date)
    }

    const getWorkoutsForMonth = (year: number, month: number): WorkoutDay[] => {
        return workoutDays.filter((workout) => {
            const workoutDate = new Date(workout.date + "T12:00:00")
            return workoutDate.getFullYear() === year && workoutDate.getMonth() === month
        })
    }

    const getWorkoutsByType = (): Record<string, number> => {
        const counts: Record<string, number> = {}
        workoutDays.forEach((workout) => {
            counts[workout.session_type] = (counts[workout.session_type] || 0) + 1
        })
        return counts
    }

    const getRecentWorkouts = (limit = 5): WorkoutDay[] => {
        return [...workoutDays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
    }

    return {
        workoutDays,
        calendarStats,
        loading,
        error,
        refetch: fetchCalendarData,
        // Helper functions
        hasWorkout,
        getWorkoutForDate,
        getWorkoutsForMonth,
        getWorkoutsByType,
        getRecentWorkouts,
    }
}
