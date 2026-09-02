// src/pages/Start.js
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import ContentBlock from '../components/ContentBlock';
import FeatureCard from '../components/FeatureCard';
import AktuellesTeaser from '../components/AktuellesTeaser';
import ActivityShowcase from '../components/ActivityShowcase';
import MultilingualWelcome from '../components/MultilingualWelcome';
import HeroSpotlightCard from '../components/HeroSpotlightCard';
import BigEventBanner from '../components/BigEventBanner';
import { FaUsers, FaCalendarAlt, FaBullhorn } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import { isEventInPast, dateToKey, expandRecurringEntries, getComparableEventDate, mergeUpcomingEvents, parseLocalDate } from '../utils/calendarUtils';

import heroVideo from '../assets/images/hero-background.mp4'; 
import foto1 from '../assets/images/wirUberUns-4.jpg';
import { Helmet } from 'react-helmet-async';

const formatTickerDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        });
    } catch (e) {
        return '';
    }
};

const Start = () => {
    const [bigEvent, setBigEvent] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [latestPastEvent, setLatestPastEvent] = useState(null);
    const [tickerAnnouncements, setTickerAnnouncements] = useState([]);

    // Büyük etkinliği, son fotoğraflı faaliyeti ve kayan yazı duyurularını çek
    useEffect(() => {
        const fetchHeroData = async () => {
            const today = parseLocalDate(new Date());
            const horizon = new Date(today);
            horizon.setDate(horizon.getDate() + 30);
            const todayKey = dateToKey(today);
            const horizonKey = dateToKey(horizon);
            const now = new Date();
            const nowIso = now.toISOString();
            
            const [bigEventRes, pastEventsRes, recurringRes, singleRes, exceptionsRes] = await Promise.all([
                supabase
                    .from('ereignisse')
                    .select('id, title, event_date, end_time, location, description, image_url, program_details')
                    .eq('is_big_event', true)
                    .eq('is_public', true)
                    .gte('event_date', nowIso)
                    .order('event_date', { ascending: true })
                    .limit(1)
                    .maybeSingle(),
                supabase
                    .from('ereignisse')
                    .select('id, title, category, location, event_date, end_time, description, image_url, archive_photos, archive_summary, is_big_event')
                    .eq('is_public', true)
                    .order('event_date', { ascending: false })
                    .limit(10),
                supabase
                    .from('calendar_recurring_entries')
                    .select('*')
                    .eq('is_public', true)
                    .eq('is_active', true)
                    .gte('end_date', todayKey)
                    .lte('start_date', horizonKey),
                supabase
                    .from('calendar_single_entries')
                    .select('*')
                    .eq('is_public', true)
                    .eq('is_active', true)
                    .gte('entry_date', todayKey)
                    .lte('entry_date', horizonKey),
                supabase.from('calendar_recurring_exceptions').select('*')
            ]);

            if (!bigEventRes.error && bigEventRes.data) {
                setBigEvent(bigEventRes.data);
                setShowBanner(true);
            }

            if (!pastEventsRes.error && pastEventsRes.data) {
                const withPhotos = pastEventsRes.data.find((e) => {
                    const isPast = e.event_date ? isEventInPast(e.event_date, now) : true;
                    return isPast && Array.isArray(e.archive_photos) && e.archive_photos.length > 0;
                }) || pastEventsRes.data.find((e) => {
                    const isPast = e.event_date ? isEventInPast(e.event_date, now) : true;
                    return isPast && (e.archive_summary || e.image_url);
                });

                if (withPhotos) {
                    setLatestPastEvent(withPhotos);
                }

                // Ticker duyurularını hazırla
                const ereignisseOccurrences = pastEventsRes.data
                    .filter((e) => e.event_date && !isEventInPast(e.event_date, now))
                    .map((e) => {
                        const eventDate = getComparableEventDate(e.event_date);
                        return {
                            dateKey: eventDate ? dateToKey(eventDate) : null,
                            title: e.title,
                            category: e.category,
                            location: e.location,
                            startTime: eventDate ? String(eventDate.toTimeString()).slice(0, 5) : null,
                            endTime: e.end_time ? String(e.end_time).slice(0, 5) : null,
                            sortKey: eventDate ? eventDate.getTime() : Number.MAX_SAFE_INTEGER,
                            isPriority: true,
                            isBigEvent: e.is_big_event || false,
                        };
                    });

                const recurringOccurrences = expandRecurringEntries(recurringRes.data || [], today, horizon, exceptionsRes.data || []).map((entry) => ({
                    dateKey: entry.dateKey,
                    title: entry.title,
                    category: entry.category,
                    location: entry.location,
                    startTime: entry.startTime,
                    sortKey: parseLocalDate(entry.dateKey)?.getTime() || Number.MAX_SAFE_INTEGER,
                    isPriority: false,
                }));

                const singleOccurrences = (singleRes.data || []).map((entry) => ({
                    dateKey: entry.entry_date,
                    title: entry.title,
                    category: entry.category,
                    location: entry.location,
                    startTime: entry.start_time,
                    sortKey: parseLocalDate(entry.entry_date)?.getTime() || Number.MAX_SAFE_INTEGER,
                    isPriority: false,
                }));

                const sortByDateKey = (a, b) => {
                    if (a.dateKey !== b.dateKey) return (a.dateKey || '').localeCompare(b.dateKey || '');
                    const leftTime = a.startTime ? String(a.startTime).slice(0, 5) : '99:99';
                    const rightTime = b.startTime ? String(b.startTime).slice(0, 5) : '99:99';
                    if (leftTime !== rightTime) return leftTime.localeCompare(rightTime);
                    return String(a.title || '').localeCompare(String(b.title || ''), 'de');
                };

                const allMerged = mergeUpcomingEvents([...ereignisseOccurrences, ...recurringOccurrences, ...singleOccurrences]);
                const priorityItems = allMerged.filter((e) => e.isPriority).sort(sortByDateKey);
                const calendarItems = allMerged.filter((e) => !e.isPriority).sort(sortByDateKey);
                const combined = [...priorityItems, ...calendarItems.slice(0, 5)];

                const formattedAnnouncements = combined.map((entry) => {
                    const date = formatTickerDate(entry.dateKey);
                    const startTime = entry.startTime ? String(entry.startTime).slice(0, 5) : null;
                    const endTime = entry.endTime ? String(entry.endTime).slice(0, 5) : null;
                    let timeText = null;
                    if (startTime && endTime) {
                        timeText = `${startTime}–${endTime} Uhr`;
                    } else if (startTime) {
                        timeText = `${startTime} Uhr`;
                    }
                    let text = `${date}: ${entry.title}`;
                    if (timeText) {
                        text += ` (${timeText})`;
                    }
                    if (entry.location) {
                        text += ` – ${entry.location}`;
                    }
                    return { text, isBig: entry.isBigEvent || false };
                });

                setTickerAnnouncements(formattedAnnouncements);
            }
        };
        fetchHeroData();
    }, []);

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
            <Hero videoUrl={heroVideo} tickerItems={tickerAnnouncements}>
                <div className={`w-full ${latestPastEvent ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 xl:gap-14 items-center' : 'flex flex-col items-center justify-center text-center'}`}>
                    {/* Sol Sütun: Karşılama & Buton (Büyük ekranlarda 6 sütun genişliğinde ve ferah) */}
                    <div className={`${latestPastEvent ? 'lg:col-span-6 xl:col-span-6' : 'w-full'} flex flex-col items-center justify-center text-center px-2 sm:px-4`}>
                        <div className='flex flex-col items-center justify-center text-center'>
                            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-dancing leading-tight">
                                “Komm ren„
                            </h1>
                            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mt-1 whitespace-nowrap">
                                Bürgertreff Wissen
                            </h2>
                        </div>
                        
                        {/* Modern Çok Dilli Karşılama Kapsülü */}
                        <div className="w-full flex justify-center mt-4 sm:mt-6 lg:mt-8">
                            <MultilingualWelcome />
                        </div>

                        <div className="mt-5 sm:mt-6 lg:mt-8 flex justify-center">
                            <Link to="/machen-sie-mit" className="bg-rcRed text-white text-base sm:text-lg lg:text-xl font-bold py-3 sm:py-3.5 lg:py-4 px-6 sm:px-8 lg:px-10 rounded-full hover:bg-opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 inline-block">
                                Jetzt mitmachen
                            </Link>
                        </div>
                    </div>

                    {/* Sağ Sütun: Son Fotoğraflı Faaliyet Vitrin Kartı (Büyük ekranlarda 6 sütun genişliğinde ve orantılı) */}
                    {latestPastEvent && (
                        <div className="lg:col-span-6 xl:col-span-6 flex justify-center w-full mt-2 lg:mt-0 px-2 sm:px-4">
                            <HeroSpotlightCard event={latestPastEvent} />
                        </div>
                    )}
                </div>
            </Hero>

            {/* Geçmiş ve Görsel Faaliyetler Vitrini */}
            <ActivityShowcase />

            {/* Yaklaşan Program ve Etkinlikler */}
            <AktuellesTeaser />

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