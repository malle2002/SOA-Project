'use client'
import React from 'react';
import Payment from '../../components/payment/Payment';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

const PaymentPage = () => {
    const router = useRouter()
    const { data: session } = useSession({
        required:true,
        onUnauthenticated() {
            router.push("/api/auth/signin?callbackUrl=/movies")
        },
    })
    return (
        <div className='flex flex-col justify-center'>
            <Payment />
        </div>
        
    );
};

export default PaymentPage;
