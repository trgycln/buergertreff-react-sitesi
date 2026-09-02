// src/components/Hero.js
import React from 'react';
import { FaChevronDown } from 'react-icons/fa';
import AnnouncementTicker from './AnnouncementTicker';

const Hero = ({ imageUrl, videoUrl, children, tickerItems = [], showScrollIndicator = true }) => {
  return (
    <div className="relative min-h-[90vh] md:h-screen flex items-center justify-center text-center text-white px-4 overflow-hidden pt-10 md:pt-12 pb-6 md:pb-10">
      {/* İntro Üzerinde Kayan Yazı Şeridi */}
      {tickerItems && tickerItems.length > 0 && (
        <div className="absolute top-0 left-0 w-full z-30">
          <AnnouncementTicker items={tickerItems} variant="heroGlass" />
        </div>
      )}

      {videoUrl ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-[115%] object-cover object-top scale-105 origin-top z-0 pointer-events-none"
          src={videoUrl}
        />
      ) : (
        <div
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${imageUrl})` }}
        ></div>
      )}
      
      {/* Çok katmanlı şık gradyan karartma katmanı */}
      <div className="absolute inset-0 bg-gradient-to-b from-rcBlue/60 via-rcBlue/30 to-slate-900/90 z-10 pointer-events-none"></div>
      
      {/* Alt dip geçiş gradyanı (Videonun altındaki yazıları gizler ve bir sonraki bölüme yumuşak bağlar) */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent z-10 pointer-events-none"></div>

      {/* Metin ve Kart İçeriği (Büyük ekranlarda 1550px'e kadar ferahça genişler) */}
      <div className="relative z-20 pt-3 pb-4 md:py-4 w-full max-w-7xl 2xl:max-w-[1550px] px-4 sm:px-6 md:px-8 lg:px-12 mx-auto flex flex-col items-center">
        {children}
      </div>

      {/* Aşağı kaydır göstergesi (Sadece masaüstünde; mobilde kartın üstüne binmesini önler) */}
      {showScrollIndicator && (
        <a 
          href="#aktivitaeten" 
          aria-label="Zu den Aktivitäten scrollen"
          className="hidden md:flex absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex-col items-center text-white/75 hover:text-white transition-all group cursor-pointer"
        >
          <span className="text-xs font-semibold tracking-widest uppercase mb-1 drop-shadow opacity-90 group-hover:opacity-100">
            Aktivitäten entdecken
          </span>
          <span className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors shadow-sm">
            <FaChevronDown className="animate-bounce text-sm text-white" />
          </span>
        </a>
      )}
    </div>
  );
};

export default Hero;