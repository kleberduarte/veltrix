import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GlobalDialogs from '@/components/ui/GlobalDialogs'
import EmpresaTheme from '@/components/theme/EmpresaTheme'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Veltrix - ERP & PDV',
  description: 'Sistema de gestão para pequenos negócios',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <EmpresaTheme>{children}</EmpresaTheme>
        <GlobalDialogs />
      </body>
    </html>
  )
}
