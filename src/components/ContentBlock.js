// src/components/ContentBlock.js
import React from 'react';
import Blob from './Blob';

// Yeni 'imageClassName' prop'unu ekledik ve varsayılan bir değer atadık ('w-3/4')
const ContentBlock = ({ title, imageUrl, imageSide = 'right', children, blobs = [], bgColor = 'bg-white', imageClassName = "w-3/4" }) => {
    const imageOrderClass = imageSide === 'left' ? 'lg:order-first' : 'lg:order-last';

    return (
        <section className={`relative py-12 md:py-20 overflow-hidden ${bgColor}`}>
            {blobs.map((blob, index) => (
                <Blob 
                    key={index}
                    className={`absolute z-0 ${blob.className}`} 
                    color={blob.color}
                />
            ))}

            <div className="relative z-10 container mx-auto px-6">
                <div className="lg:flex lg:items-center lg:gap-12">
                    <div className="lg:w-1/2">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">{title}</h2>
                        <div className="mt-4 text-gray-600 space-y-4">{children}</div>
                    </div>
                    
                    <div className={`lg:w-1/2 mt-8 lg:mt-0 ${imageOrderClass} flex justify-center items-center`}>
                        {/* --- DEĞİŞİKLİK BURADA --- */}
                        {/* Sabit bir genişlik yerine, dışarıdan gelen 'imageClassName' prop'unu kullanıyoruz */}
                        <img 
                            src={imageUrl} 
                            alt={title} 
                            className={`rounded-lg shadow-xl h-auto ${imageClassName}`} 
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContentBlock;