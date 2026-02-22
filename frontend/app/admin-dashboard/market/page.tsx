"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Loader2,
  ShoppingCart,
  CheckCircle,
  Flag,
  Trash2,
  Eye,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { apiGet, apiPatch, apiDelete } from "@/lib/api";

export default function AdminMarketPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [pagination, setPagination] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFlagOpen, setIsFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flaggingId, setFlaggingId] = useState("");

  useEffect(() => {
    loadProducts();
  }, [search, statusFilter, categoryFilter, page]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      params.append("page", page.toString());
      params.append("limit", "20");

      const res = await apiGet<any>(`/api/admin/market?${params.toString()}`);
      if (res.success) {
        setProducts(res.data.products || []);
        setCategories(res.data.categories || []);
        setStatistics(res.data.statistics || {});
        setPagination(res.data.pagination || {});
      }
    } catch (err: any) {
      console.error("Failed to load market data:", err);
      setError(err.message || "Failed to load market data");
    } finally {
      setIsLoading(false);
    }
  };

  const viewProduct = async (productId: string) => {
    try {
      const res = await apiGet<any>(`/api/admin/market/${productId}`);
      if (res.success) {
        setSelectedProduct(res.data);
        setIsDetailOpen(true);
      }
    } catch (err: any) {
      console.error("Failed to load product details:", err);
    }
  };

  const approveProduct = async (productId: string) => {
    try {
      const res = await apiPatch<any>(`/api/admin/market/${productId}/approve`, {});
      if (res.success) {
        loadProducts();
      }
    } catch (err: any) {
      setError(err.message || "Failed to approve product");
    }
  };

  const openFlagDialog = (productId: string) => {
    setFlaggingId(productId);
    setFlagReason("");
    setIsFlagOpen(true);
  };

  const flagProduct = async () => {
    if (!flagReason) return;
    try {
      const res = await apiPatch<any>(`/api/admin/market/${flaggingId}/flag`, { reason: flagReason });
      if (res.success) {
        setIsFlagOpen(false);
        loadProducts();
      }
    } catch (err: any) {
      setError(err.message || "Failed to flag product");
    }
  };

  const unflagProduct = async (productId: string) => {
    try {
      const res = await apiPatch<any>(`/api/admin/market/${productId}/unflag`, {});
      if (res.success) {
        loadProducts();
      }
    } catch (err: any) {
      setError(err.message || "Failed to unflag product");
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await apiDelete<any>(`/api/admin/market/${productId}`);
      if (res.success) {
        loadProducts();
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete product");
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "default";
      case "SOLD_OUT": return "secondary";
      case "INACTIVE": return "destructive";
      default: return "outline";
    }
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Market Management</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{statistics.totalProducts || 0}</p>
            <p className="text-sm text-gray-500">Total Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{statistics.activeProducts || 0}</p>
            <p className="text-sm text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{statistics.soldOut || 0}</p>
            <p className="text-sm text-gray-500">Sold Out</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{(statistics.totalRevenue || 0).toLocaleString()}</p>
            <p className="text-sm text-gray-500">Revenue (Br)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search products..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name} ({cat._count?.produce || 0})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">No products found</TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.description?.substring(0, 50)}...</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {product.farmer?.name || product.farmer?.email || ""}
                    </TableCell>
                    <TableCell><Badge variant="outline">{product.category?.name || "N/A"}</Badge></TableCell>
                    <TableCell className="font-medium">{product.price?.toLocaleString()} Br</TableCell>
                    <TableCell><Badge variant={statusColor(product.status) as any}>{product.status}</Badge></TableCell>
                    <TableCell className="text-sm">{product._count?.orderItems || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => viewProduct(product.id)} title="View"><Eye className="h-4 w-4" /></Button>
                        {product.status === "INACTIVE" && (
                          <Button variant="ghost" size="sm" onClick={() => approveProduct(product.id)} title="Activate" className="text-green-600"><CheckCircle className="h-4 w-4" /></Button>
                        )}
                        {product.status === "AVAILABLE" && (
                          <Button variant="ghost" size="sm" onClick={() => openFlagDialog(product.id)} title="Deactivate" className="text-amber-600"><Flag className="h-4 w-4" /></Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => deleteProduct(product.id)} className="text-red-500" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
          <span className="flex items-center text-sm text-gray-500">Page {pagination.current} of {pagination.total}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext}>Next</Button>
        </div>
      )}

      {/* Product Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Product Details</DialogTitle></DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-gray-500">Name</Label><p className="font-medium">{selectedProduct.name}</p></div>
                <div><Label className="text-gray-500">Price</Label><p className="font-medium">{selectedProduct.price?.toLocaleString()} Br</p></div>
                <div><Label className="text-gray-500">Status</Label><Badge variant={statusColor(selectedProduct.status) as any}>{selectedProduct.status}</Badge></div>
                <div><Label className="text-gray-500">Stock</Label><p>{selectedProduct.stock}</p></div>
              </div>
              <div><Label className="text-gray-500">Description</Label><p className="text-sm">{selectedProduct.description}</p></div>
              {selectedProduct.statistics && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center"><p className="text-lg font-bold">{selectedProduct.statistics.totalOrders}</p><p className="text-xs text-gray-500">Orders</p></div>
                  <div className="text-center"><p className="text-lg font-bold">{selectedProduct.statistics.totalRevenue?.toLocaleString()} Br</p><p className="text-xs text-gray-500">Revenue</p></div>
                  <div className="text-center"><p className="text-lg font-bold">{selectedProduct.statistics.averageRating?.toFixed(1)}</p><p className="text-xs text-gray-500">Avg Rating</p></div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={isFlagOpen} onOpenChange={setIsFlagOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Flag Product</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Reason for flagging *</Label><Textarea value={flagReason} onChange={(e) => setFlagReason(e.target.value)} placeholder="Explain why this product should be flagged..." /></div>
            <Button onClick={flagProduct} disabled={!flagReason} className="w-full">Flag Product</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
