import { useState, useEffect, type ReactNode, useCallback } from "react"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import Footer from "./Footer"
import { supabase } from "../../lib/supabase"
import { toast } from "react-toastify"

export default function Layout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [netProfit, setNetProfit] = useState(0)

  const fetchData = useCallback(async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const user = authData?.user

    if (authError) {
      toast.error("Failed to get user session: " + authError.message)
      return
    }

    if (user) {
      setEmail(user.email || '')

      // 🔥 ambil profile dari database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()

      if (profileError) {
        toast.error("Failed to load profile: " + profileError.message)
        return
      }

      if (profile?.full_name) {
        setName(profile.full_name)
      } else {
        setName(user.email?.split('@')[0] || 'User')
      }

      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url)
      }

      // Hitung Net Profit: Total Profit Transaksi - Total Expenses
      const [{ data: transactions, error: txError }, { data: expenses, error: expError }] = await Promise.all([
        supabase.from('Transactions').select('profit').eq('user_id', user.id),
        supabase.from('expenses').select('total').eq('user_id', user.id)
      ])

      if (txError || expError) {
        toast.error("Failed to load financial data: " + (txError?.message || expError?.message))
        return
      }

      const grossProfit = (transactions ?? []).reduce((sum, t) => sum + (t.profit || 0), 0)
      const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + (e.total || 0), 0)
      
      setNetProfit(grossProfit - totalExpenses)
    }
  }, [])

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    let channel: ReturnType<typeof supabase.channel> | null = null
    let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const setupRealtimeAndAuthListener = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // If no user, redirect to login page
        window.location.href = '/'
        return
      }

      // Initial data fetch
      await fetchData();

      // Subscribe to changes in Transactions and expenses tables for the current user
      channel = supabase
        .channel(`net-profit-realtime-${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'Transactions', 
          filter: `user_id=eq.${user.id}` 
        }, () => {
          clearTimeout(timeout)
          timeout = setTimeout(() => fetchData(), 500) // Debounce for 500ms
        })
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'expenses', 
          filter: `user_id=eq.${user.id}` 
        }, () => {
          clearTimeout(timeout)
          timeout = setTimeout(() => fetchData(), 500) // Debounce for 500ms
        })
        .subscribe()

      // Setup Auth State Change Listener
      authListener = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          // User logged out or session expired
          window.location.href = '/';
        }
      });
    }

    setupRealtimeAndAuthListener()

    // Cleanup function
    return () => {
      if (channel) supabase.removeChannel(channel)
      if (authListener) authListener.data.subscription.unsubscribe();
      clearTimeout(timeout)
    }
  }, [fetchData])

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
        netProfit={netProfit}
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