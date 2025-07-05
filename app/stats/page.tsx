"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Search, X, Download, TrendingUp, Calendar, Dumbbell } from "lucide-react"
import { useStats } from "@/hooks/use-stats"

export default function StatsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<string>("all")

  const { exerciseStats, sessionStats, progressStats, loading, exportStatsPDF } = useStats()

  // Filter exercise stats based on search term, session type, and period
  const filteredExerciseStats = useMemo(() => {
    if (!exerciseStats) return []

    return exerciseStats.filter((stat) => {
      // Search by exercise name
      const matchesSearch = searchTerm === "" || stat.name.toLowerCase().includes(searchTerm.toLowerCase())

      // Filter by session type
      const matchesSessionType = sessionTypeFilter === "all" || stat.session_type === sessionTypeFilter

      // Filter by period (simplified - you can enhance this)
      const matchesPeriod =
        periodFilter === "all" ||
        (periodFilter === "recent" && new Date(stat.last_performed) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

      return matchesSearch && matchesSessionType && matchesPeriod
    })
  }, [exerciseStats, searchTerm, sessionTypeFilter, periodFilter])

  // Count active filters
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

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="w-48 h-8 bg-muted rounded animate-pulse"></div>
            <div className="w-32 h-10 bg-muted rounded animate-pulse"></div>
          </div>

          {/* Search and filters skeleton */}
          <Card className="animate-pulse">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-muted rounded"></div>
                <div className="w-48 h-6 bg-muted rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search input skeleton */}
                <div className="w-full h-10 bg-muted rounded"></div>

                {/* Filters skeleton */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-4 bg-muted rounded"></div>
                    <div className="w-32 h-10 bg-muted rounded"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-4 bg-muted rounded"></div>
                    <div className="w-32 h-10 bg-muted rounded"></div>
                  </div>
                </div>

                {/* Results summary skeleton */}
                <div className="flex items-center gap-2">
                  <div className="w-40 h-4 bg-muted rounded"></div>
                  <div className="w-20 h-5 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted rounded"></div>
                    <div className="w-32 h-4 bg-muted rounded"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-8 h-8 bg-muted rounded mb-2"></div>
                  <div className="w-20 h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs skeleton */}
          <div className="space-y-4">
            <div className="flex space-x-1 bg-muted rounded-lg p-1">
              <div className="w-24 h-8 bg-background rounded"></div>
              <div className="w-20 h-8 bg-muted rounded"></div>
              <div className="w-20 h-8 bg-muted rounded"></div>
            </div>

            {/* Exercise cards skeleton */}
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-40 h-6 bg-muted rounded"></div>
                      <div className="flex gap-2">
                        <div className="w-12 h-5 bg-muted rounded"></div>
                        <div className="w-16 h-5 bg-muted rounded"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="space-y-2">
                          <div className="w-20 h-4 bg-muted rounded"></div>
                          <div className="w-12 h-6 bg-muted rounded"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Estadísticas</h1>
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Global Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar y Filtrar Ejercicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Input */}
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

              {/* Filters */}
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

              {/* Results Summary */}
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

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Total Entrenamientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats?.total_sessions || 0}</div>
              <div className="text-sm text-muted-foreground">Este mes: {sessionStats?.this_month || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Ejercicios Únicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exerciseStats?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Filtrados: {filteredExerciseStats.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Último Entrenamiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessionStats?.last_session
                  ? new Date(sessionStats.last_session).toLocaleDateString("es-ES", {
                    month: "short",
                    day: "numeric",
                  })
                  : "N/A"}
              </div>
              <div className="text-sm text-muted-foreground">
                {sessionStats?.days_since_last ? `Hace ${sessionStats.days_since_last} días` : "Sin datos"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats Tabs */}
        <Tabs defaultValue="exercises" className="space-y-4">
          <TabsList>
            <TabsTrigger value="exercises">Ejercicios ({filteredExerciseStats.length})</TabsTrigger>
            <TabsTrigger value="sessions">Sesiones</TabsTrigger>
            <TabsTrigger value="progress">Progreso</TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="space-y-4">
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
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">Peso máximo:</span>
                          <div className="text-lg font-bold">{stat.max_weight || "N/A"}</div>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Peso promedio:</span>
                          <div className="text-lg font-bold">{stat.avg_weight || "N/A"}</div>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Series promedio:</span>
                          <div className="text-lg font-bold">{stat.avg_sets || "N/A"}</div>
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

          <TabsContent value="sessions" className="space-y-4">
            {sessionStats?.session_distribution && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Sesiones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sessionStats.session_distribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="session_type" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {progressStats?.weight_progress && progressStats.weight_progress.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Progreso de Peso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressStats.weight_progress}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
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
