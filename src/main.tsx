import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

async function prepareApp(): Promise<void> {
  if (import.meta.env.MODE === 'mock') {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledFrame: 'bypass',
    })
  }
}

prepareApp().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
