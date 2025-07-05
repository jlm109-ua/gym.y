"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, Download, Upload, FileText, Info } from "lucide-react"
import { useProgress } from "@/hooks/use-progress"
import { ProgressImportModal } from "@/components/progress-import-modal"

export default function ProgressPage() {
  const { progress, loading, addProgress, deleteProgress, exportProgress, exportProgressPDF, importProgress } =
    useProgress()
  const [newWeight, setNewWeight] = useState("")
  const [newHeight, setNewHeight] = useState("")
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0])
  const [showImportModal, setShowImportModal] = useState(false)

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWeight || !newDate) return

    const weight = Number.parseFloat(newWeight)
    if (isNaN(weight) || weight <= 0) return

    const data: { date: string; weight: number; height?: number } = {
      date: newDate,
      weight,
    }

    if (newHeight) {
      const height = Number.parseFloat(newHeight)
      if (!isNaN(height) && height > 0) {
        data.height = height
      }
    }

    const result = await addProgress(data)
    if (result.success) {
      setNewWeight("")
      setNewHeight("")
      setNewDate(new Date().toISOString().split("T")[0])
    }
  }

  const handleDeleteProgress = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta medición?")) {
      await deleteProgress(id)
    }
  }

  const handleExportText = async () => {
    const result = await exportProgress()
    if (!result.success) {
      alert(result.error || "Error al exportar datos")
    }
  }

  const handleExportPDF = async () => {
    const result = await exportProgressPDF()
    if (!result.success) {
      alert(result.error || "Error al exportar PDF")
    }
  }

  // Prepare chart data
  const chartData = progress
    .slice()
    .reverse()
    .map((p, index) => ({
      date: new Date(p.date).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      }),
      weight: p.weight,
      fullDate: p.date,
    }))

  // Calculate statistics
  const weights = progress.map((p) => p.weight).filter((w) => w != null)
  const currentWeight = weights.length > 0 ? weights[0] : null
  const previousWeight = weights.length > 1 ? weights[1] : null
  const initialWeight = weights.length > 0 ? weights[weights.length - 1] : null

  const weightChange = currentWeight && initialWeight ? currentWeight - initialWeight : null
  const recentChange = currentWeight && previousWeight ? currentWeight - previousWeight : null

  // Calculate average height
  const heights = progress.map((p) => p.height).filter((h) => h != null)
  const avgHeight = heights.length > 0 ? heights.reduce((a, b) => a + b, 0) / heights.length : null

  // Calculate BMI
  const currentBMI = currentWeight && avgHeight ? (currentWeight / Math.pow(avgHeight / 100, 2)).toFixed(1) : null

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="w-48 h-8 bg-muted rounded animate-pulse"></div>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="w-24 h-4 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="w-16 h-8 bg-muted rounded mb-2"></div>
                  <div className="w-20 h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart skeleton */}
          <Card className="animate-pulse">
            <CardHeader>
              <div className="w-32 h-6 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>

          {/* Add form skeleton */}
          <Card className="animate-pulse">
            <CardHeader>
              <div className="w-40 h-6 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="w-12 h-4 bg-muted rounded"></div>
                  <div className="w-full h-10 bg-muted rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-16 h-4 bg-muted rounded"></div>
                  <div className="w-full h-10 bg-muted rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-muted rounded"></div>
                  <div className="w-full h-10 bg-muted rounded"></div>
                </div>
              </div>
              <div className="w-32 h-10 bg-muted rounded"></div>
            </CardContent>
          </Card>

          {/* History skeleton */}
          <Card className="animate-pulse">
            <CardHeader>
              <div className="w-40 h-6 bg-muted rounded mb-2"></div>
              <div className="w-full h-12 bg-muted/50 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-4 bg-muted rounded"></div>
                      <div className="w-12 h-4 bg-muted rounded"></div>
                      <div className="w-16 h-5 bg-muted rounded"></div>
                      <div className="w-20 h-5 bg-muted rounded"></div>
                    </div>
                    <div className="w-8 h-8 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export section skeleton */}
          <Card className="animate-pulse">
            <CardHeader>
              <div className="w-40 h-6 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="w-full h-10 bg-muted rounded"></div>
                <div className="w-full h-10 bg-muted rounded"></div>
                <div className="w-full h-10 bg-muted rounded"></div>
              </div>
              <div className="space-y-1">
                <div className="w-full h-4 bg-muted rounded"></div>
                <div className="w-full h-4 bg-muted rounded"></div>
                <div className="w-3/4 h-4 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Progreso Físico</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Peso Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentWeight ? `${currentWeight} kg` : "No hay datos"}</div>
              {recentChange !== null && (
                <div
                  className={`flex items-center text-sm ${recentChange > 0 ? "text-red-600" : recentChange < 0 ? "text-green-600" : "text-muted-foreground"
                    }`}
                >
                  {recentChange > 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : recentChange < 0 ? (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  ) : (
                    <Minus className="h-4 w-4 mr-1" />
                  )}
                  {recentChange > 0 ? "+" : ""}
                  {recentChange.toFixed(1)} kg vs anterior
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cambio Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weightChange !== null ? (
                  <span className={weightChange >= 0 ? "text-red-600" : "text-green-600"}>
                    {weightChange > 0 ? "+" : ""}
                    {weightChange.toFixed(1)} kg
                  </span>
                ) : (
                  "No hay datos"
                )}
              </div>
              <div className="text-sm text-muted-foreground">{progress.length} mediciones registradas</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">IMC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentBMI || "No calculable"}</div>
              {currentBMI && (
                <Badge
                  variant={
                    Number.parseFloat(currentBMI) < 18.5
                      ? "destructive"
                      : Number.parseFloat(currentBMI) < 25
                        ? "default"
                        : Number.parseFloat(currentBMI) < 30
                          ? "secondary"
                          : "destructive"
                  }
                >
                  {Number.parseFloat(currentBMI) < 18.5
                    ? "Bajo peso"
                    : Number.parseFloat(currentBMI) < 25
                      ? "Normal"
                      : Number.parseFloat(currentBMI) < 30
                        ? "Sobrepeso"
                        : "Obesidad"}
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolución del Peso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload
                          return new Date(data.fullDate).toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        }
                        return label
                      }}
                      formatter={(value: any) => [`${value} kg`, "Peso"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add New Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Añadir Nueva Medición</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProgress} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Fecha</Label>
                  <Input id="date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="70.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="height">Altura (cm) - Opcional</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    min="0"
                    value={newHeight}
                    onChange={(e) => setNewHeight(e.target.value)}
                    placeholder="175"
                  />
                </div>
              </div>
              <Button type="submit">
                <Plus className="h-4 w-4 mr-2" />
                Añadir Medición
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Progress History */}
        {progress.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historial de Mediciones</CardTitle>
              {progress.length > 5 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Mostrando las últimas 5 mediciones. Para ver el historial completo, exporta a PDF.
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {progress.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-muted-foreground">
                        {new Date(p.date).toLocaleDateString("es-ES", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="font-medium">{p.weight} kg</div>
                      {p.height && <Badge variant="outline">{p.height} cm</Badge>}
                      {p.height && (
                        <Badge variant="secondary">IMC: {(p.weight / Math.pow(p.height / 100, 2)).toFixed(1)}</Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteProgress(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export and Import Section */}
        <Card>
          <CardHeader>
            <CardTitle>Exportar e Importar Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={handleExportText} variant="outline" className="flex items-center gap-2 bg-transparent">
                  <FileText className="h-4 w-4" />
                  Exportar Texto
                </Button>
                <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
                <Button onClick={() => setShowImportModal(true)} variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Importar Datos
                </Button>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Exportar Texto:</strong> Genera un archivo de texto simple para importar en otras aplicaciones
                </p>
                <p>
                  <strong>Exportar PDF:</strong> Crea un archivo PDF profesional con gráficas y análisis completo
                </p>
                <p>
                  <strong>Importar Datos:</strong> Importa mediciones desde texto (solo fecha y peso necesarios)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ProgressImportModal open={showImportModal} onOpenChange={setShowImportModal} onImport={importProgress} />
    </div>
  )
}
