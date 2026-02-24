"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Menu,
  X,
  Leaf,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  return (
    <div>
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AgroLink</h1>
            </div>

            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/farmer-dashboard" className="text-green-600 font-medium">Dashboard</Link>
              <Link href="/farmer-dashboard/produce" className="text-gray-600 hover:text-green-600">My Produce</Link>
              <Link href="/farmer-dashboard/chat" className="text-gray-600 hover:text-green-600">Messages</Link>
              <Link href="/farmer-dashboard/browse-experts" className="text-gray-600 hover:text-green-600">Browse Experts</Link>
              <Link href="/farmer-dashboard/market" className="text-gray-600 hover:text-green-600">Market Prices</Link>
              <Link href="/farmer-dashboard/weather" className="text-gray-600 hover:text-green-600">Weather</Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </Button>
              <Link href="/farmer-dashboard/settings">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-green-100 text-green-700">FD</AvatarFallback>
                </Avatar>
              </Link>
              {/* Burger on the right after bell and avatar (always visible) */}
              <Button variant="ghost" size="icon" className="md:hidden z-50 text-gray-700" onClick={() => setMenuOpen(true)}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile vertical header menu for farmer dashboard */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-64">
          <SheetHeader>
            <div className="flex items-center justify-between w-full">
              <SheetTitle>AgroLink</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                <X />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>
          </SheetHeader>

          <nav className="mt-4 flex flex-col gap-2 px-4">
            <button onClick={async () => { await router.push('/farmer-dashboard'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded hover:bg-gray-100 text-green-600 font-medium">Dashboard</button>
            <button onClick={async () => { await router.push('/farmer-dashboard/produce'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded hover:bg-gray-100">My Produce</button>
            <button onClick={async () => { await router.push('/farmer-dashboard/chat'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded hover:bg-gray-100">Messages</button>
            <button onClick={async () => { await router.push('/farmer-dashboard/browse-experts'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded hover:bg-gray-100">Browse Experts</button>
            <button onClick={async () => { await router.push('/farmer-dashboard/market'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded hover:bg-gray-100">Market Prices</button>
            <button onClick={async () => { await router.push('/farmer-dashboard/weather'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded hover:bg-gray-100">Weather</button>
            <div className="border-t mt-3 pt-3">
              <button onClick={async () => { await router.push('/farmer-dashboard/settings'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded hover:bg-gray-100">Settings</button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      <main>{children}</main>
    </div>
  )
}
