"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DEFAULT_USER_ID } from "@/lib/supabase"

const SESSION_TYPES = ["PUSH", "PULL", "LEG"] as const
const MUSCLE_TAGS = ["Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Femoral", "Glúteos", "Core"]

interface WorkoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string
  onSuccess: (workout: any) => void
}

export function WorkoutModal({ open, onOpenChange, date, onSuccess }: WorkoutModalProps) {
  const [sessionType, setSessionType] = useState<string>("")
  const [muscleTags, setMuscleTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionType) return

    setLoading(true)
    try {
      const workout = {
        date,
        session_type: sessionType,
        muscle_tags: muscleTags,
        user_id: DEFAULT_USER_ID,
      }

      onSuccess(workout)
      setSessionType("")
      setMuscleTags([])
    } catch (error) {
      console.error("Error creating workout:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleMuscleTag = (tag: string) => {
    setMuscleTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear entrenamiento</DialogTitle>
          <DialogDescription>
            Configura el tipo de sesión y los grupos musculares para tu entrenamiento
          </DialogDescription>
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
              {loading ? "Creando..." : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
