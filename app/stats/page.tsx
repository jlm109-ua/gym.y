"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Dumbbell, Calendar, Target } from "lucide-react"
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

  const filteredExercises =
    selectedSessionType === "all" ? exerciseStats : getExercisesBySessionType(selectedSessionType)

  const chartData = getTopExercises(8).map((stat) => ({
    name: stat.name.length > 12 ? stat.name.substring(0, 12) + "..." : stat.name,
    peso: Number.parseFloat(stat.maxWeight.replace("kg", "")) || 0,
    series: stat.totalSets,
  }))

  const workoutTypeData = workoutStats
    ? Object.entries(workoutStats.workoutsByType).map(([type, count]) => ({
      name: type,
      value: count,
    }))
    : []

  const muscleGroupData = workoutStats
    ? Object.entries(workoutStats.exercisesByMuscle)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([muscle, count]) => ({
        name: muscle,
        value: count,
      }))
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
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Reintentar
          </button>
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
      <h1 className="text-3xl font-bold mb-6">Estadísticas</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Entrenamientos
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
              Total Ejercicios
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
              Total Series
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workoutStats.totalSets}</div>
            <div className="text-xs text-muted-foreground">series completadas</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workoutStats.workoutsThisWeek}</div>
            <div className="text-xs text-muted-foreground">entrenamientos</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="exercises">Por Ejercicio</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Peso Máximo por Ejercicio</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
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
                <CardTitle>Total de Series por Ejercicio</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="series" fill="hsl(var(--secondary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay datos de series para mostrar
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Exercises */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Ejercicios (por series totales)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getTopExercises(5).map((exercise, index) => (
                  <div key={exercise.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{exercise.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {exercise.sessionTypes.map((type) => (
                            <Badge key={type} variant="outline" className="mr-1 text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{exercise.totalSets} series</div>
                      <div className="text-sm text-muted-foreground">Max: {exercise.maxWeight}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exercises">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los ejercicios</SelectItem>
                  <SelectItem value="PUSH">PUSH</SelectItem>
                  <SelectItem value="PULL">PULL</SelectItem>
                  <SelectItem value="LEG">LEG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExercises.map((stat) => (
                <Card key={stat.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{stat.name}</CardTitle>
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
                        <div className="font-medium text-muted-foreground">Reps Máximas</div>
                        <div className="text-lg font-bold">{stat.maxReps}</div>
                        <div className="text-xs text-muted-foreground">con {stat.weightAtMaxReps}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Total Series</div>
                        <div className="text-lg font-bold">{stat.totalSets}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Entrenamientos</div>
                        <div className="text-lg font-bold">{stat.totalWorkouts}</div>
                      </div>
                      <div className="col-span-2 pt-2 border-t">
                        <div className="font-medium text-muted-foreground">Última vez</div>
                        <div className="text-sm">
                          {stat.lastPerformed ? new Date(stat.lastPerformed).toLocaleDateString("es-ES") : "N/A"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Entrenamientos por Tipo</CardTitle>
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
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {workoutTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
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
                <CardTitle>Grupos Musculares Más Trabajados</CardTitle>
              </CardHeader>
              <CardContent>
                {muscleGroupData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={muscleGroupData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
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
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente (últimos 30 días)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getRecentExercises(30)
                  .slice(0, 10)
                  .map((exercise) => (
                    <div key={exercise.name} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <div className="font-medium">{exercise.name}</div>
                        <div className="text-sm text-muted-foreground">{exercise.sessionTypes.join(", ")}</div>
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
