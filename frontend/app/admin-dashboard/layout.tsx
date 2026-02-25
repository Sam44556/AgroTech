"use client"

import React from "react"
import Link from "next/link"
import Topbar from "@/components/ui/topbar"
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"

interface LayoutProps {
	children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
	return (
		<SidebarProvider>
			<div className="flex min-h-screen flex-col bg-background">
				<Topbar />
				<div className="flex flex-1">
					<Sidebar side="left" variant="sidebar">
						{/* Sidebar content for admin dashboard */}
						<nav className="flex flex-col gap-2 p-4">
							<Link href="/admin-dashboard" className="px-3 py-2 rounded hover:bg-gray-100 font-medium text-green-700">Dashboard</Link>
							<Link href="/admin-dashboard/alerts" className="px-3 py-2 rounded hover:bg-gray-100">Alerts</Link>
							<Link href="/admin-dashboard/analytics" className="px-3 py-2 rounded hover:bg-gray-100">Analytics</Link>
							<Link href="/admin-dashboard/users" className="px-3 py-2 rounded hover:bg-gray-100">Users</Link>
							<Link href="/admin-dashboard/market" className="px-3 py-2 rounded hover:bg-gray-100">Market</Link>
							<Link href="/admin-dashboard/profile" className="px-3 py-2 rounded hover:bg-gray-100">Profile</Link>
						</nav>
						<button
							className="mt-8 px-3 py-2 rounded bg-red-500 text-white hover:bg-red-600 w-full"
							onClick={() => {
								localStorage.removeItem("session");
								window.location.href = "/";
							}}
						>
							Logout
						</button>
					</Sidebar>
					<main className="flex-1 p-4 overflow-auto">
						{children}
					</main>
				</div>
			</div>
		</SidebarProvider>
	)
}
