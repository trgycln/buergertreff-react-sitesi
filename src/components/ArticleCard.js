// src/components/ArticleCard.js
import React from 'react';

// Artık 'link' yerine 'imageUrl' ve 'onClick' alıyoruz
const ArticleCard = ({ publication, date, title, imageUrl, onClick }) => {
    return (
        // onClick olayını tetiklemek için bir div kullanıyoruz
        <div 
            onClick={onClick}
            className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer group"
        >
            <div className="overflow-hidden h-48">
                <img 
                    src={imageUrl} 
                    alt={title} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300" 
                />
            </div>
            <div className="p-6">
                <p className="font-bold text-red-700">{publication}</p>
                <p className="text-sm text-gray-500">{date}</p>
                <h3 className="mt-2 text-xl font-semibold text-gray-800">{title}</h3>
            </div>
        </div>
    );
};

export default ArticleCard;