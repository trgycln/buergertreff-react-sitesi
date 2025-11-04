// src/pages/Angebote.js
// GÜNCELLENDİ: EventList'e 'archiveView="list"' prop'u eklendi.

import React, { useState } from 'react';
import PageBanner from '../components/PageBanner';
import EventList from '../components/EventList'; 

import angeboteBannerImage from '../assets/images/angebote-banner.jpg';

const categoryOptions = [
    'Alle',
    'Offene Stube',
    'Frühstück',
    'Sprachtreff',
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
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* --- ETKİNLİK LİSTESİ BİLEŞENİ --- */}
                    {/* DÜZELTME: Arşivin "liste" olarak görünmesi için prop eklendi */}
                    <EventList 
                        filterCategory={selectedCategory} 
                        archiveView="list" 
                    />
                    
                </div>
            </main>
        </div>
    );
};

export default Angebote;