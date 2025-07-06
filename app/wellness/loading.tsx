import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function WellnessLoading() {
    return (
        <div className="container mx-auto p-4 pb-20 md:pb-4">
            <div className="mb-6">
                <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
            </div>

            {/* Tabs skeleton */}
            <div className="mb-6">
                <div className="h-10 bg-muted rounded animate-pulse" />
            </div>

            {/* Stats cards skeleton */}
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

            {/* Charts skeleton */}
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
