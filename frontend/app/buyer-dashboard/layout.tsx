"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
	Menu,
	X,
	ShoppingCart,
	Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { apiGet } from "@/lib/api"

export default function Layout({ children }: { children: React.ReactNode }) {
	const [menuOpen, setMenuOpen] = useState(false)
	const router = useRouter()
	const [profileImage, setProfileImage] = useState<string | null>(null)
	const [userName, setUserName] = useState<string | null>(null)

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const res = await apiGet<any>("/api/buyer/profile")
				const user = res?.data?.user ?? res?.data?.user
				if (!mounted) return
				setUserName(user?.name ?? null)
				setProfileImage(user?.image ?? null)
			} catch (err) {
				console.warn("Failed to load buyer user for header avatar", err)
			}
		})()

		return () => { mounted = false }
	}, [])

	// Listen for profile updates from pages (e.g., after changing photo)
	useEffect(() => {
		const handler = (e: any) => {
			const detail = e?.detail ?? {}
			if (detail.name) setUserName(detail.name)
			if (detail.image) setProfileImage(detail.image)
		}

		window.addEventListener("buyerProfileUpdated", handler as EventListener)
		return () => window.removeEventListener("buyerProfileUpdated", handler as EventListener)
	}, [])

	return (
		<div>
			<header className="bg-white border-b sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
								     <ShoppingCart className="w-6 h-6 text-white" />
							</div>
							<h1 className="text-xl font-bold text-gray-900">AgroLink</h1>
						</div>

						<nav className="hidden md:flex items-center space-x-6">
							<Link href="/buyer-dashboard" className="text-green-600 font-medium">Dashboard</Link>
							<Link href="/buyer-dashboard/browse" className="text-gray-600 hover:text-green-600">Browse</Link>
							<Link href="/buyer-dashboard/orders" className="text-gray-600 hover:text-green-600">Orders</Link>
							<Link href="/buyer-dashboard/chat" className="text-gray-600 hover:text-green-600">Messages</Link>
							</nav>

						<div className="flex items-center space-x-4">
							<Button variant="ghost" size="icon" className="relative">
								<Bell className="h-5 w-5" />
								<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
							</Button>
							<Link href="/buyer-dashboard/profile">
								<Avatar className="h-8 w-8 cursor-pointer">
									{profileImage ? (
										<AvatarImage src={profileImage} />
									) : (
										<AvatarFallback className="bg-green-100 text-green-700">{userName ? userName.charAt(0).toUpperCase() : "B"}</AvatarFallback>
									)}
								</Avatar>
							</Link>

							<Button
								variant="ghost"
								onClick={() => {
									try { localStorage.removeItem("session"); } catch {}
									router.push("/")
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

					<nav className="mt-4 flex flex-col gap-2 px-4">
						<button onClick={async () => { await router.push('/buyer-dashboard'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded hover:bg-gray-100 text-green-600 font-medium">Dashboard</button>
						<button onClick={async () => { await router.push('/buyer-dashboard/browse'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded hover:bg-gray-100">Browse</button>
						<button onClick={async () => { await router.push('/buyer-dashboard/orders'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded hover:bg-gray-100">Orders</button>
						<button onClick={async () => { await router.push('/buyer-dashboard/favorites'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded hover:bg-gray-100">Favorites</button>
						<button onClick={async () => { await router.push('/buyer-dashboard/chat'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded hover:bg-gray-100">Messages</button>
						<button onClick={async () => { await router.push('/buyer-dashboard/profile'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded hover:bg-gray-100">Profile</button>
						<div className="border-t mt-3 pt-3">
							<button onClick={() => { try { localStorage.removeItem('session') } catch {} ; router.push('/'); setMenuOpen(false) }} className="text-left px-3 py-2 rounded hover:bg-gray-100 text-red-600">Logout</button>
						</div>
					</nav>
				</SheetContent>
			</Sheet>

			<main>{children}</main>
		</div>
	)
}
