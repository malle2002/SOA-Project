import React from 'react';
import { useRouter } from 'next/router';
import { gql, useMutation, useQuery } from '@apollo/client';
import { PayPalButtons } from '@paypal/react-paypal-js';
import FormatDateTime from '@/lib/FormatDateTime';
import { useSession } from 'next-auth/react';
import { RotateLoader } from 'react-spinners';

interface SeatType {
    seatGroup: string;
    column: number;
    row: number;
}

const GET_MOVIE_BY_ID = gql`
  query GetMovieById($id: String!) {
    fetchMovie(movieId: $id) {
      title
    }
  }
`;

const FETCH_CINEMA = gql`
  query findCinema($cinema_id: String!) {
    fetchCinema(cinemaId: $cinema_id) {
      name
      location
    }
  }
`;

const BOOK_SEATS = gql`
    mutation BookSeats($cinemaId: String!, $movieId: String!, $seats: [SeatInputType!]!, $startTime: String!, $scheduleDay: String!, $userId: String!, $duration: Int!) {
        bookSeats(cinemaId: $cinemaId, movieId: $movieId, seats: $seats, scheduleDay: $scheduleDay, startTime: $startTime, userId: $userId, duration: $duration) {
            ticket {
                id
            }
            success
            message
        }
    }
`;

const Payment = () => {
    const router = useRouter();
    const { movieId, cinemaId, totalPrice, day  } = router.query;
    const date = router.query.startTime as string;
    const duration = router.query.duration as string;
    const seatsQuery = router.query.seats as string;
    const selectedSeats = seatsQuery ? JSON.parse(seatsQuery) : [];
    const { data: session, status } = useSession();
    const { data:dataMovie, loading:loadingMovie } = useQuery(GET_MOVIE_BY_ID, { variables: { id: movieId} })
    const { data:dataCinema, loading:loadingCinema } = useQuery(FETCH_CINEMA, { variables: { cinema_id: cinemaId} })
    const [bookSeats] = useMutation(BOOK_SEATS);

    const totalPriceString: string = Array.isArray(totalPrice) ? totalPrice[0] : (totalPrice || '0');
    const currencyCode: string = 'USD';

    const handlePaymentSuccess = async (paymentMethod: string) => {
        try {
            const { data, errors } = await bookSeats({
                variables: {
                    cinemaId: cinemaId,
                    movieId: movieId,
                    seats: selectedSeats,
                    scheduleDay: day,
                    startTime: date,
                    userId: session?.id,
                    duration: Number.parseInt(duration)
                }
            });
            if (data.bookSeats.success) {
                router.push({
                    pathname: '/success',
                    query: {
                        id: data.bookSeats.ticket.id,
                        paymentMethod: paymentMethod
                    }
                })
                
            } else {
                console.error(data.bookSeats.message);
            }
        } catch (error) {
            console.error('Error booking seats:', error);
        }
    };

    if(loadingMovie || loadingCinema) return (
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
        <div className='flex flex-col lg:ml-64 lg:w-1/3'>
            <h2 className='text-center lg:text-start dark:text-white text-xl mb-5'><strong>{ loadingMovie ? '' : dataMovie?.fetchMovie.title}</strong></h2>
            { loadingCinema ?
                ''
            : 
                <div>
                    <h2 className='text-center lg:text-start dark:text-white text-xl'>{dataCinema?.fetchCinema.name}</h2>
                    <h2 className='text-center lg:text-start dark:text-white text-xl'>Location {dataCinema?.fetchCinema.location}</h2>
                    <h2 className='text-center lg:text-start dark:text-white text-xl'>Starting {FormatDateTime(date)}</h2>
                </div>
            }
            <ul className='ml-5 mt-5'>
                {selectedSeats.map((seat: SeatType, index: number) => (
                    <li key={index} className='dark:text-white'>Group: {seat.seatGroup}, Row: {seat.row}, Column: {seat.column}</li>
                ))}
            </ul>    
            <p className='text-center dark:text-white text-2xl my-5'>Total Price: ${totalPriceString}</p>
            <div className='flex flex-col'>
                <h2 className='dark:text-white'>Payment options:</h2>
                <PayPalButtons
                    createOrder={(data, actions) => {
                        if (actions.order) {
                            return actions.order.create({
                                intent: 'CAPTURE',
                                purchase_units: [{
                                    amount: {
                                        currency_code: currencyCode,
                                        value: "0.01"
                                    }
                                }]
                            });
                        }
                        return Promise.reject('Order creation failed.');
                    }}
                    onApprove={async (data, actions) => {
                        if (actions.order) {
                            await actions.order.capture();
                            handlePaymentSuccess('PayPal');
                        }
                    }}
                    onError={(error: any) => console.error('PayPal error:', error)}
                />
            </div>
            <div>
                <h2>Pay with Stripe:</h2>
                <button
                    onClick={() => handlePaymentSuccess('Stripe')}
                    className="mt-5 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 rounded"
                >
                    Pay with Stripe
                </button>
            </div>
        </div>
    );
};

export default Payment;
