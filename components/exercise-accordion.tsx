"use client"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Edit, Trash2, Zap, TrendingUp, Clock, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent } from "@/components/ui/card"
import { ExerciseManagerModal } from "@/components/exercise-manager-modal"
import { supabase } from "@/lib/supabase"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"

const SESSION_TYPE_COLORS = {
    PUSH: "bg-red-500",
    PULL: "bg-blue-500",
    LEG: "bg-green-500",
}

interface ExerciseInstance {
    id: string
    name: string
    sets: string
    weights: string
    notes?: string
    position: number
    is_linked_to_previous: boolean
    created_at: string
    workout: {
        id: string
        date: string
        session_type: "PUSH" | "PULL" | "LEG"
        muscle_tags: string[]
    }
}

interface UniqueExercise extends ExerciseInstance {
    frequency: number
    lastUsed: string
    sessionTypes: string[]
    instances?: ExerciseInstance[]
}

interface ExerciseAccordionProps {
    exercise: UniqueExercise
    onUpdateExercise: (id: string, data: any) => Promise<any>
    onDeleteExercise: (id: string) => Promise<void>
}

export function ExerciseAccordion({ exercise, onUpdateExercise, onDeleteExercise }: ExerciseAccordionProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [instances, setInstances] = useState<ExerciseInstance[]>([])
    const [loading, setLoading] = useState(false)
    const [editingInstance, setEditingInstance] = useState<ExerciseInstance | null>(null)
    const { toast } = useToast()

    // Load all instances when accordion opens
    useEffect(() => {
        if (isOpen && instances.length === 0) {
            loadInstances()
        }
    }, [isOpen])

    const loadInstances = async () => {
        try {
            setLoading(true)

            const { data: exercisesData, error } = await supabase
                .from("exercises")
                .select(`
          id,
          name,
          sets,
          weights,
          notes,
          position,
          is_linked_to_previous,
          created_at,
          workout:workouts!inner(
            id,
            date,
            session_type,
            muscle_tags,
            user_id
          )
        `)
                .eq("workout.user_id", DEFAULT_USER_ID)
                .ilike("name", exercise.name) // Case insensitive match
                .order("created_at", { ascending: false })

            if (error) throw error

            setInstances(
                (exercisesData || []).map((item: any) => ({
                    ...item,
                    workout: Array.isArray(item.workout) ? item.workout[0] : item.workout,
                }))
            )
        } catch (error) {
            console.error("Error loading exercise instances:", error)
            toast({
                title: "Error",
                description: "No se pudieron cargar las instancias del ejercicio",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateInstance = async (instanceData: any) => {
        if (!editingInstance) return

        try {
            await onUpdateExercise(editingInstance.id, instanceData)

            // Reload instances to reflect changes
            await loadInstances()
            setEditingInstance(null)
        } catch (error) {
            // Error is handled by the parent hook
        }
    }

    const handleDeleteInstance = async (instanceId: string, instanceDate: string) => {
        if (
            confirm(
                `¿Estás seguro de que quieres eliminar esta instancia de "${exercise.name}" del ${new Date(instanceDate).toLocaleDateString("es-ES")}?`,
            )
        ) {
            try {
                await onDeleteExercise(instanceId)

                // Remove from local state
                setInstances((prev) => prev.filter((inst) => inst.id !== instanceId))

                // If no instances left, close accordion
                if (instances.length <= 1) {
                    setIsOpen(false)
                }
            } catch (error) {
                // Error is handled by the parent hook
            }
        }
    }

    return (
        <>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <Card className="hover:bg-muted/50 transition-colors">
                    <CollapsibleTrigger asChild>
                        <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 cursor-pointer">
                            {/* Main content */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Expand/collapse icon */}
                                <div className="flex-shrink-0">
                                    {isOpen ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>

                                {/* Session type indicators */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {exercise.sessionTypes.slice(0, 3).map((type, index) => (
                                        <div
                                            key={`${type}-${index}`}
                                            className={`w-3 h-3 rounded-full ${SESSION_TYPE_COLORS[type as keyof typeof SESSION_TYPE_COLORS]}`}
                                            title={type}
                                        />
                                    ))}
                                    {exercise.sessionTypes.length > 3 && (
                                        <span className="text-xs text-muted-foreground">+{exercise.sessionTypes.length - 3}</span>
                                    )}
                                </div>

                                {/* Superset indicator */}
                                {exercise.is_linked_to_previous && <Zap className="h-3 w-3 text-orange-500 flex-shrink-0" />}

                                {/* Exercise info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{exercise.name}</div>

                                    {/* Mobile: Stack info vertically */}
                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-sm text-muted-foreground">
                                        <span className="truncate">
                                            {exercise.sets} • {exercise.weights}
                                        </span>
                                        <div className="flex items-center gap-3 text-xs">
                                            <div className="flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3 flex-shrink-0" />
                                                <span>{exercise.frequency}x</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3 flex-shrink-0" />
                                                <span>
                                                    {new Date(exercise.lastUsed).toLocaleDateString("es-ES", {
                                                        day: "numeric",
                                                        month: "short",
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Badges and summary */}
                            <div className="flex items-center justify-between md:justify-end gap-2 flex-shrink-0">
                                {/* Badges - responsive */}
                                <div className="flex items-center gap-1 flex-wrap">
                                    {exercise.sessionTypes.slice(0, 2).map((type) => (
                                        <Badge key={type} variant="outline" className="text-xs">
                                            {type}
                                        </Badge>
                                    ))}
                                    {exercise.sessionTypes.length > 2 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{exercise.sessionTypes.length - 2}
                                        </Badge>
                                    )}
                                    {exercise.is_linked_to_previous && (
                                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                                            SS
                                        </Badge>
                                    )}
                                </div>

                                {/* Instance count */}
                                <Badge variant="secondary" className="text-xs">
                                    {exercise.frequency} instancias
                                </Badge>
                            </div>
                        </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <CardContent className="pt-0 pb-3">
                            <div className="border-t pt-3">
                                {loading ? (
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="animate-pulse flex items-center gap-3 p-2 border rounded">
                                                <div className="w-16 h-4 bg-muted rounded"></div>
                                                <div className="flex-1">
                                                    <div className="w-32 h-3 bg-muted rounded mb-1"></div>
                                                    <div className="w-24 h-3 bg-muted rounded"></div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <div className="w-6 h-6 bg-muted rounded"></div>
                                                    <div className="w-6 h-6 bg-muted rounded"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : instances.length > 0 ? (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        <div className="text-sm font-medium text-muted-foreground mb-2">
                                            Todas las instancias ({instances.length}):
                                        </div>
                                        {instances.map((instance, index) => (
                                            <div
                                                key={instance.id}
                                                className="flex items-center gap-3 p-2 border rounded hover:bg-muted/30 transition-colors"
                                            >
                                                {/* Date and session info */}
                                                <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    <div className="text-xs">
                                                        <div className="font-medium">
                                                            {new Date(instance.workout.date).toLocaleDateString("es-ES", {
                                                                day: "2-digit",
                                                                month: "short",
                                                            })}
                                                        </div>
                                                        <div className="text-muted-foreground">{instance.workout.session_type}</div>
                                                    </div>
                                                </div>

                                                {/* Exercise details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm">
                                                        <span className="font-medium">{instance.sets}</span>
                                                        {instance.weights && (
                                                            <>
                                                                <span className="text-muted-foreground"> • </span>
                                                                <span>{instance.weights}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {instance.notes && instance.notes !== "SUPERSET" && (
                                                        <div className="text-xs text-muted-foreground truncate">{instance.notes}</div>
                                                    )}
                                                </div>

                                                {/* Indicators */}
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {instance.is_linked_to_previous && (
                                                        <Zap className="h-3 w-3 text-orange-500" />
                                                    )}
                                                    <div
                                                        className={`w-2 h-2 rounded-full ${SESSION_TYPE_COLORS[instance.workout.session_type as keyof typeof SESSION_TYPE_COLORS]
                                                            }`}
                                                        title={instance.workout.session_type}
                                                    />
                                                </div>

                                                {/* Action buttons */}
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setEditingInstance(instance)
                                                        }}
                                                        className="h-6 w-6"
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteInstance(instance.id, instance.workout.date)
                                                        }}
                                                        className="h-6 w-6"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground text-sm">
                                        No se pudieron cargar las instancias
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            {/* Edit Modal */}
            {editingInstance && (
                <ExerciseManagerModal
                    open={!!editingInstance}
                    onOpenChange={(open) => !open && setEditingInstance(null)}
                    exercise={editingInstance}
                    onSuccess={handleUpdateInstance}
                />
            )}
        </>
    )
}
