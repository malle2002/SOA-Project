'use client'
import React from 'react';
import SelectSeats from '@/components/SelectSeats';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

interface QueryProps{
    title:string;
    poster_url:string;
    day:string;
    movie_id:string;
    start_time:string;
}

const SelectSeatsPage = (schedule_item:string) => {
    const router = useRouter()
    const { id } = router.query;
    const { title, poster_url, start_time, movie_id, day } = router.query as unknown as QueryProps;
    const { data: session } = useSession({
        required:true,
        onUnauthenticated() {
            const callbackUrl = `/api/auth/signin?callbackUrl=/locations/${id}`;
            router.push(callbackUrl)
        },
    })
    return (
        <div className='flex flex-col justify-center'>
            <SelectSeats/>
        </div>
        
    );
};

export default SelectSeatsPage;
