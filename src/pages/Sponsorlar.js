// src/Sponsorlar.js
import React from 'react';
import { FaHandshake } from 'react-icons/fa';

import PageBanner from '../components/PageBanner';
import sponsorBanner from '../assets/images/sponsorenbanner.png'; 

import sponsorLogoKoelschbach from '../assets/images/sponsor1.jpg';
import sponsorLogoSparkasse from '../assets/images/sponsor2.png';

const sponsors = [
  {
    name: 'Kölschbach Heizung Klima Sanitär',
    logo: sponsorLogoKoelschbach,
    url: 'https://www.koelschbach.de/' 
  },
  {
    name: 'Sparkasse',
    logo: sponsorLogoSparkasse,
    url: 'https://www.sparkasse.de'
  }
];

const SponsorCircle = ({ name, logo, url }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    title={name}
    className="group flex justify-center items-center"
  >
    <div className="w-40 h-40 bg-white rounded-full shadow-lg p-4 flex justify-center items-center transition-all duration-300 ease-in-out group-hover:shadow-2xl group-hover:scale-105 border-4 border-transparent group-hover:border-rcRed overflow-hidden">
      <img 
        src={logo} 
        alt={name}
        className="w-28 h-28 object-contain" 
      />
    </div>
  </a>
);

const Sponsorlar = () => {
  return (
    <>
      <PageBanner
        title="Sponsoren & Partner"
        imageUrl={sponsorBanner}
      />

      <div className="bg-gray-50 py-8"> {/* Dikey boşluk py-8 olarak güncellendi */}
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <FaHandshake className="text-rcRed text-5xl mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-rcBlue mb-4">Unsere Sponsoren und Unterstützer</h1>
            <p className="text-lg text-rcDarkGray max-w-3xl mx-auto">
              Wir danken unseren Partnern für ihre wertvolle Unterstützung. Ohne ihre Beiträge könnten wir unsere Arbeit für die Gemeinschaft nicht verwirklichen.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-12">
            {sponsors.map((sponsor, index) => <SponsorCircle key={index} {...sponsor} />)}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sponsorlar;