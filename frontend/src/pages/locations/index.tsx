'use client'
import React from 'react';
import Locations from '../../components/locations/Locations'

const LocationsPage = () => {
    return (
        <div className='flex flex-col justify-center'>
            <h1 className='text-black dark:text-white text-center font-bold my-5 text-2xl italic'>Hoop to your seat in your favourite cinema!</h1>
            <Locations/>
        </div>
        
    );
};

export default LocationsPage;
