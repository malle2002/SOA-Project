import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useSession } from 'next-auth/react';
import ImagePopUp from '../ImagePopUp';
import { RotateLoader } from 'react-spinners';

interface WorkingDayType {
  day: string;
  startTime: string;
  endTime: string;
}
const FETCH_CINEMA = gql`
  query findCinema($cinema_id: String!) {
    fetchCinema(cinemaId: $cinema_id) {
      id
      name
      location
      rating
      imageUrl
      ratedBy
      workingDays {
        day
        startTime
        endTime
      }
    }
  }
`;
const RATE_CINEMA = gql`
  mutation RateCinema($cinema_id: ID!, $rating: Float!, $user_id: String!) {
    rateCinema(cinemaId: $cinema_id, rating: $rating, userId: $user_id) {
      success
    }
  }
`;

const Cinema: React.FC<{ id: string }> = ({ id }) => {
  const { data: session } = useSession();
  const [rating, setRating] = useState<number>(0);
  const [rated, setRated] = useState<boolean>(false);
  const { data, error, loading, refetch } = useQuery(FETCH_CINEMA, {
    variables: {
      cinema_id: id,
    },
    onCompleted: (data) => {
      if (session?.id) {
        const userHasRated = data?.fetchCinema.ratedBy.includes(session.id);
        setRated(userHasRated);
      }
    }
  });

  const [rateCinema] = useMutation(RATE_CINEMA);

  const handleRatingChange = async (newRating: number) => {
    if(session?.id){
      if (data && data.fetchCinema) {
        const currentUserRated = data.fetchCinema.ratedBy.includes(session?.id);
        setRated(currentUserRated);

        if (rated) {
          console.log("You have already rated this cinema.");
          return;
        }
        setRating(newRating);
        try {
          await rateCinema({
            variables: {
              cinema_id: id,
              rating: newRating,
              user_id: session?.id,
            },
          });
          await refetch();
        } catch (error) {
          console.error('Error rating cinema:', error);
        }
      }
    }
    else {
      console.error('User not found', error)
    }
  };

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
  if (error) return <p className='text-xl ml-5 dark:text-white'>Error: {error.message}</p>;

  const cinema = data?.fetchCinema;

  return (
    <div className='my-5 w-full'>
      {cinema && (
        <div className="bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 flex flex-col md:flex-row">
          <div className="md:w-1/2">
            <div className="h-full w-full">
              <ImagePopUp 
                imageUrl={`${cinema.imageUrl}`} 
                altText='Cinema Image' 
              />
            </div>
          </div>
          <div className="md:w-1/2 mt-10 items-start">
            <h5 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white text-center">{cinema.name}</h5>
            <p className="font-semibold tracking-tight text-gray-900 dark:text-white text-center">{cinema.location}</p>
            <div className='ml-5 mt-5'>
              {cinema.workingDays.map((_:WorkingDayType, index:number) => (
                <div key={index}>
                    <p className='dark:text-gray-300'>{_.day}: {_.startTime} - {_.endTime}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center mt-2.5 mb-5 ml-2">
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                {[...Array(Math.floor(cinema.rating))].map((_, index) => (
                  <svg key={index} className="w-4 h-4 ml-3 text-yellow-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
                  </svg>
                ))}
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800 ms-3">{(cinema.rating).toFixed(2)}</span>
            </div>
            {!rated && (
              <div className="flex items-center space-x-2 ml-5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button key={value} onClick={() => handleRatingChange(value)} className={`text-sm font-medium rounded-lg px-3 py-1.5 focus:outline-none ${rated ? 'bg-gray-200' : 'bg-yellow-300'}`}>
                    {value}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center ml-5 mt-10 mb-5">
              <a href={`/locations/${id}`} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Visit</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cinema;
