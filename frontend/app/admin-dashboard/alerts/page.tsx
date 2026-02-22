"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle,
  RotateCcw,
  Trash2,
  Loader2,
  Bell,
  ShieldAlert,
} from "lucide-react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [pagination, setPagination] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
    alertType: "system",
  });

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, severityFilter, page]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (severityFilter !== "all") params.append("severity", severityFilter);
      params.append("page", page.toString());
      params.append("limit", "20");

      const res = await apiGet<any>(`/api/admin/alerts?${params.toString()}`);
      if (res.success) {
        setAlerts(res.data.alerts || []);
        setStatistics(res.data.statistics || {});
        setPagination(res.data.pagination || {});
      }
    } catch (err: any) {
      console.error("Failed to load alerts:", err);
      setError(err.message || "Failed to load alerts");
    } finally {
      setIsLoading(false);
    }
  };

  const createAlert = async () => {
    if (!form.title || !form.description) return;
    setSaving(true);
    try {
      const res = await apiPost<any>("/api/admin/alerts", form);
      if (res.success) {
        setIsCreateOpen(false);
        setForm({ title: "", description: "", severity: "MEDIUM", alertType: "system" });
        loadAlerts();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create alert");
    } finally {
      setSaving(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const res = await apiPatch<any>(`/api/admin/alerts/${alertId}/resolve`, { resolution: "Resolved by admin" });
      if (res.success) {
        loadAlerts();
      }
    } catch (err: any) {
      setError(err.message || "Failed to resolve alert");
    }
  };

  const reopenAlert = async (alertId: string) => {
    try {
      const res = await apiPatch<any>(`/api/admin/alerts/${alertId}/reopen`, {});
      if (res.success) {
        loadAlerts();
      }
    } catch (err: any) {
      setError(err.message || "Failed to reopen alert");
    }
  };

  const deleteAlert = async (alertId: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) return;
    try {
      const res = await apiDelete<any>(`/api/admin/alerts/${alertId}`);
      if (res.success) {
        loadAlerts();
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete alert");
    }
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "destructive";
      case "HIGH": return "destructive";
      case "MEDIUM": return "secondary";
      case "LOW": return "outline";
      default: return "outline";
    }
  };

  if (isLoading && alerts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">System Alerts</h1>
        <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (!o) setForm({ title: "", description: "", severity: "MEDIUM", alertType: "system" }); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Create Alert</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Alert</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Alert title" />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Alert description..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Severity</Label>
                  <Select value={form.severity} onValueChange={(v) => setForm((p) => ({ ...p, severity: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.alertType} onValueChange={(v) => setForm((p) => ({ ...p, alertType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createAlert} disabled={saving || !form.title || !form.description} className="w-full">
                {saving ? "Creating..." : "Create Alert"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-700">{statistics.critical || 0}</p>
              <p className="text-sm text-gray-500">Critical</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-amber-700">{statistics.high || 0}</p>
              <p className="text-sm text-gray-500">High</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-blue-700">{statistics.unresolved || 0}</p>
              <p className="text-sm text-gray-500">Unresolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-700">{statistics.resolvedToday || 0}</p>
              <p className="text-sm text-gray-500">Resolved Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No alerts found</p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${alert.severity === "CRITICAL" ? "border-l-red-500" : alert.severity === "HIGH" ? "border-l-amber-500" : alert.severity === "MEDIUM" ? "border-l-blue-500" : "border-l-gray-300"}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <Badge variant={severityColor(alert.severity) as any}>{alert.severity}</Badge>
                      <Badge variant="outline">{alert.alertType}</Badge>
                      {alert.isResolved && <Badge variant="default" className="bg-green-600">Resolved</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
                      {alert.isResolved && alert.resolvedAt && (
                        <span>Resolved: {new Date(alert.resolvedAt).toLocaleString()}</span>
                      )}
                      {alert.admin && (
                        <span>
                          By: {alert.admin.name || alert.admin.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {!alert.isResolved ? (
                      <Button variant="ghost" size="sm" onClick={() => resolveAlert(alert.id)} title="Resolve" className="text-green-600">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => reopenAlert(alert.id)} title="Reopen" className="text-amber-600">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteAlert(alert.id)} className="text-red-500" title="Delete">
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
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
          <span className="flex items-center text-sm text-gray-500">Page {pagination.current} of {pagination.total}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext}>Next</Button>
        </div>
      )}
    </div>
  );
}
