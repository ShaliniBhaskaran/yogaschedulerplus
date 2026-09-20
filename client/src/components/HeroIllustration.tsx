export default function HeroIllustration({ className = 'w-full h-36 rounded-2xl' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 140" className={className} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#fb923c" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="400" height="140" fill="url(#sky)" />

      <circle cx="200" cy="80" r="32" fill="url(#sun)" />

      <polygon points="0,140 90,55 150,140" fill="#a5b4fc" />
      <polygon points="120,140 220,40 320,140" fill="#818cf8" />
      <polygon points="260,140 340,70 400,140" fill="#6366f1" />
    </svg>
  );
}
