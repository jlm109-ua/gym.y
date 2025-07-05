"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { generateProgressPDF } from "@/lib/pdf-generator"

interface PhysicalProgress {
    id: string
    date: string
    weight: number
    height?: number
    user_id: string
    created_at: string
}

export function useProgress() {
    const [progress, setProgress] = useState<PhysicalProgress[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProgress()
    }, [])

    const fetchProgress = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("physical_progress")
                .select("*")
                .eq("user_id", DEFAULT_USER_ID)
                .order("date", { ascending: false })

            if (error) throw error
            setProgress(data || [])
        } catch (error) {
            console.error("Error fetching progress:", error)
            setProgress([])
        } finally {
            setLoading(false)
        }
    }

    const addProgress = async (data: { date: string; weight: number; height?: number }) => {
        try {
            const { error } = await supabase.from("physical_progress").upsert({
                ...data,
                user_id: DEFAULT_USER_ID,
            })

            if (error) throw error
            await fetchProgress()
            return { success: true }
        } catch (error) {
            console.error("Error adding progress:", error)
            return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
        }
    }

    const deleteProgress = async (id: string) => {
        try {
            const { error } = await supabase.from("physical_progress").delete().eq("id", id)

            if (error) throw error
            await fetchProgress()
            return { success: true }
        } catch (error) {
            console.error("Error deleting progress:", error)
            return { success: false, error: error instanceof Error ? error.message : "Error desconocido" }
        }
    }

    const exportProgress = async () => {
        try {
            const exportData = progress
                .map((p) => {
                    const date = new Date(p.date).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                    })
                    const heightPart = p.height ? ` - ${p.height}cm` : ""
                    return `${date} - ${p.weight}kg${heightPart}`
                })
                .join("\n")

            const blob = new Blob([exportData], { type: "text/plain" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `progreso-fisico-${new Date().toISOString().split("T")[0]}.txt`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            return { success: true }
        } catch (error) {
            console.error("Error exporting progress:", error)
            return { success: false, error: "Error al exportar datos" }
        }
    }

    const exportProgressPDF = async () => {
        try {
            if (!progress || progress.length === 0) {
                return { success: false, error: "No hay datos de progreso físico para exportar" }
            }

            // Calculate statistics
            const weights = progress.map((p) => p.weight).filter((w) => w != null)
            const heights = progress.map((p) => p.height).filter((h) => h != null)

            const currentWeight = weights[0] // Most recent (first in reversed order)
            const initialWeight = weights[weights.length - 1] // Oldest
            const weightChange = currentWeight - initialWeight
            const avgHeight = heights.length > 0 ? heights.reduce((a, b) => a + b, 0) / heights.length : null
            const currentBMI = avgHeight ? (currentWeight / Math.pow(avgHeight / 100, 2)).toFixed(1) : null

            // Calculate trend (simple linear regression)
            const n = weights.length
            const sumX = weights.reduce((sum, _, i) => sum + i, 0)
            const sumY = weights.reduce((sum, w) => sum + w, 0)
            const sumXY = weights.reduce((sum, w, i) => sum + i * w, 0)
            const sumX2 = weights.reduce((sum, _, i) => sum + i * i, 0)

            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
            const avgWeeklyChange = (slope * 7).toFixed(2)

            const stats = {
                currentWeight,
                initialWeight,
                weightChange: Number(weightChange.toFixed(1)),
                avgHeight: avgHeight ? Number(avgHeight.toFixed(0)) : null,
                currentBMI,
                avgWeeklyChange: Number(avgWeeklyChange),
                totalMeasurements: progress.length,
            }

            // Generate PDF
            const doc = generateProgressPDF(progress, stats)
            doc.save(`progreso-fisico-${new Date().toISOString().split("T")[0]}.pdf`)

            return { success: true }
        } catch (error) {
            console.error("Error exporting PDF:", error)
            return { success: false, error: error instanceof Error ? error.message : "Error al exportar PDF" }
        }
    }

    const importProgress = async (data: string) => {
        try {
            const lines = data
                .trim()
                .split("\n")
                .filter((line) => line.trim())
            let successCount = 0
            let errorCount = 0
            const errors: string[] = []

            for (const line of lines) {
                try {
                    // Parse different formats:
                    // "4/3/25 - 72.3kg"
                    // "4/3/25 - 72.3kg - 175cm"
                    // "🗓️4/3/25 🏋️Any text ↔️ 72.3kg"
                    // "🗓️4/3/25 🏋️Any text ↔️ 72.3kg 📏175cm"

                    let dateStr = ""
                    let weightStr = ""
                    let heightStr = ""

                    // Try to extract date (various formats)
                    const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/)
                    if (dateMatch) {
                        dateStr = dateMatch[1]
                    }

                    // Try to extract weight
                    const weightMatch = line.match(/(\d+(?:\.\d+)?)kg/)
                    if (weightMatch) {
                        weightStr = weightMatch[1]
                    }

                    // Try to extract height (optional)
                    const heightMatch = line.match(/(\d+(?:\.\d+)?)cm/)
                    if (heightMatch) {
                        heightStr = heightMatch[1]
                    }

                    if (!dateStr || !weightStr) {
                        throw new Error(`Formato inválido: ${line}`)
                    }

                    // Parse date
                    const [day, month, year] = dateStr.split("/")
                    const fullYear = year.length === 2 ? `20${year}` : year
                    const date = new Date(Number.parseInt(fullYear), Number.parseInt(month) - 1, Number.parseInt(day))

                    if (isNaN(date.getTime())) {
                        throw new Error(`Fecha inválida: ${dateStr}`)
                    }

                    const weight = Number.parseFloat(weightStr)
                    if (isNaN(weight) || weight <= 0) {
                        throw new Error(`Peso inválido: ${weightStr}`)
                    }

                    const progressData: { date: string; weight: number; height?: number } = {
                        date: date.toISOString().split("T")[0],
                        weight,
                    }

                    if (heightStr) {
                        const height = Number.parseFloat(heightStr)
                        if (!isNaN(height) && height > 0) {
                            progressData.height = height
                        }
                    }

                    const result = await addProgress(progressData)
                    if (result.success) {
                        successCount++
                    } else {
                        errorCount++
                        errors.push(`Error en línea "${line}": ${result.error}`)
                    }
                } catch (error) {
                    errorCount++
                    errors.push(`Error en línea "${line}": ${error instanceof Error ? error.message : "Error desconocido"}`)
                }
            }

            return {
                success: true,
                summary: {
                    total: lines.length,
                    success: successCount,
                    errors: errorCount,
                    errorDetails: errors,
                },
            }
        } catch (error) {
            console.error("Error importing progress:", error)
            return {
                success: false,
                error: error instanceof Error ? error.message : "Error al importar datos",
            }
        }
    }

    return {
        progress,
        loading,
        addProgress,
        deleteProgress,
        exportProgress,
        exportProgressPDF,
        importProgress,
        refetch: fetchProgress,
    }
}
