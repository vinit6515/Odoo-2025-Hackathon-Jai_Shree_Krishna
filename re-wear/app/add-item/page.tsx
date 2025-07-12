"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { X, Plus, FileText, ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { itemsApi } from "@/lib/api"

const categories = ["Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories", "Bags", "Jewelry"]

const conditions = ["Like New", "Excellent", "Good", "Fair"]

const sizes = ["XS", "S", "M", "L", "XL", "XXL", "6", "8", "10", "12", "14", "16"]

export default function AddItemPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    size: "",
    condition: "",
    tags: [] as string[],
  })

  const [images, setImages] = useState<File[]>([])
  const [bill, setBill] = useState<File | null>(null)
  const [currentTag, setCurrentTag] = useState("")
  const [loading, setLoading] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload maximum 5 images.",
        variant: "destructive",
      })
      return
    }
    setImages([...images, ...files])
  }

  const handleBillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBill(file)
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()],
      })
      setCurrentTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (images.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one image of your item.",
        variant: "destructive",
      })
      return
    }

    if (!bill) {
      toast({
        title: "Bill required",
        description: "Please upload the purchase bill for verification.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const formDataToSend = new FormData()

      // Add form fields
      formDataToSend.append("title", formData.title)
      formDataToSend.append("description", formData.description)
      formDataToSend.append("category", formData.category)
      formDataToSend.append("type", formData.type)
      formDataToSend.append("size", formData.size)
      formDataToSend.append("condition", formData.condition)

      // Add tags
      formData.tags.forEach((tag) => {
        formDataToSend.append("tags[]", tag)
      })

      // Add images
      images.forEach((image) => {
        formDataToSend.append("images", image)
      })

      // Add bill
      if (bill) {
        formDataToSend.append("bill", bill)
      }

      const response = await itemsApi.createItem(formDataToSend)

      if (response.success) {
        toast({
          title: "Success!",
          description: response.message,
        })
        router.push("/dashboard")
      } else {
        throw new Error(response.message || "Failed to create item")
      }
    } catch (error) {
      console.error("Create item error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-20 md:pb-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Item</h1>
            <p className="text-gray-600">List your unused clothing for exchange with the community</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>
                Provide detailed information about your item to attract potential swappers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Images Upload */}
                <div className="space-y-2">
                  <Label>Item Images (Max 5)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="images" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">Upload item images</span>
                          <input
                            id="images"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image) || "/placeholder.svg"}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Item Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Vintage Denim Jacket"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Input
                      id="type"
                      placeholder="e.g., Casual, Formal"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, size: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
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

                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map((condition) => (
                          <SelectItem key={condition} value={condition}>
                            {condition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your item in detail..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add tags (e.g., vintage, designer)"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                          {tag} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bill Upload */}
                <div className="space-y-2">
                  <Label>Purchase Bill/Receipt (Required for verification)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center">
                      <FileText className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-2">
                        <label htmlFor="bill" className="cursor-pointer">
                          <span className="text-sm font-medium text-gray-900">Upload bill (PDF or Image)</span>
                          <input
                            id="bill"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleBillUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  {bill && (
                    <div className="flex items-center space-x-2 mt-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">{bill.name}</span>
                      <button type="button" onClick={() => setBill(null)} className="text-red-500 hover:text-red-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Item for Approval"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
