"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { authClient } from "@/lib/auth-client"

type NavItem = { label: string; href: string; className?: string }

const ROLE_NAV: Record<string, NavItem[]> = {
  farmer: [
    { label: "Dashboard", href: "/farmer-dashboard", className: "text-green-600 font-medium" },
    { label: "My Produce", href: "/farmer-dashboard/produce" },
    { label: "Messages", href: "/farmer-dashboard/chat" },
    { label: "Browse Experts", href: "/farmer-dashboard/browse-experts" },
    { label: "Market Prices", href: "/farmer-dashboard/market" },
    { label: "Weather", href: "/farmer-dashboard/weather" },
  ],
  buyer: [
    { label: "Dashboard", href: "/buyer-dashboard" },
    { label: "Browse", href: "/buyer-dashboard/browse" },
    { label: "Favorites", href: "/buyer-dashboard/favorites" },
    { label: "Messages", href: "/buyer-dashboard/chat" },
    { label: "Profile", href: "/buyer-dashboard/profile" },
  ],
  expert: [
    { label: "Dashboard", href: "/expert-dashboard" },
    { label: "Articles", href: "/expert-dashboard/articles" },
    { label: "Messages", href: "/expert-dashboard/chat" },
    { label: "Profile", href: "/expert-dashboard/profile" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin-dashboard" },
    { label: "Alerts", href: "/admin-dashboard/alerts" },
    { label: "Analytics", href: "/admin-dashboard/analytics" },
    { label: "Users", href: "/admin-dashboard/users" },
    { label: "Market", href: "/admin-dashboard/market" },
  ],
}

export default function Topbar() {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const session = await authClient.getSession()
        const sessionData = (session as any)?.data
        const userRole = sessionData?.user?.role
        if (mounted) setRole(userRole ?? null)
      } catch (err) {
        console.error("Topbar: failed to get session", err)
        if (mounted) setRole(null)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const navItems = role && ROLE_NAV[role] ? ROLE_NAV[role] : [
    { label: "Home", href: "/" },
    { label: "Profile", href: "/profile" },
    { label: "Login", href: "/auth/login" },
  ]

  return (
    <div className="sticky top-0 z-50 bg-white border-b">
      <div className="mx-4 flex h-12 items-center justify-between md:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu />
            <span className="sr-only">Open menu</span>
          </Button>
        </div>
        <div className="flex items-center">
          {/* optional brand/title */}
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Menu</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </SheetHeader>

          <nav className="mt-4 flex flex-col gap-2 px-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`px-3 py-2 rounded hover:bg-gray-100 ${item.className ?? ''}`.trim()} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
