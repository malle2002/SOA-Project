import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { gql, useQuery, useMutation } from '@apollo/client';
import Image from 'next/image';
import SeatGrid from './seats/SeatGrid';
import DurationFormat from '../lib/DurationFormat';
import FormatDateTime from '../lib/FormatDateTime'
import client from '../lib/apollo-client';
import { RotateLoader } from 'react-spinners';

interface QueryProps{
    title:string;
    poster_url:string;
    day:string;
    movie_id:string;
    start_time:string;
}
interface SeatType {
    seatGroup: string;
    row: number;
    column: number;
    isTaken: boolean;
}
interface SeatGroupType {
    seatGroup: string;
    rows: number;
    columns: number;
    seats: SeatType[];
}

const GET_SCHEDULE_ITEM = gql`
    query GetScheduleItem($cinema_id: String!, $movie_id: String!, $day: String!, $start_time: String!) {
        scheduleItem(cinemaId: $cinema_id, movieId: $movie_id, day: $day, startTime: $start_time) {
            duration
            startTime
            price
            seats {
                groupName
                rows
                columns
                seats {
                    seatGroup
                    row
                    column
                    isTaken
                }
            }
        }
    }
`;
const CHECK_SEATS_AVAILABILITY = gql`
    mutation CheckSeatsAvailability($cinemaId: String!, $movieId: String!, $scheduleDay: String!, $startTime: String!, $seats: [SeatInputType!]!) {
        checkSeatsAvailability(cinemaId: $cinemaId, movieId: $movieId, scheduleDay: $scheduleDay, startTime: $startTime, seats: $seats) {
            areSeatsTaken
        }
    }
`;

const SelectSeats = () => {
    const router = useRouter();
    const { id } = router.query;
    const { title, poster_url, start_time, movie_id, day } = router.query as unknown as QueryProps;
    const [selectedSeats, setSelectedSeats] = useState<SeatType[]>([]);
    const { data, loading, error } = useQuery(GET_SCHEDULE_ITEM, {
        variables: { cinema_id: id, movie_id: movie_id, start_time: start_time, day: day },
    });

    if (loading) return (
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
    if (error) return <p className='text-xl ml-5 dark:text-white'>Error loading movie details.</p>;

    const handleSelectSeat = (seat: SeatType) => {
        if (seat.isTaken) return;

        setSelectedSeats(prevSelectedSeats => {
            const seatIdentifier = `${seat.seatGroup}-${seat.row}-${seat.column}`;

            const seatIndex = prevSelectedSeats.findIndex(
                s => `${s.seatGroup}-${s.row}-${s.column}` === seatIdentifier
            );
    
            if (seatIndex > -1) {
                return prevSelectedSeats.filter((_, index) => index !== seatIndex);
            } else {
                return [...prevSelectedSeats, seat];
            }
        });
    };

    const handleProceedToPayment = async () => {
        const selectedSeatDetails = selectedSeats.map(seat => ({
            seatGroup: seat.seatGroup,
            row: seat.row,
            column: seat.column
        }));

        if (selectedSeatDetails.length === 0) {
            return;
        }

        try {
            const { data:dataSeatAvailability, errors } = await client.mutate({
                mutation: CHECK_SEATS_AVAILABILITY,
                variables: {
                    cinemaId: id,
                    scheduleDay: day,
                    movieId: movie_id,
                    startTime: data.scheduleItem.startTime,
                    seats: selectedSeatDetails
                }
            });

            if (errors) {
                console.error('GraphQL Errors:', errors);
                alert('GraphQL Error: ' + errors.map(error => error.message).join(', '));
                return;
            }
    
    
            if (dataSeatAvailability.checkSeatsAvailability.areSeatsTaken) {
                alert('Some of the selected seats are no longer available. Please select other seats.');
                return;
            }
    
            router.push({
                pathname: '/payment',
                query: {
                    movieId: movie_id,
                    cinemaId: id,
                    day: day,
                    startTime: start_time,
                    totalPrice: data.scheduleItem.price * selectedSeats.length,
                    seats: JSON.stringify(selectedSeatDetails),
                    duration: data.scheduleItem.duration
                }
            });
        } catch (error:any) {
            console.error('Error checking seat availability:', error.networkError);
            alert('There was an error checking seat availability. Please try again.');
        }
    };
    return (
        <div className='my-5 md:flex flex-row'>
            <div className='lg:ml-64'>
                <h1 className="text-center text-2xl font-bold dark:text-white">{title}</h1>
                {data?.scheduleItem !=null ? (
                    <div className='text-center'>
                        <p className='dark:text-white'>Date: {FormatDateTime(data.scheduleItem.startTime)}</p>
                        <p className='dark:text-white'>Price: ${data.scheduleItem.price}</p>
                        <p className='dark:text-white'>Duration: {DurationFormat(data.scheduleItem.duration)}</p>
                    </div>
                ):''}
                {poster_url && title && <Image src={poster_url} alt={title} className="mx-auto my-4 w-64 h-96 object-cover rounded" width={1500} height={1000} /> }
            </div>
            <div className='mx-auto'>
                <h1 className='text-4xl dark:text-white text-center'>Select Your Seats</h1>
                <div className="flex flex-col p-4">
                    <div className='lg:flex lg:justify-evenly lg: gap-5'>
                        {data?.scheduleItem !=null && data.scheduleItem.seats.map((seatGroup:SeatGroupType, index:number) => (
                                <SeatGrid
                                    key={index}
                                    seatGroup={seatGroup}
                                    selectedSeats={selectedSeats}
                                    onSelectSeat={handleSelectSeat}
                                />
                            ))
                        }
                    </div>
                    
                    <div className="text-center">
                        <p className='dark:text-white'>Total Price: ${data.scheduleItem.price * selectedSeats.length}</p>
                        <button
                            onClick={handleProceedToPayment}
                            className="mt-5 bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded"
                        >
                            Proceed to Payment
                        </button>
                    </div>
                </div>
            </div>
            <div className='mr-64'>

            </div>
        </div>
    );
};

export default SelectSeats;
