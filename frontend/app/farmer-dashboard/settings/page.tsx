'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  Shield,
  Bell,
  Leaf,
  Camera,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'
import { apiGet, apiPut, apiPatch } from '@/lib/api'

export default function FarmerSettingsPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    profilePicture: ''
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

 

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const response = await apiGet<{ success: boolean; data: { user: any; settings: any } }>(
          '/api/farmer/settings'
        )

        const user = response.data.user || {}
        const settings = response.data.settings || {}

        setProfile(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          location: user.location || '',
          profilePicture: (user as any).image || ''
        }))
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    setError('')
    setSuccess('')
    try {
      const fd = new FormData()
      fd.append('name', profile.name)
      fd.append('phone', profile.phone)
      fd.append('location', profile.location)
      if (selectedFile) fd.append('image', selectedFile)

      await apiPut('/api/farmer/profile', fd)

      // Refresh settings to get latest profile picture
      try {
        const res = await apiGet<any>('/api/farmer/settings')
        const user = res.data.user
        setProfile(prev => ({ ...prev, profilePicture: user?.image || '' }))
      } catch (fetchErr) {
        console.warn('Failed to refresh profile after update', fetchErr)
      }

      setSuccess('Profile updated successfully!')
      // clear selected file & preview
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      setError(error?.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match!')
      return
    }
    setIsLoading(true)
    setError('')
    setSuccess('')
    try {
      await apiPatch('/api/farmer/settings/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword
      })
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setSuccess('Password changed successfully!')
    } catch (error: any) {
      console.error('Failed to change password:', error)
      setError(error.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center">
              <User className="h-4 w-4 mr-2" /> Profile
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center">
              <Lock className="h-4 w-4 mr-2" /> Password
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-6">
                  <div>
                    <Avatar className="h-24 w-24">
                      {previewUrl ? (
                        <AvatarImage src={previewUrl} />
                      ) : profile.profilePicture ? (
                        <AvatarImage src={profile.profilePicture} />
                      ) : (
                        <AvatarFallback className="bg-green-100 text-green-700 text-2xl">
                          {profile.name ? profile.name.charAt(0).toUpperCase() : 'F'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  <div>
                    <input
                      id="profileImage"
                      ref={(el) => { /* placeholder, will be replaced by inputRef below */ }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        if (!file) return
                        if (file.size > 2 * 1024 * 1024) {
                          setError('Image must be under 2MB')
                          return
                        }
                        setSelectedFile(file)
                        const reader = new FileReader()
                        reader.onloadend = () => setPreviewUrl(reader.result as string)
                        reader.readAsDataURL(file)
                      }}
                    />
                    <Button
                      variant="outline"
                      className="mb-2"
                      onClick={() => {
                        const input = document.getElementById('profileImage') as HTMLInputElement | null
                        input?.click()
                      }}
                    >
                      <Camera className="h-4 w-4 mr-2" /> Change Photo
                    </Button>
                    <p className="text-sm text-gray-500">JPG, PNG or GIF. Max 2MB.</p>
                    {previewUrl && (
                      <div className="mt-2">
                        <img src={previewUrl} alt="preview" className="h-24 w-24 rounded" />
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        id="name" 
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        id="email" 
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        id="phone" 
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        id="location" 
                        value={profile.location}
                        onChange={(e) => setProfile({...profile, location: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleProfileUpdate}
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="currentPassword" 
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="newPassword" 
                      type={showNewPassword ? "text" : "password"}
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handlePasswordChange}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications and Security tabs removed as requested */}
        </Tabs>
      </main>
    </div>
  )
}
