import { COLORS } from './designTokens'

const digitSegments: Record<string, string> = {
  '0': 'abcedf',
  '1': 'bc',
  '2': 'abdeg',
  '3': 'abcdg',
  '4': 'bcfg',
  '5': 'acdfg',
  '6': 'acdefg',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
}

const segmentPaths = {
  a: 'M18 8 L30 0 H78 L90 8 L80 18 H28 Z',
  b: 'M92 10 L100 20 V76 L92 88 L84 78 V22 Z',
  c: 'M92 92 L100 104 V160 L92 170 L84 158 V102 Z',
  d: 'M18 172 L28 162 H80 L90 172 L78 180 H30 Z',
  e: 'M8 92 L16 102 V158 L8 170 L0 160 V104 Z',
  f: 'M8 10 L16 22 V78 L8 88 L0 76 V20 Z',
  g: 'M17 90 L28 80 H80 L91 90 L80 100 H28 Z',
} as const

type SevenSegmentDigitProps = {
  digit: number | string
  x?: number
  y?: number
  scale?: number
  color?: string
  dimColor?: string
}

export function SevenSegmentDigit({
  digit,
  x = 0,
  y = 0,
  scale = 1,
  color = COLORS.ledWhite,
  dimColor = '#17201e',
}: SevenSegmentDigitProps) {
  const enabled = digitSegments[String(digit)] ?? ''
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} aria-hidden="true">
      {Object.entries(segmentPaths).map(([segment, path]) => (
        <path
          d={path}
          fill={enabled.includes(segment) ? color : dimColor}
          filter={enabled.includes(segment) ? 'url(#digitGlow)' : undefined}
          key={segment}
          opacity={enabled.includes(segment) ? 1 : 0.46}
        />
      ))}
    </g>
  )
}

type DigitDisplayProps = {
  value: number
  x: number
  y: number
  color: string
  label: string
  labelAbove?: boolean
}

export function DigitDisplay({ value, x, y, color, label, labelAbove = false }: DigitDisplayProps) {
  const digits = String(Math.max(0, Math.min(999, Math.floor(value)))).padStart(3, '0')
  return (
    <g aria-label={`${label} ${digits}`} role="img">
      {digits.split('').map((digit, index) => {
        const cellX = x + index * 90
        return (
          <g key={`${digit}-${index}`}>
            <path
              d={`M${cellX} ${y + 10} L${cellX + 10} ${y} H${cellX + 88} V${y + 118} H${cellX} Z`}
              fill="#050708"
              stroke={COLORS.frame}
              strokeWidth="3"
            />
            <SevenSegmentDigit digit={digit} x={cellX + 18} y={y + 15} scale={0.56} color={color} />
          </g>
        )
      })}
      <text
        x={x + 135}
        y={labelAbove ? y - 12 : y + 144}
        fill={color}
        fontSize="22"
        textAnchor="middle"
        letterSpacing="1"
      >{label}</text>
    </g>
  )
}

