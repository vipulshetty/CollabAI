import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { Providers } from './providers'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/auth-config'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'CollabAI',
  description: 'Collaborative AI-powered video meetings',
  icons: {
    icon: '/vercel.svg',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authConfig)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${
        // Remove background color for video call routes
        process.env.NODE_ENV === 'development' && 
        typeof window !== 'undefined' && 
        window.location.pathname.includes('/video-call') 
          ? '' 
          : 'bg-gray-50 dark:bg-gray-900'
      }`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers session={session}>
            {children}
            <Toaster richColors position="bottom-right" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
