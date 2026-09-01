// src/components/Hero.js
import React from 'react';
import { FaChevronDown } from 'react-icons/fa';

const Hero = ({ imageUrl, videoUrl, children, showScrollIndicator = true }) => {
  return (
    <div className="relative min-h-[90vh] md:h-screen flex items-center justify-center text-center text-white px-4 overflow-hidden">
      {videoUrl ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-[125%] object-cover z-0"
          src={videoUrl}
        />
      ) : (
        <div
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${imageUrl})` }}
        ></div>
      )}
      
      {/* Çok katmanlı şık gradyan karartma katmanı */}
      <div className="absolute inset-0 bg-gradient-to-b from-rcBlue/60 via-rcBlue/40 to-slate-900/80 z-10 pointer-events-none"></div>
      
      {/* Metin içeriği */}
      <div className="relative z-20 py-16 max-w-4xl mx-auto flex flex-col items-center">
        {children}
      </div>

      {/* Aşağı kaydır göstergesi */}
      {showScrollIndicator && (
        <a 
          href="#aktivitaeten" 
          aria-label="Zu den Aktivitäten scrollen"
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center text-white/75 hover:text-white transition-all group cursor-pointer"
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