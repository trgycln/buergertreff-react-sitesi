// src/components/BigEventBanner.js

import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaMapMarkerAlt, FaArrowRight, FaTimes } from 'react-icons/fa';

const formatBannerDate = (dateString) => {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        const dayName = date.toLocaleDateString('de-DE', { weekday: 'long' });
        const dayMonth = date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
        const time = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        return { dayName, dayMonth, time };
    } catch {
        return null;
    }
};

const BigEventBanner = ({ event, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 30);
        document.body.style.overflow = 'hidden';
        return () => {
            clearTimeout(timer);
            document.body.style.overflow = '';
        };
    }, []);

    const handleClose = () => {
        document.body.style.overflow = '';
        setVisible(false);
        setTimeout(onClose, 350);
    };

    const dateInfo = formatBannerDate(event.event_date);
    const hasImage = !!event.image_url;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-350 ${
                visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
            {/* Tam ekran arka plan: fotoğraf bulanık ve karartılmış */}
            <div
                className="absolute inset-0 bg-cover bg-center scale-105"
                style={{
                    backgroundImage: hasImage
                        ? `url(${event.image_url})`
                        : undefined,
                    backgroundColor: hasImage ? undefined : '#1f5ea8',
                    filter: 'blur(6px)',
                }}
            />
            <div className="absolute inset-0 bg-black/55" />

            {/* X butonu */}
            <button
                onClick={handleClose}
                aria-label="Schließen"
                className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors border border-white/20"
            >
                <FaTimes size={16} />
            </button>

            {/* KART */}
            <div className="relative z-10 w-full max-w-md mx-4 sm:mx-auto flex flex-col rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">

                {/* Üst: büyük fotoğraf */}
                {hasImage ? (
                    <div className="h-56 sm:h-64 flex-shrink-0 overflow-hidden">
                        <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="h-20 flex-shrink-0 bg-rcBlue" />
                )}

                {/* Alt: bilgi alanı (beyaz) */}
                <div className="bg-white flex flex-col overflow-y-auto">
                    <div className="px-6 pt-5 pb-4 space-y-4">

                        {/* Başlık */}
                        <h1 className="text-2xl sm:text-3xl font-bold text-rcDarkGray leading-tight">
                            {event.title}
                        </h1>

                        {/* Tarih */}
                        {dateInfo && (
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-rcBlue/10">
                                    <FaCalendarAlt className="text-rcBlue" size={14} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Datum & Uhrzeit</p>
                                    <p className="text-rcDarkGray font-semibold text-sm">
                                        {dateInfo.dayName}, {dateInfo.dayMonth}
                                    </p>
                                    <p className="text-rcBlue font-bold text-xl">
                                        {dateInfo.time}{event.end_time ? `–${String(event.end_time).slice(0, 5)} Uhr` : ' Uhr'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Yer */}
                        {event.location && (
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-red-50">
                                    <FaMapMarkerAlt className="text-rcRed" size={14} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Ort</p>
                                    <p className="text-rcDarkGray font-semibold">{event.location}</p>
                                </div>
                            </div>
                        )}

                        {/* Açıklama */}
                        {event.description && (
                            <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 border-t border-gray-100 pt-4">
                                {event.description}
                            </p>
                        )}
                    </div>

                    {/* Buton */}
                    <div className="px-6 pb-6 pt-2">
                        <button
                            onClick={handleClose}
                            className="w-full flex items-center justify-center gap-2 bg-rcBlue hover:bg-blue-700 text-white font-bold text-base py-3.5 rounded-xl transition-colors duration-200 shadow-md"
                        >
                            Weiter zur Website
                            <FaArrowRight size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BigEventBanner;
