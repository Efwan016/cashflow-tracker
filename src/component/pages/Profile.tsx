import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Profile() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [createdAt, setCreatedAt] = useState('')
  const [name, setName] = useState('Cashflow User')

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (!user) {
        navigate('/')
        return
      }

      setEmail(user.email ?? '')
      setCreatedAt(user.created_at ?? '')
      const metadataName = user.user_metadata?.full_name || user.user_metadata?.name
      if (metadataName) {
        setName(metadataName)
      } else if (user.email) {
        setName(user.email.split('@')[0])
      }
    }
    loadProfile()
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="rounded-[32px] border border-slate-800 bg-slate-950/95 p-8 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Account profile</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Your profile</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Manage your account details, review authentication status, and sign out from here.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-12 items-center justify-center rounded-3xl border border-slate-700 bg-slate-900 px-5 text-sm font-semibold text-white transition hover:border-sky-400 hover:bg-slate-800"
          >
            Sign out now
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-slate-800 bg-slate-950/95 p-8 shadow-xl shadow-slate-950/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500 to-indigo-500 text-2xl font-semibold text-white">
              {name
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-slate-400">Signed in as</p>
              <p className="mt-1 text-xl font-semibold text-white">{name}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Email</p>
              <p className="mt-3 text-lg font-medium text-white">{email}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Member since</p>
              <p className="mt-3 text-lg font-medium text-white">{createdAt ? new Date(createdAt).toLocaleDateString() : 'Loading...'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-800 bg-slate-950/95 p-8 shadow-xl shadow-slate-950/20">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Security</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Logout protection</h2>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            For security, always log out from shared or public devices. Your session will be closed and you will return to the login screen.
          </p>

          <div className="mt-6 space-y-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
            <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
              <span>Session tracking</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">Active</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
              <span>Two-factor auth</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">Not set</span>
            </div>
            <div className="rounded-3xl bg-slate-950/90 p-4 text-sm text-slate-400">
              <p className="font-medium text-white">Tip</p>
              <p className="mt-2">Use sign out whenever you finish work to keep your account safe.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
