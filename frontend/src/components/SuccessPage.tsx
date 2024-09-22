import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import DurationFormat from '../lib/DurationFormat';
import FormatDateTime from '../lib/FormatDateTime';
import { useSession } from 'next-auth/react';
import { RotateLoader } from 'react-spinners';

interface SeatType{
    seatGroup: string;
    column: string;
    row: string;
}

const FETCH_TICKET = gql`
    query FetchTicket($id: String!){
        fetchTicket(id: $id){
            user
            movie {
                title
                description
            }
            cinema {
                name
                location
            }
            duration
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

const SuccessPage = () => {
    const router = useRouter()
    const id = router.query.id
    const paymentMethod = router.query.paymentMethod
    const { data: session } = useSession()

    const { data, error, loading } = useQuery(FETCH_TICKET, { variables: { id : id }})

    let email = session?.user?.email
    let uid = session?.id
    let fetchTicket = data?.fetchTicket

    useEffect(() => {
        console.log({email,uid,fetchTicket})
        if (fetchTicket && fetchTicket.user === uid) {
            const sendEmail = async () => {
                const response = await fetch('http://localhost:8000/orders-service/api/orders/sendMail', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: email,
                        subject: 'Ordered successfully',
                        text: `Thank you for your order! Here are your ticket details: 
                               Movie: ${fetchTicket.movie.title}
                               Cinema: ${fetchTicket.cinema.name}
                               Seats: ${fetchTicket.seats.map((seat:SeatType) => `${seat.seatGroup}: Row ${seat.row} - Column ${seat.column}`).join(', ')}
                               Reserved At: ${FormatDateTime(fetchTicket.reservedAt)}`,
                    }),
                });

                if (!response.ok) {
                    console.error(response)
                    console.error('Failed to send email');
                }
            };

            sendEmail();
        }
    }, [email,fetchTicket,uid]);

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
        <div>
            {data?.fetchTicket?.user==session?.id && (
            <>
                <span className='dark:text-white lg:ml-64'>This is your ticket made on {FormatDateTime(data?.fetchTicket.reservedAt)}, thank you for ordering!</span>
                {loading?'':(
                <div className='dark:text-white shadow-lg shadow-slate-700 flex flex-col lg:mx-64'>
                    <p className='text-2xl self-center'>{data?.fetchTicket?.movie.title}</p>

                    <p className='text-xl self-center'>{data?.fetchTicket?.cinema.name} {FormatDateTime(data?.fetchTicket?.startTime)}</p>
                    <p className='text-xl self-center'>{DurationFormat(data?.fetchTicket?.duration)}</p>
                    <p className='text-2xl self-center'>{data?.fetchTicket?.movie.description}</p>
                    <h2 className='dark:text-white text-xl ml-5'>Seats Taken</h2>
                    <div className='ml-5'>
                        { data?.fetchTicket?.seats?.map((seat:SeatType) => (
                            <p key={seat.seatGroup+seat.row+seat.column}>{seat.seatGroup} : Row {seat.row} - Column {seat.column}</p>
                        ))}
                    </div>
                    <p className='dark:text-white'>Payment method: {paymentMethod}</p>
                    <div className='ml-5 my-5 underline'>
                        <a href={`tickets/${session?.id}`}>View All Tickets</a>
                    </div>
                </div>
                )}
            </>
            )}
        </div>
    )
};

export default SuccessPage;
