// src/pages/EreignisDetail.js
// DÜZELTME: 'archiveSummary' hatası giderildi (event.archive_summary olarak düzeltildi)

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ScrollToTop from '../components/ScrollToTop'; 
import { FaRegCalendarAlt, FaMapMarkerAlt, FaInfoCircle, FaEuroSign, FaUser, FaCheckCircle } from 'react-icons/fa';
import fallbackImage from '../assets/images/ana_logo.jpg'; 
import VideoPlayer from '../components/VideoPlayer'; 
import ImageCarousel from '../components/ImageCarousel';

// --- Yardımcı Fonksiyonlar ---

// Tarih formatlayıcı
const formatEventDate = (dateString) => {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
         }) + ' Uhr';
    } catch (e) {
        return dateString;
    }
};

// Bilgi satırı bileşeni
const InfoRow = ({ icon: Icon, label, value }) => {
    if (!value) return null; 
    return (
        <div className="flex items-start mb-5">
            <Icon className="text-rcBlue text-xl mt-1 mr-4 flex-shrink-0" />
            <div>
                <strong className="block text-sm text-gray-500 uppercase tracking-wide">{label}</strong>
                <p className="text-lg text-rcDarkGray">{value}</p>
            </div>
        </div>
    );
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

// --- Ana Detay Sayfası Bileşeni ---

const EreignisDetail = () => {
    const { id } = useParams(); 
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvent = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('ereignisse')
                .select('*')
                .eq('id', id)
                .eq('is_public', true) 
                .single(); 

            if (error) {
                console.error("Fehler beim Abrufen des Ereignisses:", error);
                setError("Veranstaltung nicht gefunden oder nicht öffentlich.");
            } else {
                setEvent(data);
            }
            setLoading(false);
        };
        fetchEvent();
    }, [id]); 

    if (loading) {
        return <div className="text-center py-40 text-lg text-rcDarkGray">Lade Veranstaltung...</div>;
    }

    if (error) {
        return (
            <div className="text-center py-40">
                <p className="text-3xl font-semibold text-rcRed mb-6">{error}</p>
                <Link to="/angebote" className="px-6 py-3 bg-rcBlue text-white rounded-lg hover:bg-blue-700 text-lg font-semibold">
                    &larr; Zurück zu allen Angeboten
                </Link>
            </div>
        );
    }

    if (!event) {
        return null; 
    }
    
    // Verileri formatla
    const formattedDate = formatEventDate(event.event_date);
    const imageUrl = event.image_url || fallbackImage;
    const isPastEvent = event.event_date && new Date(event.event_date) < new Date();
    const videoId = getYouTubeID(event.youtube_url);
    const archiveImageUrls = event.archive_photos || [];
    
    return (
        <div className="bg-white">
            <ScrollToTop /> 
            
            {/* 1. Başlık / Resim Alanı (Resmi sığdır) */}
            <div className="relative h-64 md:h-96 bg-gray-800">
                <img src={imageUrl} alt={event.title} className="w-full h-full object-contain" />
                
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                    <div className="container mx-auto px-6 py-8">
                        {event.category && (
                            <span className="text-sm font-semibold text-rcRed uppercase tracking-wider bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                {event.category}
                            </span>
                        )}
                        <h1 className="text-4xl md:text-5xl font-bold text-white mt-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            {event.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* 2. Ana İçerik Alanı */}
            <div className="container mx-auto px-6 py-12 md:py-16">
                
                <div className="mb-8">
                    <Link to="/angebote" className="text-rcBlue font-semibold hover:underline">
                        &larr; Zurück zu allen Angeboten
                    </Link>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-12">
                    
                    {/* Sol Sütun (Ana İçerik) */}
                    <div className="lg:w-2/3 space-y-10">
                        
                        {/* AÇIKLAMA (Sadece gelecek etkinliklerde veya arşiv özeti yoksa göster) */}
                        {event.description && (!isPastEvent || !event.archive_summary) && (
                            <section>
                                <h2 className="text-3xl font-semibold text-rcDarkGray mb-4 pb-2 border-b-2 border-rcLightBlue">Beschreibung</h2>
                                <p className="text-lg text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {event.description}
                                </p>
                            </section>
                        )}

                        {/* PROGRAM */}
                        {event.program_details && event.program_details.length > 0 && (
                            <section>
                                <h2 className="text-3xl font-semibold text-rcDarkGray mb-4 pb-2 border-b-2 border-rcLightBlue">Programm</h2>
                                <ul className="list-none space-y-3">
                                    {event.program_details.map((item, index) => (
                                        <li key={index} className="flex items-baseline p-4 bg-rcGray rounded-lg border border-gray-200">
                                            {item.time && <strong className="text-rcBlue w-32 flex-shrink-0 text-base">{item.time}:</strong>}
                                            <span className="text-rcDarkGray text-base">{item.activity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                        
                        {/* DÜZELTME: 'archiveSummary' -> 'event.archive_summary' olarak değiştirildi */}
                        {isPastEvent && (event.archive_summary || archiveImageUrls.length > 0 || videoId) && (
                            <section className="p-6 bg-blue-50 border-2 border-rcLightBlue rounded-lg">
                                <h2 className="text-3xl font-semibold text-rcBlue mb-4">Rückblick: So war's!</h2>
                                
                                {/* Arşiv Özeti */}
                                {event.archive_summary && (
                                    <p className="text-lg text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">
                                        {event.archive_summary}
                                    </p>
                                )}
                                
                                {/* Arşiv Videosu */}
                                {videoId && (
                                    <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
                                        <VideoPlayer videoId={videoId} />
                                    </div>
                                )}

                                {/* Arşiv Fotoğraf Galerisi */}
                                {archiveImageUrls.length > 0 && (
                                    <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
                                        <ImageCarousel images={archiveImageUrls} />
                                    </div>
                                )}
                            </section>
                        )}
                    </div>

                    {/* Sağ Sütun (Bilgi Kartı) */}
                    <div className="lg:w-1/3">
                        <div className="sticky top-28 bg-rcGray p-6 rounded-lg shadow-md border border-gray-200">
                            <h2 className="text-2xl font-semibold text-rcDarkGray mb-6 pb-3 border-b border-gray-300">
                                Details
                            </h2>
                            <div className="space-y-4">
                                <InfoRow icon={FaRegCalendarAlt} label="Wann" value={formattedDate || (isPastEvent ? "Vergangene Veranstaltung" : "Termin wird bekannt gegeben")} />
                                <InfoRow icon={FaMapMarkerAlt} label="Wo" value={event.location} />
                                <InfoRow icon={FaEuroSign} label="Kosten" value={event.cost} />
                                <InfoRow icon={FaCheckCircle} label="Anmeldung" value={event.registration_details} />
                                <InfoRow icon={FaUser} label="Kontakt" value={event.contact_person} />
                                <InfoRow icon={FaInfoCircle} label="Hinweise" value={event.notes} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EreignisDetail;