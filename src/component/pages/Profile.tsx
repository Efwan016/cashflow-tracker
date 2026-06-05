import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../providers/useLanguage'

const LANGUAGE_LOCALES = {
  en: 'en-US',
  id: 'id-ID',
  es: 'es-ES',
  zh: 'zh-CN',
  fr: 'fr-FR',
  de: 'de-DE',
  ja: 'ja-JP',
  pt: 'pt-PT',
  ru: 'ru-RU',
  ar: 'ar-SA',
} as const

export default function Profile() {
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [createdAt, setCreatedAt] = useState('')

  const [showPhotoPreview, setShowPhotoPreview] = useState(false)
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const initials = useMemo(() => {
    if (!name.trim()) return t('U')

    return name
      .trim()
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
  }, [name, t])

  const memberSince = useMemo(() => {
    if (!createdAt) return '-'

    return new Date(createdAt).toLocaleDateString(LANGUAGE_LOCALES[language], {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }, [createdAt, language])

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)

        const { data, error: authError } = await supabase.auth.getUser()

        if (authError) throw authError

        const user = data?.user

        if (!user) {
          navigate('/')
          return
        }

        setUserId(user.id)
        setEmail(user.email ?? '')
        setCreatedAt(user.created_at ?? '')

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError
        }

        if (profile) {
          setName(profile.full_name || '')
          setAvatarUrl(profile.avatar_url || null)
          return
        }

        const defaultName = user.email?.split('@')[0] || t('User')

        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          full_name: defaultName,
          avatar_url: null,
        })

        if (insertError) throw insertError

        setName(defaultName)
        setAvatarUrl(null)
      } catch (err) {
        console.error(err)
        toast.error(t('Failed to load profile data'))
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [navigate, t])

  const handleSave = async () => {
    const cleanName = name.trim()

    if (!userId) return

    if (!cleanName) {
      toast.error(t('Name cannot be empty'))
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: cleanName,
        avatar_url: avatarUrl,
      })

      if (error) throw error

      const { error: updateUserError } = await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
          avatar_url: avatarUrl,
        },
      })

      if (updateUserError) throw updateUserError

      setName(cleanName)
      toast.success(t('Profile updated successfully'))
    } catch (err) {
      console.error(err)

      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error(t('Failed to save profile'))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      const file = event.target.files?.[0]

      if (!file) {
        throw new Error(t('No file selected'))
      }

      if (!userId) {
        throw new Error(t('User is not ready'))
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

      if (!allowedTypes.includes(file.type)) {
        throw new Error(t('Image format must be JPG, PNG, or WEBP'))
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error(t('Maximum image size is 2MB'))
      }

      const fileExt = file.name.split('.').pop()
      const filePath = `profiles/${userId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

      setAvatarUrl(data.publicUrl)
      toast.success(t('Avatar uploaded successfully'))
    } catch (err) {
      console.error(err)

      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error(t('Failed to upload avatar'))
      }
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-white sm:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-44 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-slate-800" />

          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <div className="h-96 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-slate-800" />
            <div className="h-96 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* HEADER */}
        <section className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-fuchsia-500/10" />
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
                {t('Account Center')}
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {t('Profile Settings')}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                {t('Manage your account identity, profile photo, and basic information in one place.')}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {t('Logged in as')}
              </p>
              <p className="mt-1 max-w-[260px] truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                {email}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* PROFILE CARD */}
          <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex flex-col items-center text-center">
              <button
                type="button"
                onClick={() => setShowPhotoPreview(true)}
                disabled={uploading || saving}
                className="group relative rounded-[2rem] outline-none disabled:cursor-not-allowed disabled:opacity-70"
              >
                <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 p-1 text-4xl font-black text-white shadow-2xl shadow-sky-500/20">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[1.7rem] bg-slate-100 dark:bg-slate-950">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={t('Profile avatar')}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="bg-gradient-to-br from-sky-500 to-indigo-500 bg-clip-text text-transparent">
                        {initials}
                      </span>
                    )}
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-black/50 text-xs font-black text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  {t('View Photo')}
                </div>
              </button>

              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp"
                onChange={handleUpload}
              />

              <h2 className="mt-6 max-w-full truncate text-2xl font-black text-slate-950 dark:text-white">
                {name || t('User')}
              </h2>

              <p className="mt-1 max-w-full truncate text-sm text-slate-500 dark:text-slate-400">
                {email}
              </p>

              <div className="mt-6 w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-white/10 dark:bg-slate-950/60">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      {t('Photo Detail')}
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                      {avatarUrl ? t('Custom Avatar') : t('Default Initials')}
                    </p>
                  </div>

                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                    {avatarUrl ? t('Active') : t('Default')}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3 dark:border-white/10">
                    <span className="text-xs font-semibold text-slate-400">
                      {t('Photo Type')}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {t('Profile Picture')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3 dark:border-white/10">
                    <span className="text-xs font-semibold text-slate-400">
                      {t('Visibility')}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {t('Account Only')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3 dark:border-white/10">
                    <span className="text-xs font-semibold text-slate-400">
                      {t('Status')}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {avatarUrl ? t('Uploaded') : t('Using Initials')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FORM CARD */}
          <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
            <div className="border-b border-slate-200 pb-6 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">
                {t('Personal Information')}
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {t('Edit Profile')}
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t('Update your profile information and avatar to keep your account up to date.')}
              </p>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  {t('Full Name')}
                </label>

                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-sky-400"
                  placeholder={t('Full name')}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  {t('Email')}
                </label>

                <input
                  value={email}
                  disabled
                  className="h-12 w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-500 outline-none dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400"
                />

                <p className="mt-2 text-xs text-slate-400">
                  {t('Email follows the Supabase Auth account, so it cannot be edited from this page.')}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {t('Preview')}
                </p>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-black text-white shadow-lg shadow-sky-500/20">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={t('Avatar preview')}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                      {name || t('User')}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving || uploading}
                  className="h-12 rounded-2xl border border-slate-200 px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  {uploading ? t('Uploading...') : t('Upload Avatar')}
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="h-12 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-8 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {saving ? t('Saving...') : t('Save Changes')}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* INFO */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {t('Email')}
            </p>

            <p className="mt-2 truncate text-lg font-black text-slate-900 dark:text-slate-100">
              {email}
            </p>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {t('Member Since')}
            </p>

            <p className="mt-2 text-lg font-black text-slate-900 dark:text-slate-100">
              {memberSince}
            </p>
          </div>
        </section>
      </div>
      {showPhotoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-5 shadow-2xl dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setShowPhotoPreview(false)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              ✕
            </button>

            <div className="overflow-hidden rounded-[1.5rem] bg-slate-100 dark:bg-slate-900">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={t('Profile preview')}
                  className="max-h-[70vh] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-sky-500 via-indigo-500 to-fuchsia-500 text-7xl font-black text-white">
                  {initials}
                </div>
              )}
            </div>

            <div className="mt-4">
              <p className="text-lg font-black text-slate-950 dark:text-white">
                {name || t('User')}
              </p>
              <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                {email}
              </p>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowPhotoPreview(false)}
                className="h-11 flex-1 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                {t('Close')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPhotoPreview(false)
                  fileInputRef.current?.click()
                }}
                disabled={saving || uploading}
                className="h-11 flex-1 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('Change Photo')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
