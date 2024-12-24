'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';

export function UserProfile() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <div className="user-profile">
      <Image 
        src={session.user?.image || '/default-avatar.png'} 
        alt={session.user?.name || 'User Profile'}
        width={50}
        height={50}
        className="rounded-full"
      />
      <div>
        <h3>{session.user?.name}</h3>
        <p>{session.user?.email}</p>
      </div>
    </div>
  );
}