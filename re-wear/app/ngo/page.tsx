"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Phone, Mail, Heart, Users, Globe, Filter } from "lucide-react"
import Image from "next/image"

// Hardcoded Indian NGO data with actual images
const ngosData = [
  {
    id: 1,
    name: "Goonj",
    description:
      "A grassroots organization that works on disaster relief, humanitarian aid, and community development. They run clothing drives and transform urban waste into rural development resources.",
    location: "New Delhi, Delhi",
    category: "Disaster Relief",
    phone: "+91 11 2634 4462",
    email: "info@goonj.org",
    website: "www.goonj.org",
    image: "/images/ngos/goonj.png",
    established: "1999",
    volunteers: "500+",
    programs: ["Clothing Drives", "Disaster Relief", "Rural Development"],
  },
  {
    id: 2,
    name: "Akshaya Patra Foundation",
    description:
      "Implementing the world's largest school meal programme, serving nutritious meals to children. Also involved in clothing and educational material distribution.",
    location: "Bengaluru, Karnataka",
    category: "Education & Nutrition",
    phone: "+91 80 3046 4700",
    email: "info@akshayapatra.org",
    website: "www.akshayapatra.org",
    image: "/images/ngos/akshaya-patra.png",
    established: "2000",
    volunteers: "1000+",
    programs: ["School Meals", "Education Support", "Clothing Distribution"],
  },
  {
    id: 3,
    name: "Smile Foundation",
    description:
      "Working towards the welfare of underprivileged children, youth and women through education, healthcare, and livelihood programs including clothing assistance.",
    location: "Mumbai, Maharashtra",
    category: "Child Welfare",
    phone: "+91 22 6155 7676",
    email: "info@smilefoundationindia.org",
    website: "www.smilefoundationindia.org",
    image: "/images/ngos/smile-foundation.png",
    established: "2002",
    volunteers: "800+",
    programs: ["Child Education", "Healthcare", "Clothing Support"],
  },
  {
    id: 4,
    name: "CRY - Child Rights and You",
    description:
      "Ensuring happier childhoods for underprivileged children through education, healthcare, protection from exploitation, and basic necessities including clothing.",
    location: "Chennai, Tamil Nadu",
    category: "Child Rights",
    phone: "+91 44 2834 0690",
    email: "info@cry.org",
    website: "www.cry.org",
    image: "/images/ngos/cry-india.png",
    established: "1979",
    volunteers: "600+",
    programs: ["Child Protection", "Education", "Basic Necessities"],
  },
  {
    id: 5,
    name: "Pratham",
    description:
      "Focused on providing quality education to underprivileged children. Also provides school uniforms, books, and other educational materials to students in need.",
    location: "Pune, Maharashtra",
    category: "Education",
    phone: "+91 20 2528 0404",
    email: "info@pratham.org",
    website: "www.pratham.org",
    image: "/images/ngos/pratham.png",
    established: "1995",
    volunteers: "700+",
    programs: ["Education Programs", "School Uniforms", "Learning Materials"],
  },
  {
    id: 6,
    name: "Helpage India",
    description:
      "Working for the cause and care of disadvantaged elderly people. Provides clothing, healthcare, and support services to senior citizens across India.",
    location: "Kolkata, West Bengal",
    category: "Elder Care",
    phone: "+91 33 2217 8417",
    email: "info@helpageindia.org",
    website: "www.helpageindia.org",
    image: "/images/ngos/helpage-india.png",
    established: "1978",
    volunteers: "400+",
    programs: ["Elder Care", "Healthcare", "Clothing Assistance"],
  },
  {
    id: 7,
    name: "Nanhi Kali",
    description:
      "Supporting the education of underprivileged girls by providing school supplies, uniforms, and educational support to help them complete their schooling.",
    location: "Hyderabad, Telangana",
    category: "Girl Child Education",
    phone: "+91 40 4033 4455",
    email: "info@nanhikali.org",
    website: "www.nanhikali.org",
    image: "/images/ngos/nanhi-kali.png",
    established: "1996",
    volunteers: "350+",
    programs: ["Girl Education", "School Uniforms", "Educational Materials"],
  },
  {
    id: 8,
    name: "Uday Foundation",
    description:
      "Empowering underprivileged communities through education, healthcare, and livelihood programs. Provides clothing and essential items to families in need.",
    location: "Jaipur, Rajasthan",
    category: "Community Development",
    phone: "+91 141 2234 5678",
    email: "contact@udayfoundation.org",
    website: "www.udayfoundation.org",
    image: "/images/ngos/uday-foundation.png",
    established: "2005",
    volunteers: "250+",
    programs: ["Community Development", "Healthcare", "Clothing Distribution"],
  },
  {
    id: 9,
    name: "Teach for India",
    description:
      "Addressing educational inequity by placing exceptional graduates as teachers in low-income schools. Also provides uniforms and school supplies to students.",
    location: "Ahmedabad, Gujarat",
    category: "Education",
    phone: "+91 79 4890 1234",
    email: "info@teachforindia.org",
    website: "www.teachforindia.org",
    image: "/images/ngos/teach-for-india.png",
    established: "2009",
    volunteers: "450+",
    programs: ["Teacher Training", "Student Support", "School Uniforms"],
  },
  {
    id: 10,
    name: "Sargam Sanstha",
    description:
      "Working for the rehabilitation and empowerment of street children and underprivileged youth. Provides shelter, education, clothing, and skill development.",
    location: "Lucknow, Uttar Pradesh",
    category: "Street Children",
    phone: "+91 522 2345 6789",
    email: "info@sargamsanstha.org",
    website: "www.sargamsanstha.org",
    image: "/images/ngos/sargam-sanstha.png",
    established: "2001",
    volunteers: "300+",
    programs: ["Street Children Care", "Skill Development", "Clothing Support"],
  },
]

const locations = [
  "All Locations",
  "New Delhi, Delhi",
  "Mumbai, Maharashtra",
  "Bengaluru, Karnataka",
  "Chennai, Tamil Nadu",
  "Kolkata, West Bengal",
  "Pune, Maharashtra",
  "Hyderabad, Telangana",
  "Jaipur, Rajasthan",
  "Ahmedabad, Gujarat",
  "Lucknow, Uttar Pradesh",
]

const categories = [
  "All Categories",
  "Disaster Relief",
  "Education & Nutrition",
  "Child Welfare",
  "Child Rights",
  "Education",
  "Elder Care",
  "Girl Child Education",
  "Community Development",
  "Street Children",
]

export default function NGOPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("All Locations")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [filteredNGOs, setFilteredNGOs] = useState(ngosData)

  // Filter NGOs based on search and filters
  const filterNGOs = () => {
    let filtered = ngosData

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (ngo) =>
          ngo.name.toLowerCase().includes(search) ||
          ngo.description.toLowerCase().includes(search) ||
          ngo.programs.some((program) => program.toLowerCase().includes(search)),
      )
    }

    if (selectedLocation !== "All Locations") {
      filtered = filtered.filter((ngo) => ngo.location === selectedLocation)
    }

    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter((ngo) => ngo.category === selectedCategory)
    }

    setFilteredNGOs(filtered)
  }

  // Update filters when search or filter values change
  useState(() => {
    filterNGOs()
  }, [searchTerm, selectedLocation, selectedCategory])

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, "_self")
  }

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, "_self")
  }

  const handleWebsite = (website: string) => {
    window.open(`https://${website}`, "_blank")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-20 pb-20 md:pb-8 px-4">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner NGOs</h1>
            <p className="text-gray-600">
              Connect with organizations making a difference in sustainable fashion and community support
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search NGOs, programs, or keywords..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        filterNGOs()
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Select
                    value={selectedLocation}
                    onValueChange={(value) => {
                      setSelectedLocation(value)
                      filterNGOs()
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value)
                      filterNGOs()
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-48">
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              {filteredNGOs.length} {filteredNGOs.length === 1 ? "organization" : "organizations"} found
            </p>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Sort by: Relevance</span>
            </div>
          </div>

          {/* NGO Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredNGOs.map((ngo) => (
              <Card key={ngo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <div className="aspect-video md:aspect-square relative">
                      <Image
                        src={ngo.image || "/placeholder.svg"}
                        alt={ngo.name}
                        fill
                        className="object-cover"
                        priority={ngo.id <= 4}
                      />
                    </div>
                  </div>

                  <div className="md:w-2/3 p-6">
                    <CardHeader className="p-0 mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-xl">{ngo.name}</CardTitle>
                        <Badge variant="secondary" className="ml-2">
                          {ngo.category}
                        </Badge>
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{ngo.location}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      <p className="text-gray-700 text-sm mb-4 line-clamp-3">{ngo.description}</p>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-gray-600">
                            <span className="font-medium">{ngo.volunteers}</span> volunteers
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 text-red-600 mr-2" />
                          <span className="text-gray-600">
                            Since <span className="font-medium">{ngo.established}</span>
                          </span>
                        </div>
                      </div>

                      {/* Programs */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Programs:</p>
                        <div className="flex flex-wrap gap-1">
                          {ngo.programs.slice(0, 3).map((program) => (
                            <span key={program} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {program}
                            </span>
                          ))}
                          {ngo.programs.length > 3 && (
                            <span className="text-xs text-gray-500">+{ngo.programs.length - 3} more</span>
                          )}
                        </div>
                      </div>

                      {/* Contact Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleCall(ngo.phone)} className="flex-1 min-w-0">
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEmail(ngo.email)}
                          className="flex-1 min-w-0"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWebsite(ngo.website)}
                          className="flex-1 min-w-0"
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          Website
                        </Button>
                      </div>

                      {/* Contact Info */}
                      <div className="mt-3 pt-3 border-t text-xs text-gray-500 space-y-1">
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-2" />
                          <span>{ngo.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-2" />
                          <span className="truncate">{ngo.email}</span>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredNGOs.length === 0 && (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No organizations found</p>
              <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
              <Button
                variant="outline"
                className="mt-4 bg-transparent"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedLocation("All Locations")
                  setSelectedCategory("All Categories")
                  setFilteredNGOs(ngosData)
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Call to Action */}
          <Card className="mt-12 bg-green-50 border-green-200">
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-green-900 mb-2">Want to Partner with Us?</h3>
              <p className="text-green-700 mb-6 max-w-2xl mx-auto">
                If you're an NGO working in sustainable fashion, community support, or environmental conservation, we'd
                love to collaborate with you to make a bigger impact together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => handleEmail("partnerships@rewear.in")}>
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Partnership Team
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleCall("+91 98765 43210")}
                  className="bg-transparent"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Call Us
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
