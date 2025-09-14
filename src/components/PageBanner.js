// src/components/PageBanner.js
import React from 'react';

const PageBanner = ({ title, imageUrl }) => {
    return (
        <div className="relative h-64 bg-gray-700">
            <img
                src={imageUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <div className="relative h-full flex justify-center items-center px-4"> {/* Kenar boşluğu için px-4 eklendi */}
                {/* --- DEĞİŞİKLİK BURADA: text-center eklendi --- */}
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg text-center">
                    {title}
                </h1>
            </div>
        </div>
    );
};

export default PageBanner;