import SuccessPage from '@/components/SuccessPage';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React from 'react';

const SuccessOrder = () => {
  const router = useRouter()
  const { id } = router.query;
  const { data: session } = useSession({
      required:true,
      onUnauthenticated() {
          router.push('/')
      },
  })
  return <SuccessPage />;
};

export default SuccessOrder;
