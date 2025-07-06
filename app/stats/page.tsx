"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import {
  Search,
  X,
  Download,
  TrendingUp,
  Dumbbell,
  Activity,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  PieChartIcon,
  Gauge,
} from "lucide-react"
import { useStats } from "@/hooks/use-stats"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function StatsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<string>("all")

  const { exerciseStats, sessionStats, wellnessStats, alerts, loading, exportStatsPDF } = useStats()

  // Filter exercise stats
  const filteredExerciseStats = useMemo(() => {
    if (!exerciseStats) return []

    return exerciseStats.filter((stat) => {
      const matchesSearch = searchTerm === "" || stat.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSessionType = sessionTypeFilter === "all" || stat.session_type === sessionTypeFilter
      const matchesPeriod =
        periodFilter === "all" ||
        (periodFilter === "recent" && new Date(stat.last_performed) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

      return matchesSearch && matchesSessionType && matchesPeriod
    })
  }, [exerciseStats, searchTerm, sessionTypeFilter, periodFilter])

  const activeFiltersCount = [searchTerm !== "", sessionTypeFilter !== "all", periodFilter !== "all"].filter(
    Boolean,
  ).length

  const clearAllFilters = () => {
    setSearchTerm("")
    setSessionTypeFilter("all")
    setPeriodFilter("all")
  }

  const handleExportPDF = async () => {
    const result = await exportStatsPDF()
    if (!result.success) {
      alert(result.error || "Error al exportar estadísticas")
    }
  }

  // Prepare data for charts
  const strengthProgressionData =
    exerciseStats?.slice(0, 10).map((stat) => ({
      name: stat.name.length > 15 ? stat.name.substring(0, 12) + "..." : stat.name,
      progression: Number.parseFloat(stat.progression_rate.replace("%", "").replace("+", "")) || 0,
      max_weight: Number.parseFloat(stat.max_weight.replace("kg", "")) || 0,
      frequency: stat.frequency,
    })) || []

  const volumeDistributionData =
    sessionStats?.session_distribution.map((s) => ({
      name: s.session_type,
      sessions: s.count,
      volume: s.total_volume,
    })) || []

  const wellnessRadarData = wellnessStats
    ? [
      {
        metric: "Energía",
        value: Math.max(0, Math.min(10, wellnessStats.avg_energy)),
        fullMark: 10,
      },
      {
        metric: "Sueño",
        value: Math.max(0, Math.min(10, wellnessStats.avg_sleep_quality)),
        fullMark: 10,
      },
      {
        metric: "Motivación",
        value: Math.max(0, Math.min(10, wellnessStats.avg_motivation)),
        fullMark: 10,
      },
      {
        metric: "Recuperación",
        value: 10 - wellnessStats.avg_muscle_soreness,
        fullMark: 10,
      },
      {
        metric: "Bienestar",
        value: 10 - wellnessStats.avg_stress,
        fullMark: 10,
      },
    ]
    : []

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-48 h-8 bg-muted rounded animate-pulse"></div>
              <div className="w-64 h-4 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="w-32 h-10 bg-muted rounded animate-pulse"></div>
          </div>

          {/* Alerts skeleton */}
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="w-full h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>

          {/* Overview cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted rounded"></div>
                    <div className="w-24 h-4 bg-muted rounded"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-12 h-8 bg-muted rounded mb-2"></div>
                  <div className="w-16 h-4 bg-muted rounded mb-2"></div>
                  <div className="w-full h-2 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-muted rounded"></div>
                    <div className="w-32 h-6 bg-muted rounded"></div>
                  </div>
                  <div className="w-48 h-4 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-64 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs skeleton */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 bg-muted rounded-lg p-1">
              <div className="h-8 bg-background rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>

            {/* Tab content skeleton */}
            <Card className="animate-pulse">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-muted rounded"></div>
                  <div className="w-40 h-6 bg-muted rounded"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="w-full h-10 bg-muted rounded"></div>
                  <div className="flex gap-4">
                    <div className="w-32 h-10 bg-muted rounded"></div>
                    <div className="w-32 h-10 bg-muted rounded"></div>
                  </div>
                  <div className="w-48 h-4 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Panel de Estadísticas</h1>
            <p className="text-muted-foreground mt-1">Análisis completo de tu progreso y rendimiento</p>
          </div>
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <Alert key={index} variant={alert.type === "warning" ? "destructive" : "default"}>
                {alert.type === "warning" && <AlertTriangle className="h-4 w-4" />}
                {alert.type === "success" && <CheckCircle className="h-4 w-4" />}
                {alert.type === "info" && <Info className="h-4 w-4" />}
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Entrenamientos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats?.total_sessions || 0}</div>
              <div className="text-sm text-muted-foreground">Este mes: {sessionStats?.this_month || 0}</div>
              <Progress value={((sessionStats?.this_month || 0) / 20) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Ejercicios Únicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exerciseStats?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Variedad en tu rutina</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Bienestar General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {wellnessStats
                  ? `${((wellnessStats.avg_energy + wellnessStats.avg_motivation + wellnessStats.avg_sleep_quality) / 3).toFixed(1)}/10`
                  : "N/A"}
              </div>
              <div className="text-sm text-muted-foreground">Promedio de bienestar</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Distribución de Sesiones
              </CardTitle>
              <p className="text-sm text-muted-foreground">Frecuencia de cada tipo de entrenamiento</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {volumeDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={volumeDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="sessions"
                      >
                        {volumeDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay datos suficientes para generar la gráfica.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Wellness Radar */}
          {wellnessStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Indicadores de Bienestar
                </CardTitle>
                <p className="text-sm text-muted-foreground">Tu estado físico y mental promedio</p>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={wellnessRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} />
                      <Radar
                        name="Bienestar"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wellness Trend */}
          {wellnessStats?.wellness_trend && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Tendencia de Bienestar
                </CardTitle>
                <p className="text-sm text-muted-foreground">Evolución de tus métricas de bienestar</p>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wellnessStats.wellness_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="energy" stroke="#8884d8" name="Energía" />
                      <Line type="monotone" dataKey="motivation" stroke="#82ca9d" name="Motivación" />
                      <Line type="monotone" dataKey="sleep_quality" stroke="#ffc658" name="Sueño" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="exercises" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="exercises">Ejercicios</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="wellness">Bienestar</TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Buscar y Filtrar Ejercicios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar ejercicios por nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                        onClick={() => setSearchTerm("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Tipo:</label>
                      <Select value={sessionTypeFilter} onValueChange={setSessionTypeFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="PUSH">PUSH</SelectItem>
                          <SelectItem value="PULL">PULL</SelectItem>
                          <SelectItem value="LEG">LEG</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Período:</label>
                      <Select value={periodFilter} onValueChange={setPeriodFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="recent">Recientes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {activeFiltersCount > 0 && (
                      <Button variant="outline" size="sm" onClick={clearAllFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Limpiar filtros ({activeFiltersCount})
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      Mostrando {filteredExerciseStats.length} de {exerciseStats?.length || 0} ejercicios
                    </span>
                    {activeFiltersCount > 0 && (
                      <div className="flex gap-1">
                        {searchTerm && <Badge variant="secondary">Búsqueda: "{searchTerm}"</Badge>}
                        {sessionTypeFilter !== "all" && <Badge variant="secondary">Tipo: {sessionTypeFilter}</Badge>}
                        {periodFilter !== "all" && <Badge variant="secondary">Período: {periodFilter}</Badge>}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exercise Cards */}
            {filteredExerciseStats.length > 0 ? (
              <div className="grid gap-4">
                {filteredExerciseStats.map((stat) => (
                  <Card key={stat.name}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{stat.name}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline">{stat.session_type}</Badge>
                          <Badge variant="secondary">{stat.frequency}x usado</Badge>
                          {stat.progression_rate !== "N/A" && (
                            <Badge
                              variant={
                                Number.parseFloat(stat.progression_rate.replace("%", "").replace("+", "")) > 0
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {stat.progression_rate}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">Peso máximo:</span>
                          <div className="text-lg font-bold">{stat.max_weight}</div>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Peso promedio:</span>
                          <div className="text-lg font-bold">{stat.avg_weight}</div>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">1RM estimado:</span>
                          <div className="text-lg font-bold text-primary">{stat.estimated_1rm}</div>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Series promedio:</span>
                          <div className="text-lg font-bold">{stat.avg_sets}</div>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Último uso:</span>
                          <div className="text-lg font-bold">
                            {new Date(stat.last_performed).toLocaleDateString("es-ES", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm || sessionTypeFilter !== "all" || periodFilter !== "all"
                      ? "No se encontraron ejercicios que coincidan con los filtros aplicados"
                      : "No hay estadísticas de ejercicios disponibles"}
                  </div>
                  {activeFiltersCount > 0 && (
                    <Button variant="outline" className="mt-4 bg-transparent" onClick={clearAllFilters}>
                      Limpiar filtros
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Alert variant="default" className="flex items-start gap-3">
              <Info className="mt-1 h-5 w-5 text-blue-500" />
              <div>
                <AlertTitle>¿Qué es el 1RM estimado?</AlertTitle>
                <AlertDescription>
                  El 1RM (una repetición máxima) representa el peso máximo que puedes levantar una vez en un ejercicio. Se
                  calcula de forma estimada a partir de tus repeticiones y pesos registrados usando fórmulas como la de Epley.
                </AlertDescription>
              </div>
            </Alert>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 1RM Exercises */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 - 1RM Estimado</CardTitle>
                  <p className="text-sm text-muted-foreground">Tus ejercicios con mayor fuerza máxima estimada</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {exerciseStats
                      ?.filter((stat) => stat.estimated_1rm !== "N/A")
                      .sort(
                        (a, b) =>
                          Number.parseFloat(b.estimated_1rm.replace("kg", "")) -
                          Number.parseFloat(a.estimated_1rm.replace("kg", "")),
                      )
                      .slice(0, 10)
                      .map((stat, index) => (
                        <div key={stat.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{stat.name}</div>
                              <div className="text-xs text-muted-foreground">{stat.session_type}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{stat.estimated_1rm}</div>
                            <div className="text-xs text-muted-foreground">1RM estimado</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Volume Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Volumen</CardTitle>
                  <p className="text-sm text-muted-foreground">Distribución del volumen de entrenamiento</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sessionStats?.session_distribution.map((session) => (
                      <div key={session.session_type} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{session.session_type}</span>
                          <span className="text-sm text-muted-foreground">{session.count} sesiones</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Volumen total:</span>
                            <span>{session.total_volume.toFixed(0)}kg</span>
                          </div>
                          <Progress
                            value={(session.count / (sessionStats?.total_sessions || 1)) * 100}
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="wellness" className="space-y-4">
            {wellnessStats ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Wellness Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Métricas de Bienestar</CardTitle>
                    <p className="text-sm text-muted-foreground">Promedios de tus últimas 30 mediciones</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Energía</span>
                            <span className="text-sm">{wellnessStats.avg_energy.toFixed(1)}/10</span>
                          </div>
                          <Progress value={wellnessStats.avg_energy * 10} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Motivación</span>
                            <span className="text-sm">{wellnessStats.avg_motivation.toFixed(1)}/10</span>
                          </div>
                          <Progress value={wellnessStats.avg_motivation * 10} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Calidad del Sueño</span>
                            <span className="text-sm">{wellnessStats.avg_sleep_quality.toFixed(1)}/10</span>
                          </div>
                          <Progress value={wellnessStats.avg_sleep_quality * 10} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Horas de Sueño</span>
                            <span className="text-sm">{wellnessStats.avg_sleep_hours.toFixed(1)}h</span>
                          </div>
                          <Progress value={(wellnessStats.avg_sleep_hours / 10) * 100} className="h-2" />
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Estrés (invertido)</span>
                            <span className="text-sm">{(10 - wellnessStats.avg_stress).toFixed(1)}/10</span>
                          </div>
                          <Progress value={(10 - wellnessStats.avg_stress) * 10} className="h-2" />
                        </div>
                        <div className="space-y-2 mt-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Recuperación</span>
                            <span className="text-sm">{(10 - wellnessStats.avg_muscle_soreness).toFixed(1)}/10</span>
                          </div>
                          <Progress value={(10 - wellnessStats.avg_muscle_soreness) * 10} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Wellness Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis de Bienestar</CardTitle>
                    <p className="text-sm text-muted-foreground">Insights automáticos basados en tus datos</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {wellnessStats.avg_energy >= 7 && (
                        <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-green-800 dark:text-green-200">Excelente Energía</div>
                            <div className="text-sm text-green-700 dark:text-green-300">
                              Tu nivel de energía promedio es muy bueno. Mantén tus hábitos actuales.
                            </div>
                          </div>
                        </div>
                      )}

                      {wellnessStats.avg_sleep_hours < 7 && (
                        <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-yellow-800 dark:text-yellow-200">Sueño Insuficiente</div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">
                              Estás durmiendo {wellnessStats.avg_sleep_hours.toFixed(1)} horas en promedio. Intenta
                              dormir al menos 7-8 horas para optimizar tu recuperación.
                            </div>
                          </div>
                        </div>
                      )}

                      {wellnessStats.avg_stress > 6 && (
                        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-red-800 dark:text-red-200">Estrés Elevado</div>
                            <div className="text-sm text-red-700 dark:text-red-300">
                              Tu nivel de estrés promedio es alto ({wellnessStats.avg_stress.toFixed(1)}/10). Considera
                              técnicas de relajación y asegúrate de tener días de descanso.
                            </div>
                          </div>
                        </div>
                      )}

                      {wellnessStats.avg_motivation >= 8 && (
                        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-blue-800 dark:text-blue-200">Alta Motivación</div>
                            <div className="text-sm text-blue-700 dark:text-blue-300">
                              Tu motivación está en un nivel excelente. ¡Es el momento perfecto para establecer nuevos
                              objetivos desafiantes!
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-lg font-medium mb-2">No hay datos de bienestar</div>
                  <div className="text-muted-foreground">
                    Comienza a trackear tu bienestar diario para ver análisis detallados aquí.
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
