"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ExerciseManagerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    exercise?: any
    onSuccess: (instanceData: any) => void | Promise<void>
}

export function ExerciseManagerModal({ open, onOpenChange, exercise, onSuccess }: ExerciseManagerModalProps) {
    const [name, setName] = useState("")
    const [series, setSeries] = useState("")
    const [repetitions, setRepetitions] = useState("")
    const [isFailure, setIsFailure] = useState(false)
    const [weights, setWeights] = useState("")
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (exercise) {
            setName(exercise.name || "")

            // Parse existing sets format (e.g., "4x12" or "4xAl Fallo")
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

            // Parse weights (remove "kg" suffix if present)
            const cleanWeights = exercise.weights?.replace(/kg/g, "").trim() || ""
            setWeights(cleanWeights)
            setNotes(exercise.notes === "SUPERSET" ? "" : exercise.notes || "")
        }
    }, [exercise])

    const handleRepetitionsChange = (value: string) => {
        if (value === "failure") {
            setIsFailure(true)
            setRepetitions("")
        } else {
            setIsFailure(false)
            setRepetitions(value)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !series || !exercise) return

        setLoading(true)
        try {
            // Format sets as "4x12", "4xAl Fallo", or just series if no repetitions
            let formattedSets = series
            if (isFailure) {
                formattedSets = `${series}xAl Fallo`
            } else if (repetitions) {
                formattedSets = `${series}x${repetitions}`
            }

            // Format weights with "kg" suffix if not empty
            const formattedWeights = weights ? `${weights}kg` : ""

            const exerciseData = {
                name,
                sets: formattedSets,
                weights: formattedWeights,
                notes: notes || null,
            }

            // This will be handled by the parent component
            onSuccess(exerciseData)
        } catch (error) {
            console.error("Error saving exercise:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar ejercicio</DialogTitle>
                    <DialogDescription>Modifica los datos del ejercicio desde el gestor de ejercicios</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Exercise Name */}
                    <div>
                        <Label htmlFor="exercise-name">Nombre del ejercicio</Label>
                        <Input
                            id="exercise-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Press banca"
                            required
                        />
                    </div>

                    {/* Sets and Reps */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="series">Series</Label>
                            <Input
                                id="series"
                                type="number"
                                min="1"
                                value={series}
                                onChange={(e) => setSeries(e.target.value)}
                                placeholder="4"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="repetitions">Repeticiones</Label>
                            <Select value={isFailure ? "failure" : repetitions} onValueChange={handleRepetitionsChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="failure">Al Fallo</SelectItem>
                                    <SelectItem value="6">6 reps</SelectItem>
                                    <SelectItem value="8">8 reps</SelectItem>
                                    <SelectItem value="10">10 reps</SelectItem>
                                    <SelectItem value="12">12 reps</SelectItem>
                                    <SelectItem value="15">15 reps</SelectItem>
                                    <SelectItem value="20">20 reps</SelectItem>
                                </SelectContent>
                            </Select>
                            {!isFailure && (
                                <Input
                                    type="number"
                                    min="1"
                                    value={repetitions}
                                    onChange={(e) => setRepetitions(e.target.value)}
                                    placeholder="O escribe número..."
                                    className="mt-2"
                                />
                            )}
                            <div className="text-right mt-1">
                                <span className="text-sm text-muted-foreground">
                                    {series || "0"}x{isFailure ? "Al Fallo" : repetitions || "0"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Weight */}
                    <div>
                        <Label htmlFor="weights">Peso por serie</Label>
                        <div className="relative">
                            <Input
                                id="weights"
                                value={weights}
                                onChange={(e) => setWeights(e.target.value)}
                                placeholder="40,45,50,45"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-sm text-muted-foreground">kg</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Separa los pesos con comas. Ej: 40,45,50,45</p>
                    </div>

                    {/* Notes */}
                    <div>
                        <Label htmlFor="notes">Notas (opcional)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notas adicionales..."
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!name || !series || loading}>
                            {loading ? "Guardando..." : "Actualizar"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
