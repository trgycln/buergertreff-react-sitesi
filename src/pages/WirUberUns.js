// src/pages/WirUberUns.js
import React from 'react';

import PageBanner from '../components/PageBanner';
import ContentBlock from '../components/ContentBlock';
import teamPhoto from '../assets/images/team-photo.png';

import aboutBannerImage from '../assets/images/about-banner.png'; 
import wirUberUns4 from '../assets/images/wirUberUns-4.jpg';
import flyer1 from '../assets/images/flyer1.jpg';
import flyer2 from '../assets/images/flyer2.jpg';
import ImageCarousel from '../components/ImageCarousel';
import JSZip from 'jszip';
import { Helmet } from 'react-helmet-async';

const WirUberUns = () => {
    // Bu sayfadaki ContentBlock için farklı bir blob listesi tanımlıyoruz
     const wirUeberUnsBlobs = [
        {
            // Sol üstteki blob'u daha fazla içeri çektik
            className: 'w-[700px] h-[700px] top-0 left-0 transform -translate-x-1/4 -translate-y-1/4 opacity-40',
            color: '#27ae60' // rcAccentGreen
        },
        {
            // Sağ alttaki blob'u daha fazla içeri çektik
            className: 'w-[700px] h-[700px] bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 opacity-40',
            color: '#f2994a' // rcAccentOrange
        }
    ];

    return (
        <>
            <Helmet>
                <title>Über uns: Ziele und Werte des Bürgertreff Wissen e.V.</title>
                <meta 
                    name="description" 
                    content="Erfahren Sie mehr über unsere Mission, Ziele und bürgerschaftliches Engagement. Wir schaffen einen offenen Ort für Begegnungen und Miteinander in Wissen/Sieg."
                />
            </Helmet>
            <PageBanner 
                title="Wir über uns" 
                imageUrl={aboutBannerImage} 
            />
            {/* Flyer Slider ve Download Butonu */}
            <section className="bg-white py-8">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Unsere Flyer</h2>
                    <div className="max-w-2xl mx-auto mb-4">
                        <ImageCarousel images={[flyer1, flyer2]} objectFit="contain" />
                    </div>
                    <div className="flex flex-col gap-4 justify-center items-center">
                        <button
                            onClick={async () => {
                                // İki resmi sırayla indiren fonksiyon
                                const download = async (url, filename) => {
                                    const response = await fetch(url);
                                    const blob = await response.blob();
                                    const link = document.createElement('a');
                                    link.href = URL.createObjectURL(blob);
                                    link.download = filename;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
                                };
                                await download(flyer1, 'flyer1.jpg');
                                await download(flyer2, 'flyer2.jpg');
                            }}
                            className="inline-block px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors font-semibold"
                        >
                            Flyer herunterladen
                        </button>
                    </div>
                </div>
            </section>
                                    <ContentBlock 
                                title="Wir haben's geschafft!" 
                                imageUrl={wirUberUns4}
                imageSide="right"
                blobs={wirUeberUnsBlobs}
            >
                <p className="text-justify indent-8">
Wir haben's geschafft! Seit März 2026 haben wir ein Ladenlokal in der Markstr. 8 in Wissen angemietet. Nach und nach richten wir dort unseren Bürgertreff ein. Wer Freude am gemeinsamen Gestalten von Raum und Programm hat, ist herzlich willkommen. Viele haben viele Ideen und Talente. So kann der Bürgertreff wachsen.
                                </p>
                                <p className="text-justify indent-8">
Ab 17.03.26 beginnen wir mit gemeinsamen Nachmittagen (s. Veranstaltungen, Offener Treff).
                                </p>
            </ContentBlock>

            <section className="bg-white py-12 md:py-20">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-8">Unser Vorstand</h2>
                    
                    <div className="max-w-4xl mx-auto">
                        <img 
                            src={teamPhoto} 
                            alt="Das Team des Bürgertreffs" 
                            className="rounded-lg shadow-xl w-full h-auto"
                        />
                    </div>

                    <div className="max-w-3xl mx-auto mt-6">
                        <p className="text-gray-600">
                            Unten: Erika Uber (1. Vorsitzende), Jürgen Klose (2. Vorsitzende), Turgay Celen (2. Reihe links, Kassierer), Mechthild Euteneuer und Thomas Löb (Beisitzer)
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}

export default WirUberUns;