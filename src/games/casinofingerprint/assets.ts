import print0 from './assets/print_0.png'
import print1 from './assets/print_1.png'
import print2 from './assets/print_2.png'
import print3 from './assets/print_3.png'

export const prints = [print0, print1, print2, print3]
const modules = import.meta.glob<string>('./assets/[0-3]/[0-3].png', { eager: true, query: '?url', import: 'default' })
export function pieceImage(print: number, part: number) {
  return modules[`./assets/${print}/${part}.png`]
}
