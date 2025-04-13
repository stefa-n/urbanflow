"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Menu, X, User, Navigation, Trophy } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data: userData } = await supabase.auth.getUser()
        setIsAdmin(userData?.user?.user_metadata?.is_admin || false)
      }
    }

    checkUser()
  }, [supabase])

  const navItems = [
    { name: "Acasa", href: "/", icon: Home },
    { name: "Navigare", href: "/nav", icon: Navigation },
    { name: "Recompense", href: "/reward", icon: Trophy },
  ]

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image src={require("../public/logo/UrbanFlow4.png")} alt="urbanflow logo" className="h-8 w-auto" />
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {isAdmin && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/admin'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>Admin</span>
                </div>
              </Link>
            )}
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <motion.div
                  className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out border-2 border-blue-200 ${
                    pathname === item.href
                      ? "bg-black text-white"
                      : "text-gray-500 hover:bg-lime-200 hover:border-black hover:text-black"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon className="w-5 h-5 mr-2" />
                  {item.name}
                </motion.div>
              </Link>
            ))}
            <Link href={user ? "/profile" : "/auth"}>
              <motion.div
                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out border-2 border-blue-200 ${
                  pathname === "/profile" || pathname === "/auth"
                    ? "bg-black text-white"
                    : "text-gray-500 hover:bg-lime-200 hover:border-black hover:text-black"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <User className="w-5 h-5 mr-2" />
                {!user ? "Autentificare" : "Profil"} {/* de ce reverse? dadea flicker textul cu autentificare */}
              </motion.div>
            </Link>
          </div>
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          {isAdmin && (
            <Link
              href="/admin"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/admin'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Admin</span>
              </div>
            </Link>
          )}
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} onClick={() => setIsMenuOpen(false)}>
              <motion.div
                className={`flex items-center px-3 py-2 rounded-full text-base font-medium ${
                  pathname === item.href ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </motion.div>
            </Link>
          ))}
          <Link href={user ? "/profile" : "/auth"} onClick={() => setIsMenuOpen(false)}>
            <motion.div
              className={`flex items-center px-3 py-2 rounded-full text-base font-medium ${
                pathname === "/profile" || pathname === "/auth"
                  ? "bg-black text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <User className="w-5 h-5 mr-3" />
              {user ? "Profil" : "Autentificare"}
            </motion.div>
          </Link>
        </div>
      </div>
    </nav>
  )
}

