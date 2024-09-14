'use client'
import React from 'react';
import Login from '../../components/login/Login';

const LoginPage = () => {
    return (
        <div className='flex flex-col justify-center'>
            <h1 className='text-black dark:text-white text-center font-bold my-5'>Log-in to your account now.</h1>
            <Login/>
        </div>
        
    );
};

export default LoginPage;
