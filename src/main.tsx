import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './app/queryClient'
import { App } from './App'
import './styles/global.css'

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
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
})
