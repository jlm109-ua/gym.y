"use client"

import { useState, useEffect } from "react"
import { supabase, DEFAULT_USER_ID } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface ProgressEntry {
    id: string
    date: string
    weight_kg?: number
    height_cm?: number
    user_id: string
    created_at: string
}

interface CreateProgressData {
    date: string
    weight_kg?: number
    height_cm?: number
}

interface UpdateProgressData {
    weight_kg?: number
    height_cm?: number
}

export function useProgress() {
    const [entries, setEntries] = useState<ProgressEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        fetchProgress()
    }, [])

    const fetchProgress = async () => {
        try {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from("progress")
                .select("*")
                .eq("user_id", DEFAULT_USER_ID)
                .order("date", { ascending: true })

            if (error) {
                throw error
            }

            setEntries(data || [])
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error al cargar el progreso"
            setError(errorMessage)
            console.error("Error fetching progress:", err)
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const createProgress = async (progressData: CreateProgressData) => {
        try {
            setError(null)

            // Validate that at least one measurement is provided
            if (!progressData.weight_kg && !progressData.height_cm) {
                throw new Error("Debes proporcionar al menos peso o altura")
            }

            const { data, error } = await supabase
                .from("progress")
                .insert({
                    user_id: DEFAULT_USER_ID,
                    date: progressData.date,
                    weight_kg: progressData.weight_kg || null,
                    height_cm: progressData.height_cm || null,
                })
                .select()
                .single()

            if (error) {
                throw error
            }

            // Add to local state
            setEntries((prev) => [...prev, data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))

            toast({
                title: "Progreso añadido",
                description: "La medición se ha guardado correctamente",
            })

            return data
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error al crear el progreso"
            setError(errorMessage)
            console.error("Error creating progress:", err)
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
            throw err
        }
    }

    const updateProgress = async (id: string, progressData: UpdateProgressData) => {
        try {
            setError(null)

            // Validate that at least one measurement is provided
            if (!progressData.weight_kg && !progressData.height_cm) {
                throw new Error("Debes proporcionar al menos peso o altura")
            }

            const { data, error } = await supabase
                .from("progress")
                .update({
                    weight_kg: progressData.weight_kg || null,
                    height_cm: progressData.height_cm || null,
                })
                .eq("id", id)
                .select()
                .single()

            if (error) {
                throw error
            }

            // Update local state
            setEntries((prev) => prev.map((entry) => (entry.id === id ? data : entry)))

            toast({
                title: "Progreso actualizado",
                description: "La medición se ha actualizado correctamente",
            })

            return data
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error al actualizar el progreso"
            setError(errorMessage)
            console.error("Error updating progress:", err)
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
            throw err
        }
    }

    const deleteProgress = async (id: string) => {
        try {
            setError(null)

            const { error } = await supabase.from("progress").delete().eq("id", id)

            if (error) {
                throw error
            }

            // Remove from local state
            setEntries((prev) => prev.filter((entry) => entry.id !== id))

            toast({
                title: "Progreso eliminado",
                description: "La medición se ha eliminado correctamente",
            })
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error al eliminar el progreso"
            setError(errorMessage)
            console.error("Error deleting progress:", err)
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
            throw err
        }
    }

    // Helper functions for calculations
    const getCurrentWeight = () => {
        const latestEntry = entries[entries.length - 1]
        return latestEntry?.weight_kg || null
    }

    const getCurrentHeight = () => {
        const latestEntry = entries[entries.length - 1]
        return latestEntry?.height_cm || null
    }

    const getBMI = () => {
        const weight = getCurrentWeight()
        const height = getCurrentHeight()

        if (!weight || !height) return null

        return (weight / Math.pow(height / 100, 2)).toFixed(1)
    }

    const getBMICategory = (bmi: string | null) => {
        if (!bmi) return null

        const bmiValue = Number.parseFloat(bmi)
        if (bmiValue < 18.5) return "Bajo peso"
        if (bmiValue < 25) return "Normal"
        if (bmiValue < 30) return "Sobrepeso"
        return "Obesidad"
    }

    const getWeightChange = () => {
        if (entries.length < 2) return null

        const latest = entries[entries.length - 1]?.weight_kg
        const previous = entries[entries.length - 2]?.weight_kg

        if (!latest || !previous) return null

        return latest - previous
    }

    return {
        entries,
        loading,
        error,
        createProgress,
        updateProgress,
        deleteProgress,
        refetch: fetchProgress,
        // Helper functions
        getCurrentWeight,
        getCurrentHeight,
        getBMI,
        getBMICategory,
        getWeightChange,
    }
}
