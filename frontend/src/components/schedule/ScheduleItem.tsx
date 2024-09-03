import React from 'react';
import { gql, useQuery } from '@apollo/client';
import Image from 'next/image';
import { RotateLoader } from 'react-spinners';

const FETCH_MOVIE = gql`
    query FetchMovie($movie_id: String!) {
        fetchMovie(movieId: $movie_id) {
            id
            title
            genres
            duration
            posterUrl
            description
        }
    }
`;

const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return date.toLocaleString('en-US', options);
  };

const ScheduleItem: React.FC<{ day:string, cinemaId: string, movieId: string, startTime: string }> = ({day, cinemaId, movieId, startTime}) => {
  
  const { data, error, loading } = useQuery(FETCH_MOVIE, {
    variables: {
      movie_id: movieId,
    },
  });

  const formattedStartTime = formatDateTime(startTime);

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
    <div className="flex items-center space-x-4">
      {data?.fetchMovie && (
        <div className='flex flex-row gap-5'>
          <Image
            src={data.fetchMovie.posterUrl}
            alt={data.fetchMovie.title}
            className="object-cover rounded"
            width={150}
            height={150}
          />
          <div className='flex flex-col'>
            <h6 className="font-bold dark:text-white">{data.fetchMovie.title}</h6>
            <p className="text-sm text-gray-500 dark:text-red-400">{formattedStartTime}</p>
            <p className="text-sm text-gray-500">{data.fetchMovie.genres.join(', ')}</p>
            <p className="text-sm text-gray-500">Duration: {data.fetchMovie.duration} mins</p>
            <p className="text-sm text-gray-500">{data.fetchMovie.description}</p>
            <a 
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 w-3/4 my-auto
              border-blue-700 hover:border-blue-500 rounded
              dark:bg-red-600 dark:border-red-700"
              href={`/select-seats/${cinemaId}?title=${data.fetchMovie.title}&poster_url=${data.fetchMovie.posterUrl}&movie_id=${movieId}&day=${day}&start_time=${startTime}`}
              >
                Buy Ticket
            </a>
          </div>
        </div>
      )}
    </div>

  );
};

export default ScheduleItem;
