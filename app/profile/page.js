"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, Mail, Lock, Edit2, X } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import md5 from "md5"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function ObjectLength(object) {
  var length = 0
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      ++length
    }
  }
  return length
}

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [router, setRouter] = useState(useRouter())
  const [XP, setXP] = useState(0)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setDisplayName(user.user_metadata.display_name || "")
        setEmail(user.email || "")
        setXP((user.user_metadata.xp || 0) + (ObjectLength(user.user_metadata.completed_lessons) * 500 || 0))
      } else {
        router.push("/auth")
      }
    }
    getUser()
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError("Parolele nu se potrivesc.")
      return
    }

    try {
      const updates = {
        email: email,
        data: { display_name: displayName },
      }

      if (password) {
        updates.password = password
      }

      const { error } = await supabase.auth.updateUser(updates)

      if (error) throw error

      setSuccess("Profilul a fost actualizat cu succes!")
      setIsEditing(false)
      if (password) {
        setPassword("")
        setConfirmPassword("")
      }
    } catch (error) {
      console.error("error:", error)
      setError(error.message)
    }
  }

  const resetLessonsWatched = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { completed_lessons: [] },
      })

      if (error) throw error

      setSuccess("Lecțiile vizionate au fost resetate cu succes!")
    } catch (error) {
      setError("Eroare la resetarea lecțiilor vizionate: " + error.message)
    }
  }

  const gravatarUrl = `https://www.gravatar.com/avatar/${md5(email.toLowerCase().trim())}?d=identicon&s=200`

  return (
    <div>
      <main className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900 rainbow">Profilul Meu</h1>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:bg-gray-800 transition-colors duration-200 hover:cursor-pointer"
              >
                {isEditing ? <X /> : <Edit2 />}
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-center mb-8">
              <img
                src={gravatarUrl || "/placeholder.svg"}
                alt="Profile"
                className="w-32 h-32 rounded-full mb-4 md:mb-0 md:mr-8"
              />
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">{displayName || "Utilizator"}</h2>
                <p className="text-gray-600">
                  Imaginea de profil este furnizată de{" "}
                  <Link
                    style={{
                      background: "linear-gradient(90deg, #A57ECE 0%, #6DAFF8 100%)",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      WebkitBackgroundClip: "text",
                    }}
                    href={"https://gravatar.com"}
                  >
                    Gravatar
                  </Link>{" "}
                  și se bazează pe adresa ta de email.
                </p>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
                role="alert"
              >
                <span className="block sm:inline">{success}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="displayName" className="block text-gray-700 text-sm font-bold mb-2">
                  Nume afișat
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none ${isEditing ? "bg-white focus:border-black" : "bg-gray-100"
                      }`}
                  />
                  <User className="absolute right-3 top-2.5 text-gray-400" size={20} />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={true}
                    className={`w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none bg-gray-100`}
                  />
                  <Mail className="absolute right-3 top-2.5 text-gray-400" size={20} />
                </div>
              </div>

              {isEditing && (
                <>
                  <div className="mb-6">
                    <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                      Parolă nouă
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-black"
                      />
                      <Lock className="absolute right-3 top-2.5 text-gray-400" size={20} />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
                      Confirmă parola nouă
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-black"
                      />
                      <Lock className="absolute right-3 top-2.5 text-gray-400" size={20} />
                    </div>
                  </div>
                </>
              )}

              {isEditing && (
                <motion.button
                  type="submit"
                  className="w-full bg-black text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Salvează modificările
                </motion.button>
              )}
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

