import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    console.log('Middleware executing for:', req.url);
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        console.log('Authorization check, token:', !!token);
        return token !== null;
      }
    },
    pages: {
      signIn: '/auth/signin'
    }
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/protected/:path*', 
    '/profile/:path*'
  ]
};