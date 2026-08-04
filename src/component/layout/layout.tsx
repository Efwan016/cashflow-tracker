import { useState, useEffect, type ReactNode, useCallback } from "react"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import Footer from "./Footer"
import { supabase } from "../../lib/supabase"
import { toast } from "react-toastify"
import { getLocalDate, getTzOffset } from "../../lib/utils"

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

  if (!user) return

  setEmail(user.email || '')

  // 🔥 Ambil profile dari database
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    toast.error("Failed to load profile: " + profileError.message)
    return
  }

  setName(profile?.full_name || user.email?.split('@')[0] || 'User')
  setAvatarUrl(profile?.avatar_url || null)

  const now = new Date()
  const tz = getTzOffset()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfMonth = `${firstDayOfMonth.toLocaleDateString('en-CA')}T00:00:00.000${tz}`
  const endOfNow = `${getLocalDate()}T23:59:59.999${tz}`

  const [
    { data: transactions, error: txError },
    { data: expenses, error: expError },
  ] = await Promise.all([
    supabase
      .from('Transactions')
      .select('profit')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfNow),

    supabase
      .from('expenses')
      .select('total')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfNow),
  ])

  if (txError || expError) {
    toast.error(
      "Failed to load financial data: " +
        (txError?.message || expError?.message)
    )
    return
  }

  const grossProfit = (transactions ?? []).reduce(
    (sum, transaction) => sum + (transaction.profit || 0),
    0
  )

  const totalExpenses = (expenses ?? []).reduce(
    (sum, expense) => sum + (expense.total || 0),
    0
  )

  setNetProfit(grossProfit - totalExpenses)
}, [])

  useEffect(() => {
    let isMounted = true
    let timeout: ReturnType<typeof setTimeout>
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null
    let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const setupRealtimeAndAuthListener = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!isMounted) return

      if (!user) {
        // If no user, redirect to login page
        window.location.href = '/'
        return
      }

      // Initial data fetch
      await fetchData();
      
      if (!isMounted) return

      // Consolidate into a single channel and use a unique ID to avoid Strict Mode collisions
      const channelId = Math.random().toString(36).substring(7)
      realtimeChannel = supabase
        .channel(`layout-updates-${user.id}-${channelId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'Transactions',
          filter: `user_id=eq.${user.id}`
        }, () => {
          clearTimeout(timeout)
          timeout = setTimeout(() => fetchData(), 500)
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${user.id}`
        }, () => {
          clearTimeout(timeout)
          timeout = setTimeout(() => fetchData(), 500)
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, () => {
          clearTimeout(timeout)
          timeout = setTimeout(() => fetchData(), 500)
        })
        .subscribe()

      // Setup Auth State Change Listener
      authListener = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session && isMounted) {
          // User logged out or session expired
          window.location.href = '/';
        }
      });
    }

    setupRealtimeAndAuthListener()

    // Cleanup function
    return () => {
      isMounted = false
      if (realtimeChannel) supabase.removeChannel(realtimeChannel)
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

  const closeSidebar = () => {
    setIsSidebarOpen(false)
    setIsDesktopSidebarOpen(false)
  }


  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-white transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        closeMobileSidebar={closeSidebar}
        name={name}
        netProfit={netProfit}
        email={email}
        avatarUrl={avatarUrl}
      />

      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}
      {/* Content */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${isDesktopSidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}
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
