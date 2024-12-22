import './globals.css';
import { Providers } from './providers';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authConfig);
  
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
