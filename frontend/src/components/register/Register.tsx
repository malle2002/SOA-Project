import React, { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation, gql } from '@apollo/client';
import ReCAPTCHA from 'react-google-recaptcha';
import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';

const REGISTER_MUTATION = gql`
  mutation createUser($username:String!, $email: String!, $password: String!, $captcha: String!) {
    createUser(username: $username, email: $email, password: $password, captcha: $captcha) {
      user {
        username
        email
      }
    }
  }
`;

const Register: React.FC = () => {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);
  const [register, { error }] = useMutation(REGISTER_MUTATION);

  const handleCaptcha = (token: string | null) => {
    setCaptchaToken(token);
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Min 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('1 uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('1 lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('1 number');
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setPassword(password);
    const passwordValidationErrors = validatePassword(password);
    setPasswordErrors(passwordValidationErrors);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    if (passwordErrors.length > 0) {
      alert('Please fix password errors before submitting');
      return;
    }
    if (!captchaToken) {
        alert('Please complete the CAPTCHA');
        return;
    }
    try {
        const { data } = await register({ variables: { username, email, password, captcha: captchaToken } });
        router.push('/login')
    } catch (error:any) {
        console.error('GraphQL Error:', error);
        recaptchaRef.current?.reset();
    }
  };
  

  return (
    <form onSubmit={handleSubmit} className='flex flex-col mx-auto items-center shadow-lg p-5 dark:shadow-gray-500'>
      <input
        type="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className='form-control w-auto border border-solid rounded-lg my-2 p-2 dark:focus:ring-0 dark:focus:border-gray-500 dark:focus:outline-none dark:focus:outline-gray-700'
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className='form-control w-auto  border border-solid rounded-lg my-2 p-2 dark:focus:ring-0 dark:focus:border-gray-500 dark:focus:outline-none dark:focus:outline-gray-700'
        required
      />
      <input
        type="password"
        value={password}
        onChange={handlePasswordChange}
        placeholder="Password"
        className='form-control w-auto border border-solid rounded-lg my-2 p-2 dark:focus:ring-0 dark:focus:border-gray-500 dark:focus:outline-none dark:focus:outline-gray-700'
        required
      />
      {passwordErrors.length > 0 && (
        <ul className="text-red-500 text-sm my-2 text-center">
          {passwordErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      )}
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm Password"
                className='form-control w-auto border border-solid rounded-lg my-2 p-2 dark:focus:ring-0 dark:focus:border-gray-500 dark:focus:outline-none dark:focus:outline-gray-700'
        required
      />
      <ReCAPTCHA
        sitekey={process.env.RECAPTCHA_SITE_KEY as string}
        onChange={handleCaptcha}
        className='my-2 p-2'
        ref={recaptchaRef}
      />
      <button className="bg-blue-500 dark:bg-gray-600 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 dark:border-gray-700 hover:border-blue-500 rounded" type="submit">
        Register
      </button>
      <div className="inline-flex items-center justify-center w-full">
          <hr className="w-64 h-px my-8 bg-gray-200 border-0 dark:bg-gray-700"/>
          <span className="absolute px-3 font-medium text-gray-900 -translate-x-1/2 bg-white left-1/2 dark:text-white dark:bg-black">or</span>
      </div>
      <div className='flex flex-col justify-center items-center'>
        <p className='dark:text-white mb-5 text-center'>Join us from logging into your Google Account</p>
        <button
          onClick={(e) => {
            e.preventDefault();
            signIn('google')
          } }
          className="bg-blue-500 text-white px-8 py-4 rounded-lg shadow-lg flex flex-row mb-5"
        >
          <FcGoogle className='text-2xl'/><h2>Google</h2>
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error.message}</p>}
    </form>
  );
};

export default Register;
