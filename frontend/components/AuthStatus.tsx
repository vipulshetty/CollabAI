'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthStatus() {
  const { user, loading, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 p-4 flex gap-4 items-center">
      {loading ? (
        <div>Loading...</div>
      ) : user ? (
        <>
          <span className="text-sm">
            Signed in as {user.email}
          </span>
          <button
            onClick={handleSignOut}
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