"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "@/lib/api";

export default function BuyerOrdersListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet<any>("/api/buyer/orders");
        setOrders(res.data || []);
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">My Orders</h2>
      <div className="space-y-4">
        {orders.map(o => (
          <Card key={o.id}>
            <CardHeader>
              <CardTitle>Order {o.id} — {o.status}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Total: {o.totalAmount} Br</p>
              <div className="mt-2 grid gap-2">
                {o.items.map((it: any) => (
                  <div key={it.id} className="p-2 border rounded">
                    <div className="font-medium">{it.produce?.name}</div>
                    <div className="text-sm">Qty: {it.quantity} — Price: {it.price} — Status: {it.status}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
