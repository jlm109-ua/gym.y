"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useWorkoutEdit } from "@/hooks/use-workout-edit"

const SESSION_TYPES = ["PUSH", "PULL", "LEG"] as const
const MUSCLE_TAGS = [
    "Pecho",
    "Espalda",
    "Hombros",
    "Bíceps",
    "Tríceps",
    "Cuádriceps",
    "Isquiotibiales",
    "Glúteos",
    "Pantorrillas",
    "Core",
]

interface EditWorkoutModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workoutId?: string
    currentSessionType?: "PUSH" | "PULL" | "LEG"
    currentMuscleTags?: string[]
    onSuccess: () => void
}

export function EditWorkoutModal({
    open,
    onOpenChange,
    workoutId,
    currentSessionType,
    currentMuscleTags,
    onSuccess,
}: EditWorkoutModalProps) {
    const [sessionType, setSessionType] = useState<string>(currentSessionType || "")
    const [muscleTags, setMuscleTags] = useState<string[]>(currentMuscleTags || [])
    const { updateWorkout, loading } = useWorkoutEdit()

    useEffect(() => {
        if (open) {
            setSessionType(currentSessionType || "")
            setMuscleTags(currentMuscleTags || [])
        }
    }, [open, currentSessionType, currentMuscleTags])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!sessionType || !workoutId) return

        try {
            await updateWorkout(workoutId, {
                session_type: sessionType as "PUSH" | "PULL" | "LEG",
                muscle_tags: muscleTags,
            })

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            // Error is handled by the hook
        }
    }

    const toggleMuscleTag = (tag: string) => {
        setMuscleTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar entrenamiento</DialogTitle>
                    <DialogDescription>Modifica el tipo de sesión y los grupos musculares del entrenamiento</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="session-type">Tipo de sesión</Label>
                        <Select value={sessionType} onValueChange={setSessionType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {SESSION_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Grupos musculares</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {MUSCLE_TAGS.map((tag) => (
                                <div key={tag} className="flex items-center space-x-2">
                                    <Checkbox id={tag} checked={muscleTags.includes(tag)} onCheckedChange={() => toggleMuscleTag(tag)} />
                                    <Label htmlFor={tag} className="text-sm">
                                        {tag}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!sessionType || loading}>
                            {loading ? "Guardando..." : "Guardar cambios"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
