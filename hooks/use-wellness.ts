"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { DEFAULT_USER_ID } from "@/lib/constants"

export interface WellnessEntry {
    id?: number
    user_id?: string
    date: string
    energy_level: number
    stress_level: number
    sleep_hours: number
    sleep_quality: number
    muscle_soreness: number
    motivation_level: number
    notes?: string
    created_at?: string
}

export interface WellnessStats {
    avgEnergy: number
    avgStress: number
    avgSleepHours: number
    avgSleepQuality: number
    avgMuscleSoreness: number
    avgMotivation: number
    totalEntries: number
}

export function useWellness() {
    const [entries, setEntries] = useState<WellnessEntry[]>([])
    const [stats, setStats] = useState<WellnessStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchEntries = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("wellness_tracking")
                .select("*")
                .eq("user_id", DEFAULT_USER_ID)
                .order("date", { ascending: false })

            if (error) throw error

            setEntries(data || [])
            calculateStats(data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error fetching wellness data")
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = (data: WellnessEntry[]) => {
        if (data.length === 0) {
            setStats(null)
            return
        }

        const totals = data.reduce(
            (acc, entry) => ({
                energy: acc.energy + entry.energy_level,
                stress: acc.stress + entry.stress_level,
                sleepHours: acc.sleepHours + entry.sleep_hours,
                sleepQuality: acc.sleepQuality + entry.sleep_quality,
                muscleSoreness: acc.muscleSoreness + entry.muscle_soreness,
                motivation: acc.motivation + entry.motivation_level,
            }),
            { energy: 0, stress: 0, sleepHours: 0, sleepQuality: 0, muscleSoreness: 0, motivation: 0 },
        )

        const count = data.length
        setStats({
            avgEnergy: Math.round((totals.energy / count) * 10) / 10,
            avgStress: Math.round((totals.stress / count) * 10) / 10,
            avgSleepHours: Math.round((totals.sleepHours / count) * 10) / 10,
            avgSleepQuality: Math.round((totals.sleepQuality / count) * 10) / 10,
            avgMuscleSoreness: Math.round((totals.muscleSoreness / count) * 10) / 10,
            avgMotivation: Math.round((totals.motivation / count) * 10) / 10,
            totalEntries: count,
        })
    }

    const addEntry = async (entry: Omit<WellnessEntry, "id" | "created_at" | "user_id">) => {
        try {
            // Validate ranges
            if (entry.energy_level < 1 || entry.energy_level > 10) {
                throw new Error("Nivel de energía debe estar entre 1 y 10")
            }
            if (entry.stress_level < 1 || entry.stress_level > 10) {
                throw new Error("Nivel de estrés debe estar entre 1 y 10")
            }
            if (entry.sleep_hours < 0 || entry.sleep_hours > 14) {
                throw new Error("Horas de sueño deben estar entre 0 y 14")
            }
            if (entry.sleep_quality < 1 || entry.sleep_quality > 10) {
                throw new Error("Calidad del sueño debe estar entre 1 y 10")
            }
            if (entry.muscle_soreness < 1 || entry.muscle_soreness > 10) {
                throw new Error("Dolor muscular debe estar entre 1 y 10")
            }
            if (entry.motivation_level < 1 || entry.motivation_level > 10) {
                throw new Error("Nivel de motivación debe estar entre 1 y 10")
            }

            const entryWithUserId = {
                ...entry,
                user_id: DEFAULT_USER_ID,
            }

            const { data, error } = await supabase.from("wellness_tracking").insert([entryWithUserId]).select()

            if (error) throw error

            await fetchEntries()
            return data[0]
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error adding wellness entry")
            throw err
        }
    }

    const updateEntry = async (id: number, entry: Partial<WellnessEntry>) => {
        try {
            const { data, error } = await supabase.from("wellness_tracking").update(entry).eq("id", id).select()

            if (error) throw error

            await fetchEntries()
            return data[0]
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error updating wellness entry")
            throw err
        }
    }

    const deleteEntry = async (id: number) => {
        try {
            const { error } = await supabase.from("wellness_tracking").delete().eq("id", id)

            if (error) throw error

            await fetchEntries()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error deleting wellness entry")
            throw err
        }
    }

    const getEntryByDate = (date: string) => {
        return entries.find((entry) => entry.date === date)
    }

    useEffect(() => {
        fetchEntries()
    }, [])

    return {
        entries,
        stats,
        loading,
        error,
        addEntry,
        updateEntry,
        deleteEntry,
        getEntryByDate,
        refetch: fetchEntries,
    }
}
