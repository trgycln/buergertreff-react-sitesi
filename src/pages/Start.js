// src/pages/Start.js
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import ContentBlock from '../components/ContentBlock';
import FeatureCard from '../components/FeatureCard';
import { FaUsers, FaCalendarAlt, FaBullhorn } from 'react-icons/fa';

import heroVideo from '../assets/images/hero-background.mp4'; 
import foto1 from '../assets/images/startSeite.png';

const Start = () => {
    const welcomeMessages = useMemo(() => [ "Herzlich willkommen", "Hoş geldiniz", "добро пожаловать", "Welcome", "Ласкаво просимо!", "Bienvenu", "اهلا وسهلا","Serdecznie witamy","Hûn bi xêr hatinî"],[]);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % welcomeMessages.length);
        }, 1500); 
        return () => clearInterval(intervalId);
    }, [welcomeMessages]);

    const contentBlockBlobs = [
        {
            className: 'w-[800px] h-[800px] top-0 right-0 transform translate-x-1/4 -translate-y-1/4 opacity-50',
            color: '#eef4ff'
        },
        {
            className: 'w-[600px] h-[600px] bottom-0 left-0 transform -translate-x-1/4 translate-y-1/4 opacity-50',
            color: '#f2c94c'
        }
    ];

    return (
        <div>
            <Hero videoUrl={heroVideo}>
                {/* GÜNCELLENDİ: Metin yapısı ve fontlar isteğinize göre düzeltildi */}
                <div className='flex flex-col items-center justify-center'>
                    {/* GÜNCELLENDİ: 'font-dancing' kullanıldı, 'font-bold' kaldırıldı ve boyut ayarlandı */}
                    <h1 className="text-7xl md:text-8xl font-dancing">
                        “Komm ren„
                    </h1>
                    {/* GÜNCELLENDİ: 'whitespace-nowrap' ile tek satırda kalması sağlandı */}
                    <h2 className="text-3xl md:text-5xl font-bold mt-2 ml-12 md:ml-24 whitespace-nowrap">
                        Bürgertreff Wissen
                    </h2>
                </div>
                
                <h3 
                    key={currentMessageIndex}
                    className="text-2xl md:text-4xl font-semibold mt-8 animate-fade-in-out"
                >
                    {welcomeMessages[currentMessageIndex]}
                </h3>

                <div className="mt-8">
                    <Link to="/machen-sie-mit" className="bg-rcRed text-white text-lg font-bold py-3 px-8 rounded-full hover:bg-opacity-90 transition-colors">
                        Jetzt mitmachen
                    </Link>
                </div>
            </Hero>

            <ContentBlock 
                title="Herzlich willkommen im Bürgertreff Wissen" 
                imageUrl={foto1}
                imageSide="right"
                blobs={contentBlockBlobs}
            >
                <p>
                    Schön, dass Sie da sind! Der Bürgertreff Wissen ist ein offener Ort für alle Bürgerinnen und Bürger. Wir bieten Raum für Begegnungen, gemeinsame Aktivitäten und bürgerschaftliches Engagement.
                </p>
                <p>
                    Bei uns können Sie neue Leute kennenlernen, sich austauschen, an Veranstaltungen teilnehmen oder eigene Ideen und Projekte einbringen. Schauen Sie doch mal vorbei!
                </p>
            </ContentBlock>

            <section className="bg-gray-50 py-12 md:py-20">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard title="Wir über uns" linkTo="/wir-uber-uns" icon={<FaUsers />}>
                            Lernen Sie unser Team, unsere Ziele und unsere Geschichte kennen.
                        </FeatureCard>
                        <FeatureCard title="Angebote & Veranstaltungen" linkTo="/angebote" icon={<FaCalendarAlt />}>
                            Entdecken Sie unsere regelmäßigen Treffen, Kurse und besonderen Events.
                        </FeatureCard>
                        <FeatureCard title="Machen Sie mit" linkTo="/machen-sie-mit" icon={<FaBullhorn />}>
                            Unterstützen Sie uns ehrenamtlich, mit einer Spende oder eigenen Projektideen.
                        </FeatureCard>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Start;