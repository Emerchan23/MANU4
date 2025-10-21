import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PersonalizationProvider } from "@/components/personalization-context"
import { UserPreferencesProvider } from "@/contexts/user-preferences-context"
import { NotificationSystemInitializer } from "@/components/notification-system-initializer"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/hooks/useAuth"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Manutenção Hospitalar",
  description: "Sistema completo para gestão de manutenção de equipamentos hospitalares",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <UserPreferencesProvider>
              <PersonalizationProvider>
                <NotificationSystemInitializer />
                {children}
                <Toaster />
              </PersonalizationProvider>
            </UserPreferencesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
