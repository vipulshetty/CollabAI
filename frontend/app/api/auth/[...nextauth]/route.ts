import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Log the client ID being used
if (process.env.GOOGLE_CLIENT_ID) {
  console.log('Using Google Client ID:', process.env.GOOGLE_CLIENT_ID.substring(0, 8) + '...');
} else {
  console.error('Google Client ID is not set!');
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
