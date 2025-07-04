"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, BarChart3, TrendingUp, Settings, Dumbbell } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/day", label: "Día", icon: Dumbbell },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/stats", label: "Estadísticas", icon: BarChart3 },
  { href: "/progress", label: "Progreso", icon: TrendingUp },
  { href: "/settings", label: "Ajustes", icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Navigation - Bottom */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            const href = item.href === "/day" ? `/day/${new Date().toISOString().split("T")[0]}` : item.href

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex flex-col items-center py-2 px-3 rounded-lg transition-colors",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Navigation - Top */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-background border-b z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold">Gym.y</h1>
              <div className="flex space-x-6">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname.startsWith(item.href)
                  const href = item.href === "/day" ? `/day/${new Date().toISOString().split("T")[0]}` : item.href

                  return (
                    <Link
                      key={item.href}
                      href={href}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors",
                        isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
