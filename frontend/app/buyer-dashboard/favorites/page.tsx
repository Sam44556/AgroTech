'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, Heart, MessageSquare, MapPin, Star, Trash2, ShoppingCart, Bell,
  Leaf, Clock, TrendingUp, Package, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { apiGet, apiDelete } from '@/lib/api'

export default function FavoritesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const res = await apiGet<any>('/api/buyer/favorites')
      if (res.success) {
        setFavorites(res.data.favorites || [])
      }
    } catch (err: any) {
      console.error('Failed to load favorites:', err)
      setError(err.message || 'Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (favoriteId: string) => {
    try {
      await apiDelete(`/api/buyer/favorites/${favoriteId}`)
      setFavorites(prev => prev.filter(f => f.id !== favoriteId))
    } catch (err) {
      console.error('Failed to remove favorite:', err)
    }
  }

  const filteredFavorites = favorites.filter(item =>
    item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product?.farmer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return (a.product?.price || 0) - (b.product?.price || 0)
      case 'price-high': return (b.product?.price || 0) - (a.product?.price || 0)
      case 'rating': return (b.product?.averageRating || 0) - (a.product?.averageRating || 0)
      default: return 0
    }
  })

  const totalValue = favorites.reduce((sum, item) => sum + ((item.product?.price || 0) * (item.product?.quantity || 0)), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
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
              <Link href="/buyer-dashboard/browse" className="text-gray-600 hover:text-blue-600">Browse</Link>
              <Link href="/buyer-dashboard/chat" className="text-gray-600 hover:text-blue-600">Negotiations</Link>
              <Link href="/buyer-dashboard/favorites" className="text-blue-600 font-medium">Favorites</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
              <Link href="/buyer-dashboard/profile">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-blue-100 text-blue-700">BD</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Saved Listings</h2>
            <p className="text-gray-600">Track your favorite produce listings</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            <span className="text-gray-700 font-medium">{favorites.length} saved items</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Saved</p>
                  <p className="text-2xl font-bold text-gray-900">{favorites.length}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg"><Heart className="h-6 w-6 text-red-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Est. Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">{totalValue.toLocaleString()} Br</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg"><Package className="h-6 w-6 text-green-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Available</p>
                  <p className="text-2xl font-bold text-gray-900">{favorites.filter(f => f.product?.status === 'AVAILABLE').length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg"><TrendingUp className="h-6 w-6 text-blue-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search saved listings..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Farmer Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {sortedFavorites.length > 0 ? (
          <div className="space-y-4">
            {sortedFavorites.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-green-100 rounded-lg flex items-center justify-center">
                        <Leaf className="h-10 w-10 text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{item.product?.name}</h3>
                          <Badge className="bg-green-100 text-green-700">{item.product?.category?.name}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">{item.product?.quantity} units available</p>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />{item.product?.farmer?.location || 'N/A'}
                        </div>
                        <div className="flex items-center mt-2 space-x-4">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                                {item.product?.farmer?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-700">{item.product?.farmer?.name}</span>
                          </div>
                          {item.product?.averageRating > 0 && (
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-amber-500 mr-1" />
                              <span className="text-sm text-gray-600">{item.product.averageRating.toFixed(1)}</span>
                            </div>
                          )}
                          <div className="flex items-center text-gray-400 text-sm">
                            <Clock className="h-3 w-3 mr-1" />
                            Saved {new Date(item.addedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{item.product?.price?.toLocaleString()} Br</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => removeFavorite(item.id)} className="text-red-500 hover:text-red-600 hover:border-red-300">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" /> Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved listings</h3>
              <p className="text-gray-500 mb-4">Start browsing and save listings you&apos;re interested in</p>
              <Link href="/buyer-dashboard/browse">
                <Button className="bg-blue-600 hover:bg-blue-700">Browse Listings</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
