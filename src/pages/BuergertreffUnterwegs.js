// src/pages/BuergertreffUnterwegs.js
import React from 'react';
import PageBanner from '../components/PageBanner';
import { FaCalendarCheck, FaInfoCircle } from 'react-icons/fa';

// Resimleri import edelim
import unterwegsBanner from '../assets/images/unterwegs-banner.jpg';
import unterwegs1 from '../assets/images/unterwegs-1.jpg';
import unterwegs2 from '../assets/images/unterwegs-2.jpg';

const BuergertreffUnterwegs = () => {
    return (
        <div>
            <PageBanner 
                title="Bürgertreff Unterwegs"
                imageUrl={unterwegsBanner}
            />

            {/* Giriş Metni */}
            <section className="py-12 md:py-16 bg-white">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h2 className="text-3xl font-bold text-center text-gray-800">Wir entdecken gemeinsam die Region!</h2>
                    <p className="mt-4 text-lg text-center text-gray-600">
                        Mit "Bürgertreff Unterwegs" verlassen wir unsere Räumlichkeiten und erkunden gemeinsam interessante Orte in der Umgebung. Ob Museumsbesuche, Wanderungen in der Natur oder Besichtigungen von lokalen Betrieben – bei uns ist für jeden etwas dabei. Die Ausflüge sind eine tolle Gelegenheit, neue Eindrücke zu sammeln und miteinander ins Gespräch zu kommen.
                    </p>
                </div>
            </section>

            {/* Fotoğraf Galerisi Bölümü */}
            <section className="py-12 md:py-16 bg-gray-50">
                <div className="container mx-auto px-6">
                    <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">Einige Impressionen von unseren letzten Ausflügen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="overflow-hidden rounded-lg shadow-lg">
                            <img src={unterwegs1} alt="Ausflug 1" className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="overflow-hidden rounded-lg shadow-lg">
                            <img src={unterwegs2} alt="Ausflug 2" className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-300" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Gelecek Etkinlikler Bölümü */}
            <section className="py-12 md:py-16 bg-white">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-6 rounded-r-lg" role="alert">
                        <div className="flex items-center">
                            <FaCalendarCheck className="text-3xl mr-4" />
                            <div>
                                <h3 className="font-bold text-xl">Nächster Ausflug</h3>
                                <p className="mt-2">
                                    Unser nächster Ausflug ist bereits in Planung! Wir werden bald Details zum Ziel und zum Datum bekannt geben.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-6 rounded-r-lg mt-6" role="alert">
                        <div className="flex items-center">
                            <FaInfoCircle className="text-3xl mr-4" />
                            <div>
                                <h3 className="font-bold text-xl">Informationen & Anmeldung</h3>
                                <p className="mt-2">
                                    Alle Informationen zu kommenden Ausflügen, wie Treffpunkt, Uhrzeit und eventuelle Kosten, finden Sie rechtzeitig hier auf unserer Webseite und als Aushang im Bürgertreff. Die Anmeldung erfolgt direkt bei uns.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default BuergertreffUnterwegs;