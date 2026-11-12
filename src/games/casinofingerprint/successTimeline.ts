// File seconds in CASINO_FINGERPRINT_SUCCESS_REFERENCE.md (slowdown unknown).
export const SUCCESS_EXIT_MS = 3000
type Band = readonly [top: number, height: number, color: string]
const blue = '#1700f5', green = '#164600', yellow = '#d4ed00', violet = '#9872ef'
const bands = {
  black: [],
  entry: [[4, 4, blue], [9, 46, green], [56, 30, blue], [91, 5, violet]],
  blast: [[7, 20, '#ed00ef'], [26, 13, yellow], [40, 44, blue], [91, 5, violet]],
  white: [[7, 27, '#d5b2ef'], [32, 10, yellow], [42, 28, '#ddbee9'], [70, 16, blue]],
  blue: [[27, 59, blue], [80, 8, violet], [89, 3, yellow]],
  green: [[4, 4, blue], [10, 70, green], [48, 9, yellow], [81, 3, blue]],
  center: [[35, 22, '#6540ed'], [54, 9, '#2910a5']],
  quiet: [[15, 62, '#06340c']],
  upper: [[5, 20, '#8e9f28'], [29, 40, green], [75, 10, '#170971']],
  pale: [[5, 20, '#b8b7c9'], [27, 42, '#345400'], [71, 15, '#170971']],
  fading: [[6, 15, blue], [25, 47, '#00121b'], [66, 5, blue], [80, 5, blue], [89, 7, '#aaaab2']],
  wash: [[6, 8, '#494b00'], [35, 48, '#063600'], [89, 7, '#81818d']],
  terminal: [[0, 26, '#93939a'], [28, 41, green], [70, 14, '#130b45']],
  lastBlue: [[20, 49, blue], [78, 8, '#a4a4a4']],
  lastYellow: [[31, 7, '#5c6800'], [45, 41, '#b2d500'], [88, 6, violet]],
  afterglow: [[30, 39, '#031d08'], [70, 3, '#123000']],
} satisfies Record<string, readonly Band[]>

// Each composition holds until the next cue; no modulo/random animation.
const cuts: readonly (readonly [number, keyof typeof bands])[] = [
  [.75, 'black'], [1.2, 'entry'], [1.5, 'blast'], [1.7, 'white'],
  [2.4, 'blue'], [3.2, 'green'], [4.2, 'center'], [5.2, 'quiet'],
  [6, 'upper'], [6.7, 'pale'], [7.5, 'fading'], [9.5, 'wash'],
  [10, 'fading'], [11, 'center'], [11.5, 'quiet'], [11.75, 'terminal'],
  [12.2, 'quiet'], [12.8, 'black'], [13.2, 'lastBlue'],
  [13.5, 'lastBlue'], [13.7, 'lastYellow'], [14, 'afterglow'], [14.4, 'black'],
]

export function successTimeline(elapsedMs: number) {
  const t = .75 + Math.min(1, Math.max(0, elapsedMs / SUCCESS_EXIT_MS)) * 13.75
  let index = 0
  while (index + 1 < cuts.length && cuts[index + 1][0] <= t) index++
  const composition = cuts[index][1]
  return {
    t, index, bands: bands[composition] as readonly Band[],
    stage: t < 1.5 || t >= 12.8 ? 'black' : t < 11.75 ? 'shell' : 'terminal',
    text: t < 1.5 || t >= 12.8 ? 'hidden' : t < 7.5 ? 'whole' : t < 10.5 ? 'broken' : 'trace',
    textColor: t < 3.2 ? '#eee9df' : t < 5.2 ? '#d6df77' : t < 6 ? '#5bde47' : '#b7bd76',
    shift: [0, -23, 18, -9, 31, -16][index % 6],
  }
}
