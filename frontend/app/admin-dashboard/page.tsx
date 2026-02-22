"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader2,
  Activity,
  Shield,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await apiGet<any>("/api/admin/analytics/dashboard");
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load dashboard:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadDashboard}>Retry</Button>
        </div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">System overview and management</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin-dashboard/users">
            <Button variant="outline"><Users className="mr-2 h-4 w-4" /> Users</Button>
          </Link>
          <Link href="/admin-dashboard/alerts">
            <Button variant="outline"><AlertTriangle className="mr-2 h-4 w-4" /> Alerts</Button>
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">New Users (24h)</p>
              <p className="text-2xl font-bold">{overview.dailyNewUsers?.value || 0}</p>
              <div className="flex items-center text-xs mt-1">
                {(overview.dailyNewUsers?.growthRate || 0) >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={(overview.dailyNewUsers?.growthRate || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                  {Math.abs(overview.dailyNewUsers?.growthRate || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-green-100 rounded-full mr-4">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Daily Orders</p>
              <p className="text-2xl font-bold">{overview.dailyOrders?.value || 0}</p>
              <div className="flex items-center text-xs mt-1">
                {(overview.dailyOrders?.growthRate || 0) >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={(overview.dailyOrders?.growthRate || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                  {Math.abs(overview.dailyOrders?.growthRate || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-amber-100 rounded-full mr-4">
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Daily Revenue</p>
              <p className="text-2xl font-bold">{(overview.dailyRevenue?.value || 0).toLocaleString()} Br</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className={`p-3 rounded-full mr-4 ${overview.systemHealth?.status === 'healthy' ? 'bg-green-100' : 'bg-red-100'}`}>
              <Shield className={`h-6 w-6 ${overview.systemHealth?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">System Health</p>
              <p className="text-2xl font-bold capitalize">{overview.systemHealth?.status || "unknown"}</p>
              <p className="text-xs text-gray-500">{overview.systemHealth?.criticalAlerts || 0} critical alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border">
                    <div>
                      <p className="font-medium text-sm">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{user.role}</Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin-dashboard/users" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" /> Manage Users
              </Button>
            </Link>
            <Link href="/admin-dashboard/market" className="block">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" /> Market Management
              </Button>
            </Link>
            <Link href="/admin-dashboard/analytics" className="block">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" /> View Analytics
              </Button>
            </Link>
            <Link href="/admin-dashboard/alerts" className="block">
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="mr-2 h-4 w-4" /> System Alerts
              </Button>
            </Link>
            <Link href="/admin-dashboard/profile" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" /> Admin Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
