import React, { useState } from 'react';

const Skeleton: React.FC = () => {
  // Generate random heights once and memoize them to stay "pure"
  const [barHeights] = useState(() => 
    Array.from({ length: 12 }, () => Math.floor(Math.random() * 60) + 20)
  );

  return (
    <div className="w-full space-y-8 animate-pulse p-6">
      {/* Header Placeholder */}
      <div className="space-y-3">
        <div className="h-8 w-48 rounded-lg bg-slate-800" />
        <div className="h-4 w-64 rounded-md bg-slate-900" />
      </div>

      {/* Stats Grid: 3 Cards (Revenue, Profit, Expense) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="rounded-[32px] border border-white/5 bg-slate-900/50 p-6 space-y-4"
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

      {/* Main Chart Area Placeholder */}
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
        
        {/* Mock Chart Visualization */}
        <div className="relative h-[300px] w-full flex items-end justify-between gap-2 px-2">
          {barHeights.map((height, i) => (
            <div 
              key={i} 
              className="w-full rounded-t-lg bg-slate-800/50" 
              style={{ 
                height: `${height}%`,
                opacity: (i + 1) / 12 
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Skeleton;