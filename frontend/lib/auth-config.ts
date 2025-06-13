import type { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      }
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    })
  ],
  debug: true,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('Sign in attempt:', { user, account, profile });
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirect after sign-in
      console.log('Redirect callback:', { url, baseUrl });

      // If there's a 'next' parameter in the URL, redirect there
      if (url.includes('next=')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const nextUrl = urlParams.get('next');
        if (nextUrl && nextUrl.startsWith('/')) {
          return `${baseUrl}${decodeURIComponent(nextUrl)}`;
        }
      }

      // If the URL is relative and starts with /, use it
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      // If the URL is from the same origin, use it
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // Default to dashboard
      return `${baseUrl}/protected/dashboard`;
    },
    async session({ session, token }) {
      console.log('Session callback:', { session, token });
      if (session?.user) {
        (session.user as any).id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, account }) {
      console.log('JWT callback:', { token, account });
      return token;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};
