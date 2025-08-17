"use client"

import { usePathname } from 'next/navigation'
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ProtectedRoute } from './protected-route'

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // These pages should NOT have auth protection or sidebar
  const publicRoutes = ['/landing', '/auth/signin', '/auth/signup']
  const isPublicRoute = publicRoutes.includes(pathname)
  
  if (isPublicRoute) {
    return <>{children}</>  // No auth checks, no sidebar
  }
  
  // All other routes need authentication and sidebar
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  )
}