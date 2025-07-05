"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, ChevronLeft, ChevronRight, Edit, Trash2, Dumbbell, Zap, GripVertical } from "lucide-react"
import { ExerciseModal } from "@/components/exercise-modal"
import { WorkoutModal } from "@/components/workout-modal"
import { EditWorkoutModal } from "@/components/edit-workout-modal"
import { useWorkout } from "@/hooks/use-workout"
import { useExercises } from "@/hooks/use-exercises"
import { useSuperset } from "@/hooks/use-superset"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

export default function DayPage() {
  const params = useParams()
  const router = useRouter()
  const date = params.date as string
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [editingExercise, setEditingExercise] = useState<any>(null)
  const [showEditWorkoutModal, setShowEditWorkoutModal] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const { workout, exercises, loading, createWorkout, updateWorkout, deleteExercise, refetch } = useWorkout(date)
  const { reorderExercises, loading: reorderLoading } = useExercises()
  const { toggleExerciseLink, updateMultipleExerciseLinks, loading: supersetLoading } = useSuperset()

  const navigateDate = (direction: "prev" | "next") => {
    const currentDate = new Date(date + "T12:00:00")
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1))
    const newDateString = newDate.toISOString().split("T")[0]
    router.push(`/day/${newDateString}`)
  }

  const handleAddExercise = () => {
    if (!workout) {
      setShowWorkoutModal(true)
    } else {
      setShowExerciseModal(true)
    }
  }

  const handleEditExercise = (exercise: any) => {
    setEditingExercise(exercise)
    setShowExerciseModal(true)
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este ejercicio?")) {
      await deleteExercise(exerciseId)
    }
  }

  const handleEditWorkout = () => {
    setShowEditWorkoutModal(true)
  }

  const handleToggleExerciseLink = async (exerciseId: string, currentLinkState: boolean) => {
    try {
      await toggleExerciseLink(exerciseId, currentLinkState)
      refetch()
    } catch (error) {
      // Error is handled by the hook
    }
  }

  // Helper function to find superset group for an exercise
  const findSupersetGroup = (targetIndex: number) => {
    const group = []
    const targetExercise = exercises[targetIndex]

    // If the target exercise is linked to previous, find the start of the superset
    let startIndex = targetIndex
    if (targetExercise.is_linked_to_previous) {
      while (startIndex > 0 && exercises[startIndex].is_linked_to_previous) {
        startIndex--
      }
    }

    // Add all exercises in the superset group
    group.push(startIndex)
    let nextIndex = startIndex + 1
    while (nextIndex < exercises.length && exercises[nextIndex].is_linked_to_previous) {
      group.push(nextIndex)
      nextIndex++
    }

    return group.length > 1 ? group : [targetIndex]
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", "")
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    try {
      // Find superset groups for both dragged and target exercises
      const draggedGroup = findSupersetGroup(draggedIndex)
      const targetGroup = findSupersetGroup(dropIndex)

      // Create new array with reordered exercises
      const newExercises = [...exercises]
      const updates = []

      // If dragged exercise is part of a superset, break the superset links
      if (draggedGroup.length > 1) {
        for (const idx of draggedGroup) {
          if (exercises[idx].is_linked_to_previous) {
            updates.push({
              id: exercises[idx].id,
              is_linked_to_previous: false,
            })
          }
        }
      }

      // If target position is part of a superset, break those links too
      if (targetGroup.length > 1 && !draggedGroup.includes(dropIndex)) {
        for (const idx of targetGroup) {
          if (exercises[idx].is_linked_to_previous) {
            updates.push({
              id: exercises[idx].id,
              is_linked_to_previous: false,
            })
          }
        }
      }

      // Update superset links first if needed
      if (updates.length > 0) {
        await updateMultipleExerciseLinks(updates)
      }

      // Remove dragged exercise from its current position
      const draggedExercise = newExercises[draggedIndex]
      newExercises.splice(draggedIndex, 1)

      // Adjust drop index if necessary (if we removed an item before the drop position)
      const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex

      // Insert at new position
      newExercises.splice(adjustedDropIndex, 0, draggedExercise)

      // Update positions in database
      await reorderExercises(newExercises)

      // Refresh to show updated order
      refetch()
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setDraggedIndex(null)
      setDragOverIndex(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const isInSuperset = (index: number) => {
    if (index === 0) return false
    const currentExercise = exercises[index]
    const nextExercise = exercises[index + 1]

    return currentExercise.is_linked_to_previous || (nextExercise && nextExercise.is_linked_to_previous)
  }

  const renderExerciseCard = (exercise: any, index: number) => {
    const isLinked = exercise.is_linked_to_previous
    const isNextLinked = index < exercises.length - 1 && exercises[index + 1].is_linked_to_previous
    const inSuperset = isInSuperset(index)
    const canLink = index > 0
    const isDragging = draggedIndex === index
    const isDragOver = dragOverIndex === index

    return (
      <div key={exercise.id} className="relative">
        {/* Connection line for linked exercises */}
        {isLinked && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-orange-400 z-10"></div>
        )}

        <Card
          className={cn(
            "transition-all duration-200 cursor-move",
            (inSuperset || isLinked || isNextLinked) && "border-orange-400 bg-secondary border-2",
            isDragging && "opacity-50 scale-95",
            isDragOver && "border-primary border-2 bg-primary/5",
            reorderLoading && "pointer-events-none opacity-75",
          )}
          draggable={!reorderLoading}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                {(inSuperset || isLinked || isNextLinked) && <Zap className="h-4 w-4 text-orange-500" />}
                <CardTitle className={cn("text-lg", (inSuperset || isLinked || isNextLinked) && "text-orange-700")}>
                  {exercise.name}
                </CardTitle>
              </div>
              <div className="flex gap-1">
                {canLink && (
                  <Button
                    variant={isLinked ? "default" : "ghost"}
                    size="icon"
                    onClick={() => handleToggleExerciseLink(exercise.id, isLinked)}
                    disabled={supersetLoading || reorderLoading}
                    className={cn(
                      "h-8 w-8",
                      isLinked ? "bg-orange-500 hover:bg-orange-600 text-white" : "hover:bg-orange-100 text-orange-600",
                    )}
                    title={isLinked ? "Desconectar de superserie" : "Conectar con ejercicio anterior"}
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditExercise(exercise)}
                  className="h-8 w-8"
                  disabled={reorderLoading}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteExercise(exercise.id)}
                  className="h-8 w-8"
                  disabled={reorderLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Series:</span> {exercise.sets}
              </div>
              <div>
                <span className="font-medium">Peso:</span> {exercise.weights}
              </div>
            </div>
            {exercise.notes && exercise.notes !== "SUPERSET" && (
              <div className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium">Notas:</span> {exercise.notes}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connection line for next linked exercise */}
        {isNextLinked && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-orange-400 z-10"></div>
        )}
      </div>
    )
  }

  const renderSkeleton = () => (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
        <div className="text-center">
          <div className="w-48 h-8 bg-muted rounded animate-pulse mb-2"></div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-16 h-6 bg-muted rounded animate-pulse"></div>
            <div className="w-20 h-6 bg-muted rounded animate-pulse"></div>
            <div className="w-24 h-6 bg-muted rounded animate-pulse"></div>
            <div className="w-8 h-6 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
        <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
      </div>

      {/* Exercise cards skeleton */}
      <div className="space-y-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted rounded"></div>
                  <div className="w-4 h-4 bg-muted rounded"></div>
                  <div className="w-32 h-6 bg-muted rounded"></div>
                  <div className="w-16 h-5 bg-muted rounded"></div>
                </div>
                <div className="flex gap-1">
                  <div className="w-8 h-8 bg-muted rounded"></div>
                  <div className="w-8 h-8 bg-muted rounded"></div>
                  <div className="w-8 h-8 bg-muted rounded"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="w-16 h-4 bg-muted rounded"></div>
                  <div className="w-12 h-4 bg-muted rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-16 h-4 bg-muted rounded"></div>
                  <div className="w-20 h-4 bg-muted rounded"></div>
                </div>
              </div>
              {index === 1 && (
                <div className="mt-3 space-y-1">
                  <div className="w-12 h-4 bg-muted rounded"></div>
                  <div className="w-40 h-4 bg-muted rounded"></div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Superseries info skeleton */}
      <div className="mt-6 p-4 bg-muted/20 border rounded-lg animate-pulse">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-muted rounded"></div>
          <div className="w-32 h-4 bg-muted rounded"></div>
        </div>
        <div className="w-full h-3 bg-muted rounded"></div>
        <div className="w-3/4 h-3 bg-muted rounded mt-1"></div>
      </div>

      {/* Floating button skeleton */}
      <div className="fixed bottom-20 right-4 md:bottom-4 w-14 h-14 bg-muted rounded-full animate-pulse"></div>
    </div>
  )

  if (loading) {
    return renderSkeleton()
  }

  const linkedExercisesCount = exercises.filter((ex) => ex.is_linked_to_previous).length

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigateDate("prev")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{formatDate(date)}</h1>
          {workout && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="secondary">{workout.session_type}</Badge>
              {workout.muscle_tags?.map((tag: string) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={handleEditWorkout}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigateDate("next")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Workout content */}
      {!workout ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay entrenamiento para este día</p>
              </div>
              <Button onClick={() => setShowWorkoutModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear entrenamiento
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {exercises.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <p className="text-muted-foreground mb-4">No hay ejercicios añadidos</p>
                <Button onClick={handleAddExercise}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir ejercicio
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {exercises.map((exercise: any, index: number) => renderExerciseCard(exercise, index))}

              {/* Superseries info */}
              {linkedExercisesCount > 0 && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {linkedExercisesCount} ejercicio{linkedExercisesCount > 1 ? "s" : ""} en superserie
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Los ejercicios conectados se realizan uno tras otro sin descanso. Al mover un ejercicio de
                    superserie se desconectará automáticamente.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      {workout && (
        <Button
          className="fixed bottom-20 right-4 md:bottom-4 h-14 w-14 rounded-full shadow-lg"
          size="icon"
          onClick={handleAddExercise}
          disabled={reorderLoading}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Modals */}
      <WorkoutModal
        open={showWorkoutModal}
        onOpenChange={setShowWorkoutModal}
        date={date}
        onSuccess={(newWorkout) => {
          setShowWorkoutModal(false)
          createWorkout(newWorkout)
        }}
      />

      <ExerciseModal
        open={showExerciseModal}
        onOpenChange={(open) => {
          setShowExerciseModal(open)
          if (!open) setEditingExercise(null)
        }}
        workoutId={workout?.id}
        sessionType={workout?.session_type}
        exercise={editingExercise}
        onSuccess={() => {
          setShowExerciseModal(false)
          setEditingExercise(null)
          refetch()
        }}
      />

      <EditWorkoutModal
        open={showEditWorkoutModal}
        onOpenChange={setShowEditWorkoutModal}
        workoutId={workout?.id}
        currentSessionType={workout?.session_type}
        currentMuscleTags={workout?.muscle_tags}
        onSuccess={() => {
          setShowEditWorkoutModal(false)
          window.location.reload()
        }}
      />
    </div>
  )
}
