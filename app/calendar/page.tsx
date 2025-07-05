"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CalendarIcon, TrendingUp, Target, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCalendar } from "@/hooks/use-calendar"

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

const SESSION_TYPE_COLORS = {
  PUSH: "bg-red-500",
  PULL: "bg-blue-500",
  LEG: "bg-green-500",
}

export default function CalendarPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())

  const {
    workoutDays,
    calendarStats,
    loading,
    error,
    hasWorkout,
    getWorkoutForDate,
    getWorkoutsForMonth,
    getRecentWorkouts,
  } = useCalendar()

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1))
      return newDate
    })
  }

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 12, 0, 0)
    const dateString = selectedDate.toISOString().split("T")[0]
    router.push(`/day/${dateString}`)
  }

  const isToday = (day: number) => {
    const today = new Date()
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 12, 0, 0)
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0)
    return checkDate.getTime() === todayDate.getTime()
  }

  const getWorkoutForDay = (day: number) => {
    const dateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 12, 0, 0)
      .toISOString()
      .split("T")[0]
    return getWorkoutForDate(dateString)
  }

  const days = getDaysInMonth(currentDate)
  const monthWorkouts = getWorkoutsForMonth(currentDate.getFullYear(), currentDate.getMonth())
  const recentWorkouts = getRecentWorkouts(5)

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="h-8 bg-muted rounded w-1/3"></div>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-muted rounded"></div>
                    <div className="w-24 h-4 bg-muted rounded"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-8 h-8 bg-muted rounded mb-2"></div>
                  <div className="w-16 h-3 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar skeleton */}
            <div className="lg:col-span-2">
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 bg-muted rounded"></div>
                    <div className="w-32 h-6 bg-muted rounded"></div>
                    <div className="w-8 h-8 bg-muted rounded"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Days header skeleton */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="w-8 h-4 bg-muted rounded"></div>
                    ))}
                  </div>
                  {/* Calendar grid skeleton */}
                  <div className="grid grid-cols-7 gap-1">
                    {[...Array(35)].map((_, i) => (
                      <div key={i} className="aspect-square">
                        <div className="w-full h-full bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                  {/* Legend skeleton */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-muted rounded-full"></div>
                        <div className="w-8 h-3 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar skeleton */}
            <div className="space-y-6">
              {/* Month summary skeleton */}
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="w-24 h-5 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="w-20 h-4 bg-muted rounded"></div>
                        <div className="w-8 h-4 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent workouts skeleton */}
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="w-32 h-5 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-muted rounded-full"></div>
                          <div className="space-y-1">
                            <div className="w-16 h-4 bg-muted rounded"></div>
                            <div className="w-24 h-3 bg-muted rounded"></div>
                          </div>
                        </div>
                        <div className="w-12 h-5 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick actions skeleton */}
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="w-24 h-5 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="w-full h-10 bg-muted rounded"></div>
                    <div className="w-full h-10 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Error al cargar el calendario</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Calendario</h1>

      {/* Stats Cards */}
      {calendarStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Total Entrenamientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calendarStats.totalWorkouts}</div>
              <div className="text-xs text-muted-foreground">{calendarStats.workoutsThisMonth} este mes</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Racha Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calendarStats.currentStreak}</div>
              <div className="text-xs text-muted-foreground">días consecutivos</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Mejor Racha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calendarStats.longestStreak}</div>
              <div className="text-xs text-muted-foreground">días máximo</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Promedio Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{calendarStats.averageWorkoutsPerWeek}</div>
              <div className="text-xs text-muted-foreground">entrenamientos/semana</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-xl">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day && (
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full h-full p-1 relative flex flex-col items-center justify-center",
                          isToday(day) && "border-primary border-2 text-secondary-foreground hover:bg-primary/90",
                          getWorkoutForDay(day) && !isToday(day) && "bg-secondary hover:bg-secondary/80",
                        )}
                        onClick={() => handleDateClick(day)}
                      >
                        <span className="text-sm font-medium">{day}</span>
                        {getWorkoutForDay(day) && (
                          <div className="flex items-center gap-1">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                SESSION_TYPE_COLORS[getWorkoutForDay(day)!.session_type],
                              )}
                            />
                          </div>
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-primary border-2 rounded-full"></div>
                  <span>Hoy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>PUSH</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>PULL</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>LEG</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Month Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen del Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Entrenamientos:</span>
                  <span className="font-medium">{monthWorkouts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">PUSH:</span>
                  <span className="font-medium">{monthWorkouts.filter((w) => w.session_type === "PUSH").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">PULL:</span>
                  <span className="font-medium">{monthWorkouts.filter((w) => w.session_type === "PULL").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">LEG:</span>
                  <span className="font-medium">{monthWorkouts.filter((w) => w.session_type === "LEG").length}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total ejercicios:</span>
                    <span className="font-medium">{monthWorkouts.reduce((sum, w) => sum + w.exercise_count, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total series:</span>
                    <span className="font-medium">{monthWorkouts.reduce((sum, w) => sum + w.total_sets, 0)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Workouts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entrenamientos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentWorkouts.length > 0 ? (
                  recentWorkouts.map((workout) => (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/day/${workout.date}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-3 h-3 rounded-full", SESSION_TYPE_COLORS[workout.session_type])} />
                        <div>
                          <div className="font-medium text-sm">
                            {new Date(workout.date + "T00:00:00").toLocaleDateString("es-ES", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {workout.exercise_count} ejercicios • {workout.total_sets} series
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {workout.session_type}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-4">No hay entrenamientos recientes</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  className="w-full justify-start bg-transparent"
                  variant="outline"
                  onClick={() => router.push(`/day/${new Date().toISOString().split("T")[0]}`)}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Ir a hoy
                </Button>
                <Button
                  className="w-full justify-start bg-transparent"
                  variant="outline"
                  onClick={() => setCurrentDate(new Date())}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Mes actual
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
