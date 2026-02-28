"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Menu, X, Leaf, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const res = await (await import("@/lib/api")).apiGet<any>("/api/expert/profile")
          const user = res?.data?.user ?? res?.data?.user
          if (!mounted) return
          setUserName(user?.name ?? null)
          setProfileImage(user?.image ?? null)
        } catch (err) {
          console.warn("Failed to load expert user for header avatar", err)
        }
      })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail ?? {}
      if (detail.name) setUserName(detail.name)
      if (detail.image) setProfileImage(detail.image)
    }
    window.addEventListener("expertProfileUpdated", handler as EventListener)
    return () => window.removeEventListener("expertProfileUpdated", handler as EventListener)
  }, [])

  // ── Active nav helpers ──────────────────────────────────────────────────────

  const isActive = (href: string) =>
    href === '/expert-dashboard'
      ? pathname === '/expert-dashboard'
      : pathname?.startsWith(href)

  const navLink = (href: string) =>
    `relative pb-1 font-medium transition-colors ${isActive(href)
      ? 'text-green-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-green-500 after:rounded-full'
      : 'text-gray-600 hover:text-green-600'
    }`

  const mobileBtn = (href: string) =>
    `text-left px-3 py-2 rounded font-medium transition-colors ${isActive(href)
      ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
      : 'text-gray-700 hover:bg-gray-100'
    }`

  return (
    <>
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AgroLink</h1>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/expert-dashboard" className={navLink('/expert-dashboard')}>Dashboard</Link>
              <Link href="/expert-dashboard/chat" className={navLink('/expert-dashboard/chat')}>Chats</Link>
              <Link href="/expert-dashboard/articles" className={navLink('/expert-dashboard/articles')}>Write Article</Link>
            </nav>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </Button>

              <Link href="/expert-dashboard/profile">
                <Avatar className="h-8 w-8 cursor-pointer">
                  {profileImage ? (
                    <AvatarImage src={profileImage} />
                  ) : (
                    <AvatarFallback className="bg-green-100 text-green-700">
                      {userName ? userName.charAt(0).toUpperCase() : 'E'}
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

              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-64">
          <SheetHeader>
            <div className="flex items-center justify-between w-full">
              <SheetTitle>AgroLink</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                <X />
              </Button>
            </div>
          </SheetHeader>

          <nav className="mt-4 flex flex-col gap-1 px-4">
            <button onClick={() => { router.push('/expert-dashboard'); setMenuOpen(false) }} className={mobileBtn('/expert-dashboard')}>Dashboard</button>
            <button onClick={() => { router.push('/expert-dashboard/articles'); setMenuOpen(false) }} className={mobileBtn('/expert-dashboard/articles')}>My Articles</button>
            <button onClick={() => { router.push('/expert-dashboard/chat'); setMenuOpen(false) }} className={mobileBtn('/expert-dashboard/chat')}>Messages</button>
            <button onClick={() => { router.push('/expert-dashboard/profile'); setMenuOpen(false) }} className={mobileBtn('/expert-dashboard/profile')}>Profile</button>
            <div className="border-t mt-3 pt-3">
              <button
                onClick={() => { try { localStorage.removeItem('session') } catch { }; router.push('/'); setMenuOpen(false) }}
                className="text-left px-3 py-2 rounded text-red-600 hover:bg-red-50 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      <main>{children}</main>
    </>
  )
}