import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/router';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e:React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      const { callbackUrl } = router.query;
      try {
          const result = await signIn('credentials', {
            username,
            password,
            redirect:false,
          });
          if(result){
            if (result.error) {
              setError(result.error);
              setLoading(false);
            } else if (result.ok && callbackUrl) {
              router.push(callbackUrl as string);
            } else if (result.ok) {
              router.push('/');
            }
          }

      } catch (err) {
          console.error('Login error:', err);
          setError('An unexpected error occurred. Please try again.');
          setLoading(false);
      }
    };

  return (
    <>
      <form onSubmit={handleSubmit} className='flex flex-col mx-auto items-center shadow-lg p-5 dark:shadow-gray-500'>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className='form-control w-auto border border-solid rounded-lg my-2 p-2 dark:focus:ring-0 dark:focus:border-gray-500 dark:focus:outline-none dark:focus:outline-gray-700'
          placeholder="Username"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
                  className='form-control w-auto border border-solid rounded-lg my-2 p-2 dark:focus:ring-0 dark:focus:border-gray-500 dark:focus:outline-none dark:focus:outline-gray-700'
          placeholder="Password"
          required
        />
        <Link
              className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800 my-2 dark:text-gray-500"
              href="/forgot-password"
            >
              Forgot Password?
        </Link>
        <button type="submit" disabled={loading} className='bg-blue-500 dark:bg-gray-600 hover:bg-blue-400 text-gray-300 font-bold py-2 px-4 my-2 border-b-4 border-blue-700 dark:border-gray-700 hover:border-blue-500 rounded'>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <button
          onClick={() => signIn('google')}
          className="bg-blue-500 text-white px-8 py-4 rounded-lg shadow-lg flex flex-row mb-5"
        >
          <FcGoogle className='text-2xl'/><h2>Google</h2>
        </button>
        {error && <p className='text-black dark:text-white'>Error: {error}</p>}
      </form>
      <div className='flex flex-col mx-auto items-center shadow-lg p-5 dark:shadow-gray-500'>
        <p className="dark:text-white">Don&apos;t have account?</p>
        <Link href="/register">
          <button className='bg-blue-500 dark:bg-gray-600 hover:bg-blue-400 text-gray-300 font-bold py-2 px-4 my-2 border-b-4 border-blue-700 dark:border-gray-700 hover:border-blue-500 rounded'>Register now.</button>
        </Link>
      </div>
    </>
    
  );
};

export default Login;
