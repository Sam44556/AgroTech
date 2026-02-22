"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Phone, Mail, ArrowLeft, Star, Package, DollarSign } from "lucide-react";
import Link from "next/link";
import { apiGet, apiPut } from "@/lib/api";

interface FarmerProfile {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  profilePicture?: string;
  // Stats from FarmerProfile table
  totalRevenue?: number;
  activeListings?: number;
  totalSales?: number;
  rating?: number;
  reviewCount?: number;
}

export default function FarmerProfilePage() {
  const [profile, setProfile] = useState<FarmerProfile>({
    name: "",
    email: "",
    phone: "",
    location: "",
    profilePicture: "",
    totalRevenue: 0,
    activeListings: 0,
    totalSales: 0,
    rating: 0,
    reviewCount: 0
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await apiGet<{ success: boolean; data: any }>("/api/farmer/profile");
      const data = response.data || {};

      setProfile({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        profilePicture: data.profilePicture || "",
        totalRevenue: data.totalRevenue || 0,
        activeListings: data.activeListings || 0,
        totalSales: data.totalSales || 0,
        rating: data.rating || 0,
        reviewCount: data.reviewCount || 0
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiPut("/api/farmer/profile", {
        name: profile.name,
        phone: profile.phone,
        location: profile.location
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      setError(error.message || 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-4">
        <Link href="/farmer-dashboard/settings" className="text-gray-600 hover:text-green-600 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Settings
        </Link>
      </div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-green-800">Farmer Profile</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-green-600 hover:bg-green-700">
            Edit Profile
          </Button>
        ) : (
          <div className="space-x-2">
            <Button onClick={() => { setIsEditing(false); setError(''); setSuccess(''); }} variant="outline">
              Cancel
            </Button>
            <Button onClick={saveProfile} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
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

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.profilePicture} />
                <AvatarFallback>{profile.name?.charAt(0) || "F"}</AvatarFallback>
              </Avatar>
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled={true}
                  className="bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <Input
                  id="phone"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <Input
                  id="location"
                  value={profile.location || ""}
                  onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{profile.totalRevenue?.toLocaleString() || 0} Br</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-700">{profile.activeListings || 0}</p>
                <p className="text-sm text-gray-600">Active Listings</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Package className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-700">{profile.totalSales || 0}</p>
                <p className="text-sm text-gray-600">Total Sales</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <Star className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-700">{profile.rating?.toFixed(1) || "0.0"}</p>
                <p className="text-sm text-gray-600">{profile.reviewCount || 0} Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
