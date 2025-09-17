// src/pages/Start.js
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import ContentBlock from '../components/ContentBlock';
import FeatureCard from '../components/FeatureCard';
import { FaUsers, FaCalendarAlt, FaBullhorn } from 'react-icons/fa';
import heroImage from '../assets/images/hero-background.jpg'; 
import foto1 from '../assets/images/startSeite.jpg';

const Start = () => {
    const welcomeMessages = useMemo(() => [ "Herzlich willkommen", "Hoş geldiniz", "добро пожаловать", "Welcome", "Ласкаво просимо!", "Bienvenu", "اهلا وسهلا","Serdecznie witamy","Hûn bi xêr hatinî"],[]);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % welcomeMessages.length);
        }, 1000); 
        return () => clearInterval(intervalId);
    }, [welcomeMessages]);

    const contentBlockBlobs = [
        {
            // Sağ üstteki blob'u daha fazla içeri çektik
            className: 'w-[800px] h-[800px] top-0 right-0 transform translate-x-1/4 -translate-y-1/4 opacity-50',
            color: '#eef4ff' // rcLightBlue
        },
        {
            // Sol alttaki blob'u daha fazla içeri çektik
            className: 'w-[600px] h-[600px] bottom-0 left-0 transform -translate-x-1/4 translate-y-1/4 opacity-50',
            color: '#f2c94c' // rcAccentYellow
        }
    ];

    return (
        <div>
            <Hero imageUrl={heroImage}>
                <p className="font-bold text-4xl md:text-6xl mb-4" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                    Komm rein!
                </p>
                <h1 
                    key={currentMessageIndex}
                    className="text-3xl md:text-5xl font-bold mb-8 animate-fade-in-out"
                >
                    {welcomeMessages[currentMessageIndex]}
                </h1>
                <Link to="/machen-sie-mit" className="bg-rcRed text-white text-lg font-bold py-3 px-8 rounded-full hover:bg-opacity-90 transition-colors">
                    Jetzt Mitmachen
                </Link>
            </Hero>

            <ContentBlock 
                title="Herzlich Willkommen im Bürgertreff Wissen!" 
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
                        <FeatureCard title="Angebote & Veranstaltungen" linkTo="/angebote-und-veranstaltungen" icon={<FaCalendarAlt />}>
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