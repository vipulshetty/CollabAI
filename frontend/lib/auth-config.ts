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
