"use client" // nu scoate asta (folosim router pentru redirect)

import Image from "next/image"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function Auth() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isValidEmail, setIsValidEmail] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)

  const validateEmail = (email) => {
    // regex pt email
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return re.test(email)
  }

  const handleEmailChange = (e) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    setIsValidEmail(validateEmail(newEmail))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match")
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage("Te-ai inregistrat cu succes!")
        setTimeout(() => {
          setIsSignUp(false)
        }, 500)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        setMessage("Te-ai logat cu succes!")
        setTimeout(() => {
          router.push("/dashboard")
        }, 1500)
      }
    } catch (error) {
      console.error("error:", error)
      setMessage(error.message || "Eroare! Te rog incearca din nou.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`bg-lime-200 min-h-screen flex items-center justify-center`}>
      <div className="w-full max-w-md p-8">
        <Image
          src={require("../../public/logo/UrbanFlow4.png") || "/placeholder.svg"}
          alt="urbanflow logo"
          className="mb-4"
        />
        <div className="mb-8 flex justify-center">
          <div className="relative inline-flex bg-gray-100 rounded-full p-1 border-black border-2">
            <motion.div
              className="absolute inset-0 m-1"
              layout
              transition={{ type: "spring", stiffness: 600, damping: 30 }}
            >
              <div
                className={`h-full ${isSignUp ? "translate-x-full" : ""} bg-black rounded-full shadow-md transition-transform duration-200 ease-in-out`}
                style={{ width: "calc(50% - 4px)" }}
              ></div>
            </motion.div>
            <button
              onClick={() => setIsSignUp(false)}
              className={`relative z-10 px-6 py-2 text-sm font-medium transition-colors duration-200 ${!isSignUp ? "text-white" : "text-black"
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`relative z-10 px-6 py-2 text-sm font-medium transition-colors duration-200 ${isSignUp ? "text-white" : "text-black"
                }`}
            >
              Sign Up
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label htmlFor="email" className="block text-sm font-medium text-[#666] mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              className="bg-white text-[#000] rounded-[0.33rem] w-full px-3 py-2 border border-[#eaeaea] focus:outline-none focus:ring-2 focus:ring-[#000] focus:border-transparent transition-all duration-200 ease-in-out"
              placeholder="Introdu email-ul"
              required
            />
            {isValidEmail && (
              <svg className="absolute right-3 top-9 w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-[#666] mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white text-[#000] rounded-[0.33rem] w-full px-3 py-2 border border-[#eaeaea] focus:outline-none focus:ring-2 focus:ring-[#000] focus:border-transparent transition-all duration-200 ease-in-out"
              placeholder="Introdu parola"
              required
            />
          </div>
          <AnimatePresence>
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#666] mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="text-[#000] rounded-[0.33rem] w-full px-3 py-2 border border-[#eaeaea] focus:outline-none focus:ring-2 focus:ring-[#000] focus:border-transparent transition-all duration-200 ease-in-out"
                  placeholder="Confirmă parola"
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-[0.33rem] w-full bg-[#000] text-white py-2 px-4 hover:bg-[#333] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#000] transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <motion.div
                  className="flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  În procesare...
                </motion.div>
              ) : isSignUp ? (
                "Înregistrează-te"
              ) : (
                "Autentifică-te"
              )}
            </button>
          </div>
        </form>
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-center text-sm font-medium text-green-600"
          >
            {message}
          </motion.div>
        )}
      </div>
    </div>
  )
}

