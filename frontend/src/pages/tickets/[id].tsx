import React from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Tickets from '../../components/tickets/Tickets';

const TicketsPage = () => {
  const router = useRouter()
  const { id } = router.query;
  const route = `/api/auth/signin?callbackUrl=/tickets/{id}`;
  const { data: session } = useSession({
      required:true,
      onUnauthenticated() {
          router.push(route)
      },
  })
  return <Tickets />;
};

export default TicketsPage;
