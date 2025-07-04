import { type NextRequest, NextResponse } from "next/server"
import { supabase, DEFAULT_USER_ID } from "@/lib/supabase"

interface ParsedWorkout {
  date: string
  session_type: "PUSH" | "PULL" | "LEG"
  muscle_tags: string[]
  exercises: ParsedExercise[]
}

interface ParsedExercise {
  name: string
  sets: string
  weights: string
  notes?: string
  is_superset?: boolean
  superset_exercises?: string[]
}

interface ParseError {
  line: string
  lineNumber: number
  date: string
  error: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, duplicateAction = "ask" } = body

    const { workouts, errors } = parseWorkoutText(text)

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors,
        message: `Se encontraron ${errors.length} errores durante la importación`,
      })
    }

    // Check for existing workouts
    const existingWorkouts = []
    for (const workout of workouts) {
      const { data: existing } = await supabase
        .from("workouts")
        .select("id, date, session_type")
        .eq("user_id", DEFAULT_USER_ID)
        .eq("date", workout.date)
        .single()

      if (existing) {
        existingWorkouts.push({
          date: workout.date,
          existing: existing,
          new: workout,
        })
      }
    }

    // If duplicates found and no action specified, ask user
    if (existingWorkouts.length > 0 && duplicateAction === "ask") {
      return NextResponse.json({
        success: false,
        duplicates: existingWorkouts,
        message: `Se encontraron ${existingWorkouts.length} entrenamientos duplicados`,
      })
    }

    // Process workouts based on duplicate action
    const savedWorkouts = []
    const savedExercises = []
    const skippedWorkouts = []

    for (const workout of workouts) {
      try {
        const existingWorkout = existingWorkouts.find((ew) => ew.date === workout.date)

        if (existingWorkout) {
          if (duplicateAction === "skip") {
            skippedWorkouts.push(workout.date)
            continue
          } else if (duplicateAction === "overwrite") {
            await supabase.from("workouts").delete().eq("id", existingWorkout.existing.id)
          } else if (duplicateAction === "merge") {
            for (let i = 0; i < workout.exercises.length; i++) {
              const exercise = workout.exercises[i]

              const { data: maxPos } = await supabase
                .from("exercises")
                .select("position")
                .eq("workout_id", existingWorkout.existing.id)
                .order("position", { ascending: false })
                .limit(1)
                .single()

              const nextPosition = (maxPos?.position || 0) + 1

              const { data: exerciseData, error: exerciseError } = await supabase
                .from("exercises")
                .insert({
                  workout_id: existingWorkout.existing.id,
                  name: exercise.name,
                  sets: exercise.sets,
                  weights: exercise.weights,
                  notes: exercise.notes || null,
                  position: nextPosition + i,
                  is_linked_to_previous: exercise.is_superset || false,
                })
                .select()
                .single()

              if (exerciseError) {
                throw exerciseError
              }

              savedExercises.push(exerciseData)
            }

            savedWorkouts.push(existingWorkout.existing)
            continue
          }
        }

        // Create new workout
        const { data: workoutData, error: workoutError } = await supabase
          .from("workouts")
          .insert({
            user_id: DEFAULT_USER_ID,
            date: workout.date,
            session_type: workout.session_type,
            muscle_tags: workout.muscle_tags,
          })
          .select()
          .single()

        if (workoutError) {
          throw workoutError
        }

        savedWorkouts.push(workoutData)

        // Create exercises
        for (let i = 0; i < workout.exercises.length; i++) {
          const exercise = workout.exercises[i]
          const { data: exerciseData, error: exerciseError } = await supabase
            .from("exercises")
            .insert({
              workout_id: workoutData.id,
              name: exercise.name,
              sets: exercise.sets,
              weights: exercise.weights,
              notes: exercise.notes || null,
              position: i + 1,
              is_linked_to_previous: exercise.is_superset || false,
            })
            .select()
            .single()

          if (exerciseError) {
            throw exerciseError
          }

          savedExercises.push(exerciseData)
        }
      } catch (error) {
        console.error("Error saving workout:", error)
        return NextResponse.json(
          {
            success: false,
            error: `Error al guardar el entrenamiento del ${workout.date}: ${error}`,
          },
          { status: 500 },
        )
      }
    }

    let message = `Se importaron ${savedWorkouts.length} entrenamientos con ${savedExercises.length} ejercicios`
    if (skippedWorkouts.length > 0) {
      message += `. Se omitieron ${skippedWorkouts.length} entrenamientos duplicados`
    }

    return NextResponse.json({
      success: true,
      data: {
        workouts: savedWorkouts,
        exercises: savedExercises,
        skipped: skippedWorkouts,
      },
      message,
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ error: "Failed to parse workout data" }, { status: 400 })
  }
}

// Función mejorada para manejar acentos en fechas
function parseSpanishDate(day: string, monthName: string, year: string): string {
  // Normalizar el nombre del mes removiendo acentos
  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remover acentos
  }

  const normalizedMonth = normalizeString(monthName)

  const monthMap: Record<string, string> = {
    ene: "01",
    enero: "01",
    feb: "02",
    febrero: "02",
    mar: "03",
    marzo: "03",
    abr: "04",
    abril: "04",
    may: "05",
    mayo: "05",
    jun: "06",
    junio: "06",
    jul: "07",
    julio: "07",
    ago: "08",
    agosto: "08",
    sep: "09",
    septiembre: "09",
    oct: "10",
    octubre: "10",
    nov: "11",
    noviembre: "11",
    dic: "12",
    diciembre: "12",
  }

  const month = monthMap[normalizedMonth]
  if (!month) {
    throw new Error(`Mes no reconocido: ${monthName} (normalizado: ${normalizedMonth})`)
  }

  const paddedDay = day.padStart(2, "0")
  console.log(`Parsing date: day=${day}, month=${monthName} -> ${year}-${month}-${paddedDay}`)

  return `${year}-${month}-${paddedDay}`
}

function parseWorkoutText(text: string): { workouts: ParsedWorkout[]; errors: ParseError[] } {
  const workouts: ParsedWorkout[] = []
  const errors: ParseError[] = []
  const lines = text.split("\n")

  let currentWorkout: ParsedWorkout | null = null
  let currentDate = ""
  let lineNumber = 0

  for (const line of lines) {
    lineNumber++
    const trimmedLine = line.trim()

    if (!trimmedLine) continue

    // Regex mejorada para capturar fechas con acentos
    const dateMatch = trimmedLine.match(/🗓️\s*(\w+),?\s*(\d{1,2})\s+(\w+)\s+(\d{4})/)
    if (dateMatch) {
      try {
        if (currentWorkout && currentWorkout.exercises.length > 0) {
          workouts.push(currentWorkout)
        }

        const [fullMatch, dayOfWeek, day, monthName, year] = dateMatch
        console.log(`Found date match: ${fullMatch} -> day=${day}, month=${monthName}, year=${year}`)

        const date = parseSpanishDate(day, monthName, year)
        currentDate = date

        currentWorkout = {
          date,
          session_type: "PUSH",
          muscle_tags: [],
          exercises: [],
        }
      } catch (error) {
        console.error(`Error parsing date on line ${lineNumber}:`, error)
        errors.push({
          line: trimmedLine,
          lineNumber,
          date: currentDate || "Fecha desconocida",
          error: `Error al parsear la fecha: ${error}`,
        })
      }
      continue
    }

    // Skip month headers
    if (trimmedLine.match(/^[A-Za-z]+$/)) {
      continue
    }

    // Parse exercise line (including supersets)
    if (currentWorkout && trimmedLine.includes("|")) {
      try {
        const exercise = parseExerciseLine(trimmedLine)
        currentWorkout.exercises.push(exercise)
      } catch (error) {
        errors.push({
          line: trimmedLine,
          lineNumber,
          date: currentDate || "Fecha desconocida",
          error: `Error al parsear el ejercicio: ${error}`,
        })
      }
    }
  }

  // Add last workout
  if (currentWorkout && currentWorkout.exercises.length > 0) {
    const sessionInfo = determineSessionType(currentWorkout.exercises)
    currentWorkout.session_type = sessionInfo.sessionType
    currentWorkout.muscle_tags = sessionInfo.muscleTags
    workouts.push(currentWorkout)
  }

  console.log(
    `Parsed ${workouts.length} workouts:`,
    workouts.map((w) => w.date),
  )
  return { workouts, errors }
}

function parseExerciseLine(line: string): ParsedExercise {
  const parts = line.split("|").map((part) => part.trim())

  if (parts.length < 2) {
    throw new Error("Formato de línea inválido. Se esperaba: Ejercicio | Series | Peso")
  }

  const nameRaw = parts[0]
  const setsRaw = parts[1]
  const weightsRaw = parts[2] || ""

  if (!nameRaw) {
    throw new Error("Nombre del ejercicio vacío")
  }

  // Detectar superseries
  const isSuperset = nameRaw.toLowerCase().includes("superserie:")
  let name = nameRaw
  let notes = ""
  let supersetExercises: string[] = []

  if (isSuperset) {
    // Extraer ejercicios de la superserie
    const supersetContent = nameRaw.replace(/^Superserie:\s*/i, "").trim()

    // Detectar si hay " y " para separar ejercicios
    if (supersetContent.includes(" y ")) {
      supersetExercises = supersetContent.split(" y ").map((ex) => ex.trim())
      name = `Superserie: ${supersetExercises.join(" + ")}`
    } else {
      name = `Superserie: ${supersetContent}`
      supersetExercises = [supersetContent]
    }

    notes = "SUPERSET"
  }

  const sets = normalizeSets(setsRaw)
  const weights = normalizeWeights(weightsRaw)

  return {
    name: cleanExerciseName(name),
    sets,
    weights,
    notes: notes || undefined,
    is_superset: isSuperset,
    superset_exercises: isSuperset ? supersetExercises : undefined,
  }
}

function normalizeSets(setsStr: string): string {
  if (!setsStr) return "1"

  // Handle superset formats like "4x8 y 4x12"
  if (setsStr.includes(" y ")) {
    return setsStr // Keep the original format for supersets
  }

  if (setsStr.includes("x") && !setsStr.includes(",")) {
    return setsStr
  }

  if (setsStr.includes(",")) {
    const reps = setsStr
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r)
    return `${reps.length}x${reps[0]}`
  }

  const match = setsStr.match(/(\d+)/)
  if (match) {
    return `${match[1]}x1`
  }

  return setsStr
}

function normalizeWeights(weightsStr: string): string {
  if (!weightsStr) return ""

  if (weightsStr.toLowerCase().includes("sin peso")) {
    return "Sin Peso"
  }

  // Handle superset weights like "50kg y 7.5kg cada"
  if (weightsStr.includes(" y ")) {
    return weightsStr // Keep original format for supersets
  }

  let normalized = weightsStr
  normalized = normalized.replace(/\s*(cada|por)\s*/gi, "")

  if (normalized.includes("+ Barra")) {
    normalized = normalized.replace(/\s*\+\s*Barra/gi, "")
  }

  if (normalized.includes("x") && normalized.includes("kg")) {
    const weights = normalized.match(/(\d+(?:\.\d+)?)kg/g)
    if (weights) {
      return weights.join(",")
    }
  }

  if (/\d/.test(normalized) && !normalized.includes("kg") && !normalized.toLowerCase().includes("sin peso")) {
    normalized = normalized.replace(/(\d+(?:\.\d+)?)/g, "$1kg")
  }

  return normalized
}

function cleanExerciseName(name: string): string {
  return name.replace(/^Superserie:\s*/i, "").trim()
}

function determineSessionType(exercises: ParsedExercise[]): {
  sessionType: "PUSH" | "PULL" | "LEG"
  muscleTags: string[]
} {
  const pushKeywords = [
    "press",
    "flexiones",
    "triceps",
    "pecho",
    "militar",
    "pájaros",
    "contractora",
    "cruces",
    "pull over",
  ]
  const pullKeywords = ["remo", "dominadas", "jalón", "curl", "concentrado", "martillo", "invertido", "low row"]
  const legKeywords = ["extensión", "prensa", "jaca", "peso muerto", "gemelos", "cuádriceps", "sentadilla", "zancadas"]

  let pushCount = 0
  let pullCount = 0
  let legCount = 0

  const muscleTags = new Set<string>()

  for (const exercise of exercises) {
    const exerciseName = exercise.name.toLowerCase()

    // For supersets, check all exercises
    const namesToCheck =
      exercise.is_superset && exercise.superset_exercises
        ? exercise.superset_exercises.map((ex) => ex.toLowerCase())
        : [exerciseName]

    for (const nameToCheck of namesToCheck) {
      if (pushKeywords.some((keyword) => nameToCheck.includes(keyword))) {
        pushCount++
        muscleTags.add("Pecho")
        if (nameToCheck.includes("triceps")) muscleTags.add("Tríceps")
        if (nameToCheck.includes("militar") || nameToCheck.includes("pájaros")) muscleTags.add("Hombros")
      }

      if (pullKeywords.some((keyword) => nameToCheck.includes(keyword))) {
        pullCount++
        muscleTags.add("Espalda")
        if (nameToCheck.includes("curl") || nameToCheck.includes("concentrado") || nameToCheck.includes("martillo")) {
          muscleTags.add("Bíceps")
        }
      }

      if (legKeywords.some((keyword) => nameToCheck.includes(keyword))) {
        legCount++
        if (nameToCheck.includes("cuádriceps") || nameToCheck.includes("extensión")) muscleTags.add("Cuádriceps")
        if (nameToCheck.includes("peso muerto")) muscleTags.add("Femoral")
        if (nameToCheck.includes("gemelos")) muscleTags.add("Gemelos")
        if (nameToCheck.includes("prensa") || nameToCheck.includes("sentadilla")) {
          muscleTags.add("Cuádriceps")
          muscleTags.add("Glúteos")
        }
      }
    }
  }

  let sessionType: "PUSH" | "PULL" | "LEG"
  if (legCount > pushCount && legCount > pullCount) {
    sessionType = "LEG"
  } else if (pullCount > pushCount) {
    sessionType = "PULL"
  } else {
    sessionType = "PUSH"
  }

  return {
    sessionType,
    muscleTags: Array.from(muscleTags),
  }
}
