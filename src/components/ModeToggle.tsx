"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ModeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Button
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      className={cn(
        "rounded-xl transition-all duration-300",
        showLabel ? "w-full justify-start gap-3 px-3 h-9 text-muted-foreground font-semibold hover:text-foreground" : "rounded-full"
      )}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <div className="relative h-[1.2rem] w-[1.2rem] flex items-center justify-center">
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </div>
      {showLabel && (
        <span className="truncate">
          {theme === "dark" ? "Dark Mode" : "Light Mode"}
        </span>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
