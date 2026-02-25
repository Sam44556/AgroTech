"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { apiGet, apiPut } from "@/lib/api";

export default function FarmerOrdersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet<any>("/api/farmer/orders");
        setItems(res.data || []);
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [])

  const approve = async (id: string) => {
    try {
      const res = await apiPut<any>(`/api/farmer/orders/${id}/approve`);
      if (res.success) {
        setItems(prev => prev.map(i => i.id === id ? res.data : i));
      }
    } catch (e) { console.error(e) }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Incoming Bids</h2>
      <div className="grid gap-4">
        {items.map(it => {
          const buyer = it.order?.buyer ?? {};
          return (
            <Card key={it.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    {buyer.image ? (
                      <AvatarImage src={buyer.image} />
                    ) : (
                      <AvatarFallback>{(buyer.name || 'B').charAt(0).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm">{it.produce?.name ?? 'Unknown produce'}</CardTitle>
                    <div className="text-xs text-muted-foreground">{buyer.name ?? 'Unknown buyer'}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-1">
                  <div className="text-sm">Requested Qty: {it.quantity}</div>
                  <div className="text-sm">Offered price: {it.price}</div>
                  <div className="text-sm">Status: {it.status}</div>

                  <div className="pt-2 border-t">
                    <div className="text-sm font-medium">Buyer details</div>
                    <div className="text-sm">Phone: {buyer.phone ?? 'N/A'}</div>
                    <div className="text-sm">Email: {buyer.email ?? 'N/A'}</div>
                    <div className="text-sm">Location: {buyer.location ?? 'N/A'}</div>
                    {/* delivery address removed per request */}
                  </div>

                  <div className="mt-2">
                    {it.status === 'PENDING' && (
                      <Button onClick={() => approve(it.id)}>Approve</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
