"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import {
  Download,
  Upload,
  Palette,
  Moon,
  Sun,
  Monitor,
  Dumbbell,
  Search,
  Edit,
  Trash2,
  Zap,
  Filter,
  TrendingUp,
  Clock,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ImportModal } from "@/components/import-modal"
import { useAllExercises } from "@/hooks/use-all-exercises"

const COLORS = [
  { name: "Azul", value: "blue", class: "bg-blue-500" },
  { name: "Rojo", value: "red", class: "bg-red-500" },
  { name: "Verde", value: "green", class: "bg-green-500" },
  { name: "Púrpura", value: "purple", class: "bg-purple-500" },
  { name: "Naranja", value: "orange", class: "bg-orange-500" },
]

const SESSION_TYPE_COLORS = {
  PUSH: "bg-red-500",
  PULL: "bg-blue-500",
  LEG: "bg-green-500",
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [primaryColor, setPrimaryColor] = useState("blue")
  const [mounted, setMounted] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // Exercise manager state
  const [searchTerm, setSearchTerm] = useState("")
  const [sessionFilter, setSessionFilter] = useState("all")
  const [editingExercise, setEditingExercise] = useState<any>(null)

  const {
    uniqueExercises,
    loading: exercisesLoading,
    updateExercise,
    deleteExercise,
    filterExercises,
    getExerciseStats,
    refetch: refetchExercises,
  } = useAllExercises()

  useEffect(() => {
    setMounted(true)
    // Load saved color from localStorage
    const savedColor = localStorage.getItem("primaryColor")
    if (savedColor) {
      setPrimaryColor(savedColor)
    }
  }, [])

  const handleColorChange = (color: string) => {
    setPrimaryColor(color)
    localStorage.setItem("primaryColor", color)

    // Apply color to CSS variables
    const root = document.documentElement
    const colorMap: Record<string, string> = {
      blue: "221.2 83.2% 53.3%",
      red: "0 84.2% 60.2%",
      green: "142.1 76.2% 36.3%",
      purple: "262.1 83.3% 57.8%",
      orange: "24.6 95% 53.1%",
    }

    root.style.setProperty("--primary", colorMap[color])

    toast({
      title: "Color actualizado",
      description: `Se ha cambiado el color principal a ${COLORS.find((c) => c.value === color)?.name}`,
    })
  }

  const handleExport = async () => {
    try {
      toast({
        title: "Exportando datos...",
        description: "Se está generando el archivo PDF",
      })

      setTimeout(() => {
        toast({
          title: "Exportación completada",
          description: "Los datos se han exportado correctamente",
        })
      }, 2000)
    } catch (error) {
      toast({
        title: "Error en la exportación",
        description: "No se pudo exportar los datos",
        variant: "destructive",
      })
    }
  }

  const handleImportSuccess = () => {
    toast({
      title: "Importación completada",
      description: "Los entrenamientos se han importado correctamente",
    })
    refetchExercises()
  }

  const handleEditExercise = (exercise: any) => {
    setEditingExercise(exercise)
  }

  const handleUpdateExercise = async (exerciseData: any) => {
    if (!editingExercise) return

    try {
      // Format sets as "4x12", "4xAl Fallo", or just series if no repetitions
      let formattedSets = exerciseData.series
      if (exerciseData.isFailure) {
        formattedSets = `${exerciseData.series}xAl Fallo`
      } else if (exerciseData.repetitions) {
        formattedSets = `${exerciseData.series}x${exerciseData.repetitions}`
      }

      // Format weights with "kg" suffix if not empty
      const formattedWeights = exerciseData.weights ? `${exerciseData.weights}kg` : ""

      await updateExercise(editingExercise.id, {
        name: exerciseData.name,
        sets: formattedSets,
        weights: formattedWeights,
        notes: exerciseData.notes || null,
      })

      setEditingExercise(null)
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleDeleteExercise = async (exerciseId: string, exerciseName: string) => {
    if (
      confirm(
        `¿Estás seguro de que quieres eliminar "${exerciseName}"?\n\nEsto eliminará solo la instancia más reciente del ejercicio.`,
      )
    ) {
      await deleteExercise(exerciseId)
    }
  }

  const filteredExercises = filterExercises(searchTerm, sessionFilter)
  const exerciseStats = getExerciseStats()

  if (!mounted) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Ajustes</h1>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
          <TabsTrigger value="data">Datos</TabsTrigger>
          <TabsTrigger value="exercises">
            Ejer.
            {exerciseStats.uniqueExercises > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {exerciseStats.uniqueExercises}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Apariencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div>
                <Label className="text-base font-medium">Tema</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className="justify-start"
                  >
                    <Sun className="h-4 w-4" />
                    Claro
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className="justify-start"
                  >
                    <Moon className="h-4 w-4" />
                    Oscuro
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                    className="justify-start"
                  >
                    <Monitor className="h-4 w-4" />
                    Sys
                  </Button>
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <Label className="text-base font-medium">Color principal</Label>
                <div className="grid grid-cols-5 gap-3 mt-2">
                  {COLORS.map((color) => (
                    <Button
                      key={color.value}
                      variant={primaryColor === color.value ? "default" : "outline"}
                      onClick={() => handleColorChange(color.value)}
                      className={`${color.class} justify-start`}
                    >
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de datos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-medium">Exportar datos</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Descarga todos tus entrenamientos y progreso en formato PDF
                  </p>
                  <Button onClick={handleExport} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar a PDF
                  </Button>
                </div>

                <div>
                  <Label className="text-base font-medium">Importar datos</Label>
                  <p className="text-sm text-muted-foreground mb-3">Importa entrenamientos desde un archivo de texto</p>
                  <Button onClick={() => setShowImportModal(true)} variant="outline" className="w-full bg-transparent">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar archivo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exercise Manager */}
        <TabsContent value="exercises">
          <div className="space-y-6">
            {/* Exercise Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ejercicios Únicos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{exerciseStats.uniqueExercises}</div>
                  <div className="text-xs text-muted-foreground">de {exerciseStats.totalExercises} totales</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>PUSH:</span>
                      <span className="font-medium">{exerciseStats.sessionTypes.PUSH}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PULL:</span>
                      <span className="font-medium">{exerciseStats.sessionTypes.PULL}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>LEG:</span>
                      <span className="font-medium">{exerciseStats.sessionTypes.LEG}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Superseries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{exerciseStats.supersetExercises}</div>
                  <div className="text-xs text-muted-foreground">ejercicios conectados</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Filtrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredExercises.length}</div>
                  <div className="text-xs text-muted-foreground">mostrando</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros y Búsqueda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="search">Buscar ejercicio</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Nombre del ejercicio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="session-filter">Tipo de sesión</Label>
                    <Select value={sessionFilter} onValueChange={setSessionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="PUSH">PUSH</SelectItem>
                        <SelectItem value="PULL">PULL</SelectItem>
                        <SelectItem value="LEG">LEG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exercise List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Ejercicios Únicos (A-Z)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exercisesLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-muted rounded-full"></div>
                            <div className="space-y-1">
                              <div className="w-32 h-4 bg-muted rounded"></div>
                              <div className="w-24 h-3 bg-muted rounded"></div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-8 h-8 bg-muted rounded"></div>
                            <div className="w-8 h-8 bg-muted rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredExercises.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-column items-center gap-2">
                            {exercise.sessionTypes.map((type) => (
                              <div
                                key={type}
                                className={`w-3 h-3 mb-1 mt-1 rounded-full ${SESSION_TYPE_COLORS[type as keyof typeof SESSION_TYPE_COLORS]}`}
                              />
                            ))}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{exercise.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-3">
                              <span>
                                {exercise.sets} • {exercise.weights}
                              </span>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                <span>{exercise.frequency}x usado</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {new Date(exercise.lastUsed).toLocaleDateString("es-ES", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditExercise(exercise)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteExercise(exercise.id, exercise.name)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm || sessionFilter !== "all"
                      ? "No se encontraron ejercicios con los filtros aplicados"
                      : "No hay ejercicios registrados"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* App Info */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información de la aplicación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aplicación:</span>
                  <span>Gym.y</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versión:</span>
                  <span>1.0.1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última actualización:</span>
                  <span>Julio 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desarrollado con:</span>
                  <span>Next.js + Supabase</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Modal */}
      <ImportModal open={showImportModal} onOpenChange={setShowImportModal} onSuccess={handleImportSuccess} />

      {/* Exercise Edit Modal */}
      {editingExercise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Editar Ejercicio</CardTitle>
            </CardHeader>
            <CardContent>
              <ExerciseEditForm
                exercise={editingExercise}
                onSave={handleUpdateExercise}
                onCancel={() => setEditingExercise(null)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Simple inline form component for editing exercises
function ExerciseEditForm({ exercise, onSave, onCancel }: any) {
  const [name, setName] = useState(exercise.name || "")
  const [series, setSeries] = useState("")
  const [repetitions, setRepetitions] = useState("")
  const [isFailure, setIsFailure] = useState(false)
  const [weights, setWeights] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    // Parse existing sets format
    const setsMatch = exercise.sets?.match(/^(\d+)x(.+)$/)
    if (setsMatch) {
      setSeries(setsMatch[1])
      const repsValue = setsMatch[2].trim()
      if (repsValue.toLowerCase() === "al fallo") {
        setIsFailure(true)
        setRepetitions("")
      } else {
        setIsFailure(false)
        setRepetitions(repsValue)
      }
    } else {
      setSeries(exercise.sets || "")
      setRepetitions("")
      setIsFailure(false)
    }

    const cleanWeights = exercise.weights?.replace(/kg/g, "").trim() || ""
    setWeights(cleanWeights)
    setNotes(exercise.notes === "SUPERSET" ? "" : exercise.notes || "")
  }, [exercise])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      series,
      repetitions,
      isFailure,
      weights,
      notes,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nombre</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Series</Label>
          <Input type="number" min="1" value={series} onChange={(e) => setSeries(e.target.value)} required />
        </div>
        <div>
          <Label>Repeticiones</Label>
          <Select
            value={isFailure ? "failure" : repetitions}
            onValueChange={(value) => {
              if (value === "failure") {
                setIsFailure(true)
                setRepetitions("")
              } else {
                setIsFailure(false)
                setRepetitions(value)
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="failure">Al Fallo</SelectItem>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="8">8</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Peso</Label>
        <Input value={weights} onChange={(e) => setWeights(e.target.value)} placeholder="40,45,50" />
      </div>

      <div>
        <Label>Notas</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas opcionales..." />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  )
}
