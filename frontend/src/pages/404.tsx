import React from 'react';
import Link from 'next/link';

const Custom404 = () => {
  return (
    <div className='flex flex-col items-center justify-center p-4 text-center'>
      <h1 className='text-4xl font-bold'>404 - Page Not Found</h1>
      <p className='mt-4 text-lg'>Sorry, the page you are looking for does not exist.</p>
      <Link href='/'>
        <p className='mt-4 text-blue-500 hover:underline'>Go back to Home</p>
      </Link>
    </div>
  );
};

export default Custom404;
