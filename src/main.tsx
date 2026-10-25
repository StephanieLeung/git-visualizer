import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { TitleBar } from './components/TitleBar'
import { PathProvider } from './context/PathContext'
import { TerminalProvider } from './context/TerminalContext'
import './index.css'

// The title bar is its own React root so it can stay fixed above the app (see index.css)
ReactDOM.createRoot(document.getElementById('titlebar')!).render(<TitleBar />)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TerminalProvider>
      <PathProvider>
        <App />
      </PathProvider>
    </TerminalProvider>
  </React.StrictMode>
)
