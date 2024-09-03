import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useQuery, gql, useMutation } from '@apollo/client';
import DurationFormat from '@/lib/DurationFormat';
import VideoPlayer from './VideoPlayer';
import RatingComponent from './RatingComponent';
import Image from 'next/image';
import { RotateLoader } from 'react-spinners';

interface CommentType {
  username:string;
  content:string;
  timestamp:number;
}
interface ActorType {
  id:string;
  name:string;
}

const ADD_COMMENT = gql`
  mutation AddComment($username: String!, $movieId: String!, $content: String!){
    addComment(username: $username, movieId: $movieId, content: $content){
      success
    }
  }
`;

const GET_MOVIE_BY_ID = gql`
  query GetMovieById($id: String!) {
    fetchMovie(movieId: $id) {
      id
      title
      genres
      duration
      posterUrl
      videoUrl
      description
      ratedBy
      rating
      comments {
        username
        content
        timestamp
      }
      actors {
        id
        name
      }
    }
  }
`;

const MovieDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [content, setContent] = useState('');
  const [visibleComments, setVisibleComments] = useState(10);

  const { loading, error, data } = useQuery(GET_MOVIE_BY_ID, {
    variables: { id },
    skip: !id,
  });
  const [addComment] = useMutation(ADD_COMMENT);

  if(loading) return
      <div className='absolute top-1/2 left-1/2 right-1/2 bottom-1/2'>
          <RotateLoader
            loading={true}
            margin={2}
            color='#57ffc7'
            size={10}
            speedMultiplier={1}
          />
      </div>
  if (error) return <p className='text-xl ml-5 dark:text-white'>Error fetching movie details. Please try again later.</p>;

  const movie = data?.fetchMovie;
  if (!movie) return <p className='text-xl ml-5 dark:text-white'>Movie not found.</p>;

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (session) {
        try {
            await addComment({
                variables: {
                  movieId: id,
                  username: session?.username,
                  content: content,
                },
            });
            setContent('');
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    } else {
        alert('You must be logged in to add a comment.');
    }
  };

  const showMoreComments = () => {
    setVisibleComments((prev) => prev + 10);
  };

  return (
    <div className="flex flex-col items-center p-6">
      <div className="w-full flex flex-col md:flex-row max-w-6xl">
        <Image
          src={movie.posterUrl}
          alt={movie.title}
          className="object-cover object-center w-1/2 h-1/2 rounded-lg shadow-md self-center md:self-start"
          width={300} height={200}
        />
        <div className="mx-4">
          <h2 className="text-2xl font-bold mb-2 text-center text-black dark:text-white mt-5 md:mt-0">{movie.title}</h2>
          <p className="text-lg mb-2 text-black dark:text-white">
            <strong>Genres: </strong>
            {movie.genres.join(', ')}
          </p>
          <p className="text-lg mb-2 text-black dark:text-white">
            <strong>Duration: </strong>
            {DurationFormat(movie.duration)}
          </p>
          <p className="dark:text-white">{movie.description}</p>
          {session &&
          <RatingComponent movieId={`${id}`} movieRating={movie.rating} movieRatedBy={movie.ratedBy} />
          }
          {movie.actors.length === 0 ? (
            <p className='dark:text-white my-5'>No actors.</p>
          ) : (
              <div>
                <h2 className='dark:text-white'>Actors</h2>
                {movie.actors.map((actor:ActorType, index:number) => (
                  <span key={index} className='dark:text-white'>
                    <a href={`/movies/a/${actor.id}`}>
                      <strong className='dark:text-white dark:hover:text-red-500 hover:text-red-600 mr-3'>{actor.name}</strong>
                    </a>
                  </span>
                ))}
              </div>
          )}
        </div>
      </div>
      <div className="w-full h-full mt-5">
       <VideoPlayer  url={`${movie.videoUrl}`} />
      </div>
      <hr className="h-px my-8 bg-red-200 border-0 dark:bg-red-700"/>
      <div>
        {movie.comments.length === 0 ? (
          <p className='dark:text-white my-5'>No comments yet.</p>
        ) : (
          <>
            <ul className="my-5">
              {movie.comments.slice().reverse().slice(0, visibleComments).map((comment: CommentType, index: number) => (
                <li key={index} className="dark:text-white">
                  <strong className="dark:text-white">{comment.username}</strong>: {comment.content}
                  <br />
                  <small className="dark:text-white">{new Date(comment.timestamp * 1000).toLocaleString()}</small>
                </li>
              ))}
            </ul>
            {visibleComments < movie.comments.length && (
              <a
                onClick={showMoreComments}
                className="text-blue-500 hover:text-blue-700 dark:text-red-500 dark:hover:text-red-600 font-bold my-2 rounded"
              >
                Show More
              </a>
            )}
          </>
        )}
        {session ? (
          <form onSubmit={handleCommentSubmit} className='flex items-center gap-5'>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="block p-2.5 w-full text-sm text-gray-900 dark:text-white bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:focus:ring-0 dark:focus:border-gray-500 dark:focus:outline-none dark:focus:outline-gray-700"
              placeholder="Write your thoughts here..."
            >
            </textarea>
            <button type="submit" className='bg-blue-500 dark:bg-gray-600 hover:bg-blue-400 text-gray-300 font-bold py-2 px-4 my-2 border-b-4 border-blue-700 dark:border-gray-700 hover:border-blue-500 rounded'>Add Comment</button>
          </form>
        ) : (
          <p className='dark:text-white'>You must be logged in to add a comment.</p>
        )}
      </div>
    </div>
  );
};

export default MovieDetail;
