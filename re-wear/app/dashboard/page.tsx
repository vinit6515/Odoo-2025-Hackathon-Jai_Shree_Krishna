"use client"

import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Package, ArrowUpDown, TrendingUp, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import { userApi } from "@/lib/api"
import { LoadingPage } from "@/components/loading-spinner"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [userItems, setUserItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_items: 0,
    approved_items: 0,
    total_swaps: 0,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      fetchUserData()
    }
  }, [user, authLoading, router])

  const fetchUserData = async () => {
    try {
      setLoading(true)

      // Fetch user profile with stats
      const profileResponse = await userApi.getProfile()
      if (profileResponse.success && profileResponse.user.stats) {
        setStats(profileResponse.user.stats)
      }

      // Fetch user items
      const itemsResponse = await userApi.getUserItems()
      if (itemsResponse.success) {
        setUserItems(itemsResponse.items.slice(0, 5)) // Show only first 5 items
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return <LoadingPage message="Loading your dashboard..." />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-20 md:pb-8 px-4">
        <div className="container mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name}!</h1>
            <p className="text-gray-600">Here's what's happening with your sustainable fashion journey</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Balance</CardTitle>
                <Star className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{user.points}</div>
                <p className="text-xs text-muted-foreground">Available for swaps</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Items Listed</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_items}</div>
                <p className="text-xs text-muted-foreground">{stats.approved_items} approved</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful Swaps</CardTitle>
                <ArrowUpDown className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_swaps}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest exchange activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <ArrowUpDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent activity</p>
                    <p className="text-gray-400 text-sm mt-1">Start swapping to see your activity here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* My Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Items</CardTitle>
                  <CardDescription>Items you've listed for exchange</CardDescription>
                </div>
                <Link href="/add-item">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userItems.length > 0 ? (
                    userItems.map((item: any) => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="w-15 h-15 bg-gray-200 rounded-md flex items-center justify-center">
                          {item.images && item.images.length > 0 ? (
                            <Image
                              src={`http://localhost:5001/uploads/items/${item.images[0]}`}
                              alt={item.title}
                              width={60}
                              height={60}
                              className="rounded-md object-cover"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.title}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span>{item.condition}</span>
                            <span>•</span>
                            <span>{item.views} views</span>
                          </div>
                        </div>
                        <Badge
                          variant={
                            item.status === "approved"
                              ? "default"
                              : item.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No items listed yet</p>
                      <Link href="/add-item">
                        <Button className="mt-2" size="sm">
                          List Your First Item
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                {userItems.length > 0 && (
                  <Link href="/my-items">
                    <Button variant="outline" className="w-full mt-4 bg-transparent">
                      View All Items
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
