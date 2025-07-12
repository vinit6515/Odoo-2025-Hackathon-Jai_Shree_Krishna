"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { authApi } from "@/lib/api"

interface User {
  id: number
  email: string
  name: string
  points: number
  role: "user" | "admin"
  avatar?: string
  bio?: string
  location?: string
  created_at?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
  updateUser: (userData: Partial<User>) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const refreshUser = async () => {
    try {
      const response = await authApi.getCurrentUser()
      if (response.success) {
        setUser(response.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    }
  }

  useEffect(() => {
    // Check for existing session
    refreshUser().finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(email, password)

      if (response.success) {
        setUser(response.user)
        toast({
          title: "Welcome back!",
          description: response.message,
        })
        return true
      } else {
        toast({
          title: "Login Failed",
          description: response.message,
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Unable to connect to the server. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const response = await authApi.register(email, password, name)

      if (response.success) {
        setUser(response.user)
        toast({
          title: "Welcome to ReWear!",
          description: response.message,
        })
        return true
      } else {
        toast({
          title: "Registration Failed",
          description: response.message,
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("Signup error:", error)
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Unable to connect to the server. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
      setUser(null)
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      })
    } catch (error) {
      // Even if logout fails on server, clear local state
      setUser(null)
      toast({
        title: "Logged Out",
        description: "You have been logged out.",
      })
    }
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData })
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
