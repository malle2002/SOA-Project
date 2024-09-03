import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import StarRating from '../StarRating';

interface RatingProps {
    movieId: string;
    movieRating: number;
    movieRatedBy: [string];
}

const RatingComponent = ({ movieId,movieRating,movieRatedBy }:RatingProps) => {
    const { data: session } = useSession();
    return (
      <div className="my-5">
        <div className="flex items-center gap-5">
          <StarRating movieId={movieId} userId={session?.id} ratedBy={movieRatedBy} />
          <p className="dark:text-white">{movieRating}</p>
        </div>
      </div>
    );
};

export default RatingComponent;