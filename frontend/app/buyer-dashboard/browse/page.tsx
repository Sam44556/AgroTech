'use client'
import { useRouter } from 'next/navigation' // ADD THIS
import { useSocket } from '@/lib/socket-context' // ADD THIS
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  Search, MapPin, Star, Heart, MessageSquare, ShoppingCart, Bell, Leaf,
  Grid, List, SlidersHorizontal, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { apiGet, apiPost } from '@/lib/api'

export default function BrowseListingsPage() {
  const router = useRouter() // ADD THIS
  const { socket } = useSocket()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCrop, setSelectedCrop] = useState('all')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [priceRange, setPriceRange] = useState([0, 20000])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<any>(null)
const [negotiating, setNegotiating] = useState<string | null>(null)
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCrop !== 'all') params.append('category', selectedCrop)
      if (selectedRegion !== 'all') params.append('location', selectedRegion)
      if (priceRange[0] > 0) params.append('minPrice', String(priceRange[0]))
      if (priceRange[1] < 20000) params.append('maxPrice', String(priceRange[1]))
      params.append('page', String(page))
      params.append('limit', '12')

      const res = await apiGet<any>(`/api/buyer/browse?${params.toString()}`)
      if (res.success) {
        setProducts(res.data.products || [])
        setPagination(res.data.pagination)
        if (res.data.filters) {
          setCategories(res.data.filters.categories?.map((c: any) => c.name) || [])
          setLocations(res.data.filters.locations || [])
        }
      }
    } catch (err: any) {
      console.error('Failed to browse products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchProducts(1)
  }

  const toggleFavorite = async (productId: string) => {
    try {
      await apiPost(`/api/buyer/browse/${productId}/favorite`)
      setFavoriteIds(prev =>
        prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
      )
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  const handleStartNegotiation = (farmerId: string) => {
    if (!socket || negotiating) return
    
    setNegotiating(true)
    
    // Emit start_conversation event to backend
    socket.emit('start_conversation', { recipientId: farmerId })
    
    // Listen for conversation_ready event
    const handleConversationReady = (data: { conversation?: { id: string } }) => {
      socket.off('conversation_ready', handleConversationReady)
      setNegotiating(false)
      // Redirect to chat page
      router.push('/buyer-dashboard/chat')
    }
    
    socket.on('conversation_ready', handleConversationReady)
    
    // Timeout fallback in case of no response
    setTimeout(() => {
      socket.off('conversation_ready', handleConversationReady)
      setNegotiating(false)
    }, 5000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AgroLink</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/buyer-dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
              <Link href="/buyer-dashboard/browse" className="text-blue-600 font-medium">Browse</Link>
              <Link href="/buyer-dashboard/chat" className="text-gray-600 hover:text-blue-600">Negotiations</Link>
              <Link href="/buyer-dashboard/favorites" className="text-gray-600 hover:text-blue-600">Favorites</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
              <Link href="/buyer-dashboard/profile">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-blue-100 text-blue-700">BD</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Browse Listings</h2>
          <p className="text-gray-600">Find fresh produce from local farmers</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by crop name..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Select value={selectedCrop} onValueChange={(v) => { setSelectedCrop(v); }}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Crop Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Crops</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRegion} onValueChange={(v) => { setSelectedRegion(v); }}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Region" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline"><SlidersHorizontal className="h-4 w-4 mr-2" /> Filters</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Advanced Filters</SheetTitle>
                <SheetDescription>Refine your search results</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Price Range (Birr per quintal)</label>
                  <div className="px-2">
                    <Slider value={priceRange} onValueChange={setPriceRange} max={20000} step={100} className="mt-2" />
                    <div className="flex justify-between mt-2 text-sm text-gray-500">
                      <span>{priceRange[0].toLocaleString()} Br</span>
                      <span>{priceRange[1].toLocaleString()} Br</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full" onClick={() => { handleSearch(); }}>Apply Filters</Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex border rounded-lg overflow-hidden">
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-blue-600' : ''}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-blue-600' : ''}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-4">{pagination?.totalCount || products.length} listings found</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-40 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                  <Leaf className="h-16 w-16 text-green-400" />
                  <button onClick={() => toggleFavorite(product.id)} className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
                    <Heart className={`h-4 w-4 ${favoriteIds.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                  <Badge className="absolute top-3 left-3 bg-green-600">{product.category?.name || 'Produce'}</Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-xl font-bold text-green-600">{product.price?.toLocaleString()} Br<span className="text-sm font-normal text-gray-500">/unit</span></p>
                  <p className="text-sm text-gray-500 mb-2">{product.quantity} units available</p>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <MapPin className="h-3 w-3 mr-1" />{product.farmer?.location || 'N/A'}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                          {product.farmer?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-700">{product.farmer?.name}</span>
                    </div>
                    {product.averageRating > 0 && (
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-amber-500 mr-1" />
                        <span className="text-sm text-gray-600">{product.averageRating?.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleStartNegotiation(product.farmer?.id || '')}
                    disabled={!!negotiating || !product.farmer?.id}
                  >
                    {negotiating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Starting...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" /> Negotiate
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center">
                        <Leaf className="h-10 w-10 text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <Badge className="bg-green-100 text-green-700">{product.category?.name}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">{product.quantity} units available</p>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />{product.farmer?.location || 'N/A'}
                        </div>
                        <div className="flex items-center mt-2 space-x-3">
                          <span className="text-sm text-gray-700">{product.farmer?.name}</span>
                          {product.averageRating > 0 && (
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-amber-500 mr-1" />
                              <span className="text-sm text-gray-600">{product.averageRating?.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{product.price?.toLocaleString()} Br</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => toggleFavorite(product.id)}>
                          <Heart className={`h-4 w-4 ${favoriteIds.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700" 
                          size="sm"
                          onClick={() => handleStartNegotiation(product.farmer?.id || '')}
                          disabled={negotiating || !product.farmer?.id}
                        >
                          {negotiating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Starting...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="h-4 w-4 mr-2" /> Negotiate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {pagination && pagination.total > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            <Button variant="outline" disabled={!pagination.hasPrev} onClick={() => fetchProducts(pagination.current - 1)}>Previous</Button>
            <span className="flex items-center px-4 text-sm text-gray-600">Page {pagination.current} of {pagination.total}</span>
            <Button variant="outline" disabled={!pagination.hasNext} onClick={() => fetchProducts(pagination.current + 1)}>Next</Button>
          </div>
        )}
      </main>
    </div>
  )
}
