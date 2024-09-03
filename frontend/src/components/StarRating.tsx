import React, { useEffect, useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { gql, useMutation, useQuery } from "@apollo/client";
import { RotateLoader } from 'react-spinners';

const RATE_MOVIE = gql`
  mutation RateMovie($movieId: String!, $rating: Float!, $userId: String!) {
    rateMovie(movieId: $movieId, rating: $rating, userId: $userId) {
      success
    }
  }
`;
const FETCH_MOVIE = gql`
  query fetchMovie($movie_id: String!) {
    fetchMovie(movieId: $movie_id) {
      id
      ratedBy
      rating
    }
  }
`;

interface StarProps{
  movieId: string,
  userId: string | undefined,
  ratedBy: [string];
}

const StarRating = ({ movieId, userId, ratedBy }:StarProps) => {
  const [hover, setHover] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState<boolean>(false);
  const [rateMovie] = useMutation(RATE_MOVIE);
  const { loading, error, data } = useQuery(FETCH_MOVIE, {  
    variables: {
      movie_id: movieId
    } 
  })
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

  const handleRating = async (newRating:number) => {
    if(userId){
      const currentUserRated = ratedBy.includes(userId);
      setRated(currentUserRated);
      if (rated) {
        console.log("You have already rated this movie.");
        return;
      }
      setRating(newRating);
      try {
        const {data} = await rateMovie({
          variables: {
            movieId: movieId,
            rating: newRating,
            userId: userId,
          },
        });
        if (data.rateMovie.success) {
          alert('Rating submitted successfully!');
        } else {
          alert('Failed to submit rating.');
        }
      } catch (error) {
        console.error('Error rating cinema:', error);
      }
    }
  };

  const isUserRated = data && data.fetchMovie && data.fetchMovie.ratedBy.includes(userId);
  return (
    <div className="inline-flex w-auto">
      {isUserRated ? (
        [...Array(5)].map((star, index) => {
          const ratingValue = index + 1;
          return (
            <FaStar
              key={index}
              className="star"
              color={ratingValue <= data?.fetchMovie?.rating ? "#ffc107" : "#e4e5e9"}
              size={25}
            />
          );
        })
      ) : (
        [...Array(5)].map((star, index) => {
          const ratingValue = index + 1;
          return (
            <label key={index}>
              <input
                type="radio"
                name="rating"
                value={ratingValue}
                className="hidden"
              />
              <FaStar
                className="star"
                color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                size={25}
                onMouseEnter={() => setHover(ratingValue)}
                onMouseLeave={() => setHover(null)}
                onClick={() => handleRating(ratingValue)}
              />
            </label>
          );
        })
      )}

    </div>
  );
};

export default StarRating;
