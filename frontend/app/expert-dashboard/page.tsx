"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  MessageSquare,
  FileText,
  DollarSign,
  Star,
  TrendingUp,
  Clock,
  Loader2,
  Eye,
  BarChart3,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export default function ExpertDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await apiGet<any>("/api/expert/dashboard");
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
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
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
  const metrics = data?.metrics || {};
  const recentArticles = data?.recentArticles || [];
  const profileCompletion = data?.profileCompletion || { percentage: 0 };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-purple-800">Expert Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here&apos;s your overview.</p>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-purple-100 rounded-full mr-4">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Conversations</p>
              <p className="text-2xl font-bold">{overview.totalConversations || 0}</p>
              <p className="text-xs text-green-600">
                {overview.activeConversations || 0} active
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Articles Published</p>
              <p className="text-2xl font-bold">{overview.articlesPublished || 0}</p>
              <p className="text-xs text-blue-600">
                {metrics.monthlyArticles || 0} this month
              </p>
            </div>
          </CardContent>
        </Card>


      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Articles */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Recent Articles
            </CardTitle>
            <Link href="/expert-dashboard/articles">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentArticles.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No articles yet. Write your first article!</p>
            ) : (
              <div className="space-y-4">
                {recentArticles.map((article: any) => (
                  <div key={article.id} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 border">
                    <div className="flex-1">
                      <h4 className="font-medium">{article.title}</h4>
                      {article.excerpt && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{article.excerpt}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {article.viewCount || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(article.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge variant={article.isPublished ? "default" : "secondary"}>
                      {article.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Monthly Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Conversations</span>
                <span className="font-medium">{metrics.monthlyConversations || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Articles Written</span>
                <span className="font-medium">{metrics.monthlyArticles || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Article Views</span>
                <span className="font-medium">{metrics.articleViews || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Growth</span>
                <span className="font-medium flex items-center text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" /> {metrics.conversationGrowth || 0}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{profileCompletion.percentage}%</span>
                </div>
                <Progress value={profileCompletion.percentage} className="h-2" />
                {profileCompletion.missingFields?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Missing:</p>
                    <ul className="text-xs text-amber-600 mt-1 space-y-1">
                      {profileCompletion.missingFields.map((field: string) => (
                        <li key={field}>• {field}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <Link href="/expert-dashboard/profile">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
