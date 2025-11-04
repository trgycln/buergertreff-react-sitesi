// src/components/AnnouncementTicker.js
// DÜZELTME: Duyuruları tek metin yapmak yerine, map ile dönüp aralarına boşluk eklendi.

import React from 'react';
import { FaStar } from 'react-icons/fa';

const AnnouncementTicker = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  // DÜZELTME: Bu birleştirme (join) işlemine artık gerek yok.
  // const marqueeText = items.map(item => ` ${item} `).join(' ★ '); // <-- KALDIRILDI

  // YENİ: Kesintisiz bir animasyon döngüsü için listeyi ikiye katlıyoruz.
  // Eğer sadece 1 etkinlik varsa, [event1, event1] olur.
  // Eğer 2 etkinlik varsa, [event1, event2, event1, event2] olur.
  const doubledItems = [...items, ...items];

  return (
    // Ana konteyner
    <div className="bg-[#FFFBEB] text-[#92400E] py-1.5 px-4 flex items-center overflow-hidden shadow-sm border-b border-amber-200">
      
      {/* Animasyonlu div */}
      <div className="flex flex-nowrap animate-marquee">
        
        {/* DÜZELTME: 
          Eski iki <p> etiketi yerine, ikiye katlanmış 'doubledItems' dizisini map ile dönüyoruz.
          Her bir öğe artık kendi başına bir 'span' etiketi içinde.
        */}
        {doubledItems.map((item, index) => (
          <span 
            // index'i key olarak kullanmak bu senaryoda (sabit liste animasyonu) kabul edilebilir.
            key={index} 
            // DÜZELTME: Her öğeye 'mr-16' (margin-right: 4rem) ekleyerek aralarını açıyoruz.
            className="flex-shrink-0 flex items-center text-sm font-semibold mr-16"
          >
            <FaStar className="mr-3 text-amber-500" /> {/* Yıldız ve metin arasını biraz azalttık */}
            {item}
          </span>
        ))}
        {/* Eski <p> etiketleri kaldırıldı */}

      </div>
    </div>
  );
};

export default AnnouncementTicker;