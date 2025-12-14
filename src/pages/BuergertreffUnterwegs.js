// src/pages/BürgertreffUnterwegs.js
// DÜZELTME: VideoPlayer bileşeni kaldırıldı, yerine doğrudan YouTube iframe'i eklendi.

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Supabase istemcisi
import PageBanner from '../components/PageBanner';
import ImageCarousel from '../components/ImageCarousel'; // Resim galerisi bileşeni
import ScrollToTop from '../components/ScrollToTop';

// DÜZELTME: VideoPlayer import'u kaldırıldı, artık gerekmiyor.
// import VideoPlayer from '../components/VideoPlayer'; 

// Banner resmi
import bannerImage from '../assets/images/idea-unterwegs.jpg'; 

import { Helmet } from 'react-helmet-async';

// Tarihi formatlamak için (örn: "November 2025")
const formatArchiveDate = (dateString) => {
    if (!dateString) return ""; 
    try {
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            month: 'long',
            year: 'numeric',
         });
    } catch (e) {
        return "";
    }
};

// YouTube URL'sinden Video ID'sini çıkaran fonksiyon
const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
        return match[2];
    }
    if (url.length === 11) {
        return url;
    }
    return null; 
};

const BürgertreffUnterwegs = () => {
    const [pastEvents, setPastEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPastEvents = async () => {
            setLoading(true);
            const today = new Date().toISOString(); 

            const { data, error } = await supabase
                .from('ereignisse')
                .select('*')
                .eq('is_public', true) 
                .eq('category', 'Bürgertreff unterwegs') 
                .lt('event_date', today) 
                .order('event_date', { ascending: false }); 

            if (error) {
                console.error("Fehler beim Abrufen der Archiv-Ereignisse:", error);
                setError("Archiv-Ereignisse konnten nicht geladen werden.");
            } else {
                // Filtreleme JS tarafında yapılıyor (en güvenlisi)
                const validEvents = data.filter(e => 
                    (e.archive_photos && e.archive_photos.length > 0) || 
                    (e.youtube_url && e.youtube_url.trim() !== '')
                );
                setPastEvents(validEvents);
            }
            setLoading(false);
        };

        fetchPastEvents();
    }, []); 

    return (
       <>


       <Helmet>
    <title>Bürgertreff Unterwegs: Unsere Ausflüge & Impressionen</title>
    <meta 
        name="description" 
        content="Sehen Sie Fotos und Berichte unserer letzten gemeinsamen Ausflüge und Exkursionen. Entdecken Sie die Erlebnisse und die lebendige Gemeinschaft des Bürgertreff Wissen e.V."
    />
</Helmet>
        <div>
    
            <ScrollToTop />
            <PageBanner
                title="Bürgertreff unterwegs"
                imageUrl={bannerImage} 
            />

            <main className="py-12 md:py-20 bg-white">
                <div className="container mx-auto px-6 max-w-5xl">
                    
                    {/* Statik Açıklama Metni */}
                    <div className="prose lg:prose-lg max-w-none mb-16 text-gray-700 leading-relaxed">
                        <p>
                            Wir erkunden den Wissen und Umgebung! Hier finden Sie einen Rückblick auf 
                            vergangene Touren mit Fotos und Berichten.
                        </p>
                        <p>
                            Die kommenden Ausflüge finden Sie im 
                            <a href="/angebote" className="text-rcBlue hover:underline font-medium"> allgemeinen Kalender</a>.
                            Haben Sie auch Ideen für einen Ausflug? 
                            <a href="/ideenboerse#ideen-form" className="text-rcBlue hover:underline font-medium">
                                Teilen Sie sie uns mit!
                            </a>
                        </p>
                    </div>

                    {/* --- Dinamik Arşiv Galerisi --- */}
                    {loading && (
                        <p className="text-center text-lg text-rcDarkGray">Lade Archiv-Galerie...</p>
                    )}
                    {error && (
                        <p className="text-center text-lg text-rcRed">{error}</p>
                    )}
                    
                    {!loading && !error && (
                        <div className="space-y-16">
                            {pastEvents.length > 0 ? (
                                pastEvents.map((event, index) => {
                                    const videoId = getYouTubeID(event.youtube_url);
                                    const archiveImageUrls = event.archive_photos || [];

                                    return (
                                        <section key={event.id} className={index > 0 ? "pt-12 border-t border-gray-200" : ""}>
                                            
                                            <div className="mb-6 text-center">
                                                <h2 className="text-3xl font-bold text-rcDarkGray mb-2">
                                                    {event.title}
                                                </h2>
                                                <p className="text-lg text-gray-500 font-medium">
                                                    {formatArchiveDate(event.event_date)}
                                                </p>
                                            </div>

                                            {event.archive_summary && (
                                                <p className="text-lg text-gray-700 mb-8 whitespace-pre-wrap max-w-3xl mx-auto text-center">
                                                    {event.archive_summary}
                                                </p>
                                            )}

                                            {/* DÜZELTME: VideoPlayer yerine doğrudan iframe eklendi */}
                                            {videoId && (
                                                <div className="mb-6 rounded-lg overflow-hidden shadow-lg border border-gray-200">
                                                    {/* Tailwind 'aspect-video' sınıfı 16:9 oranı sağlar */}
                                                    <iframe
                                                        className="w-full aspect-video" 
                                                        src={`https://www.youtube.com/embed/${videoId}`}
                                                        title={event.title || "YouTube video player"}
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    ></iframe>
                                                </div>
                                            )}

                                            {/* Fotoğraf Galerisi */}
                                            {archiveImageUrls.length > 0 && (
                                                <div className="not-prose rounded-lg overflow-hidden shadow-xl border border-gray-200">
                                                    <ImageCarousel 
                                                        images={archiveImageUrls} 
                                                    />
                                                </div>
                                            )}
                                        </section>
                                    )
                                })
                            ) : (
                                <p className="text-center text-lg text-gray-500 italic">
                                    Es gibt noch keine Archiv-Einträge mit Fotos oder Videos für diese Kategorie.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
       </>
    );
};

export default BürgertreffUnterwegs;