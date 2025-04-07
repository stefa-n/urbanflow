"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Menu, X, User, Navigation, Trophy } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [allCourses, setAllCourses] = useState([])

  useEffect(() => {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    const fetchCourses = async () => {
      const { data, error } = await supabase.from("courses").select("id, title").order("title", { ascending: true })

      if (error) {
        console.error("Error fetching courses:", error)
      } else {
        setAllCourses(data)
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        setUser(session.user)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        router.push("/auth")
      } else if (event === "TOKEN_REFRESHED") {
        setUser(session.user)
      } else if (event === "USER_UPDATED") {
        setUser(session.user)
      }
    })

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      } else {
        setUser(null)
        if (pathname !== "/auth" && pathname !== "/") {
          router.push("/auth")
        }
      }
    }

    checkSession()
    fetchCourses()

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [pathname, router])

  const navItems = [
    { name: "Acasa", href: "/dashboard", icon: Home },
    { name: "Navigare", href: "/nav", icon: Navigation },
    { name: "Recompense", href: "/reward", icon: Trophy },
  ]

  return (
    <nav className={`bg-white border-b-2 border-black`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image src={require("../public/logo/UrbanFlow4.png")} alt="urbanflow logo" className="h-8 w-auto" />
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
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
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black transition-all duration-200 ease-in-out"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
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
              <Link href={user ? "/profile" : "/auth"} onClick={() => setIsOpen(false)}>
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
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

