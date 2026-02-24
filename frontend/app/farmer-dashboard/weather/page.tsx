'use client'

import { useState, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CloudRain, 
  Sun,
  Cloud,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  Bug,
  Leaf,
  Bell,
  MapPin,
  Calendar,
  Clock,
  Lightbulb
} from 'lucide-react'
import Link from 'next/link'
import { apiGet } from '@/lib/api'

export default function WeatherAdvisoryPage() {
  const [selectedLocation, setSelectedLocation] = useState('Oromia, Arsi')
  const [currentWeather, setCurrentWeather] = useState<any | null>(null)
  const [forecast, setForecast] = useState<any[]>([])
  const [weatherAlerts, setWeatherAlerts] = useState<any[]>([])
  const [expertTips, setExpertTips] = useState<any[]>([])
  const [pestAlerts, setPestAlerts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadWeather = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [weatherRes, forecastRes, alertsRes, articlesRes] = await Promise.all([
          apiGet<{ success: boolean; data: any; error?: string; message?: string }>('/api/farmer/weather'),
          apiGet<{ success: boolean; data: any; error?: string; message?: string }>('/api/farmer/weather/forecast'),
          apiGet<{ success: boolean; data: any; error?: string; message?: string }>('/api/farmer/weather/alerts'),
          apiGet<{ success: boolean; data: any; error?: string; message?: string }>('/api/articles?limit=6')
        ])

        console.log('Weather API responses:', { weatherRes, forecastRes, alertsRes, articlesRes })

        // Check for errors in responses
        if (weatherRes.error || weatherRes.message) {
          setError(weatherRes.message || weatherRes.error || 'Failed to load weather')
          return
        }

        const weatherData = weatherRes.data || {}
        const forecastData = forecastRes.data || {}
        const alertsData = alertsRes.data || {}

        setSelectedLocation(weatherData.location || selectedLocation)
        setCurrentWeather({
          location: weatherData.location,
          ...weatherData.current
        })

        setForecast((forecastData.forecast || []).map((item: any) => ({
          day: item.day,
          high: item.high,
          low: item.low,
          condition: item.condition,
          icon: item.condition?.includes('rain') ? CloudRain : item.condition?.includes('cloud') ? Cloud : Sun,
          rainChance: item.chanceOfRain || 0
        })))

        setWeatherAlerts((weatherData.alerts || []).map((alert: any, index: number) => ({
          id: index + 1,
          type: alert.title || alert.type,
          severity: alert.severity || 'info',
          message: alert.message || alert.action || 'Weather alert',
          region: weatherData.location || 'Your region',
          validUntil: 'Today'
        })))

        setExpertTips((articlesRes.data?.articles || []).map((article: any) => ({
          id: article.id,
          title: article.title,
          content: article.excerpt || article.content.substring(0, 150) + '...',
          author: article.author.name,
          authorRole: 'Expert',
          cropType: article.tags?.[0] || 'General',
          date: new Date(article.publishedAt || article.createdAt).toLocaleDateString()
        })))

        setPestAlerts((alertsData.alerts || []).map((alert: any, index: number) => ({
          id: index + 1,
          pest: alert.crop || 'Crop Alert',
          severity: alert.severity || 'medium',
          affectedCrops: [alert.crop || 'Crop'],
          regions: [weatherData.location || 'Region'],
          advice: alert.action || alert.alert || 'Monitor your crops closely'
        })))
      } catch (err: any) {
        setError(err.message || 'Failed to load weather data')
      } finally {
        setIsLoading(false)
      }
    }

    loadWeather()
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-300'
      case 'watch': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-amber-100 text-amber-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
    

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Weather & Advisory</h2>
          <p className="text-gray-600">Weather forecasts, alerts, and expert farming advice</p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading weather data...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">Error loading weather data</p>
            <p className="text-sm">{error}</p>
            <p className="text-sm mt-2">Make sure your location is set in your <Link href="/farmer-dashboard/settings" className="underline">profile settings</Link>.</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
        {/* Weather Alerts Banner */}
        {weatherAlerts.length > 0 && (
          <div className="space-y-3 mb-8">
            {weatherAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`rounded-lg p-4 border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{alert.type}</p>
                      <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">{alert.message}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" />{alert.region}</span>
                      <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />Valid until {alert.validUntil}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current Weather & Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Current Weather */}
          <Card className="lg:col-span-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription className="text-blue-100">Current Weather</CardDescription>
                  <CardTitle className="text-white flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" /> {currentWeather?.location || selectedLocation}
                  </CardTitle>
                </div>
                <Cloud className="h-12 w-12 text-white/80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold mb-4">{currentWeather?.temperature ?? '--'}°C</div>
              <p className="text-blue-100 mb-6">{currentWeather?.condition || 'Loading...'}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Droplets className="h-4 w-4 text-blue-200" />
                  <span className="text-sm">Humidity: {currentWeather?.humidity ?? '--'}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Wind className="h-4 w-4 text-blue-200" />
                  <span className="text-sm">Wind: {currentWeather?.windSpeed ?? '--'} km/h</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CloudRain className="h-4 w-4 text-blue-200" />
                  <span className="text-sm">Rain: {currentWeather?.rainfall ?? '--'} mm</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4 text-blue-200" />
                  <span className="text-sm">UV Index: {currentWeather?.uvIndex ?? '--'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 7-Day Forecast */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>7-Day Forecast</CardTitle>
              <CardDescription>Plan your farming activities ahead</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {forecast.map((day, index) => {
                  const Icon = day.icon
                  return (
                    <div 
                      key={index} 
                      className={`text-center p-3 rounded-lg ${index === 0 ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                    >
                      <p className="text-sm font-medium text-gray-900">{day.day}</p>
                      <Icon className={`h-8 w-8 mx-auto my-2 ${
                        day.condition.includes('Sunny') ? 'text-amber-500' :
                        day.condition.includes('Rain') ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                      <p className="text-sm font-bold text-gray-900">{day.high}°</p>
                      <p className="text-xs text-gray-500">{day.low}°</p>
                      <div className="flex items-center justify-center mt-2">
                        <Droplets className="h-3 w-3 text-blue-400 mr-1" />
                        <span className="text-xs text-gray-500">{day.rainChance}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Tips and Pest Alerts */}
        <Tabs defaultValue="tips" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tips" className="flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" /> Expert Tips
            </TabsTrigger>
            <TabsTrigger value="pests" className="flex items-center">
              <Bug className="h-4 w-4 mr-2" /> Pest Warnings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tips">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {expertTips.map((tip) => (
                <Card key={tip.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {tip.cropType}
                      </Badge>
                      <span className="text-xs text-gray-500">{tip.date}</span>
                    </div>
                    <CardTitle className="text-lg mt-2">{tip.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">{tip.content}</p>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {tip.author.split(' ').map((n: any[]) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tip.author}</p>
                        <p className="text-xs text-gray-500">{tip.authorRole}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pests">
            <div className="space-y-4">
              {pestAlerts.map((pest) => (
                <Card key={pest.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          pest.severity === 'high' ? 'bg-red-100' :
                          pest.severity === 'medium' ? 'bg-amber-100' : 'bg-green-100'
                        }`}>
                          <Bug className={`h-5 w-5 ${
                            pest.severity === 'high' ? 'text-red-600' :
                            pest.severity === 'medium' ? 'text-amber-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{pest.pest}</h3>
                            <Badge className={getSeverityColor(pest.severity)}>
                              {pest.severity.toUpperCase()} RISK
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-sm text-gray-500">Affects:</span>
                            {pest.affectedCrops.map((crop: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, i: Key | null | undefined) => (
                              <Badge key={i} variant="outline" className="text-xs">{crop}</Badge>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-sm text-gray-500">Regions:</span>
                            {pest.regions.map((region: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined, i: Key | null | undefined) => (
                              <span key={i} className="text-sm text-gray-600">{region}{i < pest.regions.length - 1 ? ',' : ''}</span>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg">
                            <strong>Advice:</strong> {pest.advice}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        </>
        )}
      </main>
    </div>
  )
}
