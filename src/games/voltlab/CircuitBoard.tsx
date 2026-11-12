import { memo } from 'react'
import type { PointerEventHandler, Ref } from 'react'
import {
  COLORS,
  GRID_X,
  GRID_Y,
  SOURCE_COLORS,
  SOURCE_ROWS,
  STROKES,
  TARGET_ROWS,
  TIMING,
  VIEWBOX,
} from './designTokens'
import { resultFor } from './logic'
import type { Connection, GridPoint, Multiplier, VoltLabState } from './logic'
import { DigitDisplay, SevenSegmentDigit } from './SevenSegment'

const gridNodes = GRID_Y.flatMap((_, row) => GRID_X.map((__, col) => ({ col, row })))

function CircuitDefinitions() {
  return (
    <defs>
      <pattern id="minorGrid" width="29.5" height="29.5" patternUnits="userSpaceOnUse">
        <path d="M29.5 0H0V29.5" fill="none" stroke={COLORS.gridMinor} strokeWidth="1" />
      </pattern>
      <pattern id="majorGrid" width="118" height="118" patternUnits="userSpaceOnUse">
        <path d="M118 0H0V118" fill="none" stroke={COLORS.gridMajor} strokeWidth="1.4" />
      </pattern>
      <radialGradient id="vignette">
        <stop offset="48%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.72" />
      </radialGradient>
      <filter id="digitGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.2" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="wireGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.2" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  )
}

const StaticBackdrop = memo(function StaticBackdrop() {
  return (
    <g aria-hidden="true">
      <rect width={VIEWBOX.width} height={VIEWBOX.height} fill={COLORS.background} />
      <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="url(#minorGrid)" opacity="0.8" />
      <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="url(#majorGrid)" opacity="0.52" />
      {gridNodes.map(({ col, row }) => (
        <g key={`${col}-${row}`} opacity="0.8">
          <rect x={GRID_X[col] - 6} y={GRID_Y[row] - 6} width="12" height="12" fill={COLORS.gridNode} />
          <path d={`M${GRID_X[col] - 13} ${GRID_Y[row]}h26M${GRID_X[col]} ${GRID_Y[row] - 13}v26`} stroke={COLORS.gridNode} />
        </g>
      ))}
      <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="url(#vignette)" />
    </g>
  )
})

function Resistor({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const direction = flip ? -1 : 1
  return <polyline
    points={`${x},${y} ${x + 18},${y} ${x + 34},${y - 25 * direction} ${x + 54},${y + 25 * direction} ${x + 74},${y - 25 * direction} ${x + 94},${y + 25 * direction} ${x + 114},${y - 25 * direction} ${x + 134},${y + 25 * direction} ${x + 150},${y} ${x + 170},${y}`}
    fill="none" stroke={COLORS.text} strokeWidth={STROKES.circuit} strokeLinejoin="miter"
  />
}

function ModifierSymbol({ multiplier }: { multiplier: Multiplier }) {
  if (multiplier === 10) return <g stroke={COLORS.text} strokeWidth="9"><path d="M-24-24L24 24M24-24L-24 24" /></g>
  if (multiplier === 2) return <g stroke={COLORS.text} strokeWidth="8"><path d="M-28-13H28M-28 13H28M-18-27L18 27" /></g>
  return <g stroke={COLORS.text} strokeWidth="7" fill="none"><rect x="-19" y="-27" width="38" height="54" /><path d="M0-36V36" /></g>
}

function StaticCircuit({ state }: { state: VoltLabState }) {
  const connectedTargets = new Map(state.connections.map((connection) => [connection.target, connection.source]))
  const activeSource = state.editing?.source ?? state.selectedSource
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="miter">
      <g stroke={COLORS.frame} strokeWidth={STROKES.circuit}>
        <path d="M438 160H585M755 160H820M1090 160H1470V920H1350M1175 920H1090M820 920H735M585 920H438V160" />
        <path d="M438 277H468M438 306H468M438 335H468M438 511H468M438 540H468M438 569H468M438 744H468M438 773H468M438 802H468" />
        <circle cx="438" cy="277" r="7" fill={COLORS.frame} />
        <circle cx="438" cy="511" r="7" fill={COLORS.frame} />
        <circle cx="438" cy="744" r="7" fill={COLORS.frame} />
        <circle cx="438" cy="864" r="10" fill={COLORS.frame} />
        <path d="M558 306H585M558 540H585M558 773H585M1297 306H1325M1297 540H1325M1297 773H1325M1442 306H1470M1442 540H1470M1442 773H1470" />
        {[306, 540, 773].map((y) => <g key={y}><rect x="578" y={y - 7} width="14" height="14" /><rect x="1290" y={y - 7} width="14" height="14" /><rect x="1463" y={y - 7} width="14" height="14" /></g>)}
        <path d="M430 420H446M438 412V428M430 654H446M438 646V662" />
        <path d="M1460 423H1480M1470 413V433M1460 657H1480M1470 647V667M1458 912H1482M1458 928H1482" />
      </g>
      <Resistor x={585} y={160} />
      <Resistor x={1180} y={920} flip />

      {state.puzzle.inputs.map((value, source) => {
        const y = GRID_Y[SOURCE_ROWS[source]]
        const selected = activeSource === source
        const color = SOURCE_COLORS[source]
        return <g key={`source-${source}`}>
          <path d={`M468 ${y - 58}H548L558 ${y - 48}V${y + 58}H468Z`} fill="#050708" stroke={selected ? color : COLORS.inactive} strokeWidth={selected ? 4 : 3} />
          <SevenSegmentDigit digit={value} x={483} y={y - 48} scale={0.52} color={COLORS.ledWhite} />
          <rect x="578" y={y - 8} width="16" height="16" fill={selected ? color : COLORS.background} stroke={selected ? color : COLORS.inactive} strokeWidth="3" />
        </g>
      })}

      {state.puzzle.multipliers.map((multiplier, target) => {
        const y = GRID_Y[TARGET_ROWS[target]]
        const source = connectedTargets.get(target)
        const color = source === undefined ? COLORS.inactive : SOURCE_COLORS[source]
        return <g key={`target-${target}`}>
          <circle cx="1385" cy={y} r="60" fill="#050708" stroke={color} strokeWidth={source === undefined ? 3 : 4} />
          <g transform={`translate(1385 ${y})`}><ModifierSymbol multiplier={multiplier} /></g>
          <rect x="1289" y={y - 8} width="16" height="16" fill={source === undefined ? COLORS.background : color} stroke={color} strokeWidth="3" />
        </g>
      })}
    </g>
  )
}

function Battery({ remainingMs }: { remainingMs: number }) {
  const lit = Math.ceil(Math.max(0, remainingMs) / TIMING.batteryMs * 6)
  return <g aria-label={`Battery ${Math.ceil(remainingMs / 1000)} seconds remaining`} role="img">
    <path d="M585 892H725V948H585Z" fill="#050708" stroke={COLORS.frame} strokeWidth="3" />
    <path d="M575 908H585M575 932H585M565 914V926M558 920H565" stroke={COLORS.frame} strokeWidth="4" />
    {Array.from({ length: 6 }, (_, index) => <rect key={index} x={594 + index * 21} y="902" width="15" height="36"
      fill={index < lit ? COLORS.ledGreen : '#14251f'} stroke={COLORS.frame} strokeWidth="2" />)}
    {Array.from({ length: 5 }, (_, index) => <path key={index} d={`M${610 + index * 24} 883V892M${610 + index * 24} 948V958`} stroke={COLORS.frame} strokeWidth="3" />)}
  </g>
}

function wirePoints(path: readonly GridPoint[]) {
  return path.map(({ col, row }) => `${GRID_X[col]},${GRID_Y[row]}`).join(' ')
}

function cornerPoints(path: readonly GridPoint[]) {
  return path.filter((point, index) => {
    if (index === 0 || index === path.length - 1) return true
    const previous = path[index - 1]
    const next = path[index + 1]
    return (previous.col - point.col) !== (point.col - next.col)
      || (previous.row - point.row) !== (point.row - next.row)
  })
}

function Wire({ connection, opacity = 1, editing = false }: { connection: Connection; opacity?: number; editing?: boolean }) {
  const color = SOURCE_COLORS[connection.source]
  return <g opacity={opacity} filter="url(#wireGlow)" aria-hidden="true">
    <polyline points={wirePoints(connection.path)} fill="none" stroke={color} strokeWidth={editing ? 5 : STROKES.wire} strokeLinejoin="miter" strokeLinecap="butt" />
    {cornerPoints(connection.path).map(({ col, row }, index) => <rect key={`${col}-${row}-${index}`}
      x={GRID_X[col] - STROKES.wireNode / 2} y={GRID_Y[row] - STROKES.wireNode / 2}
      width={STROKES.wireNode} height={STROKES.wireNode} fill={color} />)}
  </g>
}

function Tutorial({ state }: { state: VoltLabState }) {
  const initial = state.connections.length === 0 && !state.editing
  const completeWrong = state.connections.length === 3
  const lines = initial
    ? ['To bypass the system you will need to', 'link the numbers on the left to the', 'modifiers on the right. You must link', 'them in a specific way to achieve a', 'target sum.']
    : completeWrong
      ? ['You need to solve the grid before the', 'battery depletes.', 'You will receive a time penalty for an', 'incorrect sum.', 'Hold ESC to exit.']
      : ['Use WASD or arrow keys to link the nodes.', 'Press ENTER to register the link and add it', 'to the total.', 'Press BACKSPACE to go back a step.']
  return <text x="78" y="66" fill={COLORS.text} fontSize="23" fontWeight="600" aria-label={lines.join(' ')}>
    {lines.map((line, index) => <tspan x="78" dy={index === 0 ? 0 : 30} key={line}>{line}</tspan>)}
  </text>
}

function SignalIcons() {
  return <g fill={COLORS.text} stroke={COLORS.text} aria-hidden="true">
    {[8, 14, 20, 27].map((height, index) => <rect key={height} x={1840 + index * 11} y={78 - height} width="7" height={height} />)}
    <path d="M1890 61Q1903 48 1916 61M1895 67Q1903 59 1911 67M1901 73Q1903 71 1905 73" fill="none" strokeWidth="4" />
  </g>
}

function ControlHints({ exitProgress }: { exitProgress: number }) {
  return <g fontSize="18" fill={COLORS.text} aria-label="Controls: move with arrows or WASD, select with Enter, undo with Backspace, hold Escape to exit">
    <text x="1325" y="1035">Move <tspan fill="#fff">WASD / ↑↓←→</tspan></text>
    <text x="1535" y="1035">Select <tspan fill="#8fb3ff">ENTER</tspan></text>
    <text x="1690" y="1035">Undo <tspan fill="#f0b1aa">BACKSPACE</tspan></text>
    <rect x="1688" y="1050" width="174" height="5" fill="#301a1b" />
    <rect x="1688" y="1050" width={174 * exitProgress} height="5" fill={COLORS.ledRed} />
    <text x="1690" y="1073" fontSize="14">Hold ESC to exit</text>
  </g>
}

type CircuitBoardProps = {
  state: VoltLabState
  exitProgress: number
  transitionProgress: number
  svgRef: Ref<SVGSVGElement>
  onPointerDown: PointerEventHandler<SVGSVGElement>
}

export function CircuitBoard({ state, exitProgress, transitionProgress, svgRef, onPointerDown }: CircuitBoardProps) {
  const result = resultFor(state.puzzle, state.connections)
  const matched = state.phase === 'matched' || state.phase === 'transition'
  const resultColor = matched ? COLORS.ledGreen : result > state.puzzle.target ? COLORS.overTarget : COLORS.ledWhite
  const circuitOpacity = state.phase === 'transition' ? Math.max(0, 1 - transitionProgress * 1.35) : 1
  return (
    <svg ref={svgRef} viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} preserveAspectRatio="xMidYMid meet"
      role="application" aria-label="VOLTlab circuit linking puzzle" onPointerDown={onPointerDown}>
      <CircuitDefinitions />
      <StaticBackdrop />
      <g opacity={circuitOpacity}>
        <StaticCircuit state={state} />
        <DigitDisplay value={state.puzzle.target} x={820} y={102} color={COLORS.ledRed} label="TARGET" labelAbove />
        <Battery remainingMs={state.remainingMs} />
        <DigitDisplay value={result} x={820} y={860} color={resultColor} label="RESULT" />
        {state.connections.map((connection, index) => {
          const fade = state.phase === 'transition'
            ? Math.max(0, Math.min(1, 1 - (transitionProgress * 1.45 - index * 0.22)))
            : 1
          return <Wire connection={connection} opacity={fade} key={`${connection.source}-${connection.order}`} />
        })}
        {state.editing ? <Wire connection={{ ...state.editing, target: -1, order: -1 }} editing /> : null}
        <Tutorial state={state} />
        <SignalIcons />
        <ControlHints exitProgress={exitProgress} />
      </g>
    </svg>
  )
}

