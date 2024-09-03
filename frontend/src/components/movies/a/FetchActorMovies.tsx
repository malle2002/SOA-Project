import React, { useState, useRef, useEffect } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { RotateLoader } from 'react-spinners';

interface Movie {
    id:string;
    title: string;
    posterUrl: string;
}

const GET_ALL_ACTOR_MOVIES_COUNT = gql`
    query getMovieCount($actor_id: String!, $genre: String) {
        movieActorCount(actorId: $actor_id, genre: $genre)
    }
`
const GET_SEARCH_ACTOR_MOVIES_COUNT = gql`
    query getMovieCount($actor_id: String!, $genre: String, $query: String!) {
        searchMovieActorCount(actorId: $actor_id, genre: $genre, query: $query)
    }
`

const ALL_ACTOR_MOVIES = gql`
    query FetchActorMovies($actor_id: String!, $genre: String, $skip: Int!, $limit: Int!){
        moviesByActor(actorId: $actor_id, genre: $genre, skip: $skip, limit: $limit){
            id
            title
            posterUrl
        }
    }
`
const SEARCH_ACTOR_MOVIES = gql`
  query SearchMoviesByActorPage($actor_id: String!, $query: String!,$genre: String, $skip: Int!, $limit: Int!) {
    searchMoviesByActor(actorId: $actor_id, query: $query, genre: $genre, skip: $skip, limit: $limit ) {
      id
      title
      posterUrl
    }
  }
`;

const MOVIES_PER_PAGE = 24;

const genres = [
    'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Biography',
    'Thriller', 'Western', 'Crime', 'Adventure', 'Fantasy', 'Animation',
    'Documentary', 'Musical', 'War', 'History', 'Disaster'
];

const FetchActorMovies = () => {
    const router = useRouter();
    const {id} = router.query;

    const [currentPage, setCurrentPage] = useState(1);
    const [searching, setSearching] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [term, setTerm] = useState<string | number | readonly string[] | undefined>(undefined);
    const [inputTerm, setInputTerm] = useState('');
    const searchTerm = useRef<HTMLInputElement>(null);

    const [ allMovies, { loading:loadAll, error:errorAll, data:dataAll }] = useLazyQuery(ALL_ACTOR_MOVIES,{
        variables: {
            actor_id: id,
            skip: (currentPage - 1) * MOVIES_PER_PAGE,
            limit: MOVIES_PER_PAGE,
            genre: selectedGenre,
        },
    });
    const [searchMovies, { loading:loadSearch, error:errorSearch, data:dataSearch }] = useLazyQuery(SEARCH_ACTOR_MOVIES,{
        variables: {
            actor_id: id,
            skip: (currentPage - 1) * MOVIES_PER_PAGE,
            limit: MOVIES_PER_PAGE,
            query: term || '',
            genre: selectedGenre,
        },
    });
    const [getSearchMovieCount, { data:dataSearchCount }] = useLazyQuery(GET_SEARCH_ACTOR_MOVIES_COUNT,{
        variables: {
            query: term || '',
            actor_id: id,
            genre: selectedGenre || null,
        },
    });
    const [getAllMovieCount, { data:dataAllCount }] = useLazyQuery(GET_ALL_ACTOR_MOVIES_COUNT,{
        variables: {
            actor_id: id,
            genre: selectedGenre || null,
        },
    });

    useEffect(() => {
        if (term) {
          setSearching(true);
          searchMovies({
            variables: {
              query: term || '',
              skip: (currentPage - 1) * MOVIES_PER_PAGE,
              limit: MOVIES_PER_PAGE,
              genre: selectedGenre || null
            }
          });
          getSearchMovieCount({
            variables: {
              query: term || '',
              genre: selectedGenre || null
            }
          })
          totalMovies = dataSearchCount ? dataSearchCount.searchMovieCount : 0;
        } else {
          setSearching(false);
          allMovies({
            variables: {
              skip: (currentPage - 1) * MOVIES_PER_PAGE,
              limit: MOVIES_PER_PAGE,
              genre: selectedGenre || null
            }
          })
          getAllMovieCount({
            variables: {
              genre: selectedGenre || null
            }
          })
          totalMovies = dataAllCount ? dataAllCount.movieCount : 0;
        }
      }, [term, currentPage, selectedGenre]);
    
    const handleGenreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedGenre(event.target.value);
        setCurrentPage(1);
    };
    
    const handleSearch = () => {
        setTerm(inputTerm);
        setCurrentPage(1);
    };
    
    if (loadAll|| loadSearch ) return
        <RotateLoader
            loading
            margin={2}
            color='#57ffc7'
            size={10}
            speedMultiplier={1}
        />;
    
    if (errorAll || errorSearch) {
        console.error('Error fetching movies:', errorAll || errorSearch );
        return <p className='text-xl ml-5 dark:text-white'>Error fetching movies. Please try again later.</p>;
    }
    
    let sortedMovies: Movie[] = [];
    let totalMovies = 0;
    let totalPages = 0;
      
    if(searching) {
        if (dataSearch && dataSearch.searchMoviesByActor) {
          sortedMovies = [...dataSearch.searchMoviesByActor].sort((a, b) => parseInt(b.id) - parseInt(a.id));
          totalMovies = dataSearchCount ? dataSearchCount.searchMovieActorCount : 0;
        }
    } else {
        if (dataAll && dataAll.moviesByActor) {
          sortedMovies = [...dataAll.moviesByActor].sort((a, b) => parseInt(b.id) - parseInt(a.id));
          totalMovies = dataAllCount ? dataAllCount.movieActorCount : 0;
        }
    }
    
    totalPages = Math.ceil(totalMovies / MOVIES_PER_PAGE);
    
    const handleNextPage = () => {
    if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
    }
    };
    
    const handlePrevPage = () => {
    if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
    }
    };
    return (
      <div className='mx-5'>
        <div className='flex flex-col justify-center items-center p-6'>
        <div className='mb-4 w-full'>
            <label htmlFor="genre" className="mr-2 text-black dark:text-white">Filter by genre:</label>
            <select id="genre" onChange={handleGenreChange} value={selectedGenre || ''} className='rounded-lg p-1'>
            <option value="">All</option>
            {genres.map((genre) => (
                <option key={genre} value={genre}>{genre}</option>
            ))}
            </select>
        </div>
        <div className='mb-4 w-full'>
            <label htmlFor="search" className="mr-2 text-black dark:text-white">Search by title:</label>
            <input
                type="text"
                id="search"
                ref={searchTerm}
                value={inputTerm} 
                onChange={e => setInputTerm(e.target.value)}
                placeholder="Search movies..."
                className="rounded-lg p-1 border border-gray-500 dark:focus:ring-0 dark:focus:border-gray-500 dark:focus:outline-none dark:focus:outline-gray-700"
            />
            <button onClick={handleSearch} className="ml-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-gray-500">
                Search
            </button>
        </div>
        <ul className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 w-full'>
            {sortedMovies.length > 0 ? (
                sortedMovies.map((movie:Movie) => (
                <Link key={movie.id} href={`/movies/${movie.id}`}>
                    <div className="flex flex-col items-center bg-white dark:bg-black rounded-lg  dark:shadow-red-500 overflow-hidden">
                    <div className="object-cover object-center w-full h-auto">
                        <Image src={movie.posterUrl} alt={movie.title} width={400} height={400}/>
                    </div>
                    <div className="p-2 text-center">
                        <h4 className="text-lg font-semibold mb-2 text-black dark:text-slate-100">{movie.title}</h4>
                    </div>
                    </div>
                </Link>
                ))
            ):(
                <h1 className='dark:text-white w-full col-span-2 sm:col-span-4 lg:col-span-6'>Sorry, but there are no movies like that. :( </h1>
            )}
        </ul>
        </div>
        <div className="my-4 flex justify-center items-center">
            <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="bg-gray-200 hover:bg-gray-400 dark:hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-l dark:bg-gray-300">
            Previous
            </button>
            <span className="mx-2 text-gray-800 dark:text-white font-bold">
            Page {currentPage} of {totalPages}
            </span>
            <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="bg-gray-200 hover:bg-gray-400 sdark:hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-r dark:bg-gray-300">
            Next
            </button>
        </div>
      </div>
    );
};

export default FetchActorMovies;