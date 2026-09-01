// src/components/MultilingualWelcome.js
import React, { useState, useEffect } from 'react';

// Kürt Bayrağı (Ala Rengîn: Kırmızı, Beyaz içinde 21 ışınlı altın sarısı güneş, Yeşil)
const KurdishFlag = () => (
    <svg 
        viewBox="0 0 600 400" 
        preserveAspectRatio="xMidYMid slice" 
        className="w-full h-full block"
    >
        {/* Kırmızı Şerit */}
        <rect width="600" height="133.33" fill="#E4312B" />
        {/* Beyaz Şerit */}
        <rect y="133.33" width="600" height="133.33" fill="#FFFFFF" />
        {/* Yeşil Şerit */}
        <rect y="266.67" width="600" height="133.33" fill="#149A48" />
        
        {/* 21 Işınlı Güneş */}
        <g transform="translate(300, 200)">
            <circle r="42" fill="#FFC82D" />
            {Array.from({ length: 21 }).map((_, i) => (
                <polygon
                    key={i}
                    points="0,-68 6,-42 -6,-42"
                    fill="#FFC82D"
                    transform={`rotate(${i * (360 / 21)})`}
                />
            ))}
        </g>
    </svg>
);

// Almanya'da yaygın olarak yaşayan topluluklar ve temiz yazımları (Ünlemsiz, sade ve zarif)
const welcomeList = [
    { text: "Herzlich willkommen", code: "de", label: "Deutschland" },
    { text: "Hoş geldiniz", code: "tr", label: "Türkei" },
    { text: "Welcome", code: "gb", label: "Großbritannien" },
    { text: "Ласкаво просимо", code: "ua", label: "Ukraine" },
    { text: "أهلاً وسهلاً", code: "sy", label: "Arabisch" },
    { text: "Добро пожаловать", code: "ru", label: "Russisch" },
    { text: "Serdecznie witamy", code: "pl", label: "Polen" },
    { text: "Benvenuti", code: "it", label: "Italien" },
    { text: "Bienvenidos", code: "es", label: "Spanien" },
    { text: "Καλώς ορίσατε", code: "gr", label: "Griechenland" },
    { text: "Dobrodošli", code: "hr", label: "Kroatien / Balkan" },
    { text: "Bine ați venit", code: "ro", label: "Rumänien" },
    { text: "Bienvenue", code: "fr", label: "Frankreich" },
    { text: "Hûn bi xêr hatin", isKurdish: true, label: "Kurdî" }
];

const MultilingualWelcome = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % welcomeList.length);
        }, 2800);
        return () => clearInterval(intervalId);
    }, []);

    const currentItem = welcomeList[currentIndex];

    return (
        <div className="mt-8 flex flex-col items-center">
            {/* Glassmorphism Karşılama Kapsülü (360px mobil uyumlu) */}
            <div className="relative inline-flex items-center gap-2.5 sm:gap-4 md:gap-5 px-4 sm:px-7 md:px-8 py-2 sm:py-3 md:py-3.5 rounded-full bg-white/20 backdrop-blur-md border border-white/35 shadow-2xl transition-all duration-300 hover:bg-white/25 max-w-[95vw] sm:max-w-none">
                {/* Yuvarlak Gerçek Bayrak Rozeti */}
                <div 
                    key={`flag-${currentIndex}`} 
                    className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full overflow-hidden bg-white/25 border-2 border-white/40 flex items-center justify-center flex-shrink-0 shadow-md animate-slide-up-fade"
                >
                    {currentItem.isKurdish ? (
                        <KurdishFlag />
                    ) : (
                        <img 
                            src={`https://flagcdn.com/w80/${currentItem.code}.png`}
                            srcSet={`https://flagcdn.com/w160/${currentItem.code}.png 2x`}
                            alt={currentItem.label}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    )}
                </div>

                {/* Akıcı Kayarak Gelen Karşılama Metni */}
                <div className="overflow-hidden min-h-[30px] sm:min-h-[38px] flex items-center justify-center">
                    <h3
                        key={`text-${currentIndex}`}
                        className="text-lg sm:text-2xl md:text-4xl font-bold tracking-wide text-white drop-shadow-lg animate-slide-up-fade text-center whitespace-nowrap"
                    >
                        {currentItem.text}
                    </h3>
                </div>
            </div>

            {/* Minik Geçiş Noktaları (Dots) */}
            <div className="flex items-center gap-1.5 mt-3.5 opacity-75">
                {welcomeList.map((_, idx) => (
                    <span
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                            idx === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default MultilingualWelcome;
