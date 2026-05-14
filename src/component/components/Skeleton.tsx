import  { useState } from 'react'
import type { SkeletonProps } from '../../types/types'

export default function Skeleton({
  n = 4,
  h = 54,
  variant = 'list',
}: SkeletonProps) {
  const [barHeights] = useState(() =>
    Array.from({ length: 12 }, () => Math.floor(Math.random() * 60) + 20)
  )

  // ─── Mini List Skeleton ─────────────────────────────
  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl bg-slate-800/40"
            style={{
              height: h,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    )
  }

  // ─── Full Dashboard Skeleton ───────────────────────
  return (
    <div className="w-full animate-pulse space-y-8 p-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-8 w-48 rounded-lg bg-slate-800" />
        <div className="h-4 w-64 rounded-md bg-slate-900" />
      </div>

      {/* Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="space-y-4 rounded-[32px] border border-white/5 bg-slate-900/50 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-800" />
              <div className="h-8 w-8 rounded-xl bg-slate-800" />
            </div>

            <div className="h-10 w-32 rounded-lg bg-slate-800" />
            <div className="h-4 w-40 rounded bg-slate-900" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-[40px] border border-white/10 bg-slate-900/40 p-8 shadow-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-6 w-32 rounded bg-slate-800" />
            <div className="h-4 w-48 rounded bg-slate-900" />
          </div>

          <div className="flex gap-2">
            <div className="h-8 w-20 rounded-full bg-slate-800" />
            <div className="h-8 w-20 rounded-full bg-slate-800" />
          </div>
        </div>

        <div className="relative flex h-[300px] w-full items-end justify-between gap-2 px-2">
          {barHeights.map((height, i) => (
            <div
              key={i}
              className="w-full rounded-t-lg bg-slate-800/50"
              style={{
                height: `${height}%`,
                opacity: (i + 1) / 12,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}