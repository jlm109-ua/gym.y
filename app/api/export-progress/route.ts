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

        // Generate LaTeX document
        const latexContent = `
\\documentclass[a4paper,11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{geometry}
\\usepackage{pgfplots}
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{xcolor}
\\usepackage{fancyhdr}
\\usepackage{graphicx}

\\geometry{margin=2cm}
\\pgfplotsset{compat=1.18}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\textbf{Reporte de Progreso Físico}}
\\fancyhead[R]{\\today}
\\fancyfoot[C]{\\thepage}

\\definecolor{primarycolor}{RGB}{59, 130, 246}
\\definecolor{secondarycolor}{RGB}{16, 185, 129}

\\begin{document}

\\begin{center}
\\huge\\textbf{Reporte de Progreso Físico}\\\\
\\large\\textcolor{gray}{Análisis Completo de Evolución}
\\end{center}

\\vspace{1cm}

\\section{Resumen Ejecutivo}

\\begin{tabular}{|l|c|}
\\hline
\\textbf{Métrica} & \\textbf{Valor} \\\\
\\hline
Peso Actual & ${currentWeight} kg \\\\
Peso Inicial & ${initialWeight} kg \\\\
Cambio Total & ${weightChange >= 0 ? "+" : ""}${weightChange.toFixed(1)} kg \\\\
${avgHeight ? `Altura Promedio & ${avgHeight.toFixed(0)} cm \\\\` : ""}
${currentBMI ? `IMC Actual & ${currentBMI} \\\\` : ""}
Tendencia Semanal & ${Number(avgWeeklyChange) >= 0 ? "+" : ""}${avgWeeklyChange} kg/semana \\\\
Total de Mediciones & ${progressData.length} \\\\
\\hline
\\end{tabular}

\\vspace{1cm}

\\section{Evolución del Peso}

\\begin{center}
\\begin{tikzpicture}
\\begin{axis}[
    width=14cm,
    height=8cm,
    xlabel={Medición},
    ylabel={Peso (kg)},
    grid=major,
    legend pos=north west,
    title={Evolución del Peso Corporal},
    xmin=0,
    xmax=${progressData.length + 1},
    ymin=${Math.min(...weights) - 2},
    ymax=${Math.max(...weights) + 2},
]

\\addplot[
    color=primarycolor,
    mark=*,
    mark size=2pt,
    line width=2pt
] coordinates {
${progressData.map((p, i) => `(${i + 1},${p.weight})`).join(" ")}
};

\\addplot[
    color=secondarycolor,
    line width=1pt,
    dashed
] coordinates {
(1,${initialWeight + slope * 0}) (${progressData.length},${initialWeight + slope * (progressData.length - 1)})
};

\\legend{Peso Real, Tendencia}
\\end{axis}
\\end{tikzpicture}
\\end{center}

\\section{Historial Completo de Mediciones}

\\begin{center}
\\begin{tabular}{|c|c|c|c|}
\\hline
\\textbf{Fecha} & \\textbf{Peso (kg)} & \\textbf{Altura (cm)} & \\textbf{IMC} \\\\
\\hline
${progressData
                .map((p) => {
                    const date = new Date(p.date).toLocaleDateString("es-ES")
                    const height = p.height || avgHeight || "-"
                    const bmi = p.height
                        ? (p.weight / Math.pow(p.height / 100, 2)).toFixed(1)
                        : avgHeight
                            ? (p.weight / Math.pow(avgHeight / 100, 2)).toFixed(1)
                            : "-"
                    return `${date} & ${p.weight} & ${height !== "-" ? height.toFixed(0) : "-"} & ${bmi} \\\\`
                })
                .join("\n")}
\\hline
\\end{tabular}
\\end{center}

\\section{Análisis y Recomendaciones}

\\subsection{Tendencia de Peso}
${slope > 0.1
                ? `Tu peso muestra una tendencia ascendente de ${avgWeeklyChange} kg por semana. Si tu objetivo es mantener o reducir peso, considera ajustar tu plan nutricional.`
                : slope < -0.1
                    ? `Tu peso muestra una tendencia descendente de ${Math.abs(Number.parseFloat(avgWeeklyChange))} kg por semana. Si tu objetivo es ganar peso, considera aumentar tu ingesta calórica.`
                    : `Tu peso se mantiene relativamente estable con variaciones mínimas. Esto indica un buen equilibrio entre ingesta y gasto calórico.`
            }

\\subsection{Índice de Masa Corporal}
${currentBMI
                ? Number.parseFloat(currentBMI) < 18.5
                    ? `Tu IMC actual de ${currentBMI} indica bajo peso. Considera consultar con un profesional de la salud.`
                    : Number.parseFloat(currentBMI) < 25
                        ? `Tu IMC actual de ${currentBMI} se encuentra en el rango normal. ¡Excelente trabajo!`
                        : Number.parseFloat(currentBMI) < 30
                            ? `Tu IMC actual de ${currentBMI} indica sobrepeso. Considera un plan de reducción de peso gradual.`
                            : `Tu IMC actual de ${currentBMI} indica obesidad. Es recomendable consultar con un profesional de la salud.`
                : "No se puede calcular el IMC sin datos de altura."
            }

\\subsection{Consistencia en el Seguimiento}
Has registrado ${progressData.length} mediciones, lo que demuestra ${progressData.length >= 10 ? "excelente" : progressData.length >= 5 ? "buena" : "básica"} consistencia en el seguimiento de tu progreso.

\\vspace{1cm}

\\begin{center}
\\textit{Reporte generado automáticamente el \\today}
\\end{center}

\\end{document}
    `.trim()

        return new NextResponse(latexContent, {
            headers: {
                "Content-Type": "application/x-latex",
                "Content-Disposition": `attachment; filename="progreso-fisico-${new Date().toISOString().split("T")[0]}.tex"`,
            },
        })
    } catch (error) {
        console.error("Error exporting progress:", error)
        return NextResponse.json({ error: "Error al exportar progreso físico" }, { status: 500 })
    }
}
