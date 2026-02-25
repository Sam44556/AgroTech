"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Phone, Mail, Loader2 } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";

export default function BuyerProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({ name: "", phone: "", location: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await apiGet<any>("/api/buyer/profile");
      if (res.success) {
        setUser(res.data.user);
        setProfile(res.data.profile);
        setFormData({
          name: res.data.user?.name || "",
          phone: res.data.user?.phone || "",
          location: res.data.user?.location || "",
        });
      }
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("phone", formData.phone);
      fd.append("location", formData.location);
      if (selectedFile) fd.append("image", selectedFile);

      const res = await apiPut<any>("/api/buyer/profile", fd);
      if (res.success) {
        setUser(res.data.user);
        setProfile(res.data.profile);
        setIsEditing(false);
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
        // Notify layout/header about updated profile so avatar updates immediately
        try {
          window.dispatchEvent(new CustomEvent('buyerProfileUpdated', { detail: { name: res.data.user?.name, image: res.data.user?.image } }))
        } catch (e) {
          // ignore
        }
      }
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Buyer Profile</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
            Edit Profile
          </Button>
        ) : (
          <div className="space-x-2">
            <Button onClick={() => { setIsEditing(false); setFormData({ name: user?.name || "", phone: user?.phone || "", location: user?.location || "" }); }} variant="outline">
              Cancel
            </Button>
            <Button onClick={saveProfile} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">{success}</div>}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={previewUrl ?? user?.image} />
                <AvatarFallback>{user?.name?.charAt(0) || "B"}</AvatarFallback>
              </Avatar>
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-4">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {isEditing && (
                <Button variant="outline" onClick={openFilePicker}>Change Photo</Button>
              )}
            </div>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} disabled={!isEditing} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <Input id="email" type="email" value={user?.email || ""} disabled />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} disabled={!isEditing} />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <Input id="location" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} disabled={!isEditing} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">{profile?.totalOrders || 0}</p>
                <p className="text-sm text-blue-600">Total Orders</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{(profile?.totalSpent || 0).toLocaleString()} Br</p>
                <p className="text-sm text-green-600">Total Spent</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-700">{profile?.favoriteCount || 0}</p>
                <p className="text-sm text-amber-600">Favorites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
