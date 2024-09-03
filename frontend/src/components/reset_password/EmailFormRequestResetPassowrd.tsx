import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/router';

const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email) {
      success
    }
  }
`;

const RequestPasswordResetForm = () => {
  const [email, setEmail] = useState('');
  const [requestPasswordReset, { data }] = useMutation(REQUEST_PASSWORD_RESET_MUTATION);
  const router = useRouter();

  const handleSubmit = async (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const { data } = await requestPasswordReset({ variables: { email } });
      if (data && data.requestPasswordReset.success) {
        alert('Password reset email sent successfully')
        router.push('/login')
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='max-w-sm mx-auto'>
      <div className='mb-5'>
        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
        <input
          type="email"
          value={email}
          name='email'
          onChange={(e) => setEmail(e.target.value)}
          className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-0 dark:focus:border-gray-500 dark:focus:outline-none dark:focus:outline-gray-700'
          placeholder="Enter your email"
          required
        />
      </div>
      
      <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-gray-500 dark:hover:bg-gray-600 dark:focus:ring-0 dark:focus:border-gray-500 dark:focus:outline-none dark:focus:outline-gray-700">Send mail</button>
      {data && !data.requestPasswordReset.success && <p>Email not found</p>}
    </form>
  );
};

export default RequestPasswordResetForm;
