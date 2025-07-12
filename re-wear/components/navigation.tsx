"use client"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Home, Search, Plus, User, Settings, Recycle, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Browse", href: "/browse", icon: Search },
  { name: "Add Item", href: "/add-item", icon: Plus },
  { name: "Profile", href: "/profile", icon: User },
]

export function Navigation() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Recycle className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold">ReWear</span>
          </Link>

          <div className="flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-green-100 text-green-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
            {user.role === "admin" && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === "/admin"
                    ? "bg-green-100 text-green-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                )}
              >
                <Settings className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg text-xs font-medium transition-colors",
                pathname === item.href
                  ? "bg-green-100 text-green-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
