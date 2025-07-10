"use client"

import jsPDF from "jspdf"

// Función para generar PDF de progreso físico
export function generateProgressPDF(progressData: any[], stats: any) {
    const doc = new jsPDF()

    // Configuración inicial
    doc.setFont("helvetica")

    // Título
    doc.setFontSize(20)
    doc.text("Reporte de Progreso Físico", 20, 30)

    doc.setFontSize(12)
    doc.text(`Generado el ${new Date().toLocaleDateString("es-ES")}`, 20, 40)

    // Resumen ejecutivo
    doc.setFontSize(16)
    doc.text("Resumen Ejecutivo", 20, 60)

    doc.setFontSize(10)
    let yPos = 75

    const summaryData = [
        ["Peso Actual", `${stats.currentWeight} kg`],
        ["Peso Inicial", `${stats.initialWeight} kg`],
        ["Cambio Total", `${stats.weightChange >= 0 ? "+" : ""}${stats.weightChange} kg`],
        ["Total Mediciones", `${stats.totalMeasurements}`],
    ]

    if (stats.avgHeight) {
        summaryData.push(["Altura Promedio", `${stats.avgHeight} cm`])
    }

    if (stats.currentBMI) {
        summaryData.push(["IMC Actual", stats.currentBMI])
    }

    summaryData.push(["Tendencia Semanal", `${stats.avgWeeklyChange >= 0 ? "+" : ""}${stats.avgWeeklyChange} kg/semana`])

    // Tabla de resumen
    summaryData.forEach(([label, value]) => {
        doc.text(`${label}:`, 25, yPos)
        doc.text(value, 100, yPos)
        yPos += 8
    })

    // Historial de mediciones
    yPos += 15
    doc.setFontSize(16)
    doc.text("Historial de Mediciones", 20, yPos)

    yPos += 15
    doc.setFontSize(10)

    // Encabezados de tabla
    doc.text("Fecha", 25, yPos)
    doc.text("Peso (kg)", 70, yPos)
    doc.text("Altura (cm)", 110, yPos)
    doc.text("IMC", 150, yPos)

    yPos += 5
    doc.line(20, yPos, 190, yPos) // Línea horizontal
    yPos += 8

    // Datos de la tabla (mostrar todos los datos en PDF)
    progressData
        .slice()
        .reverse()
        .forEach((p) => {
            if (yPos > 270) {
                // Nueva página si es necesario
                doc.addPage()
                yPos = 30
            }

            const date = new Date(p.date).toLocaleDateString("es-ES")
            const height = p.height || (typeof stats.avgHeight === "number" ? stats.avgHeight : null)
            const bmi = p.height
                ? (p.weight / Math.pow(p.height / 100, 2)).toFixed(1)
                : typeof stats.avgHeight === "number"
                    ? (p.weight / Math.pow(stats.avgHeight / 100, 2)).toFixed(1)
                    : "-"

            doc.text(date, 25, yPos)
            doc.text(p.weight.toString(), 70, yPos)
            doc.text(height ? height.toFixed(0) : "-", 110, yPos)
            doc.text(bmi, 150, yPos)

            yPos += 8
        })

    // Análisis y recomendaciones
    if (yPos > 200) {
        doc.addPage()
        yPos = 30
    } else {
        yPos += 15
    }

    doc.setFontSize(16)
    doc.text("Análisis y Recomendaciones", 20, yPos)

    yPos += 15
    doc.setFontSize(10)

    // Tendencia de peso
    doc.setFontSize(12)
    doc.text("Tendencia de Peso:", 25, yPos)
    yPos += 8

    doc.setFontSize(10)
    let trendText = ""
    if (Number.parseFloat(stats.avgWeeklyChange) > 0.1) {
        trendText = `Tu peso muestra una tendencia ascendente de ${stats.avgWeeklyChange} kg por semana.`
    } else if (Number.parseFloat(stats.avgWeeklyChange) < -0.1) {
        trendText = `Tu peso muestra una tendencia descendente de ${Math.abs(Number.parseFloat(stats.avgWeeklyChange))} kg por semana.`
    } else {
        trendText = "Tu peso se mantiene relativamente estable con variaciones mínimas."
    }

    const trendLines = doc.splitTextToSize(trendText, 160)
    trendLines.forEach((line: string) => {
        doc.text(line, 25, yPos)
        yPos += 6
    })

    // IMC
    if (stats.currentBMI) {
        yPos += 8
        doc.setFontSize(12)
        doc.text("Índice de Masa Corporal:", 25, yPos)
        yPos += 8

        doc.setFontSize(10)
        let bmcText = ""
        const bmi = Number.parseFloat(stats.currentBMI)
        if (bmi < 18.5) {
            bmcText = `Tu IMC actual de ${stats.currentBMI} indica bajo peso.`
        } else if (bmi < 25) {
            bmcText = `Tu IMC actual de ${stats.currentBMI} se encuentra en el rango normal. ¡Excelente trabajo!`
        } else if (bmi < 30) {
            bmcText = `Tu IMC actual de ${stats.currentBMI} indica sobrepeso.`
        } else {
            bmcText = `Tu IMC actual de ${stats.currentBMI} indica obesidad.`
        }

        const bmcLines = doc.splitTextToSize(bmcText, 160)
        bmcLines.forEach((line: string) => {
            doc.text(line, 25, yPos)
            yPos += 6
        })
    }

    return doc
}

// Función para generar PDF de estadísticas
export function generateStatsPDF(exerciseStats: any[], sessionStats: any) {
    const doc = new jsPDF()

    // Configuración inicial
    doc.setFont("helvetica")

    // Título
    doc.setFontSize(20)
    doc.text("Reporte de Estadísticas de Entrenamiento", 20, 30)

    doc.setFontSize(12)
    doc.text(`Generado el ${new Date().toLocaleDateString("es-ES")}`, 20, 40)

    // Resumen general
    doc.setFontSize(16)
    doc.text("Resumen General", 20, 60)

    doc.setFontSize(10)
    let yPos = 75

    const summaryData = [
        ["Total Entrenamientos", `${sessionStats?.total_sessions || 0}`],
        ["Entrenamientos Este Mes", `${sessionStats?.this_month || 0}`],
        ["Ejercicios Únicos", `${exerciseStats.length}`],
        [
            "Último Entrenamiento",
            sessionStats?.last_session ? new Date(sessionStats.last_session).toLocaleDateString("es-ES") : "N/A",
        ],
        ["Días Desde Último", `${sessionStats?.days_since_last || 0}`],
    ]

    // Tabla de resumen
    summaryData.forEach(([label, value]) => {
        doc.text(`${label}:`, 25, yPos)
        doc.text(value, 100, yPos)
        yPos += 8
    })

    // Distribución de sesiones
    if (sessionStats?.session_distribution) {
        yPos += 15
        doc.setFontSize(16)
        doc.text("Distribución de Sesiones", 20, yPos)

        yPos += 15
        doc.setFontSize(10)

        sessionStats.session_distribution.forEach((s: any) => {
            const percentage = ((s.count / (sessionStats?.total_sessions || 1)) * 100).toFixed(1)
            doc.text(`${s.session_type}: ${s.count} entrenamientos (${percentage}%)`, 25, yPos)
            yPos += 8
        })
    }

    // Top 10 ejercicios
    yPos += 15
    doc.setFontSize(16)
    doc.text("Top 10 Ejercicios Más Utilizados", 20, yPos)

    yPos += 15
    doc.setFontSize(10)

    exerciseStats
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10)
        .forEach((stat, index) => {
            if (yPos > 270) {
                doc.addPage()
                yPos = 30
            }

            doc.text(`${index + 1}. ${stat.name} (${stat.session_type})`, 25, yPos)
            yPos += 6
            doc.text(`   ${stat.frequency} veces - Peso máximo: ${stat.max_weight}`, 30, yPos)
            yPos += 10
        })

    // Estadísticas detalladas (primeros 20 ejercicios)
    if (yPos > 200) {
        doc.addPage()
        yPos = 30
    } else {
        yPos += 15
    }

    doc.setFontSize(16)
    doc.text("Estadísticas Detalladas de Ejercicios", 20, yPos)

    yPos += 15
    doc.setFontSize(8)

    // Encabezados
    doc.text("Ejercicio", 25, yPos)
    doc.text("Tipo", 80, yPos)
    doc.text("Freq.", 100, yPos)
    doc.text("Peso Máx.", 120, yPos)
    doc.text("Peso Prom.", 150, yPos)
    doc.text("Series Prom.", 175, yPos)

    yPos += 5
    doc.line(20, yPos, 190, yPos)
    yPos += 8

    exerciseStats.forEach((stat) => {
        if (yPos > 270) {
            doc.addPage()
            yPos = 30
        }

        // Truncar nombre si es muy largo
        const name = stat.name.length > 20 ? stat.name.substring(0, 17) + "..." : stat.name

        doc.text(name, 25, yPos)
        doc.text(stat.session_type, 80, yPos)
        doc.text(stat.frequency.toString(), 100, yPos)
        doc.text(stat.max_weight, 120, yPos)
        doc.text(stat.avg_weight, 150, yPos)
        doc.text(stat.avg_sets, 175, yPos)

        yPos += 8
    })

    return doc
}

// Función para generar PDF de entrenamientos completo
export function generateWorkoutsPDF(workoutsData: any[]) {
    const doc = new jsPDF()

    // Configuración inicial
    doc.setFont("helvetica")

    // Título
    doc.setFontSize(20)
    doc.text("Reporte Completo de Entrenamientos", 20, 30)

    doc.setFontSize(12)
    doc.text(`Generado el ${new Date().toLocaleDateString("es-ES")}`, 20, 40)

    // Resumen
    doc.setFontSize(16)
    doc.text("Resumen de Entrenamientos", 20, 60)

    doc.setFontSize(10)
    let yPos = 75

    const totalExercises = workoutsData.reduce((sum, w) => sum + (w.exercises?.length || 0), 0)

    const summaryData = [
        ["Total de Entrenamientos", `${workoutsData.length}`],
        ["Ejercicios Totales", `${totalExercises}`],
        [
            "Primer Entrenamiento",
            workoutsData.length > 0 ? new Date(workoutsData[0].date).toLocaleDateString("es-ES") : "N/A",
        ],
        [
            "Último Entrenamiento",
            workoutsData.length > 0
                ? new Date(workoutsData[workoutsData.length - 1].date).toLocaleDateString("es-ES")
                : "N/A",
        ],
    ]

    summaryData.forEach(([label, value]) => {
        doc.text(`${label}:`, 25, yPos)
        doc.text(value, 100, yPos)
        yPos += 8
    })

    // Entrenamientos detallados (primeros 15)
    yPos += 15
    doc.setFontSize(16)
    doc.text("Entrenamientos Detallados", 20, yPos)

    yPos += 15
    doc.setFontSize(10)

    workoutsData.slice(0, 15).forEach((workout, index) => {
        if (yPos > 250) {
            doc.addPage()
            yPos = 30
        }

        const workoutDate = new Date(workout.date).toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })

        doc.setFontSize(12)
        doc.text(`${workoutDate} - ${workout.session_type}`, 25, yPos)
        yPos += 10

        doc.setFontSize(10)
        if (workout.exercises && workout.exercises.length > 0) {
            workout.exercises.slice(0, 8).forEach((exercise: any) => {
                if (yPos > 270) {
                    doc.addPage()
                    yPos = 30
                }

                doc.text(`• ${exercise.name}: ${exercise.sets} - ${exercise.weights || "Sin peso"}`, 30, yPos)
                yPos += 6
            })

            if (workout.exercises.length > 8) {
                doc.text(`... y ${workout.exercises.length - 8} ejercicios más`, 30, yPos)
                yPos += 6
            }
        } else {
            doc.text("• Sin ejercicios registrados", 30, yPos)
            yPos += 6
        }

        yPos += 8
    })

    if (workoutsData.length > 15) {
        if (yPos > 260) {
            doc.addPage()
            yPos = 30
        }
        doc.setFontSize(10)
        doc.text(`... y ${workoutsData.length - 15} entrenamientos más`, 25, yPos)
    }

    return doc
}
