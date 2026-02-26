"use client"

import Link from "next/link"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, History, FileText, TrendingUp, ShoppingCart, Settings, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, loading, signIn, signOut } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#3b3f4d] bg-[#1a1d23]/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-[#46a758] hover:text-[#50b962] transition-colors">
            <span className="font-mono">{">"} SWEmaxx_</span>
          </Link>

          {/* Center Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/interview" className="text-[#f0f0f0] hover:text-[#46a758] transition-colors">
              Interview
            </Link>
            <Link href="/store" className="text-[#f0f0f0] hover:text-[#46a758] transition-colors">
              Store
            </Link>
            <Link href="/process" className="text-[#14b8a6] hover:text-[#2dd4bf] transition-colors">
              !process
            </Link>
          </div>

          {/* Profile Dropdown / Sign-in */}
          {user ? (
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger className="flex items-center gap-2 text-[#f0f0f0] hover:text-[#46a758] transition-colors">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="avatar" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5" />
                )}
                <span className="hidden sm:inline">{user.displayName ?? user.email ?? "Profile"}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-[#242830] border-[#3b3f4d] text-[#f0f0f0]">
                <DropdownMenuItem asChild>
                  <Link href="/profile/history" className="flex items-center gap-2 cursor-pointer">
                    <History className="h-4 w-4" />
                    History
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/problems" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    My Problems
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/progress" className="flex items-center gap-2 cursor-pointer">
                    <TrendingUp className="h-4 w-4" />
                    Progress
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/orders" className="flex items-center gap-2 cursor-pointer">
                    <ShoppingCart className="h-4 w-4" />
                    Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#3b3f4d]" />
                <DropdownMenuItem asChild>
                  <Link href="/profile/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 cursor-pointer text-[#e5484d]">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center">
              <button onClick={signIn} className="text-sm text-[#f0f0f0] hover:text-[#46a758] transition-colors">
                {loading ? "..." : "Sign in"}
              </button>
            </div>
          )}

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-4">
            <Link href="/interview" className="text-[#f0f0f0] text-sm">
              Interview
            </Link>
            <Link href="/store" className="text-[#f0f0f0] text-sm">
              Store
            </Link>
            <Link href="/process" className="text-[#14b8a6] text-sm">
              !process
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="avatar" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-[#f0f0f0]" />
                )}
                <button onClick={signOut} className="text-sm text-[#e5484d]">
                  Sign out
                </button>
              </div>
            ) : (
              <button onClick={signIn} className="text-sm text-[#f0f0f0]">
                {loading ? "..." : "Sign in"}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
