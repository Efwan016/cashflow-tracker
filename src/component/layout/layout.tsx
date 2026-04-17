import { useState, useEffect, type ReactNode } from "react"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import Footer from "./Footer"
import { supabase } from "../../lib/supabase"

export default function Layout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [revenue, setRevenue] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user

      if (user) {
        setEmail(user.email || '')

        // 🔥 ambil profile dari database
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()

        if (profile?.full_name) {
          setName(profile.full_name)
        } else {
          setName(user.email?.split('@')[0] || 'User')
        }

        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url)
        }
      }

      // revenue tetap
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
        avatarUrl={avatarUrl}
      />

      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Content */}
      {/* Content */}
      <div
        className={`flex flex-col min-h-screen transition-all ${isDesktopSidebarOpen ? "lg:ml-72" : "lg:ml-0"
          }`}
      >

        {/* Topbar (FIXED) */}
        <Topbar toggleSidebar={toggleSidebar} />

        {/* Main */}
        <main className="flex-1 p-6">{children}</main>

        <Footer />
      </div>
    </div>
  )
}