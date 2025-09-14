// src/pages/Danke.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

const Danke = () => {
    return (
        <div className="bg-rcGray py-20">
            <div className="container mx-auto px-6 text-center max-w-2xl">
                <div className="bg-white p-10 rounded-2xl shadow-xl">
                    <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-6" />
                    <h1 className="text-4xl font-extrabold text-rcBlue">Vielen Dank!</h1>
                    <p className="text-gray-600 mt-4 text-lg">
                        Ihre Nachricht wurde erfolgreich an uns übermittelt. Wir werden uns so schnell wie möglich bei Ihnen melden.
                    </p>
                    <Link 
                        to="/" 
                        className="mt-8 bg-rcRed text-white text-lg font-bold py-3 px-8 rounded-full hover:bg-opacity-90 transition-colors inline-block"
                    >
                        Zurück zur Startseite
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Danke;