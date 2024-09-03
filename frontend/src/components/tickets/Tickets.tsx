import React from 'react';
import { useRouter } from 'next/router';
import { gql, useQuery } from '@apollo/client';
import FormatDateTime from '@/lib/FormatDateTime';
import { useSession } from 'next-auth/react';
import { RotateLoader } from 'react-spinners';

interface SeatType {
    length: number;
    seatGroup: string;
    row: number;
    column: number;
}

interface MovieType {
    title: string;
}

interface CinemaType{
    name: string;
    location: string;
}

interface TicketType {
    id: string;
    title: string;
    movie: MovieType;
    cinema: CinemaType;
    startTime: string;
    seats: SeatType;
    reservedAt: string;
}

const FETCH_USER_TICKETS = gql`
    query FetchUserTickets($userId: String!){
        ticketsByUser(userId: $userId) {
            id
            movie {
                title
            }
            cinema {
                name
                location
            }
            startTime
            seats {
                seatGroup 
                row
                column
            }
            reservedAt
        }
    }
`

const Tickets = () => {
    const router = useRouter();
    const { id } = router.query;
    const { data: session } = useSession();
    const { data: dataTickets, loading, error } = useQuery(FETCH_USER_TICKETS, { variables: { userId: id }, skip: !id, });

    if(error) return <p className='text-xl ml-5 dark:text-white'>Invalid user.</p>;
    if (!session) return <p className='text-xl ml-5 dark:text-white'>Please sign in to view your tickets.</p>;
    if (session?.id !== id) return <p className='text-xl ml-5 dark:text-white'>You do not have permission to view these tickets.</p>;
    if(loading) return (
        <div className='absolute top-1/2 left-1/2 right-1/2 bottom-1/2'>
            <RotateLoader
                loading={true}
                margin={2}
                color='#57ffc7'
                size={10}
                speedMultiplier={1}
            />
        </div>
    )

    return (
        <div className='flex flex-col lg:ml-64'>
            <h2 className='dark:text-white text-2xl'>Ticket order history: </h2>
            { !loading && (
                <>
                    {dataTickets?.ticketsByUser?.length > 0 ? (
                        dataTickets?.ticketsByUser?.map((ticket:TicketType) => (
                            <div className='dark:text-white mb-5 shadow-lg shadow-slate-800 p-5' key={ticket.id}>
                                <h1>Title: {ticket.movie.title}</h1>
                                <p>ID: {ticket.id}</p>
                                <p>Premiered on: {ticket.cinema.name}, {ticket.cinema.location} {FormatDateTime(ticket.startTime)}</p>
                                <p>Reserved At: {FormatDateTime(ticket.reservedAt)}</p>
                                <p>Seats reserved: {ticket.seats.length}</p>
                            </div>
                        ))):(
                            <p className='underline dark:text-white mt-5'>No tickets found</p>
                        )}
                </>
            )}
        </div>
    );
};

export default Tickets;
