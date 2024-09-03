import React, { ReactNode, useState } from 'react';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { useRouter } from 'next/router';

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword) {
      success
      message
    }
  }
`;

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [resetPassword] = useMutation(RESET_PASSWORD_MUTATION);
  const router = useRouter();
  const { token } = router.query;

  const handleSubmit = async (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { data } = await resetPassword({ variables: { token, newPassword } });

    if (data.resetPassword.success) {
      alert('Password reset successfully');
    } else {
      alert(data.resetPassword.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Enter new password"
        required
      />
      <button type="submit">Reset Password</button>
    </form>
  );
};

export default ResetPassword;
