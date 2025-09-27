import React from 'react';
import { FaStar } from 'react-icons/fa';

const AnnouncementTicker = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  const marqueeText = items.map(item => ` ${item} `).join(' ★ ');

  return (
    // GÜNCELLENDİ: Ana konteyner artık 'flex' ve 'overflow-hidden'
    <div className="bg-[#FFFBEB] text-[#92400E] py-1.5 px-4 flex items-center overflow-hidden shadow-sm border-b border-amber-200">
      {/* GÜNCELLENDİ: Animasyonlu div artık 'absolute' değil */}
      <div className="flex flex-nowrap animate-marquee">
        <p className="flex-shrink-0 flex items-center text-sm font-semibold pr-12">
          <FaStar className="mr-4 text-amber-500" />
          {marqueeText}
        </p>
        <p className="flex-shrink-0 flex items-center text-sm font-semibold pr-12">
          <FaStar className="mr-4 text-amber-500" />
          {marqueeText}
        </p>
      </div>
    </div>
  );
};

export default AnnouncementTicker;