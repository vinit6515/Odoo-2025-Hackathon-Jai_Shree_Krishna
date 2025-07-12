import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Recycle, Users, Award, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const featuredItems = [
  {
    id: 1,
    title: "Vintage Denim Jacket",
    category: "Outerwear",
    condition: "Excellent",
    points: 25,
    image: "/placeholder.svg?height=200&width=200",
    user: "Sarah M.",
  },
  {
    id: 2,
    title: "Designer Silk Scarf",
    category: "Accessories",
    condition: "Like New",
    points: 15,
    image: "/placeholder.svg?height=200&width=200",
    user: "Emma K.",
  },
  {
    id: 3,
    title: "Cotton Summer Dress",
    category: "Dresses",
    condition: "Good",
    points: 20,
    image: "/placeholder.svg?height=200&width=200",
    user: "Lisa R.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Recycle className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">ReWear</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Sustainable Fashion Through
            <span className="text-green-600 block">Community Exchange</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Give your unused clothes a new life. Swap, redeem, and discover unique pieces while reducing textile waste
            and building a sustainable wardrobe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Swapping <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/browse">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                Browse Items
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How ReWear Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">List Your Items</h3>
                <p className="text-gray-600">
                  Upload photos and details of clothes you no longer wear. Include purchase receipts for verification.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Recycle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Swap or Redeem</h3>
                <p className="text-gray-600">
                  Exchange items directly with other users or use points to redeem items you love.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Earn Points</h3>
                <p className="text-gray-600">
                  Get points for successful swaps and use them to discover new pieces for your wardrobe.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Items</h2>
            <Link href="/browse">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square relative">
                  <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <div className="flex items-center text-green-600">
                      <Star className="h-4 w-4 mr-1" />
                      <span className="font-semibold">{item.points}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="secondary">{item.category}</Badge>
                      <Badge variant="outline">{item.condition}</Badge>
                    </div>
                    <span className="text-sm text-gray-500">by {item.user}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-green-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Sustainable Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users already making a difference through clothing exchange
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Join ReWear Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Recycle className="h-6 w-6" />
            <span className="text-xl font-bold">ReWear</span>
          </div>
          <p className="text-gray-400">© 2024 ReWear. Making fashion sustainable, one swap at a time.</p>
        </div>
      </footer>
    </div>
  )
}
