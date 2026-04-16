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
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) {
    return <div className="text-white p-10">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#020617] via-slate-900 to-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="card-glass flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold">Profile</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage your account
            </p>
          </div>

          <button onClick={handleLogout} className="btn-outline">
            Logout
          </button>
        </div>

        {/* PROFILE */}
        <div className="card-glass flex gap-6 items-center">

          {/* AVATAR */}
          <div
            className="relative cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="avatar">
              {avatarUrl ? (
                <img src={avatarUrl} className="w-full h-full object-cover" />
              ) : (
                name.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="avatar-overlay">
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
              className="input"
              placeholder="Full name"
            />

            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* INFO */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-glass">
            <p className="label">Email</p>
            <p className="value">{email}</p>
          </div>

          <div className="card-glass">
            <p className="label">Member since</p>
            <p className="value">
              {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* 🔥 STYLE */}
      <style>{`
        .card-glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 24px;
          border-radius: 24px;
          backdrop-filter: blur(20px);
        }

        .input {
          width: 100%;
          height: 48px;
          border-radius: 12px;
          padding: 0 12px;
          background: #0f172a;
          border: 1px solid #1e293b;
        }

        .btn-primary {
          height: 48px;
          padding: 0 20px;
          border-radius: 14px;
          background: linear-gradient(to right, #0ea5e9, #6366f1);
          font-weight: 600;
        }

        .btn-outline {
          border: 1px solid #334155;
          padding: 10px 16px;
          border-radius: 12px;
        }

        .avatar {
          width: 96px;
          height: 96px;
          border-radius: 24px;
          background: linear-gradient(to bottom right, #0ea5e9, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 24px;
          overflow: hidden;
        }

        .avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          transition: 0.2s;
        }

        .group:hover .avatar-overlay {
          opacity: 1;
        }

        .label {
          font-size: 12px;
          color: #94a3b8;
        }

        .value {
          font-size: 18px;
          margin-top: 4px;
        }
      `}</style>
    </main>
  )
}