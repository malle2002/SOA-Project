'use client'
import React from 'react';
import ResetPassword from '@/components/reset_password/ResetPassword';

const RegisterPage = () => {
    return (
        <div className='flex flex-col justify-center'>
            <h1 className='text-black dark:text-white text-center font-bold my-5'>Reset your password!</h1>
            <ResetPassword/>
        </div>
        
    );
};

export default RegisterPage;
