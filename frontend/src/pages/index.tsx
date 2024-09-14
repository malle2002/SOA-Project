'use client'
import React, { useState,useCallback } from 'react';
import { useRouter } from 'next/router';
import { gql, useQuery } from '@apollo/client';
import client from "../lib/apollo-client"
import Image from 'next/image';
import Link from 'next/link';
import { RotateLoader } from 'react-spinners';

interface MovieType {
    id:string;
    title:string;
    posterUrl:string;
}

export const GET_RANDOM_MOVIES = gql`
  query GetRandomMovies($count: Int!) {
    randomMovies(count: $count) {
      id
      title
      posterUrl
    }
  }
`;

const HomePage = () => {
    const [isCircle, setIsCircle] = useState(false);
    const router = useRouter();

    const asd = process.env.NEXTAUTH_SECRET
    const asd2 = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID 

    const { data, loading, error } = useQuery(GET_RANDOM_MOVIES, {
        variables: { count: 4 },
        client: client
    });

    const handleIconClick = useCallback(() => {
        if (!isCircle) {
          setIsCircle(true);
          router.push('/locations');
        }
      }, [isCircle, router]);
    
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
    );
    if (error) return <p className='text-xl ml-5 dark:text-white'>Error: {error.message}</p>;

    return (
    <div className="flex flex-col justify-center items-center bg-white dark:bg-black">
      <h1 className="dark:text-white text-xl md:text-2xl">
        Stream your favourite movies for <strong>FREE</strong>
      </h1>
      <p className="dark:text-white text-xl md:text-2xl">{asd}</p>
      <p className="dark:text-white text-xl md:text-2xl">{asd2}</p>
      <hr className="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
      <div className="flex flex-wrap justify-center gap-4 my-4">
        {data.randomMovies.map((movie: MovieType) => (
          <div key={movie.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-64 h-60 flex flex-col">
            <Link href={`/movies/${movie.id}`}>
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-48 object-cover"
                width={1600}
                height={900}
                style={{ objectFit: 'cover' }}
              />
              <div className="p-4 flex flex-col justify-center">
                <h3 className="text-center text-black dark:text-white truncate w-full h-10 leading-tight">
                  {movie.title}
                </h3>
              </div>
            </Link>
          </div>
        ))}
      </div>
      <div className="bg-transparent rounded-lg w-64 h-40 flex flex-col justify-center items-center">
        <Link href="/movies" className="bg-blue-500 dark:bg-gray-600 text-white px-4 py-2 rounded font-bold">
          — View All Movies —
        </Link>
      </div>
      <hr className="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
      <h2 className="text-black dark:text-white md:text-3xl">Experience the Magic on the Big Screen!</h2>
      <div className="container rounded-md my-4">
        <div className={`play-icon ${isCircle ? 'loading' : ''}`} id="playIcon" onClick={handleIconClick}></div>
      </div>
    </div>
  );
};

export default React.memo(HomePage);