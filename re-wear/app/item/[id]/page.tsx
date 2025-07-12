"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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

// Mock data for the item
const mockItem = {
  id: 1,
  title: "Vintage Leather Jacket",
  description:
    "Beautiful vintage leather jacket in excellent condition. Worn only a few times. Perfect for fall and winter. Features classic design with zipper closure and multiple pockets. Originally purchased from a high-end boutique.",
  category: "Outerwear",
  type: "Casual",
  size: "M",
  condition: "Excellent",
  points: 35,
  images: [
    "/placeholder.svg?height=500&width=500",
    "/placeholder.svg?height=500&width=500",
    "/placeholder.svg?height=500&width=500",
  ],
  tags: ["vintage", "leather", "classic", "fall", "winter"],
  user: {
    name: "Sarah M.",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 4.8,
    swaps: 23,
    joinDate: "March 2023",
  },
  availability: "available",
  location: "New York, NY",
  postedDate: "3 days ago",
  views: 47,
  likes: 12,
}

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [liked, setLiked] = useState(false)

  const handleSwapRequest = () => {
    toast({
      title: "Swap request sent!",
      description: "The owner will be notified of your swap request.",
    })
  }

  const handleRedeemWithPoints = () => {
    if (user && user.points >= mockItem.points) {
      toast({
        title: "Item redeemed!",
        description: `You've redeemed this item for ${mockItem.points} points.`,
      })
    } else {
      toast({
        title: "Insufficient points",
        description: `You need ${mockItem.points} points to redeem this item.`,
        variant: "destructive",
      })
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === mockItem.images.length - 1 ? 0 : prev + 1))
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? mockItem.images.length - 1 : prev - 1))
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-20 md:pb-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square relative bg-white rounded-lg overflow-hidden">
                <Image
                  src={mockItem.images[currentImageIndex] || "/placeholder.svg"}
                  alt={mockItem.title}
                  fill
                  className="object-cover"
                />

                {mockItem.images.length > 1 && (
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

              {mockItem.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {mockItem.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex ? "border-green-500" : "border-gray-200"
                      }`}
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`${mockItem.title} ${index + 1}`}
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{mockItem.title}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {mockItem.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {mockItem.postedDate}
                      </div>
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-1" />
                        {mockItem.views} views
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center bg-green-100 text-green-800 px-3 py-2 rounded-full">
                    <Star className="h-4 w-4 mr-1" />
                    <span className="font-semibold">{mockItem.points} points</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{mockItem.category}</Badge>
                  <Badge variant="outline">{mockItem.type}</Badge>
                  <Badge variant="outline">Size {mockItem.size}</Badge>
                  <Badge variant="outline">{mockItem.condition}</Badge>
                  <Badge
                    variant={mockItem.availability === "available" ? "default" : "secondary"}
                    className={mockItem.availability === "available" ? "bg-green-600" : ""}
                  >
                    {mockItem.availability}
                  </Badge>
                </div>

                <p className="text-gray-700 leading-relaxed mb-4">{mockItem.description}</p>

                <div className="flex flex-wrap gap-2">
                  {mockItem.tags.map((tag) => (
                    <span key={tag} className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
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
                      <AvatarImage src={mockItem.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{mockItem.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{mockItem.user.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1 text-yellow-500" />
                          {mockItem.user.rating}
                        </div>
                        <span>{mockItem.user.swaps} successful swaps</span>
                        <span>Joined {mockItem.user.joinDate}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleSwapRequest}
                  className="w-full"
                  size="lg"
                  disabled={mockItem.availability !== "available"}
                >
                  <ArrowLeftRight className="h-5 w-5 mr-2" />
                  Request Swap
                </Button>

                <Button
                  onClick={handleRedeemWithPoints}
                  variant="outline"
                  className="w-full bg-transparent"
                  size="lg"
                  disabled={mockItem.availability !== "available" || user.points < mockItem.points}
                >
                  <Star className="h-5 w-5 mr-2" />
                  Redeem for {mockItem.points} Points
                  {user.points < mockItem.points && (
                    <span className="ml-2 text-red-500">(Need {mockItem.points - user.points} more)</span>
                  )}
                </Button>

                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <Heart className="h-4 w-4 mr-2" />
                    Save ({mockItem.likes})
                  </Button>
                  <Button variant="outline" className="flex-1 bg-transparent">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Additional Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Condition:</span>
                    <span className="font-medium">{mockItem.condition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{mockItem.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{mockItem.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{mockItem.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Posted:</span>
                    <span className="font-medium">{mockItem.postedDate}</span>
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
