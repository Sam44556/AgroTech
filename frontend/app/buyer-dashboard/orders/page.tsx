"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGet, apiPost } from "@/lib/api";

export default function BuyerOrdersPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet<any>("/api/buyer/browse?limit=20");
        setProducts(res.data.products || []);
      } catch (e) {
        console.error(e);
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const placeBid = async (produceId: string) => {
    setMsg("");
    try {
      const product = products.find(p => p.id === produceId);
      const qtyToUse = selected === produceId && qty ? qty : 1;
      const priceToUse = selected === produceId && price ? price : (product?.price ?? 0);
      const body = { items: [{ produceId, quantity: qtyToUse, price: priceToUse }] };
      const res = await apiPost<any>("/api/buyer/orders", body);
      if (res.success) {
        setMsg('Bid placed')
        setSelected(null)
      }
    } catch (e: any) {
      setMsg(e.message || 'Failed')
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Place Bids</h2>
        <Link href="/buyer-dashboard/orders/list" className="text-sm text-gray-500">View my orders</Link>
      </div>

      {msg && <div className="mb-4 text-sm text-green-600">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map(p => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {p.farmer?.image ? (
                      <AvatarImage src={p.farmer.image} />
                    ) : (
                      <AvatarFallback>{p.farmer?.name?.charAt(0)?.toUpperCase() ?? 'F'}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.farmer?.name} — {p.farmer?.location}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-700">{p.price} Br</div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Available: {p.remainingQuantity ?? p.quantity}</p>
              <div className="mt-3">
                <Input type="number" value={selected === p.id ? qty : 1} onChange={(e) => { setSelected(p.id); setQty(Number(e.target.value)) }} />
                <Input type="number" value={selected === p.id ? price : p.price} onChange={(e) => { setSelected(p.id); setPrice(Number(e.target.value)) }} className="mt-2" />
                <Button className="mt-2" onClick={() => placeBid(p.id)}>Place Bid</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
