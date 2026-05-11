import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'

export default function Profile() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [createdAt, setCreatedAt] = useState('')

  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  //  LOAD PROFILE (AUTH + DB)
  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user

      if (!user) {
        navigate('/')
        return
      }

      setUserId(user.id)
      setEmail(user.email ?? '')
      setCreatedAt(user.created_at ?? '')

      //  ambil dari table profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setName(profile.full_name || '')
        setAvatarUrl(profile.avatar_url)
      } else {
        //  AUTO INSERT PROFILE kalau belum ada
        await supabase.from('profiles').insert({
          id: user.id,
          full_name: user.email?.split('@')[0] || 'User',
        })

        setName(user.email?.split('@')[0] || 'User')
      }

      setLoading(false)
    }

    loadProfile()
  }, [navigate])

  //  UPDATE PROFILE (DB + AUTH)
  const handleSave = async () => {
    if (!userId) return

    setSaving(true)

    // 1. update ke profiles table
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: name,
      avatar_url: avatarUrl,
    })

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    // 2. sync ke auth metadata (optional tapi bagus)
    await supabase.auth.updateUser({
      data: {
        full_name: name,
        avatar_url: avatarUrl,
      },
    })

    toast.success('Profile updated')
    setSaving(false)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!e.target.files?.length) {
        throw new Error('No file selected')
      }

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()

      //  PATH CLEAN & SCALABLE
      const filePath = `profiles/${userId}/${Date.now()}.${fileExt}`

      // upload ke bucket "avatars"
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true, // biar overwrite kalau sama
        })

      if (uploadError) throw uploadError

      // ambil public url
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = data.publicUrl

      setAvatarUrl(publicUrl)

      toast.success('Avatar uploaded 🚀')
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error('An unknown error occurred during avatar upload.')
      }
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="text-white p-10">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex justify-between items-center rounded-3xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/5 p-6 backdrop-blur-xl shadow-sm">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Profile</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Manage your account
            </p>
          </div>
        </div>

        {/* PROFILE */}
        <div className="flex gap-6 items-center rounded-3xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/5 p-6 backdrop-blur-xl shadow-sm">

          {/* AVATAR */}
          <div
            className="relative cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-2xl text-white overflow-hidden shadow-lg shadow-sky-500/20">
              {avatarUrl ? (
                <img src={avatarUrl} className="w-full h-full object-cover" />
              ) : (
                name.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-3xl transition-opacity text-white text-xs font-bold">
              Change
            </div>

            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={handleUpload}
            />
          </div>

          {/* FORM */}
          <div className="flex-1 space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 rounded-xl px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-sky-500/20"
              placeholder="Full name"
            />

            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold shadow-lg shadow-sky-500/20 hover:from-sky-400 transition-all"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* INFO */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/5 p-6 backdrop-blur-xl shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Email</p>
            <p className="text-lg mt-1 font-medium text-slate-900 dark:text-slate-100">{email}</p>
          </div>

          <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/5 p-6 backdrop-blur-xl shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Member since</p>
            <p className="text-lg mt-1 font-medium text-slate-900 dark:text-slate-100">
              {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}