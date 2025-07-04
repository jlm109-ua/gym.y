"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Plus, Edit, Save, X, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import { useProgress } from "@/hooks/use-progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function ProgressPage() {
  const {
    entries,
    loading,
    error,
    createProgress,
    updateProgress,
    deleteProgress,
    getCurrentWeight,
    getCurrentHeight,
    getBMI,
    getBMICategory,
    getWeightChange,
  } = useProgress()

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    weight_kg: "",
    height_cm: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const chartData = entries.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    }),
    peso: entry.weight_kg,
    altura: entry.height_cm,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.weight_kg && !formData.height_cm) {
      return
    }

    setSubmitting(true)
    try {
      const progressData = {
        date: formData.date,
        weight_kg: formData.weight_kg ? Number.parseFloat(formData.weight_kg) : undefined,
        height_cm: formData.height_cm ? Number.parseFloat(formData.height_cm) : undefined,
      }

      if (editingId) {
        await updateProgress(editingId, {
          weight_kg: progressData.weight_kg,
          height_cm: progressData.height_cm,
        })
        setEditingId(null)
      } else {
        await createProgress(progressData)
      }

      setFormData({
        date: new Date().toISOString().split("T")[0],
        weight_kg: "",
        height_cm: "",
      })
      setShowAddForm(false)
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (entry: any) => {
    setFormData({
      date: entry.date,
      weight_kg: entry.weight_kg?.toString() || "",
      height_cm: entry.height_cm?.toString() || "",
    })
    setEditingId(entry.id)
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta medición?")) {
      await deleteProgress(id)
    }
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingId(null)
    setFormData({
      date: new Date().toISOString().split("T")[0],
      weight_kg: "",
      height_cm: "",
    })
  }

  const currentWeight = getCurrentWeight()
  const currentHeight = getCurrentHeight()
  const bmi = getBMI()
  const bmiCategory = getBMICategory(bmi)
  const weightChange = getWeightChange()

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-muted rounded"></div>
            <div className="h-80 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Error al cargar el progreso</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Progreso Físico</h1>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Añadir medición
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peso Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWeight ? `${currentWeight} kg` : "N/A"}</div>
            {weightChange && (
              <div className={`flex items-center text-xs mt-1 ${weightChange > 0 ? "text-red-500" : "text-green-500"}`}>
                {weightChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(weightChange).toFixed(1)} kg
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Altura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentHeight ? `${currentHeight} cm` : "N/A"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">IMC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bmi || "N/A"}</div>
            {bmiCategory && <div className="text-xs text-muted-foreground mt-1">{bmiCategory}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Mediciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>
      </div>

      {entries.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay mediciones registradas</p>
                <p className="text-sm">Añade tu primera medición para comenzar a hacer seguimiento</p>
              </div>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir primera medición
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolución del Peso</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.some((d) => d.peso) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.filter((d) => d.peso)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={["dataMin - 1", "dataMax + 1"]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="peso"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
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
                <CardTitle>Historial de Mediciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {entries
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg border">
                        <div>
                          <div className="font-medium">{new Date(entry.date).toLocaleDateString("es-ES")}</div>
                          <div className="text-sm text-muted-foreground">
                            {entry.weight_kg && `${entry.weight_kg} kg`}
                            {entry.weight_kg && entry.height_cm && " • "}
                            {entry.height_cm && `${entry.height_cm} cm`}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Add/Edit Form Modal */}
      <Dialog
        open={showAddForm}
        onOpenChange={(open) => {
          if (!open) handleCancel()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar medición" : "Añadir medición"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Modifica los datos de la medición" : "Registra una nueva medición de tu progreso físico"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="weight">Peso</Label>
                <div className="relative">
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    max="500"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData((prev) => ({ ...prev, weight_kg: e.target.value }))}
                    placeholder="75.5"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-sm text-muted-foreground">kg</span>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="height">Altura</Label>
                <div className="relative">
                  <Input
                    id="height"
                    type="number"
                    min="0"
                    max="300"
                    value={formData.height_cm}
                    onChange={(e) => setFormData((prev) => ({ ...prev, height_cm: e.target.value }))}
                    placeholder="175"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-sm text-muted-foreground">cm</span>
                  </div>
                </div>
              </div>
            </div>

            {!formData.weight_kg && !formData.height_cm && (
              <p className="text-sm text-muted-foreground">Debes proporcionar al menos el peso o la altura</p>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit" disabled={(!formData.weight_kg && !formData.height_cm) || submitting}>
                <Save className="h-4 w-4 mr-2" />
                {submitting ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
