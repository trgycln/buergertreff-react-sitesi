// src/components/Hero.js
import React from 'react';

// Artık title, subtitle gibi prop'lar yerine 'children' alıyor
const Hero = ({ imageUrl, children }) => {
    return (
        <div 
            className="relative h-[60vh] min-h-[450px] bg-cover bg-center flex items-center justify-center text-center text-white px-4"
            style={{ backgroundImage: `url(${imageUrl})` }}
        >
            {/* Arka planı karartmak için overlay katmanı */}
            <div className="absolute inset-0 bg-rcBlue opacity-60"></div>

            {/* İçerik, overlay katmanının üzerinde olacak */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default Hero;