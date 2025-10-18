"use client"
import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export const ThemeProvider = React.forwardRef<
  React.ElementRef<typeof NextThemesProvider>,
  ThemeProviderProps
>(({ children, ...props }, ref) => {
  return <NextThemesProvider ref={ref} {...props}>{children}</NextThemesProvider>
})

ThemeProvider.displayName = "ThemeProvider"
