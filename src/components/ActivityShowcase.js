// src/components/ActivityShowcase.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaRegCalendarAlt, FaImages, FaArrowRight } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import fallbackImage from '../assets/images/ana_logo.jpg';
import { isEventInPast } from '../utils/calendarUtils';

const formatActivityDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
};

const ActivityShowcase = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPastActivities = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('ereignisse')
                .select('id, title, category, event_date, description, image_url, archive_photos, archive_summary')
                .eq('is_public', true)
                .order('event_date', { ascending: false })
                .limit(12);

            if (error) {
                console.error('Fehler beim Laden der Aktivitäten:', error);
                setActivities([]);
            } else {
                const now = new Date();
                const pastList = (data || []).filter((e) => {
                    const isInPast = e.event_date ? isEventInPast(e.event_date, now) : true;
                    const hasMedia = (Array.isArray(e.archive_photos) && e.archive_photos.length > 0) || e.archive_summary || e.image_url;
                    return isInPast && hasMedia;
                });

                setActivities(pastList.slice(0, 3));
            }
            setLoading(false);
        };

        fetchPastActivities();
    }, []);

    if (loading || activities.length === 0) {
        return null;
    }

    return (
        <section id="aktivitaeten" className="relative py-12 md:py-16 bg-white border-b border-gray-200">
            <div className="container mx-auto px-6">
                {/* Başlık Bölümü */}
                <div className="flex items-end justify-between mb-8 pb-3 border-b-2 border-rcLightBlue">
                    <h2 className="text-3xl font-bold text-rcDarkGray">
                        Letzte Aktivitäten
                    </h2>
                    <Link
                        to="/angebote"
                        className="text-sm md:text-base font-semibold text-rcBlue hover:underline inline-flex items-center gap-1 group"
                    >
                        <span>Alle Veranstaltungen anzeigen</span>
                        <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </div>

                {/* 3'lü Kart Izgarası */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {activities.map((activity) => {
                        const photos = Array.isArray(activity.archive_photos) && activity.archive_photos.length > 0
                            ? activity.archive_photos
                            : null;
                        const coverImg = photos ? photos[0] : (activity.image_url || fallbackImage);
                        const photoCount = photos ? photos.length : 0;
                        const summaryText = activity.archive_summary || activity.description || '';

                        return (
                            <Link
                                key={activity.id}
                                to={`/angebote/${activity.id}`}
                                className="group flex flex-col bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-200 overflow-hidden transform transition-all duration-300 hover:-translate-y-1.5"
                            >
                                {/* Fotoğraf Alanı */}
                                <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                                    <img
                                        src={coverImg}
                                        alt={activity.title}
                                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                                    {/* Kategori */}
                                    {activity.category && (
                                        <span className="absolute top-3 right-3 bg-rcRed text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                                            {activity.category === 'Offene Treff' ? 'Offener Treff' : activity.category}
                                        </span>
                                    )}

                                    {/* Fotoğraf Sayısı */}
                                    {photoCount > 1 && (
                                        <span className="absolute top-3 left-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow flex items-center gap-1.5 backdrop-blur-sm">
                                            <FaImages className="text-rcLightBlue text-xs" />
                                            <span>{photoCount} Fotos</span>
                                        </span>
                                    )}

                                    {/* Tarih */}
                                    {activity.event_date && (
                                        <div className="absolute bottom-3 left-3 flex items-center text-white text-xs font-medium">
                                            <FaRegCalendarAlt className="mr-1.5 text-rcLightBlue" />
                                            <span>{formatActivityDate(activity.event_date)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* İçerik Alanı */}
                                <div className="flex flex-col flex-grow p-6">
                                    <h3 className="text-xl font-semibold text-rcBlue group-hover:text-blue-700 transition-colors line-clamp-2 mb-3">
                                        {activity.title}
                                    </h3>

                                    {summaryText && (
                                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                                            {summaryText}
                                        </p>
                                    )}

                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm font-semibold text-rcBlue mt-auto">
                                        <span className="group-hover:underline">Zum Rückblick</span>
                                        <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default ActivityShowcase;
