import { GitVisualizer } from './components/GitVisualizer'
import { Landing } from './components/Landing'
import { GitProvider } from './context/GitContext'
import { usePath } from './context/PathContext'

// Repo picker until a repository is chosen, then the visualizer
export default function App() {
  const { path } = usePath()

  return (
    <div className="h-full m-0 p-0">
      {path.trim() === '' ? (
        <Landing />
      ) : (
        <GitProvider>
          <GitVisualizer />
        </GitProvider>
      )}
    </div>
  )
}
