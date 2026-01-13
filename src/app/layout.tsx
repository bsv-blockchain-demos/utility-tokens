import { WalletProvider } from '@/context/WalletContext'
import { Toaster } from 'sonner'
import '../globals.css'
import 'react-toastify/dist/ReactToastify.css'

export const metadata = {
  title: 'Tokenization',
  description: 'BSV Token Management Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
          <Toaster position="top-right" richColors />
        </WalletProvider>
      </body>
    </html>
  )
}
