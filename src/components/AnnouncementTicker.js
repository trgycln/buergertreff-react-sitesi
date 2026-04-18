// src/components/AnnouncementTicker.js

import React from 'react';
import { FaStar } from 'react-icons/fa';

const AnnouncementTicker = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  const normalizedItems = items.map((item) =>
    typeof item === 'string' ? { text: item, isBig: false } : item
  );

  const doubledItems = [...normalizedItems, ...normalizedItems];

  return (
    <div className="bg-[#FFFBEB] py-1.5 px-4 flex items-center overflow-hidden shadow-sm border-b border-amber-200">
      <div className="flex flex-nowrap animate-marquee">
        {doubledItems.map((item, index) =>
          item.isBig ? (
            <span
              key={index}
              className="flex-shrink-0 flex items-center mr-16"
            >
              {/* Büyük etkinlik: koyu kırmızı arka planlı pill */}
              <span className="inline-flex items-center gap-2 bg-red-600 text-white text-sm font-bold px-4 py-1 rounded-full shadow-md">
                <span className="text-base leading-none">🎉</span>
                {item.text}
              </span>
            </span>
          ) : (
            <span
              key={index}
              className="flex-shrink-0 flex items-center text-sm font-semibold mr-16 text-[#92400E]"
            >
              <FaStar className="mr-3 text-amber-500" size={11} />
              {item.text}
            </span>
          )
        )}
      </div>
    </div>
  );
};

export default AnnouncementTicker;