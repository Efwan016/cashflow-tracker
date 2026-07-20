"use client";

type MarqueeTextProps = {
  text?: string;
  items?: string[];
  speed?: number;
  className?: string;
};

export const MarqueeText = ({
  text = "Cashflow AI — Track your cash flow smarter — Fast, simple, elegant — Secure finance workspace — ",
  items,
  speed = 60,
  className = "",
}: MarqueeTextProps) => {
  const content = Array.isArray(items) && items.length > 0 ? items.join(" — ") + " — " : text;

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div
        className="flex whitespace-nowrap"
        style={{
          animation: `marquee ${speed}s linear infinite`,
          width: "max-content",
        }}
      >
        <span className="mx-4 text-xs uppercase tracking-[0.35em]">{content}</span>
        <span className="mx-4 text-xs uppercase tracking-[0.35em] opacity-60">{content}</span>
        <span className="mx-4 text-xs uppercase tracking-[0.35em] opacity-40">{content}</span>
      </div>

      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }`}</style>
    </div>
  );
};

export default MarqueeText;
