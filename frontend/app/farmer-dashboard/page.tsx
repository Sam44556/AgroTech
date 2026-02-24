'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  DollarSign, 
  MessageSquare, 
  TrendingUp, 
  CloudRain, 
  Bell, 
  Plus,
  Sun,
  AlertTriangle,
  Leaf,
} from 'lucide-react'
import Link from 'next/link'
import { apiGet } from '@/lib/api'

interface DashboardStats {
  listings: {
    total: number
    totalValue: number
    averagePrice: number
  }
  orders: {
    pending: number
    confirmed: number
    completed: number
    total: number
    successRate: number
  }
  revenue: {
    thisMonth: number
    averageOrderValue: number
    totalEarnings: number
  }
  growth: {
    revenueGrowth: number
    ordersGrowth: number
    listingsGrowth: number
  }
}

interface DashboardData {
  farmer: {
    name?: string
    farmName?: string
    location?: string
  }
  stats: DashboardStats
  recentListings: {
    id: string
    name: string
    price: number
    quantity: number
    status: string
    images: string[]
    totalValue: number
    createdAt: string
    ordersCount: number
  }[]
  recentOrders: {
    id: string
    status: string
    totalAmount: number
    itemsCount: number
    items: string[]
    createdAt: string
  }[]
  insights: {
    title: string
    description: string
    type: string
  }[]
}

interface MarketPrice {
  id: string
  cropName: string
  currentPrice: number
  previousPrice: number
  change: number
  changePercent: number
  unit: string
  region: string
  updatedAt: string
}

interface WeatherAlert {
  title: string
  description: string
  severity: string
  location: string
}

export default function FarmerDashboard() {
  console.log('🚀 FarmerDashboard component rendering!')
  
  const [weatherAlert, setWeatherAlert] = useState<WeatherAlert | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([])
  const [recentListingsData, setRecentListingsData] = useState<DashboardData['recentListings']>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true)
      setError('')
      
      // Load each API independently so one failure doesn't break others
      try {
        const dashboardRes = await apiGet<{ success: boolean; data: DashboardData }>('/api/farmer/dashboard')
        setDashboardData(dashboardRes.data)
      } catch (err: any) {
        console.error('Dashboard API error:', err)
      }

      try {
        const marketRes = await apiGet<{ success: boolean; data: MarketPrice[] }>('/api/farmer/market')
        setMarketPrices(marketRes.data || [])
      } catch (err: any) {
        console.error('Market API error:', err)
      }

      try {
        const alertsRes = await apiGet<{ success: boolean; data: { alerts: WeatherAlert[] } }>('/api/farmer/weather/alerts')
        setWeatherAlert(alertsRes.data?.alerts?.[0] || null)
      } catch (err: any) {
        console.error('Weather API error:', err)
      }

      try {
        const recentCropsRes = await apiGet<{ success: boolean; data: DashboardData['recentListings'] }>('/api/farmer/crops/recent')
        console.log('Recent crops response:', recentCropsRes)
        setRecentListingsData(recentCropsRes.data || [])
      } catch (err: any) {
        console.error('Recent crops API error:', err)
      }

      setIsLoading(false)
    }

    loadDashboard()
  }, [])

  const stats = {
    activeListings: dashboardData?.stats?.listings?.total || 0,
    soldListings: dashboardData?.stats?.orders?.completed || 0,
    newMessages: 0,
    currentPrice: marketPrices[0]?.currentPrice || 0,
    priceChange: marketPrices[0]?.changePercent || 0,
    priceLabel: marketPrices[0]?.cropName || 'Market Price'
  }

  const notifications = (dashboardData?.recentOrders || []).map((order) => ({
    id: order.id,
    message: `Order ${order.id} ${order.status.toLowerCase()} - ${order.items.join(', ')}`,
    time: new Date(order.createdAt).toLocaleString(),
    type: order.status === 'DELIVERED' ? 'sale' : 'message'
  }))

  const recentListings = recentListingsData.map((listing) => ({
    id: listing.id,
    crop: listing.name,
    quantity: `${listing.quantity} quintals`,
    price: listing.price,
    status: listing.status === 'AVAILABLE' ? 'active' : listing.status === 'SOLD_OUT' ? 'sold' : 'inactive',
    images: listing.images || [],
    name: listing.name // for alt text in image
  }))

  console.log('recentListingsData:', recentListingsData)
  console.log('recentListings mapped:', recentListings)

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Weather Alert Banner */}
        {weatherAlert && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CloudRain className="h-6 w-6 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Weather Alert: {weatherAlert.title}</p>
                <p className="text-sm text-amber-600">{weatherAlert.description}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setWeatherAlert(null)}>Dismiss</Button>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back{dashboardData?.farmer?.name ? `, ${dashboardData.farmer.name}` : ''}! 👋
          </h2>
          <p className="text-gray-600">Here's what's happening with your farm today.</p>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Listings</CardTitle>
              <Package className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.activeListings}</div>
              <p className="text-xs text-green-600 mt-1">+2 this week</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sold Listings</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.soldListings}</div>
              <p className="text-xs text-blue-600 mt-1">+5 this month</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">New Messages</CardTitle>
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.newMessages}</div>
              <p className="text-xs text-purple-600 mt-1">3 unread</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stats.priceLabel}</CardTitle>
              <DollarSign className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.currentPrice ? stats.currentPrice.toLocaleString() : 0} Br</div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> {stats.priceChange.toFixed(2)}% today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Listings */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Listings</CardTitle>
                <CardDescription>Your latest produce listings</CardDescription>
              </div>
              <Link href="/farmer-dashboard/produce">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" /> New Listing
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentListings.map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                       {listing.images && listing.images.length > 0 ? (
                                      <div className="h-40 overflow-hidden">
                                        <img src={listing.images[0]} alt={listing.name} className="w-full h-full object-cover" />
                                      </div>
                                    ) : (
                                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Leaf className="h-6 w-6 text-green-600" />
                      </div>
                                    )}
                      
                      <div>
                        <p className="font-medium text-gray-900">{listing.crop}</p>
                        <p className="text-sm text-gray-500">{listing.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{listing.price.toLocaleString()} Br/quintal</p>
                      <Badge variant={listing.status === 'active' ? 'default' : 'secondary'} 
                             className={listing.status === 'active' ? 'bg-green-100 text-green-700' : ''}>
                        {listing.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {!isLoading && recentListings.length === 0 && (
                  <div className="text-sm text-gray-500">No recent listings yet.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Stay updated with your farm activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      notification.type === 'message' ? 'bg-purple-100' :
                      notification.type === 'price' ? 'bg-amber-100' : 'bg-green-100'
                    }`}>
                      {notification.type === 'message' && <MessageSquare className="h-4 w-4 text-purple-600" />}
                      {notification.type === 'price' && <TrendingUp className="h-4 w-4 text-amber-600" />}
                      {notification.type === 'sale' && <DollarSign className="h-4 w-4 text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  </div>
                ))}
                {!isLoading && notifications.length === 0 && (
                  <div className="text-sm text-gray-500">No notifications yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/farmer-dashboard/produce/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-medium text-gray-900">Add Listing</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/farmer-dashboard/market">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-medium text-gray-900">Market Prices</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/farmer-dashboard/chat">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <p className="font-medium text-gray-900">Messages</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/farmer-dashboard/weather">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                  <Sun className="h-6 w-6 text-amber-600" />
                </div>
                <p className="font-medium text-gray-900">Weather</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
