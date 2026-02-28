'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Search,
  Filter,
  ImagePlus,
  Leaf,
  MoreVertical,
  Layers,
  XCircle,
  Wallet,
  Tag,
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CropListing {
  id: string
  name: string
  description?: string | null
  price: number
  quantity: number
  status: string
  images: string[]
  createdAt: string
  category?: { name: string }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyProducePage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingListing, setEditingListing] = useState<CropListing | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [listings, setListings] = useState<CropListing[]>([])
  const [allListings, setAllListings] = useState<CropListing[]>([]) // unfiltered, for stats
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [newListing, setNewListing] = useState({
    cropType: '',
    quantity: '',
    unit: 'quintal',
    price: '',
    description: '',
    images: [] as File[],
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const [editListing, setEditListing] = useState({
    name: '',
    quantity: '',
    price: '',
    description: '',
    status: '',
  })
  const [editExistingImages, setEditExistingImages] = useState<string[]>([])
  const [editNewFiles, setEditNewFiles] = useState<File[]>([])
  const [editNewPreviews, setEditNewPreviews] = useState<string[]>([])

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const statusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'active'
      case 'SOLD_OUT': return 'sold'
      case 'INACTIVE': return 'inactive'
      default: return status.toLowerCase()
    }
  }

  const refreshListings = async (status = filterStatus, query = searchQuery) => {
    const statusParam = status === 'all' ? 'all' : status
    const res = await apiGet<{ success: boolean; data: CropListing[] }>(
      `/api/farmer/crops?status=${statusParam}&search=${encodeURIComponent(query)}`
    )
    return res.data || []
  }

  // ── Data loading ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await refreshListings()
        setListings(data)
        // Also load all listings (unfiltered) for accurate stat counts
        if (filterStatus !== 'all' || searchQuery) {
          const all = await refreshListings('all', '')
          setAllListings(all)
        } else {
          setAllListings(data)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load listings')
      } finally {
        setIsLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterStatus])

  // ── Derived Stats (computed from all unfiltered listings) ────────────────────

  const totalAll = allListings.length
  const inactiveCount = allListings.filter(l => l.status === 'INACTIVE').length
  const avgPrice = allListings.length > 0
    ? Math.round(allListings.reduce((s, l) => s + l.price, 0) / allListings.length)
    : 0
  const activeStockVal = allListings
    .filter(l => l.status === 'AVAILABLE')
    .reduce((s, l) => s + l.price * l.quantity, 0)

  // ── Image helpers ────────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + selectedFiles.length > 5) { window.alert('Maximum 5 images allowed'); return }
    if (files.some(f => f.size > 5 * 1024 * 1024)) { window.alert('Each image must be under 5MB'); return }
    setSelectedFiles(prev => [...prev, ...files])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (i: number) => {
    setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))
    setImagePreviews(imagePreviews.filter((_, idx) => idx !== i))
  }

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + editExistingImages.length + editNewFiles.length > 5) { window.alert('Maximum 5 images allowed'); return }
    if (files.some(f => f.size > 5 * 1024 * 1024)) { window.alert('Each image must be under 5MB'); return }
    setEditNewFiles(prev => [...prev, ...files])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => setEditNewPreviews(prev => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
  }

  const removeExistingImage = (i: number) => setEditExistingImages(editExistingImages.filter((_, idx) => idx !== i))
  const removeNewImage = (i: number) => {
    setEditNewFiles(editNewFiles.filter((_, idx) => idx !== i))
    setEditNewPreviews(editNewPreviews.filter((_, idx) => idx !== i))
  }

  // ── CRUD handlers ────────────────────────────────────────────────────────────

  const handleCreateListing = async () => {
    if (!newListing.cropType) { setError('Please select a crop type'); return }
    if (!newListing.quantity || Number(newListing.quantity) <= 0) { setError('Please enter a valid quantity'); return }
    if (!newListing.price || Number(newListing.price) <= 0) { setError('Please enter a valid price'); return }
    setIsLoading(true); setError('')
    try {
      const formData = new FormData()
      formData.append('name', newListing.cropType)
      formData.append('description', newListing.description)
      formData.append('price', newListing.price)
      formData.append('quantity', newListing.quantity)
      formData.append('categoryName', newListing.cropType)
      formData.append('unit', newListing.unit)
      selectedFiles.forEach(f => formData.append('images', f))
      await apiPost('/api/farmer/crops', formData)
      window.alert('Crop added successfully!')
      setIsCreateOpen(false)
      setNewListing({ cropType: '', quantity: '', unit: 'quintal', price: '', description: '', images: [] })
      setSelectedFiles([]); setImagePreviews([])
      const data = await refreshListings()
      setListings(data); setAllListings(data)
    } catch (err: any) {
      window.alert(err.message || 'Failed to create listing')
      setError(err.message || 'Failed to create listing')
    } finally { setIsLoading(false) }
  }

  const handleMarkAsSold = async (id: string) => {
    const listing = listings.find(l => l.id === id)
    if (!listing) return
    try {
      await apiPut(`/api/farmer/crops/${id}`, { name: listing.name, description: listing.description, price: listing.price, quantity: listing.quantity, status: 'SOLD_OUT' })
      const data = await refreshListings(); setListings(data); setAllListings(data)
    } catch (err: any) { setError(err.message || 'Failed to update listing') }
  }

  const handleDeleteListing = async (id: string) => {
    try {
      await apiDelete(`/api/farmer/crops/${id}`)
      const pruned = listings.filter(l => l.id !== id)
      setListings(pruned); setAllListings(allListings.filter(l => l.id !== id))
    } catch (err: any) { setError(err.message || 'Failed to delete listing') }
  }

  const handleEditClick = (listing: CropListing) => {
    setEditingListing(listing)
    setEditListing({ name: listing.name, quantity: listing.quantity.toString(), price: listing.price.toString(), description: listing.description || '', status: listing.status })
    setEditExistingImages(listing.images || [])
    setEditNewFiles([]); setEditNewPreviews([])
    setIsEditOpen(true)
  }

  const handleUpdateListing = async () => {
    if (!editingListing) return
    if (!editListing.name) { setError('Please enter a name'); return }
    if (!editListing.quantity || Number(editListing.quantity) <= 0) { setError('Please enter a valid quantity'); return }
    if (!editListing.price || Number(editListing.price) <= 0) { setError('Please enter a valid price'); return }
    setIsLoading(true); setError('')
    try {
      const uploadedUrls: string[] = []
      for (const file of editNewFiles) {
        const fd = new FormData(); fd.append('image', file)
        try {
          const res = await apiPost<{ imageUrl: string }>('/api/farmer/crops/upload-image', fd)
          if ((res as any).imageUrl) uploadedUrls.push((res as any).imageUrl)
        } catch { window.alert('One image upload failed') }
      }
      const imagesToSave = [...editExistingImages, ...uploadedUrls]
      await apiPut(`/api/farmer/crops/${editingListing.id}`, { name: editListing.name, description: editListing.description, price: Number(editListing.price), quantity: Number(editListing.quantity), status: editListing.status, images: imagesToSave })
      setIsEditOpen(false); setEditingListing(null); setEditExistingImages([]); setEditNewFiles([]); setEditNewPreviews([])
      const data = await refreshListings(); setListings(data); setAllListings(data)
    } catch (err: any) { setError(err.message || 'Failed to update listing') }
    finally { setIsLoading(false) }
  }

  const cropTypes = ['Teff', 'Wheat', 'Maize', 'Coffee', 'Sesame', 'Sorghum', 'Barley', 'Chickpea', 'Lentils', 'Beans']

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Produce</h2>
            <p className="text-gray-600">Manage your crop listings</p>
          </div>

          {/* Create Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) setError('') }}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0 bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" /> Create New Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Listing</DialogTitle>
                <DialogDescription>Add a new crop listing to the marketplace</DialogDescription>
              </DialogHeader>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cropType">Crop Type</Label>
                    <Select value={newListing.cropType} onValueChange={(v) => setNewListing({ ...newListing, cropType: v })}>
                      <SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger>
                      <SelectContent>
                        {cropTypes.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" type="number" placeholder="50" value={newListing.quantity} onChange={(e) => setNewListing({ ...newListing, quantity: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={newListing.unit} onValueChange={(v) => setNewListing({ ...newListing, unit: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quintal">Quintal</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                        <SelectItem value="ton">Ton</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (Birr)</Label>
                    <Input id="price" type="number" placeholder="2800" value={newListing.price} onChange={(e) => setNewListing({ ...newListing, price: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe the quality, harvest date, storage conditions..." value={newListing.description} onChange={(e) => setNewListing({ ...newListing, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Photos</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer">
                    <input type="file" id="file-upload" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <ImagePlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                    </label>
                  </div>
                  {imagePreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative group">
                          <img src={preview} alt={`Preview ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border" />
                          <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs">X</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isLoading}>Cancel</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleCreateListing} disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Listing'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) { setError(''); setEditingListing(null) } }}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Listing</DialogTitle>
                <DialogDescription>Update your crop listing details</DialogDescription>
              </DialogHeader>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input id="edit-name" value={editListing.name} onChange={(e) => setEditListing({ ...editListing, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-quantity">Quantity</Label>
                    <Input id="edit-quantity" type="number" value={editListing.quantity} onChange={(e) => setEditListing({ ...editListing, quantity: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Price (Birr)</Label>
                    <Input id="edit-price" type="number" value={editListing.price} onChange={(e) => setEditListing({ ...editListing, price: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editListing.status} onValueChange={(v) => setEditListing({ ...editListing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea id="edit-description" value={editListing.description} onChange={(e) => setEditListing({ ...editListing, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Photos</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition-colors">
                    <input type="file" id="edit-file-upload" multiple accept="image/*" onChange={handleEditFileSelect} className="hidden" />
                    <label htmlFor="edit-file-upload" className="cursor-pointer">
                      <ImagePlus className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to add images</p>
                    </label>
                  </div>
                  {editExistingImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editExistingImages.map((src, idx) => (
                        <div key={idx} className="relative group">
                          <img src={src} alt={`Existing ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border" />
                          <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs">X</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {editNewPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editNewPreviews.map((preview, idx) => (
                        <div key={idx} className="relative group">
                          <img src={preview} alt={`Preview ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border" />
                          <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs">X</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isLoading}>Cancel</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleUpdateListing} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Produce-Specific Stat Boxes ──────────────────────────────────────── */}
        {/* These are DIFFERENT from the main dashboard 4 boxes.                   */}
        {/* Dashboard shows: Active Listings · Crops Sold · Conversations · Revenue */}
        {/* This page shows: Total Ever · Inactive · Avg Price · Active Stock Value */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

          {/* Box 1 – Total Listings (all statuses combined) */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="flex items-center p-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Layers className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{isLoading ? '—' : totalAll}</p>
                <p className="text-sm text-gray-500">Total Listings</p>
              </div>
            </CardContent>
          </Card>

          {/* Box 2 – Inactive Crops */}
          <Card className="border-l-4 border-l-red-400">
            <CardContent className="flex items-center p-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{isLoading ? '—' : inactiveCount}</p>
                <p className="text-sm text-gray-500">Inactive Crops</p>
              </div>
            </CardContent>
          </Card>

          {/* Box 3 – Average Price per Quintal */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="flex items-center p-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Tag className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading || allListings.length === 0 ? '—' : `${avgPrice.toLocaleString()} Br`}
                </p>
                <p className="text-sm text-gray-500">Avg Price / Quintal</p>
              </div>
            </CardContent>
          </Card>

          {/* Box 4 – Active Stock Value (potential earnings from current AVAILABLE stock) */}
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="flex items-center p-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Wallet className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '—' : `${activeStockVal.toLocaleString()} Br`}
                </p>
                <p className="text-sm text-gray-500">Active Stock Value</p>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ── Search & Filter ──────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by crop..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Listings</SelectItem>
              <SelectItem value="AVAILABLE">Active</SelectItem>
              <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Listings Grid ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {listing.images && listing.images.length > 0 ? (
                <div className="h-40 overflow-hidden">
                  <img src={listing.images[0]} alt={listing.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                  <Leaf className="h-16 w-16 text-green-400" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{listing.name}</h3>
                    <p className="text-sm text-gray-500">{listing.category?.name || 'Uncategorized'}</p>
                  </div>
                  <Badge
                    variant={listing.status === 'AVAILABLE' ? 'default' : listing.status === 'SOLD_OUT' ? 'secondary' : 'outline'}
                    className={
                      listing.status === 'AVAILABLE' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                        listing.status === 'SOLD_OUT' ? 'bg-gray-100 text-gray-700' :
                          'bg-amber-100 text-amber-700'
                    }
                  >
                    {statusLabel(listing.status)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xl font-bold text-green-600">{listing.price.toLocaleString()} Br</p>
                    <p className="text-sm text-gray-500">per quintal</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{listing.quantity} quintals</p>
                    <p className="text-sm text-gray-500">
                      Stock value: {(listing.price * listing.quantity).toLocaleString()} Br
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Listed {new Date(listing.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(listing)}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleMarkAsSold(listing.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Mark as Sold
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteListing(listing.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isLoading && error && (
          <div className="text-center py-6 text-red-600">{error}</div>
        )}

        {!isLoading && !error && listings.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Your First Listing
            </Button>
          </div>
        )}

      </main>
    </div>
  )
}