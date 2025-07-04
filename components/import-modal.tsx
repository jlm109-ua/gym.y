"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Upload, Download, AlertTriangle, X, Calendar, RefreshCw, Plus, SkipForward, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImportError {
    line: string
    lineNumber: number
    date: string
    error: string
}

interface DuplicateWorkout {
    date: string
    existing: {
        id: string
        date: string
        session_type: string
    }
    new: {
        date: string
        session_type: string
        exercises: any[]
    }
}

interface ImportModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

type ViewState = "input" | "errors" | "duplicates" | "preview"

export function ImportModal({ open, onOpenChange, onSuccess }: ImportModalProps) {
    const [text, setText] = useState("")
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<ImportError[]>([])
    const [duplicates, setDuplicates] = useState<DuplicateWorkout[]>([])
    const [viewState, setViewState] = useState<ViewState>("input")
    const [duplicateAction, setDuplicateAction] = useState<"overwrite" | "merge" | "skip">("overwrite")
    const [previewData, setPreviewData] = useState<any[]>([])
    const { toast } = useToast()

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                setText(content)
            }
            reader.readAsText(file, "UTF-8")
        }
    }

    const previewImport = () => {
        if (!text.trim()) {
            toast({
                title: "Error",
                description: "Por favor, introduce o sube un archivo con datos para importar",
                variant: "destructive",
            })
            return
        }

        // Simple preview parsing
        const lines = text.split("\n")
        const preview: any[] = []
        let currentDate = ""
        let exercises: string[] = []

        for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine) continue

            // Check for date line
            const dateMatch = trimmedLine.match(/🗓️(\w+),\s*(\d{1,2})\s+(\w+)\s+(\d{4})/)
            if (dateMatch) {
                if (currentDate && exercises.length > 0) {
                    preview.push({
                        date: currentDate,
                        exercises,
                    })
                }
                const [, dayOfWeek, day, monthName, year] = dateMatch
                currentDate = `${day} ${monthName} ${year}`
                exercises = []
                continue
            }

            // Skip month headers
            if (trimmedLine.match(/^[A-Za-z]+$/)) {
                continue
            }

            // Add exercise
            if (trimmedLine.includes("|")) {
                const parts = trimmedLine.split("|")
                if (parts.length >= 1) {
                    exercises.push(parts[0].trim())
                }
            }
        }

        // Add last workout
        if (currentDate && exercises.length > 0) {
            preview.push({
                date: currentDate,
                exercises,
            })
        }

        setPreviewData(preview)
        setViewState("preview")
    }

    const handleImport = async (action = "ask") => {
        if (!text.trim()) {
            toast({
                title: "Error",
                description: "Por favor, introduce o sube un archivo con datos para importar",
                variant: "destructive",
            })
            return
        }

        setLoading(true)
        setErrors([])
        setDuplicates([])

        try {
            const response = await fetch("/api/import", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text, duplicateAction: action }),
            })

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "Importación exitosa",
                    description: result.message,
                })
                setText("")
                setViewState("input")
                onSuccess()
                onOpenChange(false)
            } else {
                if (result.errors && result.errors.length > 0) {
                    setErrors(result.errors)
                    setViewState("errors")
                    toast({
                        title: "Errores en la importación",
                        description: `Se encontraron ${result.errors.length} errores. Revisa los detalles para corregirlos.`,
                        variant: "destructive",
                    })
                } else if (result.duplicates && result.duplicates.length > 0) {
                    setDuplicates(result.duplicates)
                    setViewState("duplicates")
                    toast({
                        title: "Entrenamientos duplicados",
                        description: `Se encontraron ${result.duplicates.length} entrenamientos que ya existen. Elige qué hacer.`,
                        variant: "destructive",
                    })
                } else {
                    toast({
                        title: "Error en la importación",
                        description: result.message || "Error desconocido",
                        variant: "destructive",
                    })
                }
            }
        } catch (error) {
            console.error("Import error:", error)
            toast({
                title: "Error de conexión",
                description: "No se pudo conectar con el servidor",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDuplicateAction = () => {
        handleImport(duplicateAction)
    }

    const downloadErrorFile = () => {
        const errorText = errors
            .map(
                (error) =>
                    `Línea ${error.lineNumber} (${error.date}):\n` + `  Contenido: ${error.line}\n` + `  Error: ${error.error}\n`,
            )
            .join("\n")

        const blob = new Blob([errorText], { type: "text/plain;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "errores_importacion.txt"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const handleClose = () => {
        setText("")
        setErrors([])
        setDuplicates([])
        setViewState("input")
        onOpenChange(false)
    }

    const renderInputView = () => (
        <div className="space-y-4">
            {/* File Upload */}
            <div>
                <Label htmlFor="file-upload">Subir archivo</Label>
                <div className="mt-2">
                    <input
                        id="file-upload"
                        type="file"
                        accept=".txt,.md"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                </div>
            </div>

            {/* Text Input */}
            <div>
                <Label htmlFor="text-input">O pega el contenido aquí</Label>
                <Textarea
                    id="text-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="🗓️mar, 01 jul 2025 11:37

Extensión Cuádriceps | 4x12 | 35kg
Press Banca | 4x8 | 60kg
..."
                    rows={12}
                    className="mt-2 font-mono text-sm"
                />
            </div>

            {/* Format Info */}
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    <strong>Formato esperado:</strong>
                    <br />• Fecha: 🗓️mar, 01 jul 2025 11:37
                    <br />• Ejercicio: Nombre | Series | Peso
                    <br />• Ejemplo: Press Banca | 4x12 | 60kg
                </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                </Button>
                <Button variant="secondary" onClick={previewImport} disabled={!text.trim()}>
                    <Info className="h-4 w-4 mr-2" />
                    Vista previa
                </Button>
                <Button onClick={() => handleImport()} disabled={!text.trim() || loading}>
                    <Upload className="h-4 w-4 mr-2" />
                    {loading ? "Importando..." : "Importar"}
                </Button>
            </div>
        </div>
    )

    const renderPreviewView = () => (
        <div className="space-y-4">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Vista previa de los entrenamientos a importar. Verifica que las fechas y ejercicios sean correctos.
                </AlertDescription>
            </Alert>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Entrenamientos detectados ({previewData.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {previewData.map((workout, index) => (
                            <div key={index} className="border rounded-lg p-3">
                                <div className="font-medium mb-2">{workout.date}</div>
                                <div className="text-sm text-muted-foreground">
                                    <div className="mb-1">Ejercicios ({workout.exercises.length}):</div>
                                    <ul className="list-disc pl-5">
                                        {workout.exercises.slice(0, 5).map((exercise: string, i: number) => (
                                            <li key={i}>{exercise}</li>
                                        ))}
                                        {workout.exercises.length > 5 && (
                                            <li className="text-muted-foreground">...y {workout.exercises.length - 5} ejercicios más</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setViewState("input")}>
                    Volver
                </Button>
                <Button onClick={() => handleImport()} disabled={loading}>
                    <Upload className="h-4 w-4 mr-2" />
                    {loading ? "Importando..." : "Importar"}
                </Button>
            </div>
        </div>
    )

    const renderErrorsView = () => (
        <div className="space-y-4">
            {/* Error Summary */}
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Se encontraron <strong>{errors.length}</strong> errores durante la importación. Revisa y corrige los errores
                    antes de volver a intentar.
                </AlertDescription>
            </Alert>

            {/* Error List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Errores Encontrados</CardTitle>
                        <Button variant="outline" size="sm" onClick={downloadErrorFile}>
                            <Download className="h-4 w-4 mr-2" />
                            Descargar errores
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {errors.map((error, index) => (
                            <div key={index} className="border rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="destructive">Línea {error.lineNumber}</Badge>
                                    <Badge variant="outline">{error.date}</Badge>
                                </div>
                                <div className="text-sm space-y-1">
                                    <div>
                                        <strong>Contenido:</strong>
                                        <code className="block bg-muted p-2 rounded mt-1 text-xs">{error.line}</code>
                                    </div>
                                    <div>
                                        <strong>Error:</strong>
                                        <span className="text-destructive ml-1">{error.error}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setViewState("input")}>
                    Volver a intentar
                </Button>
                <Button type="button" onClick={handleClose}>
                    Cerrar
                </Button>
            </div>
        </div>
    )

    const renderDuplicatesView = () => (
        <div className="space-y-4">
            {/* Duplicate Summary */}
            <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                    Se encontraron <strong>{duplicates.length}</strong> entrenamientos que ya existen en las siguientes fechas.
                    Elige qué hacer con los duplicados.
                </AlertDescription>
            </Alert>

            {/* Duplicate Action Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">¿Qué hacer con los duplicados?</CardTitle>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={duplicateAction} onValueChange={(value: any) => setDuplicateAction(value)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="overwrite" id="overwrite" />
                            <Label htmlFor="overwrite" className="flex items-center gap-2 cursor-pointer">
                                <RefreshCw className="h-4 w-4" />
                                <div>
                                    <div className="font-medium">Sobrescribir</div>
                                    <div className="text-sm text-muted-foreground">
                                        Reemplazar los entrenamientos existentes con los nuevos datos
                                    </div>
                                </div>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="merge" id="merge" />
                            <Label htmlFor="merge" className="flex items-center gap-2 cursor-pointer">
                                <Plus className="h-4 w-4" />
                                <div>
                                    <div className="font-medium">Fusionar</div>
                                    <div className="text-sm text-muted-foreground">
                                        Añadir los nuevos ejercicios a los entrenamientos existentes
                                    </div>
                                </div>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="skip" id="skip" />
                            <Label htmlFor="skip" className="flex items-center gap-2 cursor-pointer">
                                <SkipForward className="h-4 w-4" />
                                <div>
                                    <div className="font-medium">Omitir</div>
                                    <div className="text-sm text-muted-foreground">
                                        Ignorar los entrenamientos duplicados y mantener los existentes
                                    </div>
                                </div>
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            {/* Duplicate List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Entrenamientos Duplicados</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {duplicates.map((duplicate, index) => (
                            <div key={index} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline">
                                        {new Date(duplicate.date).toLocaleDateString("es-ES", {
                                            weekday: "short",
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </Badge>
                                    <div className="flex gap-2">
                                        <Badge variant="secondary">Existente: {duplicate.existing.session_type}</Badge>
                                        <Badge variant="default">Nuevo: {duplicate.new.session_type}</Badge>
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Nuevo entrenamiento tiene {duplicate.new.exercises.length} ejercicios
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setViewState("input")}>
                    Cancelar
                </Button>
                <Button onClick={handleDuplicateAction} disabled={loading}>
                    {loading ? "Procesando..." : "Continuar"}
                </Button>
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Importar Entrenamientos</DialogTitle>
                    <DialogDescription>
                        {viewState === "input" &&
                            "Importa tus entrenamientos desde un archivo de texto. Sube un archivo o pega el contenido directamente."}
                        {viewState === "preview" && "Vista previa de los entrenamientos a importar."}
                        {viewState === "errors" &&
                            "Se encontraron errores durante la importación. Revisa los detalles para corregirlos."}
                        {viewState === "duplicates" && "Se encontraron entrenamientos duplicados. Elige cómo proceder."}
                    </DialogDescription>
                </DialogHeader>

                {viewState === "input" && renderInputView()}
                {viewState === "preview" && renderPreviewView()}
                {viewState === "errors" && renderErrorsView()}
                {viewState === "duplicates" && renderDuplicatesView()}
            </DialogContent>
        </Dialog>
    )
}
