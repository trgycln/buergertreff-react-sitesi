// src/pages/BuergertreffUnterwegs.js
import React from 'react';
import PageBanner from '../components/PageBanner';
import { FaCalendarCheck, FaInfoCircle, FaMapMarkerAlt, FaUsers, FaClock, FaEuroSign } from 'react-icons/fa'; // Zusätzliche Icons importiert

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
                    
                    {/* AKTUALISIERT: Nächster Ausflug Bilgisi */}
                    <div className="bg-gradient-to-r from-blue-100 to-blue-50 border-l-4 border-blue-500 text-blue-800 p-6 rounded-r-lg shadow-lg mb-8" role="alert">
                        <div className="flex items-center mb-4">
                            <FaCalendarCheck className="text-3xl mr-3 flex-shrink-0 text-blue-600" />
                            <h3 className="font-bold text-2xl text-blue-900">Nächster Ausflug: Auf den Spuren von F.W. Raiffeisen</h3>
                        </div>
                        
                        <div className="space-y-3 pl-10 text-lg">
                            <p className='font-semibold text-xl'>
                                Besuch im Raiffeisen-Museum Hamm/Sieg
                            </p>
                             <p className='flex items-center font-bold'>
                                <FaClock className="mr-2 text-blue-600"/> Samstag, 15. November 2025
                            </p>
                            <p>
                                Wir laden ein, Leben und Werk des Genossenschaftsgründers Friedrich Wilhelm Raiffeisen kennen zu lernen.
                            </p>
                            
                            <div className='mt-4 pt-3 border-t border-blue-200'>
                                <p className='font-semibold'>Programm:</p>
                                <ul className='list-disc list-inside ml-4 space-y-1 mt-1'>
                                    <li><strong>13:30 Uhr:</strong> Einführung bei Kaffee und Keksen mit Helmut Schimkat und Erika Uber (Kath. Gemeindesaal, oberhalb des Eiscafés)</li>
                                    <li><strong>14:30 Uhr:</strong> Besuch des Museums (Raiffeisenstr. 10, Eintritt frei)</li>
                                </ul>
                            </div>

                            <p className='mt-4 pt-3 border-t border-blue-200'>
                                Alle sind herzlich willkommen. Bitte anmelden bei: <a href="mailto:buergertreff.wissen@gmail.com" className="font-semibold text-blue-700 hover:underline">buergertreff.wissen@gmail.com</a>
                            </p>
                             <p className='text-sm text-blue-600'>
                                Unterstützt von „Aktion Neue Nachbarn“. Spende willkommen. <FaEuroSign className="inline ml-1"/>
                            </p>
                        </div>
                    </div>

                    {/* Informationen & Anmeldung Bilgisi */}
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-6 rounded-r-lg shadow-md" role="alert">
                        <div className="flex items-center">
                            <FaInfoCircle className="text-3xl mr-4 flex-shrink-0 text-yellow-600" />
                            <div>
                                <h3 className="font-bold text-xl">Allgemeine Informationen & Anmeldung</h3>
                                <p className="mt-2">
                                    Alle Informationen zu kommenden Ausflügen, wie Treffpunkt, Uhrzeit und eventuelle Kosten, finden Sie rechtzeitig hier auf unserer Webseite und als Aushang im Bürgertreff. Die Anmeldung erfolgt direkt bei uns (sofern nicht anders angegeben).
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