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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Shield,
  ShieldOff,
  Loader2,
  UserCheck,
  UserX,
} from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from "@/lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [pagination, setPagination] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "BUYER",
    name: "",
    phone: "",
  });

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter, page]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", "20");

      const res = await apiGet<any>(`/api/admin/users?${params.toString()}`);
      if (res.success) {
        setUsers(res.data.users || []);
        setStatistics(res.data.statistics || {});
        setPagination(res.data.pagination || {});
      }
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setError(err.message || "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ email: "", password: "", role: "BUYER", name: "", phone: "" });
  };

  const createUser = async () => {
    if (!form.email || !form.password) return;
    setSaving(true);
    try {
      const res = await apiPost<any>("/api/admin/users", {
        email: form.email,
        password: form.password,
        role: form.role,
        name: form.name,
        phone: form.phone,
      });
      if (res.success) {
        setIsCreateOpen(false);
        resetForm();
        loadUsers();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      password: "",
      role: user.role,
      name: user.name || "",
      phone: user.phone || "",
    });
    setIsEditOpen(true);
  };

  const updateUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await apiPut<any>(`/api/admin/users/${editingUser.id}`, {
        email: form.email,
        role: form.role,
        name: form.name,
        phone: form.phone,
      });
      if (res.success) {
        setIsEditOpen(false);
        setEditingUser(null);
        resetForm();
        loadUsers();
      }
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await apiDelete<any>(`/api/admin/users/${userId}`);
      if (res.success) {
        loadUsers();
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    }
  };

  const toggleStatus = async (userId: string) => {
    try {
      const res = await apiPatch<any>(`/api/admin/users/${userId}/toggle-status`, {});
      if (res.success) {
        loadUsers();
      }
    } catch (err: any) {
      setError(err.message || "Failed to toggle status");
    }
  };

  const UserForm = ({ onSubmit, submitLabel, showPassword }: { onSubmit: () => void; submitLabel: string; showPassword?: boolean }) => (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
      </div>
      <div>
        <Label>Email *</Label>
        <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
      </div>
      {showPassword && (
        <div>
          <Label>Password *</Label>
          <Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
        </div>
      )}
      <div>
        <Label>Role</Label>
        <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="FARMER">Farmer</SelectItem>
            <SelectItem value="BUYER">Buyer</SelectItem>
            <SelectItem value="EXPERT">Expert</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Phone</Label>
        <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
      </div>
      <Button onClick={onSubmit} disabled={saving || !form.email} className="w-full">
        {saving ? "Saving..." : submitLabel}
      </Button>
    </div>
  );

  if (isLoading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
            <UserForm onSubmit={createUser} submitLabel="Create User" showPassword />
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

      {/* Role Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{statistics.total || 0}</p>
            <p className="text-sm text-gray-500">Total</p>
          </CardContent>
        </Card>
        {Object.entries(statistics.byRole || {}).map(([role, count]) => (
          <Card key={role}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{count as number}</p>
              <p className="text-sm text-gray-500">{role}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search users..." className="pl-10" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="FARMER">Farmer</SelectItem>
            <SelectItem value="BUYER">Buyer</SelectItem>
            <SelectItem value="EXPERT">Expert</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {user.name || user.email}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.emailVerified ? "default" : "secondary"}>
                        {user.emailVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {user._count?.produce > 0 && `${user._count.produce} products`}
                      {user._count?.orders > 0 && `${user._count.orders} orders`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(user.id)} title={user.emailVerified ? "Unverify" : "Verify"}>
                          {user.emailVerified ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteUser(user.id)} className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) { setEditingUser(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <UserForm onSubmit={updateUser} submitLabel="Update User" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
