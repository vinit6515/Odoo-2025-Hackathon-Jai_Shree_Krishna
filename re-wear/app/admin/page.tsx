"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Check, X, Eye, FileText, AlertTriangle, Users, Package, TrendingUp } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { adminApi } from "@/lib/api"
import { LoadingPage } from "@/components/loading-spinner"

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({
    pending_items: 0,
    approved_items: 0,
    total_users: 0,
    total_swaps: 0,
    reports: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard")
      return
    }

    if (user && user.role === "admin") {
      fetchAdminData()
    }
  }, [user, authLoading, router])

  const fetchAdminData = async () => {
    try {
      setLoading(true)

      // Fetch pending items
      const itemsResponse = await adminApi.getPendingItems()
      if (itemsResponse.success) {
        setItems(itemsResponse.items)
      }

      // Fetch admin stats
      const statsResponse = await adminApi.getStats()
      if (statsResponse.success) {
        setStats(statsResponse.stats)
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error)
      toast({
        title: "Error",
        description: "Failed to load admin data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (itemId: number) => {
    try {
      const response = await adminApi.approveItem(itemId)

      if (response.success) {
        setItems(items.filter((item: any) => item.id !== itemId))
        setStats((prev) => ({ ...prev, pending_items: prev.pending_items - 1 }))
        toast({
          title: "Success",
          description: response.message,
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error("Approve error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve item",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (itemId: number) => {
    try {
      const response = await adminApi.rejectItem(itemId, "Item does not meet our guidelines")

      if (response.success) {
        setItems(items.filter((item: any) => item.id !== itemId))
        setStats((prev) => ({ ...prev, pending_items: prev.pending_items - 1 }))
        toast({
          title: "Item Rejected",
          description: response.message,
          variant: "destructive",
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error("Reject error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject item",
        variant: "destructive",
      })
    }
  }

  if (authLoading || loading) {
    return <LoadingPage message="Loading admin dashboard..." />
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-20 md:pb-8 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage and moderate the ReWear platform</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
                <Package className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pending_items}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.total_users}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Swaps</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.total_swaps}</div>
                <p className="text-xs text-muted-foreground">Completed swaps</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reports</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.reports}</div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">Pending Items</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle>Items Pending Approval</CardTitle>
                  <CardDescription>Review and approve/reject items submitted by users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            {item.primary_image ? (
                              <Image
                                src={`http://localhost:5001/uploads/items/${item.primary_image}`}
                                alt={item.title}
                                width={80}
                                height={80}
                                className="rounded-lg object-cover"
                              />
                            ) : (
                              <Package className="h-8 w-8 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{item.title}</h3>
                                <p className="text-gray-600">
                                  by {item.owner?.name} ({item.owner?.email})
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge variant="secondary">{item.category}</Badge>
                                  <Badge variant="outline">{item.condition}</Badge>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <FileText className="h-4 w-4 mr-1" />
                                    <span className={item.has_bill ? "text-green-600" : "text-red-600"}>
                                      {item.has_bill ? "Bill uploaded" : "No bill"}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  Submitted on {new Date(item.created_at).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(item.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleReject(item.id)}>
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {items.length === 0 && (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No pending items to review</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Reported Items</CardTitle>
                  <CardDescription>Review reports from users about inappropriate content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No reports to review</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">User management features coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
