"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Star, Heart, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { itemsApi, categoriesApi } from "@/lib/api"
import { LoadingPage } from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"

const conditions = ["All", "Like New", "Excellent", "Good", "Fair"]
const sizes = ["All", "XS", "S", "M", "L", "XL", "6", "8", "10", "12", "14", "16"]

export default function BrowsePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedCondition, setSelectedCondition] = useState("All")
  const [selectedSize, setSelectedSize] = useState("All")
  const [swapItems, setSwapItems] = useState([])
  const [donationItems, setDonationItems] = useState([])
  const [categories, setCategories] = useState(["All"])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("swaps")

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getCategories()
        if (response.success) {
          setCategories(["All", ...response.categories.map((cat: any) => cat.name)])
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true)
        setError("")

        const params: any = {}
        if (selectedCategory !== "All") params.category = selectedCategory
        if (selectedCondition !== "All") params.condition = selectedCondition
        if (selectedSize !== "All") params.size = selectedSize
        if (searchTerm.trim()) params.search = searchTerm.trim()

        // Fetch swap items
        const swapResponse = await itemsApi.getItems({ ...params, listing_type: "swap", status: "approved" })
        if (swapResponse.success) {
          setSwapItems(swapResponse.items)
        }

        // Fetch donation items
        const donationResponse = await itemsApi.getItems({ ...params, listing_type: "donation", status: "approved" })
        if (donationResponse.success) {
          setDonationItems(donationResponse.items)
        }
      } catch (error) {
        console.error("Fetch error:", error)
        setError("Failed to load items. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load items. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchItems, 300)
    return () => clearTimeout(debounceTimer)
  }, [selectedCategory, selectedCondition, selectedSize, searchTerm, toast])

  const toggleLike = (itemId: number, type: "swap" | "donation") => {
    if (type === "swap") {
      setSwapItems(swapItems.map((item: any) => (item.id === itemId ? { ...item, liked: !item.liked } : item)))
    } else {
      setDonationItems(donationItems.map((item: any) => (item.id === itemId ? { ...item, liked: !item.liked } : item)))
    }
  }

  const ItemCard = ({ item, type }: { item: any; type: "swap" | "donation" }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="aspect-square relative">
        {item.primary_image ? (
          <Image
            src={`http://localhost:5000/uploads/items/${item.primary_image}`}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
        <button
          onClick={() => toggleLike(item.id, type)}
          className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
        >
          <Heart className={`h-4 w-4 ${item.liked ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
        </button>
        <div className="absolute top-3 left-3 flex items-center">
          {type === "donation" ? (
            <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              FREE
            </div>
          ) : (
            <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <Star className="h-3 w-3 mr-1" />
              {item.points}
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{item.title}</h3>
          <p className="text-sm text-gray-600">by {item.owner?.name}</p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            <Badge variant="secondary" className="text-xs">
              {item.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {item.condition}
            </Badge>
          </div>
          <Badge variant="outline" className="text-xs">
            Size {item.size}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags?.slice(0, 2).map((tag: string) => (
            <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              #{tag}
            </span>
          ))}
          {item.tags?.length > 2 && <span className="text-xs text-gray-500">+{item.tags.length - 2}</span>}
        </div>

        <Link href={`/item/${item.id}`}>
          <Button className="w-full" size="sm">
            {type === "donation" ? "Claim Item" : "View Details"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in</div>
  }

  if (loading) {
    return <LoadingPage message="Loading items..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="pt-20 pb-20 md:pb-8 px-4">
          <div className="container mx-auto">
            <div className="text-center py-12">
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-20 md:pb-8 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Items</h1>
            <p className="text-gray-600">Discover amazing clothing items from our community</p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search items, tags, or users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {condition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {sizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Swaps and Donations */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="swaps" className="flex items-center space-x-2">
                <ArrowUpDown className="h-4 w-4" />
                <span>Swaps ({swapItems.length})</span>
              </TabsTrigger>
              <TabsTrigger value="donations" className="flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span>Donations ({donationItems.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="swaps">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-gray-600">{swapItems.length} items available for swap</p>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Sort by: Newest</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {swapItems.map((item: any) => (
                  <ItemCard key={item.id} item={item} type="swap" />
                ))}
              </div>

              {swapItems.length === 0 && (
                <div className="text-center py-12">
                  <ArrowUpDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No swap items found</p>
                  <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="donations">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-gray-600">{donationItems.length} items available for free</p>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Sort by: Newest</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {donationItems.map((item: any) => (
                  <ItemCard key={item.id} item={item} type="donation" />
                ))}
              </div>

              {donationItems.length === 0 && (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No donation items found</p>
                  <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
