// src/components/Hero.js
import React from 'react';

const Hero = ({ imageUrl, videoUrl, children }) => {
  return (
    // Ana konteynerde taşan kısımları gizlemek için 'overflow-hidden' mevcut
    <div className="relative h-screen flex items-center justify-center text-center text-white px-4 overflow-hidden">
      {videoUrl ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          // GÜNCELLENDİ: Video, konteynerden %20 daha uzun ve üste hizalı.
          // Bu sayede sadece alt kısmı görünmez hale geliyor.
          className="absolute top-0 left-0 w-full h-[130%] object-cover z-0"
          src={videoUrl}
        />
      ) : (
        <div
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${imageUrl})` }}
        ></div>
      )}
      
      {/* Videonun üzerindeki karartma katmanı */}
      <div className="absolute inset-0 bg-rcBlue opacity-60 z-10"></div>
      
      {/* Metin içeriği */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
};

export default Hero;