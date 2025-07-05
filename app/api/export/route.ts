import { type NextRequest, NextResponse } from "next/server"
import { supabase, DEFAULT_USER_ID } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rangeStart, rangeEnd, format = "pdf" } = body

    // Fetch workouts data
    let query = supabase
      .from("workouts")
      .select(`
        *,
        exercises (*)
      `)
      .eq("user_id", DEFAULT_USER_ID)
      .order("date", { ascending: true })

    if (rangeStart) {
      query = query.gte("date", rangeStart)
    }
    if (rangeEnd) {
      query = query.lte("date", rangeEnd)
    }

    const { data: workouts, error } = await query

    if (error) {
      throw error
    }

    if (format === "pdf") {
      const pdfData = generateWorkoutPDF(workouts, rangeStart, rangeEnd)

      return new NextResponse(pdfData, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="entrenamientos-${rangeStart || "inicio"}-${rangeEnd || "fin"}.pdf"`,
        },
      })
    }

    // Default to JSON export
    return NextResponse.json({
      success: true,
      data: workouts,
      count: workouts?.length || 0,
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}

function generateWorkoutPDF(workouts: any[], rangeStart?: string, rangeEnd?: string): Buffer {
  // Enhanced PDF generation with actual workout data
  const dateRange =
    rangeStart && rangeEnd
      ? `${new Date(rangeStart).toLocaleDateString("es-ES")} - ${new Date(rangeEnd).toLocaleDateString("es-ES")}`
      : "Todos los entrenamientos"

  let content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
  /Font <<
    /F1 5 0 R
  >>
>>
>>
endobj

4 0 obj
<<
/Length ${calculateContentLength(workouts, dateRange)}
>>
stream
BT
/F1 16 Tf
50 750 Td
(Gym Tracker - Reporte de Entrenamientos) Tj
0 -30 Td
/F1 12 Tf
(Período: ${dateRange}) Tj
0 -20 Td
(Total de entrenamientos: ${workouts?.length || 0}) Tj
0 -40 Td
`

  // Add workout details
  if (workouts && workouts.length > 0) {
    let yPosition = 680

    for (const workout of workouts.slice(0, 10)) {
      // Limit to first 10 workouts for PDF size
      content += `
0 -${yPosition - 650} Td
/F1 14 Tf
(${new Date(workout.date).toLocaleDateString("es-ES")} - ${workout.session_type}) Tj
0 -20 Td
/F1 10 Tf
`

      if (workout.exercises && workout.exercises.length > 0) {
        for (const exercise of workout.exercises.slice(0, 5)) {
          // Limit exercises per workout
          content += `(• ${exercise.name}: ${exercise.sets} - ${exercise.weights}) Tj
0 -15 Td
`
        }
      }

      yPosition -= 120
      if (yPosition < 100) break // Prevent overflow
    }
  }

  content += `
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000273 00000 n 
0000000${(400 + (workouts?.length || 0) * 50).toString().padStart(6, "0")} 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${500 + (workouts?.length || 0) * 60}
%%EOF`

  return Buffer.from(content)
}

function calculateContentLength(workouts: any[], dateRange: string): number {
  let baseLength = 200 + dateRange.length

  if (workouts && workouts.length > 0) {
    for (const workout of workouts.slice(0, 10)) {
      baseLength += 100 + workout.session_type.length

      if (workout.exercises) {
        for (const exercise of workout.exercises.slice(0, 5)) {
          baseLength += 50 + exercise.name.length + (exercise.sets?.length || 0) + (exercise.weights?.length || 0)
        }
      }
    }
  }

  return baseLength
}
