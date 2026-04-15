import { useState, useEffect, type ReactNode } from "react"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import Footer from "./Footer"
import { supabase } from "../../lib/supabase"

export default function Layout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
const [revenue, setRevenue] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      
      if (user) {
        const metadataName = user.user_metadata?.full_name || user.user_metadata?.name
        setName(metadataName || user.email?.split('@')[0] || 'User')
        setEmail(user.email || '')
      }

      const { data: transactions } = await supabase
        .from('Transactions')
        .select('total')

      const total = (transactions ?? []).reduce((sum, t) => sum + t.total, 0)
      setRevenue(total)
    }

    fetchData()
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) window.location.href = '/'
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsDesktopSidebarOpen(!isDesktopSidebarOpen)
    } else {
      setIsSidebarOpen(!isSidebarOpen)
    }
  }

  const closeMobileSidebar = () => setIsSidebarOpen(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white">

      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        closeMobileSidebar={closeMobileSidebar}
        name={name}
        revenue={revenue}
        email={email}
      />

      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Content */}
      <div
        className={`flex flex-col min-h-screen transition-all ${
          isDesktopSidebarOpen ? "lg:ml-72" : "lg:ml-0"
        }`}
      >
        {/* Topbar */}
        <header
          className={`sticky top-0 z-30 p-4 transition ${
            isScrolled ? "bg-gray-800 shadow" : "bg-transparent"
          }`}
        >
          <Topbar toggleSidebar={toggleSidebar} />
        </header>

        {/* Main */}
        <main className="flex-1 p-6">{children}</main>

        <Footer />
      </div>
    </div>
  )
}