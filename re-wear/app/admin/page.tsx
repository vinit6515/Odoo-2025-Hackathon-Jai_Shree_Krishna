"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Check,
  X,
  Eye,
  FileText,
  AlertTriangle,
  Users,
  Package,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { adminApi } from "@/lib/api"
import { LoadingPage } from "@/components/loading-spinner"

interface ItemDetailModalProps {
  item: any
  isOpen: boolean
  onClose: () => void
  onApprove: (itemId: number) => void
  onReject: (itemId: number) => void
}

function ItemDetailModal({ item, isOpen, onClose, onApprove, onReject }: ItemDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showBill, setShowBill] = useState(false)

  if (!item || !isOpen) return null

  const nextImage = () => {
    if (item.images && item.images.length > 1) {
      setCurrentImageIndex((prev) => (prev === item.images.length - 1 ? 0 : prev + 1))
    }
  }

  const prevImage = () => {
    if (item.images && item.images.length > 1) {
      setCurrentImageIndex((prev) => (prev === 0 ? item.images.length - 1 : prev - 1))
    }
  }

  const handleApprove = () => {
    onApprove(item.id)
    onClose()
  }

  const handleReject = () => {
    onReject(item.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{item.title}</h2>
              <p className="text-gray-600">
                Review item details before approval - Submitted by {item.owner?.name} ({item.owner?.email})
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Images Section */}
            <div className="space-y-4">
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <Image
                    src={`http://localhost:5001/uploads/items/${item.images[currentImageIndex]}`}
                    alt={`${item.title} - Image ${currentImageIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                    <span className="ml-2 text-gray-500">No images uploaded</span>
                  </div>
                )}

                {item.images && item.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      {currentImageIndex + 1} / {item.images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Image Thumbnails */}
              {item.images && item.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {item.images.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex ? "border-blue-500" : "border-gray-200"
                      }`}
                    >
                      <Image
                        src={`http://localhost:5001/uploads/items/${image}`}
                        alt={`Thumbnail ${index + 1}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Bill/Receipt Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Purchase Bill/Receipt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {item.has_bill ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-green-600 font-medium">✓ Bill uploaded</span>
                        <div className="space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setShowBill(!showBill)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {showBill ? "Hide" : "View"} Bill
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(`http://localhost:5001/uploads/bills/${item.bill_path}`, "_blank")
                            }
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>

                      {showBill && item.bill_path && (
                        <div className="border rounded-lg p-2 bg-gray-50">
                          <img
                            src={`http://localhost:5001/uploads/bills/${item.bill_path}`}
                            alt="Purchase Bill"
                            className="max-w-full h-auto rounded"
                            style={{ maxHeight: "300px" }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-600 font-medium">⚠ No bill uploaded</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Item Details Section */}
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Item Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Category</label>
                      <p className="font-medium">{item.category}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type</label>
                      <p className="font-medium">{item.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Size</label>
                      <p className="font-medium">{item.size}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Condition</label>
                      <p className="font-medium">{item.condition}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Points Value</label>
                      <p className="font-medium text-green-600">{item.points} points</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <Badge variant="secondary">{item.status}</Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="mt-1 text-gray-900 leading-relaxed">{item.description}</p>
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tags</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.tags.map((tag: string) => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Owner Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Owner Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="font-medium text-gray-600">{item.owner?.name?.charAt(0) || "U"}</span>
                      </div>
                      <div>
                        <p className="font-medium">{item.owner?.name}</p>
                        <p className="text-sm text-gray-600">{item.owner?.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Points Balance:</span>
                        <span className="ml-2 font-medium">{item.owner?.points || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Member Since:</span>
                        <span className="ml-2 font-medium">
                          {new Date(item.owner?.created_at || "").toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submission Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submission Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted:</span>
                      <span className="font-medium">{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Images:</span>
                      <span className="font-medium">{item.images?.length || 0} uploaded</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bill:</span>
                      <span className={`font-medium ${item.has_bill ? "text-green-600" : "text-red-600"}`}>
                        {item.has_bill ? "Provided" : "Missing"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700" size="lg">
                  <Check className="h-5 w-5 mr-2" />
                  Approve Item
                </Button>
                <Button onClick={handleReject} variant="destructive" className="flex-1" size="lg">
                  <X className="h-5 w-5 mr-2" />
                  Reject Item
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [selectedItem, setSelectedItem] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const handleViewDetails = (item: any) => {
    console.log("View details clicked for item:", item.id)
    setSelectedItem(item)
    setIsModalOpen(true)
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

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
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
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDetails(item)}
                                  className="hover:bg-gray-50"
                                >
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

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={closeModal}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}
