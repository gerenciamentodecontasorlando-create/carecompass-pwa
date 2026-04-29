interface BcLogoProps {
  size?: number;
  className?: string;
}

/**
 * Monograma "Bc" futurista — hexágono com gradient teal→ciano,
 * brilho interno e linhas de circuito. Pensado para a tela de entrada.
 */
export function BcLogo({ size = 88, className = "" }: BcLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Btx CliniCos"
    >
      <defs>
        <linearGradient id="bc-grad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(172 70% 45%)" />
          <stop offset="50%" stopColor="hsl(186 80% 50%)" />
          <stop offset="100%" stopColor="hsl(200 75% 40%)" />
        </linearGradient>
        <linearGradient id="bc-stroke" x1="0" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(180 100% 75%)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(172 70% 35%)" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="bc-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="hsl(180 100% 80%)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(180 100% 80%)" stopOpacity="0" />
        </radialGradient>
        <filter id="bc-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="0" dy="2" result="off" />
          <feComponentTransfer><feFuncA type="linear" slope="0.4" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Hexágono base */}
      <path
        d="M60 4 L108 32 L108 88 L60 116 L12 88 L12 32 Z"
        fill="url(#bc-grad)"
        stroke="url(#bc-stroke)"
        strokeWidth="2"
        filter="url(#bc-shadow)"
      />

      {/* Brilho interno */}
      <path d="M60 4 L108 32 L108 88 L60 116 L12 88 L12 32 Z" fill="url(#bc-glow)" />

      {/* Linhas de circuito sutis */}
      <g stroke="hsl(180 100% 90%)" strokeWidth="1" strokeOpacity="0.35" fill="none">
        <path d="M12 50 L26 50 L30 46" />
        <path d="M108 70 L94 70 L90 74" />
        <path d="M60 4 L60 14" />
        <path d="M60 116 L60 106" />
        <circle cx="30" cy="46" r="1.5" fill="hsl(180 100% 90%)" />
        <circle cx="90" cy="74" r="1.5" fill="hsl(180 100% 90%)" />
      </g>

      {/* Monograma "Bc" */}
      <g fill="hsl(0 0% 100%)" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif">
        <text
          x="36"
          y="80"
          fontSize="56"
          fontWeight="800"
          letterSpacing="-3"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" }}
        >
          B
        </text>
        <text
          x="68"
          y="80"
          fontSize="40"
          fontWeight="600"
          fillOpacity="0.92"
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" }}
        >
          c
        </text>
      </g>

      {/* Acento "pulse" tech */}
      <path
        d="M22 96 L34 96 L38 90 L44 102 L50 96 L62 96"
        stroke="hsl(180 100% 88%)"
        strokeWidth="1.5"
        strokeOpacity="0.7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
