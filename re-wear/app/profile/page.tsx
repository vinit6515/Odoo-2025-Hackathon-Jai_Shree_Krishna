"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Star, Package, ArrowUpDown, Settings, Camera, Edit3, Award, TrendingUp, MapPin, Phone } from "lucide-react"
import { swapRequestsApi, userApi } from "@/lib/api"

const userStats = {
  totalSwaps: 23,
  successfulSwaps: 21,
  itemsListed: 15,
  pointsEarned: 450,
  rating: 4.8,
  joinDate: "March 2025",
}

const recentActivity = [
  {
    id: 1,
    type: "swap",
    description: "Swapped Vintage Jacket with Summer Dress",
    date: "2 days ago",
    points: "+15",
  },
  {
    id: 2,
    type: "listing",
    description: "Listed Cotton T-Shirt",
    date: "1 week ago",
    points: "+5",
  },
  {
    id: 3,
    type: "redeem",
    description: "Redeemed Designer Scarf",
    date: "2 weeks ago",
    points: "-25",
  },
]

function SwapRequestsActivity() {
  const [swapRequests, setSwapRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    fetchSwapRequests()
  }, [])

  const fetchSwapRequests = async () => {
    try {
      const response = await swapRequestsApi.getUserSwapRequests("all")
      if (response.success) {
        setSwapRequests(response.swap_requests.slice(0, 5)) // Show only recent 5
      }
    } catch (error) {
      console.error("Failed to fetch swap requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (requestId: number) => {
    try {
      const response = await swapRequestsApi.acceptSwapRequest(requestId)
      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        })
        fetchSwapRequests() // Refresh the list
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept swap request",
        variant: "destructive",
      })
    }
  }

  const handleRejectRequest = async (requestId: number) => {
    try {
      const response = await swapRequestsApi.rejectSwapRequest(requestId)
      if (response.success) {
        toast({
          title: "Request Rejected",
          description: response.message,
        })
        fetchSwapRequests() // Refresh the list
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject swap request",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading activity...</div>
  }

  if (swapRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <ArrowUpDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No recent activity</p>
        <p className="text-gray-400 text-sm mt-1">Start swapping to see your activity here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {swapRequests.map((request: any) => (
        <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-full ${
                request.status === "pending"
                  ? "bg-yellow-100 text-yellow-600"
                  : request.status === "accepted"
                    ? "bg-green-100 text-green-600"
                    : request.status === "rejected"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
              }`}
            >
              <ArrowUpDown className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">
                {request.requester_id === user?.id
                  ? `Swap request sent for "${request.requested_item?.title}"`
                  : `Swap request received for "${request.requested_item?.title}"`}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(request.created_at).toLocaleDateString()} • {request.points_offered} points
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge
              variant={
                request.status === "pending"
                  ? "secondary"
                  : request.status === "accepted"
                    ? "default"
                    : request.status === "rejected"
                      ? "destructive"
                      : "outline"
              }
            >
              {request.status}
            </Badge>
            {request.status === "pending" && request.owner_id === user?.id && (
              <div className="flex space-x-1">
                <Button size="sm" onClick={() => handleAcceptRequest(request.id)}>
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request.id)}>
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "Fashion enthusiast who loves sustainable clothing and unique vintage pieces.",
    location: user?.location || "",
    phone: "",
    address: "",
  })

  const handleSaveProfile = async () => {
    try {
      const response = await userApi.updateProfile({
        name: profileData.name,
        bio: profileData.bio,
        location: profileData.location,
        phone: profileData.phone,
        address: profileData.address,
      })

      if (response.success) {
        updateUser(response.user)
        setIsEditing(false)
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-20 md:pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account and view your ReWear journey</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <Avatar className="h-24 w-24 mx-auto">
                        <AvatarImage src="/placeholder.svg?height=96&width=96" />
                        <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <button className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-2 hover:bg-green-700 transition-colors">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>

                    <h2 className="text-xl font-semibold mt-4">{user.name}</h2>
                    <p className="text-gray-600">{user.email}</p>

                    <div className="flex items-center justify-center mt-2">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="font-medium">{userStats.rating}</span>
                      <span className="text-gray-500 ml-1">({userStats.totalSwaps} swaps)</span>
                    </div>

                    <div className="flex items-center justify-center mt-2 text-green-600">
                      <Star className="h-4 w-4 mr-1" />
                      <span className="font-semibold">{user.points} points</span>
                    </div>

                    <p className="text-sm text-gray-500 mt-2">Member since {userStats.joinDate}</p>

                    {/* Contact Information */}
                    {(user.location || profileData.phone) && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        {user.location && (
                          <div className="flex items-center justify-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{user.location}</span>
                          </div>
                        )}
                        {profileData.phone && (
                          <div className="flex items-center justify-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-1" />
                            <span>{profileData.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Update your personal information and contact details</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        {isEditing ? "Cancel" : "Edit"}
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            disabled={true} // Email should not be editable
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            Location/City
                          </Label>
                          <Input
                            id="location"
                            placeholder="e.g., New York, NY"
                            value={profileData.location}
                            onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">
                            <Phone className="h-4 w-4 inline mr-1" />
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            placeholder="e.g., +1 (555) 123-4567"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Full Address (for item pickup/delivery)</Label>
                        <Input
                          id="address"
                          placeholder="Street address, apartment, city, state, zip code"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <textarea
                          id="bio"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Tell others about your style preferences and interests..."
                        />
                      </div>

                      {isEditing && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">Privacy & Safety</h4>
                          <p className="text-sm text-blue-800">
                            Your contact information will only be shared with users you're actively swapping with. We
                            recommend meeting in public places for item exchanges.
                          </p>
                        </div>
                      )}

                      {isEditing && (
                        <Button onClick={handleSaveProfile} className="w-full">
                          Save Changes
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Your latest swaps, listings, and point transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SwapRequestsActivity />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>Manage your account preferences and security</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Notifications</h3>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span>Email notifications for new swap requests</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span>SMS notifications for urgent updates</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span>Marketing emails and promotions</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Privacy</h3>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span>Show my profile to other users</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span>Allow direct messages from other users</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span>Share location with swap partners</span>
                          </label>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <Button variant="destructive" onClick={logout}>
                          <Settings className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
