'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ShoppingCart, 
  MessageSquare, 
  TrendingUp, 
  MapPin, 
  Bell, 
  Search,
  Star,
  Package,
  Users,
  Leaf,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { apiGet } from '@/lib/api'

export default function BuyerDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiGet<any>('/api/buyer/dashboard')
        if (res.success) {
          setData(res.data)
        }
      } catch (err: any) {
        console.error('Failed to load dashboard:', err)
        setError(err.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  const overview = data?.overview || {}

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
              <Link href="/buyer-dashboard" className="text-blue-600 font-medium">Dashboard</Link>
              <Link href="/buyer-dashboard/browse" className="text-gray-600 hover:text-blue-600">Browse</Link>
              <Link href="/buyer-dashboard/chat" className="text-gray-600 hover:text-blue-600">Negotiations</Link>
              <Link href="/buyer-dashboard/favorites" className="text-gray-600 hover:text-blue-600">Favorites</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
              </Button>
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
          <h2 className="text-2xl font-bold text-gray-900">Welcome back! 👋</h2>
          <p className="text-gray-600">Find the best produce from local farmers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{overview.pendingOrders || 0}</div>
              <p className="text-xs text-blue-600 mt-1">awaiting delivery</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Saved Listings</CardTitle>
              <Star className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{overview.favoriteCount || 0}</div>
              <p className="text-xs text-amber-600 mt-1">favorite products</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Orders</CardTitle>
              <Package className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{overview.deliveredOrders || 0}</div>
              <p className="text-xs text-green-600 mt-1">of {overview.totalOrders || 0} total</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{(overview.totalSpent || 0).toLocaleString()} Br</div>
              <p className="text-xs text-purple-600 mt-1">~{(overview.totalSavings || 0).toLocaleString()} Br saved</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest purchases</CardDescription>
              </div>
              <Link href="/buyer-dashboard/browse">
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" /> Browse All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.recentOrders?.length > 0 ? (
                  data.recentOrders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                          <Leaf className="h-7 w-7 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.items?.[0]?.productName || 'Order'}
                            {order.itemCount > 1 && ` +${order.itemCount - 1} more`}
                          </p>
                          <p className="text-sm text-gray-500">{order.items?.[0]?.farmerName}</p>
                          <div className="flex items-center text-xs text-gray-400 mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {order.items?.[0]?.farmerLocation || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{order.totalAmount?.toLocaleString()} Br</p>
                        <Badge className={
                          order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                          order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No orders yet. Start browsing!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommended</CardTitle>
                <CardDescription>Products you might like</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.recommendedProducts?.length > 0 ? (
                    data.recommendedProducts.slice(0, 4).map((product: any) => (
                      <div key={product.id} className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Leaf className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.farmer?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 text-sm">{product.price?.toLocaleString()} Br</p>
                          {product.averageRating > 0 && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Star className="h-3 w-3 text-amber-500 mr-1" />
                              {product.averageRating.toFixed(1)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">No recommendations yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Month</CardTitle>
                <CardDescription>Your activity summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Orders</span>
                    <span className="font-medium text-gray-900">{data?.monthlyActivity?.totalOrders || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Spent</span>
                    <span className="font-medium text-gray-900">{(data?.monthlyActivity?.totalSpent || 0).toLocaleString()} Br</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Unique Products</span>
                    <span className="font-medium text-gray-900">{data?.monthlyActivity?.uniqueProducts || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/buyer-dashboard/browse">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-medium text-gray-900">Browse Listings</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/buyer-dashboard/chat">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-medium text-gray-900">Negotiations</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/buyer-dashboard/favorites">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <p className="font-medium text-gray-900">Favorites</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/buyer-dashboard/profile">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <p className="font-medium text-gray-900">My Profile</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
