import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WalletProvider } from '@/context/WalletContext'
import { Toaster } from 'sonner'
import App from './App'
import './globals.css'
import './styles/react-toastify.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider>
      <App />
      <Toaster position="top-right" richColors />
    </WalletProvider>
  </StrictMode>,
)
