// src/components/AnnouncementTicker.js
import React from 'react';
import { FaStar } from 'react-icons/fa';

const AnnouncementTicker = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  const marqueeText = items.map(item => ` ${item} `).join(' ★ ');

  return (
    <div className="bg-[#FFFBEB] text-[#92400E] py-2.5 px-4 overflow-hidden shadow-sm border-b border-amber-200">
      <div className="relative flex items-center h-6">
        <div className="absolute whitespace-nowrap animate-marquee-slow">
          <span className="text-md font-semibold mx-12 flex items-center">
            <FaStar className="inline-block mr-4 text-amber-500" /> {marqueeText}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementTicker;