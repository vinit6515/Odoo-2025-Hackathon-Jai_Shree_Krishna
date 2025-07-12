"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Heart,
  Star,
  ArrowLeftRight,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Package,
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { itemsApi, swapRequestsApi, messagesApi } from "@/lib/api"
import { LoadingPage } from "@/components/loading-spinner"

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [item, setItem] = useState<any>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [swapLoading, setSwapLoading] = useState(false)
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [messageLoading, setMessageLoading] = useState(false)
  const [swapMessage, setSwapMessage] = useState("")
  const [chatMessage, setChatMessage] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchItem()
    }
  }, [params.id])

  const fetchItem = async () => {
    try {
      setLoading(true)
      const response = await itemsApi.getItem(Number.parseInt(params.id))

      if (response.success) {
        setItem(response.item)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load item",
          variant: "destructive",
        })
        router.push("/browse")
      }
    } catch (error) {
      console.error("Fetch item error:", error)
      toast({
        title: "Error",
        description: "Failed to load item details",
        variant: "destructive",
      })
      router.push("/browse")
    } finally {
      setLoading(false)
    }
  }

  const handleSwapRequest = async () => {
    if (!user || !item) return

    try {
      setSwapLoading(true)

      const response = await swapRequestsApi.createSwapRequest({
        item_id: item.id,
        type: "points",
        points_offered: item.points,
        message: swapMessage || `I'd like to swap for your ${item.title}`,
      })

      if (response.success) {
        toast({
          title: "Success!",
          description: response.message,
        })
        setSwapMessage("")
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Swap request error:", error)
      toast({
        title: "Error",
        description: "Failed to send swap request",
        variant: "destructive",
      })
    } finally {
      setSwapLoading(false)
    }
  }

  const handleRedeemWithPoints = async () => {
    if (!user || !item) return

    if (user.points < item.points) {
      toast({
        title: "Insufficient points",
        description: `You need ${item.points} points to redeem this item.`,
        variant: "destructive",
      })
      return
    }

    try {
      setRedeemLoading(true)

      const response = await itemsApi.redeemItem(item.id)

      if (response.success) {
        toast({
          title: "Success!",
          description: response.message,
        })

        // Update user points
        updateUser({ points: response.remaining_points })

        // Update item status
        setItem({ ...item, status: "swapped" })
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Redeem error:", error)
      toast({
        title: "Error",
        description: "Failed to redeem item",
        variant: "destructive",
      })
    } finally {
      setRedeemLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!user || !item || !chatMessage.trim()) return

    try {
      setMessageLoading(true)

      const response = await messagesApi.sendMessage(item.owner.id, chatMessage.trim())

      if (response.success) {
        toast({
          title: "Message sent!",
          description: response.message,
        })
        setChatMessage("")
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Send message error:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setMessageLoading(false)
    }
  }

  const nextImage = () => {
    if (item?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev === item.images.length - 1 ? 0 : prev + 1))
    }
  }

  const prevImage = () => {
    if (item?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev === 0 ? item.images.length - 1 : prev - 1))
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in</div>
  }

  if (loading) {
    return <LoadingPage message="Loading item details..." />
  }

  if (!item) {
    return <div className="flex items-center justify-center min-h-screen">Item not found</div>
  }

  const isOwner = user.id === item.owner?.id
  const isAvailable = item.status === "approved"
  const canAffordRedemption = user.points >= item.points

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-20 md:pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square relative bg-white rounded-lg overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <Image
                    src={`http://localhost:5001/uploads/items/${item.images[currentImageIndex]}`}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}

                {item.images && item.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                <button
                  onClick={() => setLiked(!liked)}
                  className="absolute top-4 right-4 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
                >
                  <Heart className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                </button>
              </div>

              {item.images && item.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {item.images.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex ? "border-green-500" : "border-gray-200"
                      }`}
                    >
                      <Image
                        src={`http://localhost:5001/uploads/items/${image}`}
                        alt={`${item.title} ${index + 1}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Item Details */}
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {item.owner?.location || "Location not specified"}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-1" />
                        {item.views} views
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center bg-green-100 text-green-800 px-3 py-2 rounded-full">
                    <Star className="h-4 w-4 mr-1" />
                    <span className="font-semibold">{item.points} points</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{item.category}</Badge>
                  <Badge variant="outline">{item.type}</Badge>
                  <Badge variant="outline">Size {item.size}</Badge>
                  <Badge variant="outline">{item.condition}</Badge>
                  <Badge variant={isAvailable ? "default" : "secondary"} className={isAvailable ? "bg-green-600" : ""}>
                    {item.status}
                  </Badge>
                </div>

                <p className="text-gray-700 leading-relaxed mb-4">{item.description}</p>

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag: string) => (
                      <span key={tag} className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Owner Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Item Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={
                          item.owner?.avatar
                            ? `http://localhost:5001/uploads/avatars/${item.owner.avatar}`
                            : "/placeholder.svg"
                        }
                      />
                      <AvatarFallback>{item.owner?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.owner?.name || "Unknown User"}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Member since {new Date(item.owner?.created_at || "").toLocaleDateString()}</span>
                      </div>
                    </div>
                    {!isOwner && (
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Type a message..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            className="w-48"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSendMessage}
                            disabled={messageLoading || !chatMessage.trim()}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            {messageLoading ? "Sending..." : "Send"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {!isOwner && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a message with your swap request (optional)..."
                      value={swapMessage}
                      onChange={(e) => setSwapMessage(e.target.value)}
                      rows={2}
                    />
                    <Button
                      onClick={handleSwapRequest}
                      className="w-full"
                      size="lg"
                      disabled={!isAvailable || swapLoading}
                    >
                      <ArrowLeftRight className="h-5 w-5 mr-2" />
                      {swapLoading ? "Sending Request..." : "Request Swap"}
                    </Button>
                  </div>

                  <Button
                    onClick={handleRedeemWithPoints}
                    variant="outline"
                    className="w-full bg-transparent"
                    size="lg"
                    disabled={!isAvailable || !canAffordRedemption || redeemLoading}
                  >
                    <Star className="h-5 w-5 mr-2" />
                    {redeemLoading ? "Redeeming..." : `Redeem for ${item.points} Points`}
                    {!canAffordRedemption && (
                      <span className="ml-2 text-red-500">(Need {item.points - user.points} more)</span>
                    )}
                  </Button>

                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1 bg-transparent">
                      <Heart className="h-4 w-4 mr-2" />
                      Save ({item.likes || 0})
                    </Button>
                    <Button variant="outline" className="flex-1 bg-transparent">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              )}

              {isOwner && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 font-medium">This is your item</p>
                  <p className="text-blue-600 text-sm">You can manage it from your dashboard</p>
                </div>
              )}

              {/* Additional Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Condition:</span>
                    <span className="font-medium">{item.condition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{item.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{item.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{item.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Posted:</span>
                    <span className="font-medium">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize">{item.status}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
