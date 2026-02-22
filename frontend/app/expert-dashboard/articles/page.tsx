"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  BarChart3,
} from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from "@/lib/api";

function ArticleForm({ form, onFormChange, onSubmit, submitLabel, saving }: { form: { title: string; content: string; excerpt: string; tags: string; isPublished: boolean }, onFormChange: (f: { title: string; content: string; excerpt: string; tags: string; isPublished: boolean }) => void, onSubmit: () => void; submitLabel: string, saving: boolean }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" value={form.title} onChange={(e) => onFormChange({ ...form, title: e.target.value })} placeholder="Article title" />
      </div>
      <div>
        <Label htmlFor="excerpt">Excerpt</Label>
        <Input id="excerpt" value={form.excerpt} onChange={(e) => onFormChange({ ...form, excerpt: e.target.value })} placeholder="Brief summary" />
      </div>
      <div>
        <Label htmlFor="content">Content *</Label>
        <Textarea id="content" value={form.content} onChange={(e) => onFormChange({ ...form, content: e.target.value })} placeholder="Write your article content..." />
      </div>
      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input id="tags" value={form.tags} onChange={(e) => onFormChange({ ...form, tags: e.target.value })} placeholder="agriculture, tips, farming" />
      </div>
      <div className="flex items-center gap-2">
        <Switch id="publish" checked={form.isPublished} onCheckedChange={(v) => onFormChange({ ...form, isPublished: v })} />
        <Label htmlFor="publish">Publish immediately</Label>
      </div>
      <Button onClick={onSubmit} disabled={saving || !form.title || !form.content} className="w-full bg-purple-600 hover:bg-purple-700">
        {saving ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
}

export default function ExpertArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [pagination, setPagination] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    tags: "",
    isPublished: false,
  });

  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    tags: "",
    isPublished: false,
  });

  useEffect(() => {
    loadArticles();
  }, [search, statusFilter, page]);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", "10");

      const res = await apiGet<any>(`/api/expert/articles?${params.toString()}`);
      if (res.success) {
        setArticles(res.data.articles || []);
        setStatistics(res.data.statistics || {});
        setPagination(res.data.pagination || {});
      }
    } catch (err: any) {
      console.error("Failed to load articles:", err);
      setError(err.message || "Failed to load articles");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCreateForm({ title: "", content: "", excerpt: "", tags: "", isPublished: false });
  };

  const resetEditForm = () => {
    setEditForm({ title: "", content: "", excerpt: "", tags: "", isPublished: false });
  };

  const createArticle = async () => {
    if (!createForm.title || !createForm.content) return;
    setSaving(true);
    try {
      const payload = {
        title: createForm.title,
        content: createForm.content,
        excerpt: createForm.excerpt,
        tags: createForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        isPublished: createForm.isPublished,
      };
      const res = await apiPost<any>("/api/expert/articles", payload);
      if (res.success) {
        setIsCreateOpen(false);
        resetForm();
        loadArticles();
      }
    } catch (err: any) {
      console.error("Failed to create article:", err);
      setError(err.message || "Failed to create article");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = async (articleId: string) => {
    try {
      const res = await apiGet<any>(`/api/expert/articles/${articleId}`);
      if (res.success) {
        const a = res.data;
        setEditingArticle(a);
        setEditForm({
          title: a.title || "",
          content: a.content || "",
          excerpt: a.excerpt || "",
          tags: (a.tags || []).join(", "),
          isPublished: a.isPublished || false,
        });
        setIsEditOpen(true);
      }
    } catch (err: any) {
      console.error("Failed to load article:", err);
    }
  };

  const updateArticle = async () => {
    if (!editingArticle) return;
    setSaving(true);
    try {
      const payload = {
        title: editForm.title,
        content: editForm.content,
        excerpt: editForm.excerpt,
        tags: editForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        isPublished: editForm.isPublished,
      };
      const res = await apiPut<any>(`/api/expert/articles/${editingArticle.id}`, payload);
      if (res.success) {
        setIsEditOpen(false);
        setEditingArticle(null);
        loadArticles();
      }
    } catch (err: any) {
      console.error("Failed to update article:", err);
      setError(err.message || "Failed to update article");
    } finally {
      setSaving(false);
    }
  };

  const deleteArticle = async (articleId: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      const res = await apiDelete<any>(`/api/expert/articles/${articleId}`);
      if (res.success) {
        loadArticles();
      }
    } catch (err: any) {
      console.error("Failed to delete article:", err);
    }
  };

  const togglePublish = async (articleId: string) => {
    try {
      const res = await apiPatch<any>(`/api/expert/articles/${articleId}/publish`, {});
      if (res.success) {
        loadArticles();
      }
    } catch (err: any) {
      console.error("Failed to toggle publish:", err);
    }
  };


  if (isLoading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-purple-800">My Articles</h1>
        <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" /> New Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Article</DialogTitle>
            </DialogHeader>
            <ArticleForm form={createForm} onFormChange={setCreateForm} onSubmit={createArticle} submitLabel="Create Article" saving={saving} />
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{statistics.total || 0}</p>
            <p className="text-sm text-gray-500">Total Articles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{statistics.published || 0}</p>
            <p className="text-sm text-gray-500">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{statistics.drafts || 0}</p>
            <p className="text-sm text-gray-500">Drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{statistics.totalViews || 0}</p>
            <p className="text-sm text-gray-500">Total Views</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search articles..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        {articles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No articles found. Write your first article!</p>
            </CardContent>
          </Card>
        ) : (
          articles.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{article.title}</h3>
                      <Badge variant={article.isPublished ? "default" : "secondary"}>
                        {article.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    {article.excerpt && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {article.viewCount || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                      {article.tags?.length > 0 && (
                        <span className="flex items-center gap-1">
                          {article.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => togglePublish(article.id)} title={article.isPublished ? "Unpublish" : "Publish"}>
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(article.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteArticle(article.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Previous
          </Button>
          <span className="flex items-center text-sm text-gray-500">
            Page {pagination.current} of {pagination.total}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext}>
            Next
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) { setEditingArticle(null); resetEditForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Article</DialogTitle>
          </DialogHeader>
          <ArticleForm form={editForm} onFormChange={setEditForm} onSubmit={updateArticle} submitLabel="Update Article" saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
