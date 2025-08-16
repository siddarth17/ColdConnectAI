"use client"

import { usePathname } from 'next/navigation'
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ProtectedRoute } from './protected-route'

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Don't protect auth pages
  const isAuthPage = pathname?.startsWith('/auth')
  
  if (isAuthPage) {
    return <>{children}</>
  }

  // Protect all other pages
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