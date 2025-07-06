"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { WellnessForm } from "@/components/wellness-form"
import { useWellness } from "@/hooks/use-wellness"
import { Heart, Activity, Moon, Brain, Zap, Target, Edit, Trash2, Plus } from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from "recharts"

export default function WellnessPage() {
    const { entries, stats, loading, addEntry, updateEntry, deleteEntry } = useWellness()
    const [editingEntry, setEditingEntry] = useState<any>(null)
    const [activeTab, setActiveTab] = useState("overview")

    const handleSubmit = async (data: any) => {
        try {
            if (editingEntry) {
                await updateEntry(editingEntry.id, data)
                setEditingEntry(null)
                setActiveTab("overview")
            } else {
                await addEntry(data)
            }
        } catch (error) {
            console.error("Error submitting wellness entry:", error)
            throw error
        }
    }

    const handleEdit = (entry: any) => {
        setEditingEntry(entry)
        setActiveTab("form")
    }

    const handleDelete = async (id: number) => {
        if (confirm("¿Estás seguro de que quieres eliminar este registro?")) {
            await deleteEntry(id)
        }
    }

    const handleCancelEdit = () => {
        setEditingEntry(null)
        setActiveTab("overview")
    }

    // Prepare chart data
    const chartData = entries
        .slice(0, 14)
        .reverse()
        .map((entry) => ({
            date: new Date(entry.date).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
            energia: entry.energy_level,
            estres: entry.stress_level,
            sueño: entry.sleep_hours,
            calidad: entry.sleep_quality,
            dolor: entry.muscle_soreness,
            motivacion: entry.motivation_level,
        }))

    const radarData = stats
        ? [
            {
                metric: "Energía",
                value: stats.avgEnergy,
                fullMark: 10,
            },
            {
                metric: "Motivación",
                value: stats.avgMotivation,
                fullMark: 10,
            },
            {
                metric: "Calidad Sueño",
                value: stats.avgSleepQuality,
                fullMark: 10,
            },
            {
                metric: "Horas Sueño",
                value: (stats.avgSleepHours / 14) * 10, // Normalize to 0-10 scale
                fullMark: 10,
            },
            {
                metric: "Dolor (inv)",
                value: 10 - stats.avgMuscleSoreness, // Invert so higher is better
                fullMark: 10,
            },
            {
                metric: "Estrés (inv)",
                value: 10 - stats.avgStress, // Invert so higher is better
                fullMark: 10,
            },
        ]
        : []

    if (loading) {
        return (
            <div className="container mx-auto p-4 pb-20 md:pb-4">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Bienestar</h1>
                    <p className="text-muted-foreground">Registra y monitorea tu bienestar diario</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <div className="h-4 bg-muted rounded animate-pulse" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                                <div className="h-3 bg-muted rounded animate-pulse" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <div className="h-6 bg-muted rounded animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 bg-muted rounded animate-pulse" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <div className="h-6 bg-muted rounded animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 bg-muted rounded animate-pulse" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 pb-20 md:pb-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Bienestar</h1>
                <p className="text-muted-foreground">Registra y monitorea tu bienestar diario</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="form">
                        {editingEntry ? "Editar" : "Registrar"}
                        {!editingEntry && <Plus className="ml-2 h-4 w-4" />}
                    </TabsTrigger>
                    <TabsTrigger value="history">Historial</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Energía</CardTitle>
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.avgEnergy}</div>
                                    <p className="text-xs text-muted-foreground">Promedio</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Estrés</CardTitle>
                                    <Brain className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.avgStress}</div>
                                    <p className="text-xs text-muted-foreground">Promedio</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Sueño</CardTitle>
                                    <Moon className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.avgSleepHours}h</div>
                                    <p className="text-xs text-muted-foreground">Promedio</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Calidad</CardTitle>
                                    <Activity className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.avgSleepQuality}</div>
                                    <p className="text-xs text-muted-foreground">Sueño</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Dolor</CardTitle>
                                    <Heart className="h-4 w-4 text-orange-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.avgMuscleSoreness}</div>
                                    <p className="text-xs text-muted-foreground">Muscular</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Motivación</CardTitle>
                                    <Target className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.avgMotivation}</div>
                                    <p className="text-xs text-muted-foreground">Promedio</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Charts */}
                    {chartData.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tendencias (14 días)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis domain={[0, 14]} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="energia" stroke="#eab308" strokeWidth={2} name="Energía" />
                                            <Line type="monotone" dataKey="motivacion" stroke="#8b5cf6" strokeWidth={2} name="Motivación" />
                                            <Line type="monotone" dataKey="calidad" stroke="#10b981" strokeWidth={2} name="Calidad Sueño" />
                                            <Line type="monotone" dataKey="sueño" stroke="#3b82f6" strokeWidth={2} name="Horas Sueño" />
                                            <Line type="monotone" dataKey="estres" stroke="#ef4444" strokeWidth={2} name="Estrés" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Perfil de Bienestar</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RadarChart data={radarData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="metric" />
                                            <PolarRadiusAxis angle={90} domain={[0, 10]} />
                                            <Radar
                                                name="Bienestar"
                                                dataKey="value"
                                                stroke="#8884d8"
                                                fill="#8884d8"
                                                fillOpacity={0.3}
                                                strokeWidth={2}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {entries.length === 0 && (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No hay registros de bienestar</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Comienza registrando tu bienestar diario para ver tendencias y análisis.
                                </p>
                                <Button onClick={() => setActiveTab("form")}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Crear primer registro
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="form">
                    <WellnessForm
                        onSubmit={handleSubmit}
                        initialData={editingEntry}
                        isEditing={!!editingEntry}
                        onCancel={editingEntry ? handleCancelEdit : undefined}
                    />
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    {entries.length > 0 ? (
                        <div className="space-y-4">
                            {entries.map((entry) => (
                                <Card key={entry.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">
                                                {new Date(entry.date).toLocaleDateString("es-ES", {
                                                    weekday: "long",
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </CardTitle>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(entry)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleDelete(entry.id!)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                                            <div className="flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-yellow-500" />
                                                <span className="text-sm">Energía:</span>
                                                <Badge variant="outline">{entry.energy_level}/10</Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Brain className="h-4 w-4 text-red-500" />
                                                <span className="text-sm">Estrés:</span>
                                                <Badge variant="outline">{entry.stress_level}/10</Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Moon className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm">Sueño:</span>
                                                <Badge variant="outline">{entry.sleep_hours}h</Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-green-500" />
                                                <span className="text-sm">Calidad:</span>
                                                <Badge variant="outline">{entry.sleep_quality}/10</Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Heart className="h-4 w-4 text-orange-500" />
                                                <span className="text-sm">Dolor:</span>
                                                <Badge variant="outline">{entry.muscle_soreness}/10</Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Target className="h-4 w-4 text-purple-500" />
                                                <span className="text-sm">Motivación:</span>
                                                <Badge variant="outline">{entry.motivation_level}/10</Badge>
                                            </div>
                                        </div>
                                        {entry.notes && (
                                            <div className="mt-4 p-3 bg-muted rounded-md">
                                                <p className="text-sm">{entry.notes}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No hay registros</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Crea tu primer registro de bienestar para comenzar.
                                </p>
                                <Button onClick={() => setActiveTab("form")}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Crear registro
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
