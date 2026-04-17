// src/pages/Angebote.js
// GÜNCELLENDİ: EventList'e 'archiveView="list"' prop'u eklendi.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageBanner from '../components/PageBanner';
import EventList from '../components/EventList'; 

import angeboteBannerImage from '../assets/images/angebote-banner.jpg';
import { Helmet } from 'react-helmet-async';

const categoryOptions = [
    'Alle',
    'Frühstück',
    'Offene Treff',
    'Ausstellungen',
    'Spielen',
    'Singen',
    'Handarbeiten',
    'Schreibwerkstatt',
    'Nachbarschaftsbörse',
    'Sonntagsgespräch',
    'Beratung',
    'Nachhilfe',
    'Bürgertreff unterwegs',
    'Sonstiges'
].filter(cat => cat !== 'Intern'); // 'Intern' kategorisini public filtrede göstermiyoruz.

const Angebote = () => {
    const [selectedCategory, setSelectedCategory] = useState('Alle'); 

    return (
       <>
<Helmet>
    <title>Angebote & Dienste | Bürgertreff Wissen</title>
    <meta 
        name="description" 
        content="Entdecken Sie unsere regelmäßigen Treffen, Sprachkurse, Hilfeleistungen und sozialen Angebote. Wir bieten vielfältige Möglichkeiten für Begegnung und Austausch in Wissen/Sieg."
    />
</Helmet>


        <div>
            <PageBanner
                title="Angebote & Veranstaltungen"
                imageUrl={angeboteBannerImage}
            />

            <main className="py-12 md:py-20 bg-rcGray">
                <div className="container mx-auto px-6">

                    {/* --- KATEGORİ FİLTRELEME BUTONLARI --- */}
                    <div className="mb-12">
                        <h2 className="text-lg font-semibold text-rcDarkGray mb-4">Kategorien filtern:</h2>
                        <div className="flex flex-wrap gap-2">
                            {categoryOptions.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`
                                        px-4 py-2 rounded-full text-sm font-medium transition-colors
                                        ${selectedCategory === category 
                                            ? 'bg-rcBlue text-white shadow' 
                                            : 'bg-white text-rcDarkGray hover:bg-gray-100 border border-gray-300'
                                        }
                                    `}
                                >
                                    {category === 'Offene Treff' ? 'Offener Treff' : category}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-12 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-3xl">
                                <h2 className="text-2xl font-bold text-rcDarkGray">Terminkalender</h2>
                                <p className="mt-2 text-gray-600">
                                    Sehen Sie im Monatskalender sofort, welche Tage bereits belegt sind und wann noch freie Zeiten verfügbar sind.
                                </p>
                            </div>
                            <Link
                                to="/terminkalender"
                                className="inline-flex items-center justify-center rounded-lg bg-rcBlue px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700"
                            >
                                Kalender öffnen
                            </Link>
                        </div>
                    </div>
                    
                    {/* --- ETKİNLİK LİSTESİ BİLEŞENİ --- */}
                    {/* DÜZELTME: Arşivin "liste" olarak görünmesi için prop eklendi */}
                    <EventList 
                        filterCategory={selectedCategory} 
                        archiveView="list"
                        maxUpcomingEvents={5}
                    />
                    
                </div>
            </main>
        </div>
       </>
    );
};

export default Angebote;