import { Providers } from './app/providers'
import { Dashboard } from './pages/dashboard'

export function App() {
  return (
    <Providers>
      <Dashboard />
    </Providers>
  )
}
