"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
	Menu,
	X,
	Leaf,
	Bell,
	LayoutDashboard,
	AlertCircle,
	BarChart3,
	Users,
	Store,
	UserCircle,
	LogOut
} from "lucide-react"
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface LayoutProps {
	children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
	const pathname = usePathname()
	const router = useRouter()
	const [menuOpen, setMenuOpen] = useState(false)

	const isActive = (href: string) =>
		href === "/admin-dashboard"
			? pathname === "/admin-dashboard"
			: pathname?.startsWith(href)

	// Style helper for links
	const linkStyle = (href: string) =>
		`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${isActive(href)
			? "bg-green-50 text-green-700 border-l-4 border-green-600 shadow-sm"
			: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
		}`

	const adminLinks = [
		{ label: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
		{ label: "Alerts", href: "/admin-dashboard/alerts", icon: AlertCircle },
		{ label: "Analytics", href: "/admin-dashboard/analytics", icon: BarChart3 },
		{ label: "Users", href: "/admin-dashboard/users", icon: Users },
		{ label: "Market", href: "/admin-dashboard/market", icon: Store },
		{ label: "Profile", href: "/admin-dashboard/profile", icon: UserCircle },
	]

	const handleLogout = () => {
		try {
			localStorage.removeItem("session")
		} catch { }
		router.push("/")
	}

	return (
		<SidebarProvider>
			<div className="flex min-h-screen flex-col w-full bg-gray-50/50">

				{/* custom header replacing Topbar for consistency */}
				<header className="bg-white border-b sticky top-0 z-50 h-16 flex items-center shrink-0">
					<div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
								<Leaf className="w-6 h-6 text-white" />
							</div>
							<h1 className="text-xl font-bold text-gray-900 hidden sm:block">AgroLink <span className="text-green-600">Admin</span></h1>
						</div>

						<div className="flex items-center gap-4">
							<Button variant="ghost" size="icon" className="relative text-gray-500">
								<Bell className="h-5 w-5" />
								<span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
							</Button>

							{/* Burger Menu for mobile */}
							<Button
								variant="ghost"
								size="icon"
								className="md:hidden text-gray-700"
								onClick={() => setMenuOpen(true)}
							>
								<Menu className="h-6 w-6" />
								<span className="sr-only">Open menu</span>
							</Button>
						</div>
					</div>
				</header>

				<div className="flex flex-1">
					{/* Desktop Sidebar */}
					<Sidebar side="left" variant="sidebar" className="hidden md:flex border-r pt-4">
						<nav className="flex flex-col gap-1 p-4">
							<p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Main Menu</p>
							{adminLinks.map((link) => (
								<Link key={link.href} href={link.href} className={linkStyle(link.href)}>
									<link.icon className={`h-5 w-5 ${isActive(link.href) ? "text-green-600" : "text-gray-400"}`} />
									{link.label}
								</Link>
							))}
						</nav>

						<div className="mt-auto p-4 border-t">
							<button
								className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 w-full font-medium transition-colors"
								onClick={handleLogout}
							>
								<LogOut className="h-5 w-5" />
								Logout
							</button>
						</div>
					</Sidebar>

					{/* Mobile Sheet Nav (Matches Sidebar Content) */}
					<Sheet open={menuOpen} onOpenChange={setMenuOpen}>
						<SheetContent side="left" className="w-72 p-0">
							<SheetHeader className="p-6 border-b text-left">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Leaf className="h-6 w-6 text-green-600" />
										<SheetTitle>Admin Menu</SheetTitle>
									</div>
									<Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
										<X className="h-5 w-5" />
									</Button>
								</div>
							</SheetHeader>

							<nav className="flex flex-col gap-1 p-4">
								{adminLinks.map((link) => (
									<button
										key={link.href}
										onClick={() => {
											router.push(link.href)
											setMenuOpen(false)
										}}
										className={linkStyle(link.href)}
									>
										<link.icon className={`h-5 w-5 ${isActive(link.href) ? "text-green-600" : "text-gray-400"}`} />
										{link.label}
									</button>
								))}
							</nav>

							<div className="mt-auto p-4 border-t">
								<button
									className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 w-full font-medium transition-colors text-left"
									onClick={handleLogout}
								>
									<LogOut className="h-5 w-5" />
									Logout
								</button>
							</div>
						</SheetContent>
					</Sheet>

					<main className="flex-1 overflow-auto bg-gray-50/50">
						<div className="p-4 md:p-8">
							{children}
						</div>
					</main>
				</div>
			</div>
		</SidebarProvider>
	)
}
