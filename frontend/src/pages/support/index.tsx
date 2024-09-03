import React from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Support from '@/components/support/Support';

const SupportPage = () => {
  const router = useRouter()
  const { id } = router.query;
  const route = `/api/auth/signin?callbackUrl=/support`;
  const { data: session } = useSession({
      required:true,
      onUnauthenticated() {
          router.push(route)
      },
  })
  return <Support />;
};

export default SupportPage;
