'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown,
  Search,
  Leaf,
  Bell,
  RefreshCcw,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'
import Link from 'next/link'
import { apiGet } from '@/lib/api'

interface PriceData {
  id: string
  crop: string
  currentPrice: number
  previousPrice: number
  change: number
  changePercent: number
  unit: string
  lastUpdated: string
  region: string
}

export default function MarketPricesPage() {
  const [selectedCrop, setSelectedCrop] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPrices = async () => {
      setIsLoading(true)
      setError('')
      try {
        const cropParam = selectedCrop === 'all' ? '' : selectedCrop
        const response = await apiGet<{ success: boolean; data: any[] }>(
          `/api/farmer/market?crop=${encodeURIComponent(cropParam)}&search=${encodeURIComponent(searchQuery)}`
        )

        setPriceData((response.data || []).map((item) => ({
          id: item.id,
          crop: item.cropName,
          currentPrice: item.currentPrice,
          previousPrice: item.previousPrice,
          change: item.change,
          changePercent: item.changePercent,
          unit: item.unit,
          lastUpdated: new Date(item.updatedAt).toLocaleString(),
          region: item.region
        })))
      } catch (err: any) {
        setError(err.message || 'Failed to load market prices')
      } finally {
        setIsLoading(false)
      }
    }

    loadPrices()
  }, [selectedCrop, searchQuery])

  const cropTypes = ["all", "teff", "coffee", "wheat", "maize", "sesame", "chickpea", "sorghum", "barley", "lentils"]

  const filteredPrices = priceData

  const topGainers = [...priceData].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3)
  const topLosers = [...priceData].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3)

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />
    if (change < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AgroLink</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/farmer-dashboard" className="text-gray-600 hover:text-green-600">Dashboard</Link>
              <Link href="/farmer-dashboard/produce" className="text-gray-600 hover:text-green-600">My Produce</Link>
              <Link href="/farmer-dashboard/chat" className="text-gray-600 hover:text-green-600">Messages</Link>
              <Link href="/farmer-dashboard/browse-experts" className="text-gray-600 hover:text-green-600">Browse Experts</Link>
              <Link href="/farmer-dashboard/market" className="text-green-600 font-medium">Market Prices</Link>
              <Link href="/farmer-dashboard/weather" className="text-gray-600 hover:text-green-600">Weather</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </Button>
              <Link href="/farmer-dashboard/settings">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-green-100 text-green-700">FD</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Market Prices</h2>
            <p className="text-gray-600">Live ECX commodity prices</p>
          </div>
          <Button variant="outline" className="mt-4 md:mt-0">
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh Prices
          </Button>
        </div>

        {error && (
          <div className="mb-6 text-red-600">{error}</div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-green-100">Top Gainers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topGainers.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm">{item.crop.split(' ')[0]}</span>
                    <span className="flex items-center text-sm font-medium">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{item.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-red-100">Top Losers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topLosers.filter(item => item.changePercent < 0).map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm">{item.crop.split(' ')[0]}</span>
                    <span className="flex items-center text-sm font-medium">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      {item.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-blue-100">Market Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Trading Status</span>
                  <Badge className="bg-green-400 text-green-900">Open</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Update</span>
                  <span className="text-sm font-medium">10 min ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Commodities</span>
                  <span className="text-sm font-medium">{priceData.length} tracked</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search commodities..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedCrop} onValueChange={setSelectedCrop}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by crop" />
            </SelectTrigger>
            <SelectContent>
              {cropTypes.map(crop => (
                <SelectItem key={crop} value={crop}>
                  {crop === 'all' ? 'All Crops' : crop.charAt(0).toUpperCase() + crop.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Table */}
        <Card>
          <CardHeader>
            <CardTitle>Live Commodity Prices</CardTitle>
            <CardDescription>Ethiopian Commodity Exchange (ECX) prices in Birr</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Commodity</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Current Price</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Previous</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Change</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">% Change</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Region</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrices.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Leaf className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="font-medium text-gray-900">{item.crop}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-gray-900">{item.currentPrice.toLocaleString()} Br</span>
                        <span className="text-xs text-gray-500 block">/{item.unit}</span>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-500">
                        {item.previousPrice.toLocaleString()} Br
                      </td>
                      <td className={`py-4 px-4 text-right ${getPriceChangeColor(item.change)}`}>
                        <span className="flex items-center justify-end">
                          {getPriceChangeIcon(item.change)}
                          <span className="ml-1">{Math.abs(item.change).toLocaleString()} Br</span>
                        </span>
                      </td>
                      <td className={`py-4 px-4 text-right font-medium ${getPriceChangeColor(item.changePercent)}`}>
                        {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline">{item.region}</Badge>
                      </td>
                      <td className="py-4 px-4 text-right text-sm text-gray-500">
                        {item.lastUpdated}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Price Alert */}
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Set Price Alerts</p>
                <p className="text-sm text-amber-600">Get notified when your crop prices change significantly</p>
              </div>
            </div>
            <Button variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100">
              Set Alert
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
