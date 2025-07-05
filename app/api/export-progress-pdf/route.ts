import { type NextRequest, NextResponse } from "next/server"
import { supabase, DEFAULT_USER_ID } from "@/lib/supabase"

export async function GET(request: NextRequest) {
    try {
        // Fetch physical progress data
        const { data: progressData, error } = await supabase
            .from("physical_progress")
            .select("*")
            .eq("user_id", DEFAULT_USER_ID)
            .order("date", { ascending: true })

        if (error) {
            throw error
        }

        if (!progressData || progressData.length === 0) {
            return NextResponse.json({ error: "No hay datos de progreso físico para exportar" }, { status: 404 })
        }

        // Calculate statistics
        const weights = progressData.map((p) => p.weight).filter((w) => w != null)
        const heights = progressData.map((p) => p.height).filter((h) => h != null)

        const currentWeight = weights[weights.length - 1]
        const initialWeight = weights[0]
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

        // Return data for client-side PDF generation
        return NextResponse.json({
            success: true,
            data: {
                progressData,
                stats: {
                    currentWeight,
                    initialWeight,
                    weightChange: weightChange.toFixed(1),
                    avgHeight: avgHeight?.toFixed(0),
                    currentBMI,
                    avgWeeklyChange,
                    totalMeasurements: progressData.length,
                },
            },
        })
    } catch (error) {
        console.error("Error fetching progress data:", error)
        return NextResponse.json({ error: "Error al obtener datos de progreso físico" }, { status: 500 })
    }
}
