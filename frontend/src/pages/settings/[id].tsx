import Profile from '@/components/settings/Profile';
import React from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

const ProfileSettings = () => {
  const router = useRouter()
  const { id } = router.query;
  const route = `/api/auth/signin?callbackUrl=/settings/{id}`;
  const { data: session } = useSession({
      required:true,
      onUnauthenticated() {
          router.push(route)
      },
  })
  return <Profile />;
};

export default ProfileSettings;
