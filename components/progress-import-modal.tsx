"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Upload, Info } from "lucide-react"

interface ProgressImportModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onImport: (data: string) => Promise<any>
}

export function ProgressImportModal({ open, onOpenChange, onImport }: ProgressImportModalProps) {
    const [data, setData] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleImport = async () => {
        if (!data.trim()) return

        setLoading(true)
        setResult(null)

        try {
            const importResult = await onImport(data)
            setResult(importResult)

            if (importResult.success && importResult.summary?.success > 0) {
                // Clear data on successful import
                setTimeout(() => {
                    setData("")
                    setResult(null)
                }, 3000)
            }
        } catch (error) {
            setResult({
                success: false,
                error: error instanceof Error ? error.message : "Error desconocido",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setData("")
        setResult(null)
        onOpenChange(false)
    }

    const exampleData = `4/3/25 - 72.3kg
5/3/25 - 72.1kg - 175cm
6/3/25 - 71.8kg`

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Importar Progreso Físico</DialogTitle>
                    <DialogDescription>
                        Pega los datos de progreso físico para importar. Solo se necesita fecha y peso, la altura es opcional.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Format Info */}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <p className="font-medium">Formatos soportados:</p>
                                <div className="text-sm space-y-1">
                                    <div>
                                        • <code>4/3/25 - 72.3kg</code> (solo peso)
                                    </div>
                                    <div>
                                        • <code>4/3/25 - 72.3kg - 175cm</code> (peso y altura)
                                    </div>
                                    <div>• Se ignora cualquier texto sobre entrenamientos</div>
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>

                    {/* Data Input */}
                    <div>
                        <Textarea
                            placeholder={`Ejemplo:\n${exampleData}`}
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                            rows={8}
                            className="font-mono text-sm"
                        />
                    </div>

                    {/* Import Result */}
                    {result && (
                        <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                            {result.success ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <AlertDescription>
                                {result.success ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-green-800">Importación completada</span>
                                        </div>
                                        {result.summary && (
                                            <div className="flex gap-2">
                                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                    {result.summary.success} exitosos
                                                </Badge>
                                                {result.summary.errors > 0 && (
                                                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                                                        {result.summary.errors} errores
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                        {result.summary?.errorDetails && result.summary.errorDetails.length > 0 && (
                                            <div className="mt-2">
                                                <details className="text-sm">
                                                    <summary className="cursor-pointer text-red-700 font-medium">
                                                        Ver errores ({result.summary.errors})
                                                    </summary>
                                                    <div className="mt-1 space-y-1 text-red-600">
                                                        {result.summary.errorDetails.map((error: string, index: number) => (
                                                            <div key={index} className="text-xs">
                                                                • {error}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-red-800">
                                        <span className="font-medium">Error:</span> {result.error}
                                    </div>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={handleClose}>
                            Cerrar
                        </Button>
                        <Button onClick={handleImport} disabled={!data.trim() || loading}>
                            {loading ? (
                                "Importando..."
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Importar
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
