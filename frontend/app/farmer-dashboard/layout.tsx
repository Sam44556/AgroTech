"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Menu,
  X,
  Leaf,
  Bell,
} from "lucide-react"
import { usePathname } from 'next/navigation'
import { useSocket } from '@/lib/socket-context'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { apiGet } from "@/lib/api"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const pathname = usePathname()
  const { socket } = useSocket()

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const res = await apiGet<any>("/api/farmer/settings")
          const user = res?.data?.user
          if (!mounted) return
          setUserName(user?.name ?? null)
          setProfileImage(user?.image ?? null)
          setUserId(user?.id ?? null)
          // fetch initial unread count
          if (user?.id) {
            try {
              const convRes = await apiGet<any>("/api/farmer/chat/conversations")
              const convs = convRes?.data || []
              const unread = convs.reduce((acc: number, conv: any) => {
                const c = (conv.messages || []).filter((m: any) => !m.isRead && m.senderId !== user.id).length
                return acc + c
              }, 0)
              if (mounted) setUnreadCount(unread)
            } catch (err) {
              console.warn('Failed to fetch conversations for unread count', err)
            }
          }
        } catch (err) {
          console.warn("Failed to load user for header avatar", err)
        }
      })()

    return () => { mounted = false }
  }, [])

  // Listen for new messages via socket and increment unread when appropriate
  useEffect(() => {
    if (!socket) return
    const handleNewMessage = (message: any) => {
      // Only increment if message is for this user (i.e., sender is not user)
      if (!userId) return
      if (message.senderId === userId) return
      // If currently on chat page, do not increment (user sees messages)
      if (pathname && pathname.startsWith('/farmer-dashboard/chat')) return
      setUnreadCount((c) => c + 1)
    }

    socket.on('new_message', handleNewMessage)
    return () => {
      socket.off('new_message', handleNewMessage)
    }
  }, [socket, userId, pathname])

  // Clear unread when navigating to chat
  useEffect(() => {
    if (pathname && pathname.startsWith('/farmer-dashboard/chat')) {
      setUnreadCount(0)
    }
  }, [pathname])

  // Active nav link helper — exact match for dashboard root, startsWith for sub-pages
  const isActive = (href: string) =>
    href === '/farmer-dashboard'
      ? pathname === '/farmer-dashboard'
      : pathname?.startsWith(href)

  // Desktop nav link classes
  const navLink = (href: string) =>
    `relative pb-1 font-medium transition-colors ${isActive(href)
      ? 'text-green-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-green-500 after:rounded-full'
      : 'text-gray-600 hover:text-green-600'
    }`

  // Mobile sheet button classes
  const mobileBtn = (href: string) =>
    `text-left px-3 py-2 rounded font-medium transition-colors ${isActive(href)
      ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
      : 'text-gray-700 hover:bg-gray-100'
    }`

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

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/farmer-dashboard" className={navLink('/farmer-dashboard')}>Dashboard</Link>
              <Link href="/farmer-dashboard/produce" className={navLink('/farmer-dashboard/produce')}>My Produce</Link>
              <Link href="/farmer-dashboard/chat" className={navLink('/farmer-dashboard/chat')}>Messages</Link>
              <Link href="/farmer-dashboard/orders" className={navLink('/farmer-dashboard/orders')}>Orders</Link>
              <Link href="/farmer-dashboard/browse-experts" className={navLink('/farmer-dashboard/browse-experts')}>Browse Experts</Link>
              <Link href="/farmer-dashboard/weather" className={navLink('/farmer-dashboard/weather')}>Weather</Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative" onClick={() => { setUnreadCount(0); router.push('/farmer-dashboard/chat') }}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
              <Link href="/farmer-dashboard/settings">
                <Avatar className="h-8 w-8 cursor-pointer">
                  {profileImage ? (
                    <AvatarImage src={profileImage} />
                  ) : (
                    <AvatarFallback className="bg-green-100 text-green-700">
                      {userName ? userName.charAt(0).toUpperCase() : 'F'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Link>
              <Button
                variant="ghost"
                onClick={() => {
                  try { localStorage.removeItem('session') } catch { }
                  router.push('/')
                }}
              >
                Logout
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden z-50 text-gray-700" onClick={() => setMenuOpen(true)}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sheet Nav */}
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

          <nav className="mt-4 flex flex-col gap-1 px-4">
            <button onClick={async () => { await router.push('/farmer-dashboard'); setMenuOpen(false) }} className={mobileBtn('/farmer-dashboard')}>Dashboard</button>
            <button onClick={async () => { await router.push('/farmer-dashboard/produce'); setMenuOpen(false) }} className={mobileBtn('/farmer-dashboard/produce')}>My Produce</button>
            <button onClick={async () => { setUnreadCount(0); await router.push('/farmer-dashboard/chat'); setMenuOpen(false) }} className={mobileBtn('/farmer-dashboard/chat')}>Messages</button>
            <button onClick={async () => { await router.push('/farmer-dashboard/orders'); setMenuOpen(false) }} className={mobileBtn('/farmer-dashboard/orders')}>Orders</button>
            <button onClick={async () => { await router.push('/farmer-dashboard/browse-experts'); setMenuOpen(false) }} className={mobileBtn('/farmer-dashboard/browse-experts')}>Browse Experts</button>
            <button onClick={async () => { await router.push('/farmer-dashboard/weather'); setMenuOpen(false) }} className={mobileBtn('/farmer-dashboard/weather')}>Weather</button>
            <div className="border-t mt-3 pt-3 flex flex-col gap-1">
              <button onClick={async () => { await router.push('/farmer-dashboard/settings'); setMenuOpen(false) }} className={mobileBtn('/farmer-dashboard/settings')}>Settings</button>
              <button onClick={() => { try { localStorage.removeItem('session') } catch { }; router.push('/'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded text-red-600 hover:bg-red-50 font-medium transition-colors">Logout</button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      <main>{children}</main>
    </div>
  )
}
