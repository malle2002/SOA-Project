import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { gql, useMutation } from '@apollo/client';

const EDIT_USER = gql`
    mutation EditUser($user_id: String!, $new_username: String!, $new_email: String!){
        editUser(userId: $user_id, newUsername: $new_username, newEmail: $new_email){
            success
            error
        }
    }
`

const Profile = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState(session?.username || '');
  const [newEmail, setNewEmail] = useState(session?.email || '');

  const [editUser] = useMutation(EDIT_USER, {
    onCompleted: (data) => {
      if (data.editUser.success) {
        setIsEditing(false);
        signOut({ redirect: true, callbackUrl: '/login' });
      } else {
        setError(data.editUser.error || 'An unknown error occurred.');
      }
    },
    onError: (error) => {
        setError(error.message || 'An unknown error occurred.');
      },
  });

  const handleEdit = () => {
    editUser({
      variables: {
        user_id: session?.id,
        new_username: newUsername,
        new_email: newEmail,
      },
    });
  };

  return (
    <div>
        { id===session?.id && status=="authenticated" && (
            <div className='flex flex-col justify-center'>
                <div className='flex flex-col items-center'>
                    <p className='dark:text-white'>Hello {session.username}</p>
                    <h1 className='dark:text-white text-2xl'>These are your settings.</h1>
                </div>
                <div className='w-full md:w-1/2 flex md:self-center shadow-lg mt-5 dark:shadow-gray-500 flex-col'>
                    <div className='mt-4 ml-4'>
                        <p className='dark:text-white'>This is your username: <strong className='mr-4 block lg:inline-block'>{session.username}</strong>{!isEditing && ( <small onClick={() => setIsEditing(true)} className='cursor-pointer'>Change</small>)}</p>
                    </div>
                    <hr className="h-px my-4 bg-gray-200 border-0 dark:bg-gray-700"/>
                    <div className='mb-4 ml-4'>
                        <p className='dark:text-white'>This is your email: <strong className='mr-4 block lg:inline-block'>{session.email}</strong>{!isEditing && (<small onClick={() => setIsEditing(true)} className='cursor-pointer'>Change</small>)}</p>
                    </div>
                    {isEditing && (
                        <div className='mt-4 ml-4'>
                            <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }}>
                                <div className='flex flex-col'>
                                    <label className='dark:text-white'>New Username:</label>
                                    <input
                                        type='text'
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className='p-1 border rounded w-full lg:w-1/3'
                                    />
                                </div>
                                <div className='mt-2 flex flex-col'>
                                    <label className='dark:text-white'>New Email:</label>
                                    <input
                                        type='email'
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className='p-1 border rounded w-full lg:w-1/3 -pr-5'
                                    />
                                </div>
                                <div className='my-4'>
                                    <button
                                        type='submit'
                                        className='bg-blue-500 text-white p-2 rounded mr-2'
                                    >
                                        Save
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => setIsEditing(false)}
                                        className='bg-gray-500 text-white p-2 rounded'
                                    >
                                        Cancel
                                    </button>
                                </div>
                                {error && (
                                    <div className='my-4 text-red-500'>
                                        {error}
                                    </div>
                                )}
                            </form>
                        </div>
                    )}
                </div>
            </div>
        )
        }
    </div>
  );
};

export default Profile;
