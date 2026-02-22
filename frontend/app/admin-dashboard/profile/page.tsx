"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Shield, Users, ShoppingCart, Package, Loader2 } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    location: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await apiGet<any>("/api/admin/profile");
      if (res.success) {
        setAdmin(res.data);
        setStatistics(res.data.statistics || {});
        setFormData({
          email: res.data.email || "",
          name: res.data.name || "",
          phone: res.data.phone || "",
          location: res.data.location || "",
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
      const res = await apiPut<any>("/api/admin/profile", {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
      });
      if (res.success) {
        setAdmin(res.data);
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
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Profile</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className="space-x-2">
            <Button onClick={() => { setIsEditing(false); setFormData({ email: admin?.email || "", name: admin?.name || "", phone: admin?.phone || "", location: admin?.location || "" }); }} variant="outline">
              Cancel
            </Button>
            <Button onClick={saveProfile} disabled={saving}>
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
                <AvatarFallback>{formData.name?.charAt(0) || "A"}</AvatarFallback>
              </Avatar>
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <Input value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} disabled={!isEditing} />
              </div>
            </div>
            <div>
              <Label>Role</Label>
              <div className="flex items-center gap-2 h-10">
                <Shield className="h-4 w-4 text-gray-500" />
                <Badge>{admin?.role || "ADMIN"}</Badge>
                {admin?.emailVerified && <Badge variant="outline" className="text-green-600">Verified</Badge>}
              </div>
            </div>
            <div>
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} disabled={!isEditing} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} disabled={!isEditing} />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={formData.location} onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))} disabled={!isEditing} />
            </div>
          </CardContent>
        </Card>

        {/* Platform Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-700">{statistics.totalUsers || 0}</p>
                <p className="text-sm text-blue-600">Total Users</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <ShoppingCart className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-700">{statistics.totalOrders || 0}</p>
                <p className="text-sm text-green-600">Total Orders</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <Package className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-purple-700">{statistics.totalProducts || 0}</p>
                <p className="text-sm text-purple-600">Total Products</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <Shield className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-amber-700">{statistics.recentActions || 0}</p>
                <p className="text-sm text-amber-600">Recent Actions (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Member since: {admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "N/A"}</p>
              <p>Email verified: {admin?.emailVerified ? "Yes" : "No"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
