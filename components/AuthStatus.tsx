'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AuthStatus() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 p-4 flex gap-4 items-center">
      {status === 'loading' ? (
        <div>Loading...</div>
      ) : session ? (
        <>
          <span className="text-sm">
            Signed in as {session.user?.name}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </>
      ) : (
        <Link
          href="/auth/signin"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Sign In
        </Link>
      )}
    </div>
  );
}