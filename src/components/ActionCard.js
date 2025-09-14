// src/components/ActionCard.js
import React from 'react';

const ActionCard = ({ icon, title, children }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-8 border-t-4 border-red-600">
            <div className="flex items-center mb-4">
                <div className="text-red-600 mr-4">
                    {React.cloneElement(icon, { size: "2.5em" })}
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
            </div>
            <div className="text-gray-600 space-y-4">
                {children}
            </div>
        </div>
    );
};

export default ActionCard;