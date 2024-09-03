import { gql, useMutation } from '@apollo/client';
import React, { FormEvent, useState } from 'react';

const SEND_EMAIL_MUTATION = gql`
  mutation SendEmail($email: String!, $subject: String!, $message: String!) {
    sendEmail(email: $email, subject: $subject, message: $message) {
      success
    }
  }
`;

const Support = () => {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [sendEmail] = useMutation(SEND_EMAIL_MUTATION);

  const handleSubmit = async (e:FormEvent) => {
    e.preventDefault();

    try {
      const { data } = await sendEmail({ variables: { email, subject, message } });

      if (data.sendEmail.success) {
        alert('Email sent successfully!');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        alert('Failed to send email.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('An error occurred.');
    }
  };


  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-black">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-100 p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Contact Support</h2>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Your Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            rows={4}
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white p-2 rounded-md shadow hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
        >
          Send Email
        </button>
      </form>
    </div>
  );
};

export default Support;
