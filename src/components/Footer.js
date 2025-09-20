// src/components/Footer.js
import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaMastodon,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { MdGroups } from "react-icons/md";

import sponsorLogoKoelschbach from '../assets/images/sponsor1.jpg';
import sponsorLogoSparkasse from '../assets/images/sponsor2.png';

const footerSponsors = [
    { name: 'Kölschbach Heizung Klima Sanitär', logo: sponsorLogoKoelschbach, url: 'https://www.koelschbach.de/' },
    { name: 'Sparkasse', logo: sponsorLogoSparkasse, url: 'https://www.sparkasse.de' },
];

const Footer = () => {
  return (
    <footer className="bg-rcBlue text-white">
      <div className="container mx-auto pt-16 pb-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          
          <div>
            <h3 className="text-lg font-bold mb-4">Unsere Sponsoren</h3>
            <div className="flex flex-col space-y-4">
                <div className="flex flex-wrap gap-4 items-center">
                    {footerSponsors.map((sponsor, index) => (
                        <a 
                            key={index} 
                            href={sponsor.url}
                            title={sponsor.name}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="group"
                        >
                            <div className="w-12 h-12 bg-white rounded-full p-1 shadow-sm flex justify-center items-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-md overflow-hidden">
                                <img src={sponsor.logo} alt={sponsor.name} className="w-10 h-10 object-contain" />
                            </div>
                        </a>
                    ))}
                </div>
                <Link to="/sponsorlar" className="text-sm text-gray-300 hover:text-white underline self-start">
                    Alle Sponsoren ansehen
                </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Kontakt</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {/* GÜNCELLENDİ: Adres geçici bir metinle değiştirildi */}
              <li>Beispielstraße 1, 12345 Beispielstadt</li>
              <li><a href="tel:015165179082" className="hover:text-white">01516 5179082</a></li>
              <li><a href="mailto:buergertreff.wissen@gmail.com" className="hover:text-white">buergertreff.wissen@gmail.com</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Folgen Sie uns</h3>
            <div className="flex flex-wrap items-center gap-5">
              <a href="https://www.youtube.com/@buergertreff-wissen" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaYoutube size={24} /></a>
              <a href="/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaFacebookF size={16} /></a>
              <a href="/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaInstagram size={16} /></a>
              <a href="/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaTiktok size={16} /></a>
              <a href="/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaXTwitter size={16} /></a>
              <a href="/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaMastodon size={16} /></a>
              <a href="/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaWhatsapp size={16} /></a>
              <a href="/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><MdGroups size={16} /></a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 mt-10 text-center text-sm text-gray-400">
          <p className="mb-2">© {new Date().getFullYear()} Bürgertreff Wissen e.V. | Alle Rechte vorbehalten.</p>
          <div className="flex justify-center items-center gap-4 mb-4">
            <Link to="/kontakt" className="hover:text-white">Impressum</Link>
            <span className="text-gray-600">|</span>
            <a href="/satzung.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-white">Satzung</a>
          </div>
          <p className="mt-4 text-xs text-gray-500">Web Design by Turgay Celen</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;