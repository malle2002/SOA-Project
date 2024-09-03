'use client'
import React from 'react';
import Register from '@/components/register/Register';

const RegisterPage = () => {
    return (
        <div className='flex flex-col justify-center'>
            <h1 className='text-black dark:text-white text-center font-bold my-5'>Be part of our community, register now!</h1>
            <Register/>
        </div>
        
    );
};

export default RegisterPage;
