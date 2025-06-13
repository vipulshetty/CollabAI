import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { Providers } from './providers'
// import { SimpleConsentBanner } from '@/components/gdpr/SimpleConsentBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'CollabAI',
  description: 'Collaborative AI-powered video meetings',
  icons: {
    icon: '/vercel.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
            {/* <SimpleConsentBanner /> */}
            <Toaster richColors position="bottom-right" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
