import { COLORS, TIMING, VIEWBOX } from './designTokens'

function ScanTexture() {
  return <defs>
    <pattern id="transitionScan" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="3" fill="#0a1013" opacity="0.48" />
    </pattern>
  </defs>
}

export function IntroScreen({ phaseMs }: { phaseMs: number }) {
  const progress = Math.min(1, phaseMs / TIMING.introMs)
  const lit = Math.floor(progress * 18)
  return <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} role="status" aria-label="VOLTlab initializing">
    <ScanTexture />
    <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="#050708" />
    <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="url(#transitionScan)" />
    <g transform="translate(680 430)">
      <text x="0" y="140" fill="#e2e7e9" fontFamily="Arial Black, sans-serif" fontSize="132" fontWeight="900" letterSpacing="-8">VOLT</text>
      <text x="350" y="140" fill={COLORS.brandBlue} fontFamily="Arial Black, sans-serif" fontSize="132" fontWeight="900" letterSpacing="-8">lab</text>
      <rect x="0" y="195" width="560" height="52" fill="#030405" stroke={COLORS.brandBlue} strokeWidth="3" />
      {Array.from({ length: 18 }, (_, index) => <rect key={index} x={12 + index * 30} y="207" width="20" height="28"
        fill={index < lit ? COLORS.brandBlue : '#102631'} opacity={index < lit ? 1 : 0.65} />)}
    </g>
  </svg>
}

function ResistanceLogo() {
  return <g transform="translate(700 420)" fill="none" strokeLinejoin="miter">
    <path d="M0 0L60 130L120 0" stroke="#edf1f3" strokeWidth="36" />
    <polyline points="160,0 205,105 250,0 295,105 340,0 385,105 430,0 475,105 520,0 555,80 600,80"
      stroke={COLORS.brandBlue} strokeWidth="36" />
  </g>
}

export function TerminalScreen({ outcome }: { outcome: 'success' | 'failure' }) {
  const success = outcome === 'success'
  return <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} role="status" aria-label={success ? 'Connection successful' : 'Connection failed'}>
    <ScanTexture />
    <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="#050708" />
    <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="url(#transitionScan)" />
    {success ? <ResistanceLogo /> : <g transform="translate(810 400)" stroke={COLORS.ledRed} strokeWidth="28"><path d="M0 0L300 260M300 0L0 260" /></g>}
    <rect x="710" y="610" width="500" height="75" fill="#050708" stroke={success ? COLORS.brandBlue : COLORS.ledRed} strokeWidth="3" />
    <text x="960" y="658" fill={COLORS.text} textAnchor="middle" fontSize="27" fontWeight="700" letterSpacing="1.5">
      {success ? 'CONNECTION SUCCESSFUL' : 'CONNECTION FAILED'}
    </text>
    <text x="960" y="740" fill="#aeb6b9" textAnchor="middle" fontSize="18">PRESS ENTER TO RETURN</text>
  </svg>
}

