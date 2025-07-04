"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function useSuperset() {
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const toggleExerciseLink = async (exerciseId: string, currentLinkState: boolean) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from("exercises")
                .update({ is_linked_to_previous: !currentLinkState })
                .eq("id", exerciseId)

            if (error) {
                throw error
            }

            return !currentLinkState
        } catch (error) {
            console.error("Error toggling exercise link:", error)
            toast({
                title: "Error",
                description: "No se pudo actualizar la superserie",
                variant: "destructive",
            })
            throw error
        } finally {
            setLoading(false)
        }
    }

    const updateMultipleExerciseLinks = async (updates: Array<{ id: string; is_linked_to_previous: boolean }>) => {
        setLoading(true)
        try {
            const promises = updates.map(({ id, is_linked_to_previous }) =>
                supabase.from("exercises").update({ is_linked_to_previous }).eq("id", id),
            )

            const results = await Promise.all(promises)

            // Check if any update failed
            const errors = results.filter((result) => result.error)
            if (errors.length > 0) {
                throw new Error(`Failed to update ${errors.length} exercises`)
            }

            return true
        } catch (error) {
            console.error("Error updating multiple exercise links:", error)
            toast({
                title: "Error",
                description: "No se pudieron actualizar las superseries",
                variant: "destructive",
            })
            throw error
        } finally {
            setLoading(false)
        }
    }

    return {
        toggleExerciseLink,
        updateMultipleExerciseLinks,
        loading,
    }
}
