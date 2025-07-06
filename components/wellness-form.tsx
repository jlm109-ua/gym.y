"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import type { WellnessEntry } from "@/hooks/use-wellness"

interface WellnessFormProps {
    onSubmit: (entry: Omit<WellnessEntry, "id" | "created_at" | "user_id">) => Promise<void>
    initialData?: WellnessEntry
    isEditing?: boolean
    onCancel?: () => void
}

const getEnergyLabel = (value: number) => {
    if (value <= 2) return "Muy baja"
    if (value <= 4) return "Baja"
    if (value <= 6) return "Moderada"
    if (value <= 8) return "Alta"
    return "Muy alta"
}

const getStressLabel = (value: number) => {
    if (value <= 2) return "Muy bajo"
    if (value <= 4) return "Bajo"
    if (value <= 6) return "Moderado"
    if (value <= 8) return "Alto"
    return "Muy alto"
}

const getSleepHoursLabel = (value: number) => {
    if (value <= 4) return "Muy poco"
    if (value <= 6) return "Poco"
    if (value <= 8) return "Normal"
    if (value <= 10) return "Bastante"
    return "Mucho"
}

const getQualityLabel = (value: number) => {
    if (value <= 2) return "Muy mala"
    if (value <= 4) return "Mala"
    if (value <= 6) return "Regular"
    if (value <= 8) return "Buena"
    return "Excelente"
}

const getSorenessLabel = (value: number) => {
    if (value <= 2) return "Ninguno"
    if (value <= 4) return "Leve"
    if (value <= 6) return "Moderado"
    if (value <= 8) return "Intenso"
    return "Muy intenso"
}

const getMotivationLabel = (value: number) => {
    if (value <= 2) return "Muy baja"
    if (value <= 4) return "Baja"
    if (value <= 6) return "Moderada"
    if (value <= 8) return "Alta"
    return "Muy alta"
}

export function WellnessForm({ onSubmit, initialData, isEditing = false, onCancel }: WellnessFormProps) {
    const [formData, setFormData] = useState({
        date: initialData?.date || new Date().toISOString().split("T")[0],
        energy_level: initialData?.energy_level || 5,
        stress_level: initialData?.stress_level || 5,
        sleep_hours: initialData?.sleep_hours || 8.0,
        sleep_quality: initialData?.sleep_quality || 5,
        muscle_soreness: initialData?.muscle_soreness || 5,
        motivation_level: initialData?.motivation_level || 5,
        notes: initialData?.notes || "",
    })

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (initialData) {
            setFormData({
                date: initialData.date,
                energy_level: initialData.energy_level,
                stress_level: initialData.stress_level,
                sleep_hours: initialData.sleep_hours,
                sleep_quality: initialData.sleep_quality,
                muscle_soreness: initialData.muscle_soreness,
                motivation_level: initialData.motivation_level,
                notes: initialData.notes || "",
            })
        }
    }, [initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await onSubmit(formData)
            if (!isEditing) {
                // Reset form after successful creation
                setFormData({
                    date: new Date().toISOString().split("T")[0],
                    energy_level: 5,
                    stress_level: 5,
                    sleep_hours: 8.0,
                    sleep_quality: 5,
                    muscle_soreness: 5,
                    motivation_level: 5,
                    notes: "",
                })
            }
        } catch (error) {
            console.error("Error submitting wellness entry:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{isEditing ? "Editar Registro" : "Nuevo Registro de Bienestar"}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="date">Fecha</Label>
                        <input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>
                                Nivel de Energía: {formData.energy_level} - {getEnergyLabel(formData.energy_level)}
                            </Label>
                            <Slider
                                value={[formData.energy_level]}
                                onValueChange={(value) => setFormData({ ...formData, energy_level: value[0] })}
                                max={10}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Nivel de Estrés: {formData.stress_level} - {getStressLabel(formData.stress_level)}
                            </Label>
                            <Slider
                                value={[formData.stress_level]}
                                onValueChange={(value) => setFormData({ ...formData, stress_level: value[0] })}
                                max={10}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Horas de Sueño: {formData.sleep_hours.toFixed(1)}h - {getSleepHoursLabel(formData.sleep_hours)}
                            </Label>
                            <Slider
                                value={[formData.sleep_hours]}
                                onValueChange={(value) => setFormData({ ...formData, sleep_hours: value[0] })}
                                max={14}
                                min={0}
                                step={0.5}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Calidad del Sueño: {formData.sleep_quality} - {getQualityLabel(formData.sleep_quality)}
                            </Label>
                            <Slider
                                value={[formData.sleep_quality]}
                                onValueChange={(value) => setFormData({ ...formData, sleep_quality: value[0] })}
                                max={10}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Dolor Muscular: {formData.muscle_soreness} - {getSorenessLabel(formData.muscle_soreness)}
                            </Label>
                            <Slider
                                value={[formData.muscle_soreness]}
                                onValueChange={(value) => setFormData({ ...formData, muscle_soreness: value[0] })}
                                max={10}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Nivel de Motivación: {formData.motivation_level} - {getMotivationLabel(formData.motivation_level)}
                            </Label>
                            <Slider
                                value={[formData.motivation_level]}
                                onValueChange={(value) => setFormData({ ...formData, motivation_level: value[0] })}
                                max={10}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas (opcional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Añade cualquier observación adicional..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={loading}>
                            {loading ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
                        </Button>
                        {isEditing && onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel}>
                                Cancelar
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
