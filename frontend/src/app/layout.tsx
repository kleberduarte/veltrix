import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GlobalDialogs from '@/components/ui/GlobalDialogs'
import EmpresaTheme from '@/components/theme/EmpresaTheme'
import PwaRegister from '@/components/pwa/PwaRegister'
import AppShell from '@/components/ui/AppShell'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Veltrix - ERP & PDV',
  description: 'Sistema de gestão para pequenos negócios',
  manifest: '/manifest.webmanifest',
  themeColor: '#2563eb',
  other: {
    'mobile-web-app-capable': 'yes',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Veltrix',
  },
  icons: {
    icon: [
      { url: '/pwa-icon?size=192', type: 'image/png', sizes: '192x192' },
      { url: '/pwa-icon?size=512', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon', sizes: '180x180' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AppShell>
          <EmpresaTheme>{children}</EmpresaTheme>
          <GlobalDialogs />
          <PwaRegister />
        </AppShell>
      </body>
    </html>
  )
}
