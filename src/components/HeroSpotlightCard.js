// src/components/HeroSpotlightCard.js
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaTimes, FaCameraRetro, FaArrowRight } from 'react-icons/fa';
import fallbackImage from '../assets/images/ana_logo.jpg';

const HeroSpotlightCard = ({ event }) => {
    const photos = Array.isArray(event?.archive_photos) && event.archive_photos.length > 0
        ? event.archive_photos
        : (event?.image_url ? [event.image_url] : [fallbackImage]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // Otomatik yumuşak geçiş (Rahat inceleme için 6.5 saniye; mouse gelince durur)
    useEffect(() => {
        if (photos.length <= 1 || isHovered || lightboxOpen) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % photos.length);
        }, 6500);
        return () => clearInterval(timer);
    }, [photos.length, isHovered, lightboxOpen]);

    // ESC tuşu ile tam ekranı kapatma desteği
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setLightboxOpen(false);
            if (e.key === 'ArrowLeft') prevPhoto();
            if (e.key === 'ArrowRight') nextPhoto();
        };
        if (lightboxOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden'; // Arka plan kaymasını engelle
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [lightboxOpen, photos.length]);

    const prevPhoto = (e) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    };

    const nextPhoto = (e) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % photos.length);
    };

    if (!event) return null;

    return (
        <>
            {/* Buzlu Cam (Glassmorphism) Entegre Kart (360px mobil uyumlu) */}
            <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="w-full max-w-lg bg-slate-900/40 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl text-left text-white transition-all duration-300 hover:bg-slate-900/50 hover:border-white/30"
            >
                {/* Üst Başlık & Rozet */}
                <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-100 border border-white/15">
                        <FaCameraRetro className="text-rcRed" />
                        <span>Letzte Aktivität</span>
                    </div>

                    {event.category && (
                        <span className="text-[11px] sm:text-xs font-bold bg-rcRed text-white px-2.5 py-0.5 rounded-full shadow">
                            {event.category === 'Offene Treff' ? 'Offener Treff' : event.category}
                        </span>
                    )}
                </div>

                {/* Başlık */}
                <Link to={`/angebote/${event.id}`} className="block group mb-2.5 sm:mb-3">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white group-hover:text-rcLightBlue transition-colors line-clamp-1">
                        {event.title}
                    </h3>
                </Link>

                {/* İnteraktif Fotoğraf Vitrini */}
                <div 
                    className="relative h-44 sm:h-56 md:h-64 rounded-xl sm:rounded-2xl overflow-hidden bg-black/40 border border-white/15 cursor-pointer group shadow-inner"
                    onClick={() => setLightboxOpen(true)}
                >
                    {/* Yumuşak Fade Geçişli Fotoğraf */}
                    <img
                        key={currentIndex}
                        src={photos[currentIndex]}
                        alt={event.title}
                        className="w-full h-full object-cover animate-slide-up-fade transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

                    {/* Fotoğraf Sayaç Rozeti */}
                    {photos.length > 1 && (
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/20 shadow">
                            {currentIndex + 1} / {photos.length}
                        </div>
                    )}

                    {/* Üzerine Gelince Beliren Oklar */}
                    {photos.length > 1 && (
                        <>
                            <button
                                onClick={prevPhoto}
                                aria-label="Vorheriges Foto"
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg z-10"
                            >
                                <FaChevronLeft className="text-xs" />
                            </button>
                            <button
                                onClick={nextPhoto}
                                aria-label="Nächstes Foto"
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg z-10"
                            >
                                <FaChevronRight className="text-xs" />
                            </button>
                        </>
                    )}

                    {/* Alttaki Fotoğraf Gösterge Çizgileri */}
                    {photos.length > 1 && (
                        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                            {photos.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentIndex(idx);
                                    }}
                                    aria-label={`Foto ${idx + 1}`}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        idx === currentIndex ? 'w-5 bg-white shadow' : 'w-1.5 bg-white/40 hover:bg-white/70'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Kısa Özet (Kurzbericht) */}
                {event.archive_summary ? (
                    <p className="mt-3.5 text-xs sm:text-sm text-blue-50/90 leading-relaxed line-clamp-2">
                        {event.archive_summary}
                    </p>
                ) : event.description ? (
                    <p className="mt-3.5 text-xs sm:text-sm text-blue-50/90 leading-relaxed line-clamp-2">
                        {event.description}
                    </p>
                ) : null}

                {/* Aksiyon Bağlantısı */}
                <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
                    <span className="text-xs text-white/75">Klicken für Großansicht</span>
                    <Link
                        to={`/angebote/${event.id}`}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white hover:text-rcLightBlue transition-colors group/link"
                    >
                        <span>Zum Rückblick</span>
                        <FaArrowRight className="text-xs transition-transform duration-300 group-hover/link:translate-x-1" />
                    </Link>
                </div>
            </div>

            {/* Gerçek Tam Ekran Lightbox (React Portal ile document.body'ye taşındı, hiçbir kayar yazı veya header altında kalmaz!) */}
            {lightboxOpen && createPortal(
                <div
                    className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 select-none"
                    onClick={() => setLightboxOpen(false)}
                >
                    {/* Üst Çubuk: Başlık, Sayaç ve Kapatma Butonu */}
                    <div 
                        className="w-full max-w-6xl flex items-center justify-between text-white z-20 pb-4 border-b border-white/15"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold uppercase tracking-wider bg-rcRed text-white px-3 py-1 rounded-full">
                                {event.category || 'Aktivität'}
                            </span>
                            <h4 className="text-lg md:text-xl font-bold truncate max-w-md sm:max-w-xl text-white">
                                {event.title}
                            </h4>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-300 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                                {currentIndex + 1} / {photos.length}
                            </span>
                            <button
                                onClick={() => setLightboxOpen(false)}
                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center transition-colors shadow-lg"
                                aria-label="Schließen"
                            >
                                <FaTimes className="text-lg" />
                            </button>
                        </div>
                    </div>

                    {/* Orta Alan: Fotoğraf ve Gezinme Okları */}
                    <div 
                        className="relative w-full max-w-6xl flex-grow flex items-center justify-center my-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            key={currentIndex}
                            src={photos[currentIndex]}
                            alt={event.title}
                            className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl animate-slide-up-fade"
                        />

                        {photos.length > 1 && (
                            <>
                                <button
                                    onClick={prevPhoto}
                                    aria-label="Vorheriges Foto"
                                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/35 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-xl hover:scale-110"
                                >
                                    <FaChevronLeft className="text-lg" />
                                </button>
                                <button
                                    onClick={nextPhoto}
                                    aria-label="Nächstes Foto"
                                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/35 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-xl hover:scale-110"
                                >
                                    <FaChevronRight className="text-lg" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Alt Çubuk: Küçük Fotoğraf Çizgileri & Bilgi */}
                    <div 
                        className="w-full max-w-6xl flex flex-col items-center gap-2 pt-3 border-t border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {photos.length > 1 && (
                            <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
                                {photos.map((photoUrl, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        aria-label={`Foto ${idx + 1}`}
                                        className={`w-12 h-8 rounded-md overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                                            idx === currentIndex
                                                ? 'border-rcLightBlue scale-110 shadow-lg'
                                                : 'border-white/30 opacity-50 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default HeroSpotlightCard;
