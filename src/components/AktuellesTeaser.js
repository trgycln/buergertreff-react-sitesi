import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRegCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import ImageCarousel from './ImageCarousel';

const formatDate = (dateString) => {
    if (!dateString) return 'Datum folgt';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) + ' Uhr';
    } catch (e) {
        return dateString;
    }
};

const AktuellesTeaser = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('ereignisse')
                .select('*')
                .eq('is_public', true)
                .order('event_date', { ascending: false });

            if (error) {
                console.error('Aktuelles konnte nicht geladen werden:', error);
                setEvents([]);
            } else {
                setEvents(data || []);
            }

            setLoading(false);
        };

        fetchEvents();
    }, []);

    const { upcoming, latestWithPhotos } = useMemo(() => {
        const today = new Date().setHours(0, 0, 0, 0);

        const upcomingEvents = events
            .filter((e) => !e.event_date || new Date(e.event_date) >= today)
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
            .slice(0, 3);

        const latestPastWithPhotos = events
            .filter((e) => e.event_date && new Date(e.event_date) < today)
            .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
            .find((e) => Array.isArray(e.archive_photos) && e.archive_photos.length > 0) || null;

        return {
            upcoming: upcomingEvents,
            latestWithPhotos: latestPastWithPhotos
        };
    }, [events]);

    return (
        <section className="bg-white py-12 md:py-16">
            <div className="container mx-auto px-6">
                <div className="flex items-end justify-between mb-6 pb-3 border-b-2 border-rcLightBlue">
                    <h2 className="text-3xl font-bold text-rcDarkGray">Aktuelles</h2>
                    <Link to="/angebote" className="text-sm md:text-base font-semibold text-rcBlue hover:underline">
                        Alle Veranstaltungen anzeigen &rarr;
                    </Link>
                </div>

                {loading ? (
                    <p className="text-gray-600">Aktuelles wird geladen...</p>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                        <div className="xl:col-span-2 bg-rcGray p-5 rounded-lg border border-gray-200">
                            <h3 className="text-xl font-semibold text-rcDarkGray mb-4">Nächste Termine</h3>

                            {upcoming.length === 0 ? (
                                <p className="text-gray-500 italic">Aktuell sind keine kommenden Termine geplant.</p>
                            ) : (
                                <ul className="space-y-3 divide-y divide-gray-200">
                                    {upcoming.map((event) => (
                                        <li key={event.id} className="pt-3 first:pt-0">
                                            <Link to={`/angebote/${event.id}`} className="block group">
                                                <h4 className="text-lg font-semibold text-rcDarkGray group-hover:text-rcBlue mb-1">
                                                    {event.title}
                                                </h4>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 text-sm text-gray-600">
                                                    <span className="flex items-center">
                                                        <FaRegCalendarAlt className="mr-1.5" />
                                                        {formatDate(event.event_date)}
                                                    </span>
                                                    {event.location && (
                                                        <span className="flex items-center">
                                                            <FaMapMarkerAlt className="mr-1.5" />
                                                            {event.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {latestWithPhotos && (
                            <aside className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                                <h3 className="text-xl font-semibold text-rcDarkGray mb-2">Letzte Aktivität</h3>
                                <p className="text-sm text-gray-600 mb-3">{latestWithPhotos.title}</p>
                                <ImageCarousel images={latestWithPhotos.archive_photos} objectFit="contain" />
                                <div className="mt-3 text-right">
                                    <Link
                                        to={`/angebote/${latestWithPhotos.id}`}
                                        className="text-sm font-semibold text-rcBlue hover:underline"
                                    >
                                        Zum Rückblick &rarr;
                                    </Link>
                                </div>
                            </aside>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default AktuellesTeaser;