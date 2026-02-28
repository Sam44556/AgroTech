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
  Plus,
  Sun,
  Leaf,
  ShoppingCart,
} from 'lucide-react'
import Link from 'next/link'
import { apiGet } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  activeListings: number       // Box 1: produce with AVAILABLE status
  soldCrops: number            // Box 2: order items with APPROVED status
  totalConversations: number   // Box 3: conversations farmer is part of
  totalRevenue: number         // Box 4: Σ (price × quantity) for APPROVED items
}

interface RecentListing {
  id: string
  name: string
  price: number
  quantity: number
  status: string
  images: string[]
  totalValue: number
  createdAt: string
  ordersCount: number
}

interface RecentOrder {
  id: string
  status: string
  totalAmount: number
  itemsCount: number
  items: string[]
  createdAt: string
}

interface DashboardData {
  farmer: {
    name?: string
    location?: string
  }
  stats: DashboardStats
  recentListings: RecentListing[]
  recentOrders: RecentOrder[]
  lastUpdated: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FarmerDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true)
      setError('')

      try {
        const res = await apiGet<{ success: boolean; data: DashboardData }>('/api/farmer/dashboard')
        if (res.success) {
          setDashboardData(res.data)
        }
      } catch (err: any) {
        console.error('Dashboard API error:', err)
        setError('Failed to load dashboard data. Please refresh.')
      }

      setIsLoading(false)
    }

    loadDashboard()
  }, [])

  // ── Derived values ─────────────────────────────────────────────────────────
  const stats = {
    activeListings: dashboardData?.stats?.activeListings ?? 0,
    soldCrops: dashboardData?.stats?.soldCrops ?? 0,
    totalConversations: dashboardData?.stats?.totalConversations ?? 0,
    totalRevenue: dashboardData?.stats?.totalRevenue ?? 0,
  }

  const recentListings = (dashboardData?.recentListings ?? []).map((l) => ({
    ...l,
    statusLabel: l.status === 'AVAILABLE' ? 'active' : l.status === 'SOLD_OUT' ? 'sold' : 'inactive',
  }))

  const recentOrders = dashboardData?.recentOrders ?? []

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back{dashboardData?.farmer?.name ? `, ${dashboardData.farmer.name}` : ''}! 👋
          </h2>
          <p className="text-gray-600">Here&apos;s what&apos;s happening with your farm today.</p>
          {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Box 1 – Active Listings */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Listings</CardTitle>
              <Package className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {isLoading ? '—' : stats.activeListings}
              </div>
              <p className="text-xs text-green-600 mt-1">Crops currently available</p>
            </CardContent>
          </Card>

          {/* Box 2 – Sold Crops (approved order items) */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Crops Sold</CardTitle>
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {isLoading ? '—' : stats.soldCrops}
              </div>
              <p className="text-xs text-blue-600 mt-1">Orders approved by you</p>
            </CardContent>
          </Card>

          {/* Box 3 – Conversations */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Conversations</CardTitle>
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {isLoading ? '—' : stats.totalConversations}
              </div>
              <p className="text-xs text-purple-600 mt-1">Active chats</p>
            </CardContent>
          </Card>

          {/* Box 4 – Total Revenue */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {isLoading ? '—' : `${stats.totalRevenue.toLocaleString()} Br`}
              </div>
              <p className="text-xs text-amber-600 mt-1">From all sold crops (price × qty)</p>
            </CardContent>
          </Card>

        </div>

        {/* ── Main Content Grid ───────────────────────────────────────────────── */}
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
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={listing.images[0]} alt={listing.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Leaf className="h-6 w-6 text-green-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{listing.name}</p>
                        <p className="text-sm text-gray-500">{listing.quantity} quintals</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{listing.price.toLocaleString()} Br/quintal</p>
                      <Badge
                        variant={listing.statusLabel === 'active' ? 'default' : 'secondary'}
                        className={listing.statusLabel === 'active' ? 'bg-green-100 text-green-700' : ''}
                      >
                        {listing.statusLabel}
                      </Badge>
                    </div>
                  </div>
                ))}
                {!isLoading && recentListings.length === 0 && (
                  <div className="text-sm text-gray-500 py-4 text-center">No listings yet. Add your first crop!</div>
                )}
                {isLoading && (
                  <div className="text-sm text-gray-400 py-4 text-center">Loading listings…</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders / Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Orders placed for your produce</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${order.status === 'CONFIRMED' ? 'bg-blue-100' :
                        order.status === 'DELIVERED' ? 'bg-green-100' :
                          order.status === 'CANCELLED' ? 'bg-red-100' : 'bg-amber-100'
                      }`}>
                      <TrendingUp className={`h-4 w-4 ${order.status === 'CONFIRMED' ? 'text-blue-600' :
                          order.status === 'DELIVERED' ? 'text-green-600' :
                            order.status === 'CANCELLED' ? 'text-red-600' : 'text-amber-600'
                        }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {order.items.join(', ')}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {!isLoading && recentOrders.length === 0 && (
                  <div className="text-sm text-gray-500 py-4 text-center">No orders yet.</div>
                )}
                {isLoading && (
                  <div className="text-sm text-gray-400 py-4 text-center">Loading orders…</div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ── Quick Actions ───────────────────────────────────────────────────── */}
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
          <Link href="/farmer-dashboard/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <p className="font-medium text-gray-900">Orders</p>
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