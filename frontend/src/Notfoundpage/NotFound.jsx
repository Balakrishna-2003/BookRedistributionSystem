import { useEffect, useMemo, useState } from 'react';

const NotFound = () => {
  const path =
    typeof window !== 'undefined' ? window.location.pathname : '/unknown-route';

  const [dots, setDots] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);

  // Ambient background stars
  const stars = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() < 0.2 ? 3 : Math.random() < 0.6 ? 2 : 1,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 3,
      })),
    []
  );

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0c0a1f] [background:radial-gradient(ellipse_at_50%_30%,#241c47_0%,#0c0a1f_65%)] text-[#f5f3ff] font-[Inter,sans-serif] px-6 py-16">
      {/* Ambient stars */}
      {stars.map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute rounded-full bg-[#cfc9f2] animate-[nf-twinkle_var(--d)_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            '--d': `${s.duration}s`,
          }}
        />
      ))}

      {/* Distant planet */}
      <div
        aria-hidden="true"
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-70 [background:radial-gradient(circle_at_35%_35%,#5b4ea3,#211a3e_70%)]"
      />
      <div
        aria-hidden="true"
        className="absolute top-24 right-6 w-72 h-20 rounded-full border border-[#5b4ea3]/40 rotate-[-12deg]"
      />

      <main className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Astronaut illustration */}
        <div className="animate-[nf-float_6s_ease-in-out_infinite] motion-reduce:animate-none mb-2">
          <svg
            viewBox="0 0 240 320"
            width="220"
            height="290"
            role="img"
            aria-label="An astronaut floating and holding a balloon shaped like the number 404, looking for the missing page"
          >
            {/* Balloon + string */}
            <g
              className="animate-[nf-sway_5s_ease-in-out_infinite] motion-reduce:animate-none"
              style={{ transformOrigin: '178px 108px' }}
            >
              <path
                d="M178 108 C 175 90, 165 75, 188 55"
                fill="none"
                stroke="#e8784a"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <ellipse cx="190" cy="42" rx="34" ry="40" fill="#ff9f6b" />
              <path d="M182 78 L 190 88 L 198 78 Z" fill="#ff9f6b" />
              <ellipse
                cx="178"
                cy="28"
                rx="9"
                ry="13"
                fill="#ffd6bd"
                opacity="0.45"
                transform="rotate(-20 178 28)"
              />
              <text
                x="190"
                y="48"
                textAnchor="middle"
                fontFamily="Baloo 2, sans-serif"
                fontWeight="700"
                fontSize="18"
                fill="#2a1730"
              >
                404
              </text>
            </g>

            {/* Backpack */}
            <rect x="70" y="142" width="100" height="86" rx="20" fill="#dcd5f4" />

            {/* Body */}
            <rect x="76" y="118" width="88" height="112" rx="36" fill="#f4f1fb" />

            {/* Chest panel */}
            <rect x="100" y="150" width="40" height="28" rx="8" fill="#6ee7e0" />
            <circle cx="108" cy="186" r="5" fill="#ff9f6b" />
            <circle cx="124" cy="186" r="5" fill="#cfc9f2" />

            {/* Legs */}
            <rect x="86" y="222" width="26" height="62" rx="13" fill="#f4f1fb" />
            <rect x="128" y="222" width="26" height="62" rx="13" fill="#f4f1fb" />
            <rect x="84" y="272" width="30" height="18" rx="9" fill="#ff9f6b" />
            <rect x="126" y="272" width="30" height="18" rx="9" fill="#ff9f6b" />

            {/* Left arm (resting) */}
            <rect
              x="52"
              y="138"
              width="24"
              height="58"
              rx="12"
              fill="#f4f1fb"
              transform="rotate(12 64 138)"
            />

            {/* Right arm (holding string) */}
            <rect
              x="150"
              y="118"
              width="24"
              height="62"
              rx="12"
              fill="#f4f1fb"
              transform="rotate(-30 150 118)"
            />

            {/* Helmet */}
            <circle cx="120" cy="84" r="56" fill="#f4f1fb" />
            <ellipse cx="120" cy="86" rx="37" ry="33" fill="#2a1f4d" />
            <ellipse
              cx="107"
              cy="74"
              rx="10"
              ry="14"
              fill="#6ee7e0"
              opacity="0.55"
              transform="rotate(-20 107 74)"
            />

            {/* Tiny stars near helmet */}
            <circle cx="48" cy="58" r="2.5" fill="#ffd66b" />
            <circle cx="60" cy="36" r="1.6" fill="#cfc9f2" />
            <circle cx="36" cy="100" r="1.8" fill="#cfc9f2" />
          </svg>
        </div>

        <h1 className="font-[Baloo_2,sans-serif] text-3xl md:text-4xl font-bold leading-tight mb-3">
          Houston, we've lost this page.
        </h1>
        <p className="text-sm md:text-base text-[#b9b3d9] leading-relaxed max-w-sm mb-5">
          The page you're looking for drifted off into deep space. Let's get
          you back to solid ground.
        </p>

        <div className="inline-flex items-center gap-2 rounded-full border border-[#5b4ea3]/40 bg-white/5 px-4 py-1.5 text-xs font-mono text-[#cfc9f2] mb-8">
          <span className="text-[#ff9f6b]">searching{'.'.repeat(dots)}</span>
          <span className="text-[#b9b3d9]">
            no match for <span className="text-[#f5f3ff]">{path}</span>
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="/"
            className="rounded-full bg-[#ff9f6b] px-6 py-2.5 text-sm font-semibold text-[#2a1730] transition-colors hover:bg-[#ffb585] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9f6b]"
          >
            Back to home
          </a>
          <button
            type="button"
            onClick={handleGoBack}
            className="rounded-full border border-[#5b4ea3]/50 bg-transparent px-6 py-2.5 text-sm font-semibold text-[#f5f3ff] transition-colors hover:border-[#cfc9f2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9f6b]"
          >
            Go back
          </button>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Inter:wght@400;500&display=swap');
        @keyframes nf-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes nf-sway {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes nf-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;