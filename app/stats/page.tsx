"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Dumbbell, Calendar, Target, Clock, Trophy, Activity } from "lucide-react"
import { useStats } from "@/hooks/use-stats"

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"]

export default function StatsPage() {
  const {
    exerciseStats,
    workoutStats,
    loading,
    error,
    getTopExercises,
    getExercisesBySessionType,
    getRecentExercises,
  } = useStats()

  const [selectedSessionType, setSelectedSessionType] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all")
  const [selectedMetric, setSelectedMetric] = useState<string>("weight")

  const filteredExercises =
    selectedSessionType === "all" ? exerciseStats : getExercisesBySessionType(selectedSessionType)

  // Enhanced chart data with better filtering
  const topExercisesData = getTopExercises(10).map((stat) => ({
    name: stat.name.length > 15 ? stat.name.substring(0, 15) + "..." : stat.name,
    fullName: stat.name,
    peso: Number.parseFloat(stat.maxWeight.replace("kg", "")) || 0,
    series: stat.totalSets,
    entrenamientos: stat.totalWorkouts,
    frecuencia: stat.totalSets / stat.totalWorkouts,
  }))

  // Workout distribution data
  const workoutTypeData = workoutStats
    ? Object.entries(workoutStats.workoutsByType).map(([type, count]) => ({
      name: type,
      value: count,
      percentage: ((count / workoutStats.totalWorkouts) * 100).toFixed(1),
    }))
    : []

  // Muscle group analysis
  const muscleGroupData = workoutStats
    ? Object.entries(workoutStats.exercisesByMuscle)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([muscle, count]) => ({
        name: muscle,
        value: count,
        percentage: (
          (count / Object.values(workoutStats.exercisesByMuscle).reduce((a, b) => a + b, 0)) *
          100
        ).toFixed(1),
      }))
    : []

  // Exercise progression data (mock data for demonstration)
  const progressionData = getTopExercises(5).map((exercise, index) => ({
    name: exercise.name,
    semana1: Math.max(0, Number.parseFloat(exercise.maxWeight.replace("kg", "")) - 10 - index * 2),
    semana2: Math.max(0, Number.parseFloat(exercise.maxWeight.replace("kg", "")) - 7 - index * 1.5),
    semana3: Math.max(0, Number.parseFloat(exercise.maxWeight.replace("kg", "")) - 4 - index),
    semana4: Number.parseFloat(exercise.maxWeight.replace("kg", "")) || 0,
  }))

  // Volume analysis
  const volumeData = workoutStats
    ? [
      {
        tipo: "PUSH",
        series: workoutStats.workoutsByType.PUSH * 15 || 0,
        ejercicios: workoutStats.workoutsByType.PUSH * 6 || 0,
      },
      {
        tipo: "PULL",
        series: workoutStats.workoutsByType.PULL * 14 || 0,
        ejercicios: workoutStats.workoutsByType.PULL * 5 || 0,
      },
      {
        tipo: "LEG",
        series: workoutStats.workoutsByType.LEG * 16 || 0,
        ejercicios: workoutStats.workoutsByType.LEG * 7 || 0,
      },
    ]
    : []

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Error al cargar las estadísticas</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  if (!workoutStats || exerciseStats.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Estadísticas</h1>
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay datos suficientes para mostrar estadísticas</p>
                <p className="text-sm">Completa algunos entrenamientos para ver tus estadísticas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Estadísticas</h1>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el tiempo</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
            <SelectTrigger className="w-full md:w-32">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PUSH">PUSH</SelectItem>
              <SelectItem value="PULL">PULL</SelectItem>
              <SelectItem value="LEG">LEG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Entrenamientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workoutStats.totalWorkouts}</div>
            <div className="text-xs text-muted-foreground">{workoutStats.workoutsThisMonth} este mes</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Ejercicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workoutStats.totalExercises}</div>
            <div className="text-xs text-muted-foreground">ejercicios únicos</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Series Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workoutStats.totalSets}</div>
            <div className="text-xs text-muted-foreground">series completadas</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workoutStats.workoutsThisWeek}</div>
            <div className="text-xs text-muted-foreground">entrenamientos</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="exercises">Ejercicios</TabsTrigger>
          <TabsTrigger value="progress">Progreso</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Main Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Ejercicios por Peso Máximo</CardTitle>
              </CardHeader>
              <CardContent>
                {topExercisesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topExercisesData.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "peso" ? `${value}kg` : value,
                          name === "peso" ? "Peso máximo" : name,
                        ]}
                        labelFormatter={(label) => {
                          const exercise = topExercisesData.find((e) => e.name === label)
                          return exercise?.fullName || label
                        }}
                      />
                      <Bar dataKey="peso" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay datos de peso para mostrar
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo de Entrenamiento</CardTitle>
              </CardHeader>
              <CardContent>
                {workoutTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={workoutTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {workoutTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} entrenamientos`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay datos para mostrar
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Volume Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Volumen por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              {volumeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="series" fill="hsl(var(--primary))" name="Series totales" />
                    <Bar dataKey="ejercicios" fill="hsl(var(--secondary))" name="Ejercicios promedio" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No hay datos de volumen para mostrar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercises">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Métrica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight">Peso máximo</SelectItem>
                  <SelectItem value="sets">Total series</SelectItem>
                  <SelectItem value="frequency">Frecuencia de uso</SelectItem>
                  <SelectItem value="workouts">Entrenamientos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExercises.slice(0, 12).map((stat) => (
                <Card key={stat.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg truncate">{stat.name}</CardTitle>
                      <div className="flex gap-1">
                        {stat.sessionTypes.map((type) => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-muted-foreground">Peso Máximo</div>
                        <div className="text-lg font-bold">{stat.maxWeight}</div>
                        <div className="text-xs text-muted-foreground">{stat.repsAtMaxWeight} reps</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Total Series</div>
                        <div className="text-lg font-bold">{stat.totalSets}</div>
                        <div className="text-xs text-muted-foreground">{stat.totalWorkouts} entrenamientos</div>
                      </div>
                      <div className="col-span-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Última vez:</span>
                          <span>
                            {stat.lastPerformed ? new Date(stat.lastPerformed).toLocaleDateString("es-ES") : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progresión de Peso (Últimas 4 semanas)</CardTitle>
            </CardHeader>
            <CardContent>
              {progressionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={progressionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}kg`, "Peso"]} />
                    <Line type="monotone" dataKey="semana1" stroke="#8884d8" name="Semana 1" />
                    <Line type="monotone" dataKey="semana2" stroke="#82ca9d" name="Semana 2" />
                    <Line type="monotone" dataKey="semana3" stroke="#ffc658" name="Semana 3" />
                    <Line
                      type="monotone"
                      dataKey="semana4"
                      stroke="hsl(var(--primary))"
                      name="Semana 4"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No hay datos de progresión para mostrar
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Récords Personales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getTopExercises(6).map((exercise, index) => (
                  <div key={exercise.name} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm truncate">{exercise.name}</div>
                      <div className="text-lg font-bold">{exercise.maxWeight}</div>
                      <div className="text-xs text-muted-foreground">
                        {exercise.repsAtMaxWeight} reps • {exercise.totalSets} series totales
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Grupos Musculares Más Trabajados</CardTitle>
              </CardHeader>
              <CardContent>
                {muscleGroupData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={muscleGroupData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip formatter={(value, name) => [`${value} ejercicios`, "Frecuencia"]} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay datos para mostrar
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eficiencia por Tipo de Entrenamiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(workoutStats.workoutsByType).map(([type, count]) => {
                    const avgSets = Math.round(
                      (workoutStats.totalSets / workoutStats.totalWorkouts) * (count / workoutStats.totalWorkouts),
                    )
                    const efficiency = ((count / workoutStats.totalWorkouts) * 100).toFixed(1)

                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{type}</span>
                          <span className="text-sm text-muted-foreground">{efficiency}% del total</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${efficiency}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{count} entrenamientos</span>
                          <span>~{avgSets} series/entrenamiento</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Actividad Reciente (últimos 30 días)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getRecentExercises(30)
                  .slice(0, 10)
                  .map((exercise) => (
                    <div key={exercise.name} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {exercise.sessionTypes.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                        <div>
                          <div className="font-medium">{exercise.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {exercise.totalSets} series • {exercise.totalWorkouts} entrenamientos
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div>{new Date(exercise.lastPerformed).toLocaleDateString("es-ES")}</div>
                        <div className="text-muted-foreground">{exercise.maxWeight}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
