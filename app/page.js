"use client"

import { motion } from "framer-motion"
import {
  Navigation,
  Leaf,
  MapPin,
  AlertTriangle,
  Gift,
  Users,
  Clock,
  Route,
  ArrowDown,
  Map,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

export default function Home() {
  const [activeSection, setActiveSection] = useState(null)
  const [stats, setStats] = useState([
    { value: "...", label: "Reducere Timp", icon: Clock },
    { value: "...", label: "Mai Puțină Poluare", icon: Leaf },
    { value: "...", label: "Utilizatori Activi", icon: Users },
    { value: "...", label: "Rute Raportate", icon: Route }
  ])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        
        if (response.ok) {
          setStats([
            { value: data.stats.timeSaved, label: "Reducere Timp", icon: Clock },
            { value: data.stats.environmentalImpact, label: "Mai Puțină Poluare", icon: Leaf },
            { value: `${data.stats.usersCount}+`, label: "Utilizatori Activi", icon: Users },
            { value: `${data.stats.reportsCount}+`, label: "Rute Raportate", icon: Route }
          ])
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
  }, [])

  const features = [
    {
      icon: Map,
      title: "Navigare Inteligentă",
      description: "Găsește cele mai rapide și eco-friendly rute pentru deplasarea ta în oraș",
      color: "bg-blue-500",
      details: `Cu ajutorul sistemului nostru de navigare inteligentă, poți:
• Evita zonele aglomerate și găsi cele mai rapide rute
• Primi actualizări în timp real despre condițiile de trafic
• Economisi timp și combustibil prin alegerea rutelor optime
• Vizualiza estimări precise ale timpului de călătorie`
    },
    {
      icon: AlertTriangle,
      title: "Raportare Incidente",
      description: "Contribuie la fluidizarea traficului prin raportarea incidentelor în timp real",
      color: "bg-orange-500",
      details: `Sistemul nostru de raportare te ajută să:
• Raportezi rapid accidente, blocaje sau lucrări
• Informezi comunitatea despre situații neprevăzute
• Contribui la siguranța rutieră prin alertarea altor utilizatori
• Verifici rapoartele altor utilizatori pentru a-ți planifica ruta`
    },
    {
      icon: Leaf,
      title: "Impact Ecologic",
      description: "Reduce amprenta de carbon alegând rute optimizate și transport sustenabil",
      color: "bg-green-500",
      details: `Împreună putem reduce impactul asupra mediului prin:
• Calcularea și monitorizarea amprentei de carbon
• Sugestii pentru rute mai eco-friendly
• Promovarea utilizării transportului în comun
• Recompense pentru alegerea opțiunilor sustenabile`
    },
    {
      icon: Gift,
      title: "Sistem de Recompense",
      description: "Primește puncte și recompense pentru contribuția ta la mobilitatea urbană",
      color: "bg-purple-500",
      details: `Beneficiază de sistemul nostru de recompense:
• Acumulează puncte eco pentru fiecare contribuție
• Deblochează insigne speciale pentru activitate constantă
• Schimbă punctele cu diverse beneficii și reduceri
• Participă la provocări lunare pentru premii exclusive`
    }
  ]

  return (
    <div className="min-h-screen bg-[oklch(93.8%_0.127_124.321)]">
      <section className="min-h-screen flex flex-col items-center justify-center relative px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="flex flex-col items-center justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <Navigation size={60} className="text-black" />
            </motion.div>
            <Image src={require("@/public/logo/UrbanFlow4.png")} alt="UrbanFlow" width={200} height={200} />
          </div>
          <p className="text-xl text-gray-600 mb-8">
            Asistentul tău pentru deplasări în oraș
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/nav"
              className="inline-flex items-center px-8 py-4 bg-black text-white rounded-full text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              <MapPin size={24} className="mr-2" />
              Explorează Orașul
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1.5 }}
          className="absolute bottom-10 w-full text-center"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ArrowDown size={30} className="mx-auto text-gray-400" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="flex items-center justify-center text-3xl font-bold text-center mb-16">Descoperă <Image src={require("@/public/logo/UrbanFlow4.png")} alt="UrbanFlow" width={150} height={150} style={{display: 'inline'}} /></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                animate={{
                  gridColumn: activeSection === index ? "1 / -1" : "auto",
                  opacity: activeSection === null || activeSection === index ? 1 : 0,
                  scale: activeSection === index ? 1 : 1,
                  width: activeSection === index ? "100%" : "auto",
                  height: "auto",
                  transition: {
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                    opacity: { duration: 0.3 },
                    width: { duration: 0.4 }
                  }
                }}
                layout
                layoutDependency={activeSection}
                style={{
                  display: activeSection !== null && activeSection !== index ? "none" : "block",
                  position: activeSection === index ? "relative" : "relative",
                  zIndex: activeSection === index ? 2 : 1
                }}
                whileHover={{ scale: activeSection === index ? 1 : 1.02 }}
                className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer`}
                onClick={() => setActiveSection(activeSection === index ? null : index)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${feature.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <feature.icon size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>

                    <motion.div
                      initial={false}
                      animate={{
                        height: activeSection === index ? "auto" : 0,
                        opacity: activeSection === index ? 1 : 0
                      }}
                      transition={{
                        height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                        opacity: { duration: 0.3 }
                      }}
                      className="overflow-hidden mt-4"
                    >
                      <div className="pt-4 border-t">
                        <p className="text-gray-600 whitespace-pre-line">
                          {feature.details}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-black text-white">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto px-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="mb-4"
                >
                  <stat.icon size={40} className="mx-auto text-lime-300" />
                </motion.div>
                <div className="text-3xl font-bold mb-2">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                  >
                    {stat.value}
                  </motion.span>
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Pregătit să începi?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Alătură-te comunității UrbanFlow și contribuie la un oraș mai inteligent și mai sustenabil
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Link
              href="/auth"
              className="inline-flex items-center px-8 py-4 bg-lime-300 text-black rounded-full text-lg font-medium hover:bg-lime-400 transition-colors"
            >
              <Users size={24} className="mr-2" />
              Creează cont
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  )
}
