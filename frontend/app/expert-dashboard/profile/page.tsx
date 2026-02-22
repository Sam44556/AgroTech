"use client";

import { useState, useEffect } from "react";
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
      const res = await apiPut<any>("/api/expert/profile", {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        hourlyRate: parseFloat(formData.hourlyRate) || 0,
        expertise: formData.expertise
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        portfolio: formData.portfolio
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      if (res.success) {
        setUser(res.data.user);
        setProfile(res.data.profile);
        setIsEditing(false);
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

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
                <AvatarImage src={user?.image} />
                <AvatarFallback>{user?.name?.charAt(0) || "E"}</AvatarFallback>
              </Avatar>
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
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

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <Star className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-purple-700">{profile?.rating?.toFixed(1) || "0.0"}</p>
                <p className="text-sm text-purple-600">Rating ({profile?.reviewCount || 0} reviews)</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <MessageSquare className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-700">{profile?.conversationCount || 0}</p>
                <p className="text-sm text-blue-600">Conversations</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-700">{(profile?.totalEarnings || 0).toLocaleString()} Br</p>
                <p className="text-sm text-green-600">Total Earnings</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <DollarSign className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-amber-700">{profile?.hourlyRate || 0} Br</p>
                <p className="text-sm text-amber-600">Hourly Rate</p>
              </div>
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
