"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Phone, Mail, DollarSign, Star, MessageSquare, Loader2 } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";

export default function ExpertProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    hourlyRate: "",
    expertise: "",
    portfolio: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await apiGet<any>("/api/expert/profile");
      if (res.success) {
        setUser(res.data.user);
        setProfile(res.data.profile);
        setFormData({
          name: res.data.user?.name || "",
          phone: res.data.user?.phone || "",
          location: res.data.user?.location || "",
          hourlyRate: res.data.profile?.hourlyRate?.toString() || "0",
          expertise: (res.data.profile?.expertise || []).join(", "),
          portfolio: (res.data.profile?.portfolio || []).join("\n"),
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
      fd.append("hourlyRate", String(parseFloat(formData.hourlyRate) || 0));
      fd.append("expertise", formData.expertise);
      fd.append("portfolio", formData.portfolio);
      if (selectedFile) fd.append("image", selectedFile);

      const res = await apiPut<any>("/api/expert/profile", fd);
      if (res.success) {
        setUser(res.data.user);
        setProfile(res.data.profile);
        setIsEditing(false);
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
        try {
          window.dispatchEvent(new CustomEvent('expertProfileUpdated', { detail: { name: res.data.user?.name, image: res.data.user?.image } }))
        } catch (e) { }
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

  const openFilePicker = () => fileInputRef.current?.click();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-purple-800">Expert Profile</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="bg-purple-600 hover:bg-purple-700">
            Edit Profile
          </Button>
        ) : (
          <div className="space-x-2">
            <Button onClick={() => { setIsEditing(false); setFormData({ name: user?.name || "", phone: user?.phone || "", location: user?.location || "", hourlyRate: profile?.hourlyRate?.toString() || "0", expertise: (profile?.expertise || []).join(", "), portfolio: (profile?.portfolio || []).join("\n") }); }} variant="outline">
              Cancel
            </Button>
            <Button onClick={saveProfile} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">{success}</div>}

      <div className="grid gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={previewUrl ?? user?.image} />
                <AvatarFallback>{user?.name?.charAt(0) || "E"}</AvatarFallback>
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
              <Input id="name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} disabled={!isEditing} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <Input id="email" value={user?.email || ""} disabled />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} disabled={!isEditing} />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <Input id="location" value={formData.location} onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))} disabled={!isEditing} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expert Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Expert Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate (Br)</Label>
              <Input id="hourlyRate" type="number" min="0" value={formData.hourlyRate} onChange={(e) => setFormData((p) => ({ ...p, hourlyRate: e.target.value }))} disabled={!isEditing} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="expertise">Expertise (comma separated)</Label>
              <Input id="expertise" value={formData.expertise} onChange={(e) => setFormData((p) => ({ ...p, expertise: e.target.value }))} disabled={!isEditing} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="portfolio">Portfolio (one item per line)</Label>
              <Textarea id="portfolio" value={formData.portfolio} onChange={(e) => setFormData((p) => ({ ...p, portfolio: e.target.value }))} disabled={!isEditing} rows={4} />
            </div>
          </CardContent>
        </Card>



        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
