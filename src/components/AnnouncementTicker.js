// src/components/AnnouncementTicker.js
import React from 'react';
import { FaStar } from 'react-icons/fa';

const AnnouncementTicker = ({ items, variant = 'default' }) => {
  if (!items || items.length === 0) {
    return null;
  }

  const normalizedItems = items.map((item) =>
    typeof item === 'string' ? { text: item, isBig: false } : item
  );

  const doubledItems = [...normalizedItems, ...normalizedItems];

  const containerStyle = variant === 'heroGlass'
    ? "bg-white/20 backdrop-blur-lg py-2.5 px-4 flex items-center overflow-hidden border-b border-white/25 text-white shadow-md w-full"
    : "bg-[#FFFBEB] py-1.5 px-4 flex items-center overflow-hidden shadow-sm border-b border-amber-200";

  const normalTextStyle = variant === 'heroGlass'
    ? "flex-shrink-0 flex items-center text-sm font-bold mr-16 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
    : "flex-shrink-0 flex items-center text-sm font-semibold mr-16 text-[#92400E]";

  const starColor = variant === 'heroGlass' ? "text-amber-300 drop-shadow" : "text-amber-500";

  return (
    <div className={containerStyle}>
      <div className="flex flex-nowrap animate-marquee">
        {doubledItems.map((item, index) =>
          item.isBig ? (
            <span
              key={index}
              className="flex-shrink-0 flex items-center mr-16"
            >
              <span className="inline-flex items-center gap-2 bg-rcRed text-white text-sm font-bold px-4 py-1 rounded-full shadow-md">
                <span className="text-base leading-none">🎉</span>
                {item.text}
              </span>
            </span>
          ) : (
            <span
              key={index}
              className={normalTextStyle}
            >
              <FaStar className={`mr-3 ${starColor}`} size={11} />
              {item.text}
            </span>
          )
        )}
      </div>
    </div>
  );
};

export default AnnouncementTicker;