// src/pages/Start.js
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import ContentBlock from '../components/ContentBlock';
import FeatureCard from '../components/FeatureCard';
import AktuellesTeaser from '../components/AktuellesTeaser';
import BigEventBanner from '../components/BigEventBanner';
import { FaUsers, FaCalendarAlt, FaBullhorn } from 'react-icons/fa';
import { supabase } from '../supabaseClient';

import heroVideo from '../assets/images/hero-background.mp4'; 
import foto1 from '../assets/images/wirUberUns-4.jpg';
import { Helmet } from 'react-helmet-async';

const Start = () => {
    const welcomeMessages = useMemo(() => [ "Herzlich willkommen", "Hoş geldiniz", "добро пожаловать", "Welcome", "Ласкаво просимо!", "Bienvenu", "اهلا وسهلا","Serdecznie witamy","Hûn bi xêr hatinî"],[]);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [bigEvent, setBigEvent] = useState(null);
    const [showBanner, setShowBanner] = useState(false);

    // Büyük etkinliği Supabase'den çek
    useEffect(() => {
        const fetchBigEvent = async () => {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('ereignisse')
                .select('id, title, event_date, end_time, location, description, image_url')
                .eq('is_big_event', true)
                .eq('is_public', true)
                .gte('event_date', now)
                .order('event_date', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (!error && data) {
                setBigEvent(data);
                setShowBanner(true);
            }
        };
        fetchBigEvent();
    }, []);

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
        <>
        {/* SEO ETİKETLERİ: Başlığınızın ve açıklamanızın Google'da görünmesini sağlar */}
            <Helmet>
                <title>Startseite: Bürgertreff Wissen e.V.</title>
                <meta 
                    name="description" 
                    content="Willkommen beim Bürgertreff Wissen e.V. Wir fördern Gemeinschaft, bürgerschaftliches Engagement und Miteinander im Großraum Wissen/Sieg. Entdecken Sie unsere Angebote und Projekte."
                />
            </Helmet>

            {/* Büyük Etkinlik Banner (varsa, tam ekran overlay) */}
            {showBanner && bigEvent && (
                <BigEventBanner event={bigEvent} onClose={() => setShowBanner(false)} />
            )}

        <div>
            <Hero videoUrl={heroVideo}>
                {/* GÜNCELLENDİ: Metin yapısı ve fontlar isteğinize göre düzeltildi */}
                <div className='flex flex-col items-center justify-center'>
                    {/* GÜNCELLENDİ: 'font-dancing' kullanıldı, 'font-bold' kaldırıldı ve boyut ayarlandı */}
                    <h1 className="text-7xl md:text-8xl font-dancing">
                        “Komm ren„
                    </h1>
                    {/* GÜNCELLENDİ: 'whitespace-nowrap' ile tek satırda kalması sağlandı */}
                    <h2 className="text-2xl md:text-3xl font-bold mt-2 ml-20 md:ml-24 whitespace-nowrap">
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
                title="Schön, dass Sie da sind!" 
                imageUrl={foto1}
                imageSide="right"
                blobs={contentBlockBlobs}
            >
                <p className="text-lg font-semibold text-rcGreen mb-4">
Es ist soweit: Im März 2026 öffnet der Bürgertreff Wissen seine Pforten.
                </p>
                <p className="text-justify indent-8 mb-4">
In einem schönen geräumigen Ladenlokal in der Innenstadt von Wissen liegt unser Bürgertreff – ein Ort für alle Menschen, die Lust auf Begegnung, auf Aktivitäten, ehrenamtliches Engagement oder nur auf ein Schwätzchen bei Kaffee oder Tee haben.
                </p>
                <p className="text-justify indent-8 font-semibold text-lg mb-2">
                  Kommen Sie herein, machen Sie mit, bringen Sie Ihre Ideen ein!
                </p>
                <p className="text-center italic text-rcOrange font-bold text-xl">
Ganz nach unserem Motto: miteinander füreinander.
                </p>
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-rcGreen">
                    <p className="text-sm font-semibold text-gray-700 mb-2">📍 Unser Standort:</p>
                    <p className="text-gray-800 font-bold text-lg">Marktstr. 8</p>
                    <p className="text-gray-800 font-bold text-lg">57537 Wissen</p>
                </div>
            </ContentBlock>

            <AktuellesTeaser />

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
        </>

    );
};

export default Start;