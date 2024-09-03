import React from 'react';
import { useQuery, gql } from '@apollo/client';
import Cinema from './Cinema';
import { RotateLoader } from 'react-spinners';

interface CinemaType {
    id: string,
    name : string,
    location : string,
    numberOfScreens : Number,
}

const ALL_CINEMAS = gql`
  query allCinemas {
    allCinemas {
      id
      name
      location
    }
  }
`;

const Locations: React.FC = () => {
  const { data, error, loading } = useQuery(ALL_CINEMAS);

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
  if (error) return <p className='text-xl ml-5 dark:text-white'>Error fetching cinemas, please try again later.</p>;

  const cinemas = data?.allCinemas;

  return (
    <div className="flex flex-col items-center md:items-start gap-5">
        {cinemas.map((cinema:CinemaType) => (
            <Cinema key={cinema.id} id={cinema.id}/>
        ))}
    </div>
  );
};

export default Locations;
