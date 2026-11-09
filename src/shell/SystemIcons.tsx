import { useId } from 'react'

type IconProps = {
  className?: string
}

export function DriveIcon({ className }: IconProps) {
  const id = useId()
  return (
    <svg className={className} viewBox="0 0 92 82" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-driveTop`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f8df2" />
          <stop offset="1" stopColor="#2868c8" />
        </linearGradient>
        <linearGradient id={`${id}-driveBase`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7f7f5" />
          <stop offset="1" stopColor="#bfc1be" />
        </linearGradient>
        <filter id={`${id}-driveShadow`} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.4" floodOpacity=".42" />
        </filter>
      </defs>
      <g filter={`url(#${id}-driveShadow)`}>
        <path d="M25 7h42c4 0 6 2 7 6l7 48H11l7-48c1-4 3-6 7-6Z" fill={`url(#${id}-driveTop)`} stroke="#245491" strokeWidth="1.4" />
        <path d="M11 61h70v10c0 3-2 5-5 5H16c-3 0-5-2-5-5V61Z" fill={`url(#${id}-driveBase)`} stroke="#9b9d9a" strokeWidth="1.4" />
        <path d="M17 63h58" stroke="#fff" strokeOpacity=".8" />
        <circle cx="46" cy="69" r="3.2" fill="#2862a3" stroke="#555" strokeWidth=".8" />
        <circle cx="46" cy="68.2" r="1.2" fill="#bce8ff" />
      </g>
    </svg>
  )
}

export function NetworkIcon({ className }: IconProps) {
  const id = useId()
  return (
    <svg className={className} viewBox="0 0 92 92" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-ocean`} cx="35%" cy="28%" r="72%">
          <stop offset="0" stopColor="#72b6f3" />
          <stop offset=".55" stopColor="#2879c2" />
          <stop offset="1" stopColor="#15518f" />
        </radialGradient>
        <filter id={`${id}-globeShadow`} x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity=".4" />
        </filter>
      </defs>
      <circle cx="46" cy="45" r="38" fill={`url(#${id}-ocean)`} stroke="#e4f2ff" strokeWidth="1.3" filter={`url(#${id}-globeShadow)`} />
      <path d="M23 18l9-6 11 3 3 8-6 6-8-2-5 6-9-4 5-11Zm30 8 9-4 8 5 5 11-8 4-4-5-7 1-6-6 3-6ZM40 42l12-3 8 7-3 8-7 3-2 11-9 7-5-10-8-8 4-10 10-5Z" fill="#d2be81" stroke="#8f7e55" strokeWidth=".7" />
      <path d="M12 45h68M17 29h58M18 61h56M46 7c-10 11-15 24-15 38s5 27 15 38M46 7c10 11 15 24 15 38s-5 27-15 38" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="1" />
    </svg>
  )
}

export function DeviceIcon({ className }: IconProps) {
  const id = useId()
  return (
    <svg className={className} viewBox="0 0 72 94" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-phoneCase`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e8e8e4" />
          <stop offset=".5" stopColor="#aaa9a2" />
          <stop offset="1" stopColor="#efefec" />
        </linearGradient>
        <linearGradient id={`${id}-phoneScreen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#174e96" />
          <stop offset="1" stopColor="#5c8bc1" />
        </linearGradient>
        <filter id={`${id}-phoneShadow`} x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity=".35" />
        </filter>
      </defs>
      <g filter={`url(#${id}-phoneShadow)`}>
        <path d="M20 3h32c4 0 7 4 7 8v73c0 4-3 7-7 7H20c-4 0-7-3-7-7V11c0-4 3-8 7-8Z" fill={`url(#${id}-phoneCase)`} stroke="#81817d" />
        <rect x="20" y="10" width="32" height="42" rx="2" fill={`url(#${id}-phoneScreen)`} stroke="#63645f" />
        <path d="M24 57h24M24 62h24M24 67h24M24 72h24M24 77h24M29 55v25M36 55v25M43 55v25" stroke="#7a7a76" strokeWidth="1.4" />
        <rect x="25" y="82" width="22" height="4" rx="2" fill="#7b7b77" />
        <path d="M23 13h26v34H23z" fill="#2d65ae" opacity=".45" />
      </g>
    </svg>
  )
}
