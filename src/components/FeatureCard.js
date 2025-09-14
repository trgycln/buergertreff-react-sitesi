// src/components/FeatureCard.js
import React from 'react';
import { Link } from 'react-router-dom';

const FeatureCard = ({ icon, title, children, linkTo }) => {
    return (
        <Link to={linkTo} className="block p-8 bg-white rounded-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
            <div className="text-red-600 mb-4">
                {React.cloneElement(icon, { size: "3em" })}
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-600">{children}</p>
        </Link>
    );
};

export default FeatureCard;