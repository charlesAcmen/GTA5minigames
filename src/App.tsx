import { AudioProvider } from './audio/AudioProvider'
import { DesktopShell } from './shell/DesktopShell'

export function App() {
  return (
    <AudioProvider>
      <DesktopShell />
    </AudioProvider>
  )
}
