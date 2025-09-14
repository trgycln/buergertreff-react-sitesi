// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
// Sosyal medya ikonlarını import ediyoruz
import { FaFacebookF, FaInstagram, FaTiktok, FaMastodon, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { MdGroups } from 'react-icons/md';

const Footer = () => {
  return (
    <footer className="bg-rcBlue text-white">
      <div className="container mx-auto pt-16 pb-8">
        {/* Üst Sütunlar Bölümü */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <h3 className="text-lg font-bold mb-4">Über Uns</h3>
            <p className="text-gray-300 text-sm">
              Ein offener Ort für alle Bürgerinnen und Bürger. Wir bieten Raum für Begegnungen, gemeinsame Aktivitäten und bürgerschaftliches Engagement.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Schnell-Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/angebote-und-veranstaltungen" className="text-gray-300 hover:text-white">Angebote</Link></li>
              <li><Link to="/machen-sie-mit" className="text-gray-300 hover:text-white">Machen Sie Mit</Link></li>
              <li><Link to="/presse-uber-uns" className="text-gray-300 hover:text-white">Presse</Link></li>
              <li><Link to="/kontakt" className="text-gray-300 hover:text-white">Kontakt</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Kontakt</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Marktstraße 7, 57537 Wissen</li>
              <li><a href="tel:015165179082" className="hover:text-white">01516 5179082</a></li>
              <li><a href="mailto:buergertreff.wissen@gmail.com" className="hover:text-white">buergertreff.wissen@gmail.com</a></li>
            </ul>
          </div>
          
          {/* --- DEĞİŞEN SÜTUN: Bizi Takip Edin --- */}
         <div>
                <h3 className="text-lg font-bold mb-4">Folgen Sie uns</h3>
                <div className="flex flex-wrap items-center gap-5"> {/* flex-wrap eklendi */}
                    <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaFacebookF size={16} /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaInstagram size={16} /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaTiktok size={16} /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaXTwitter size={16} /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaMastodon size={16} /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaWhatsapp size={16} /></a>
                    <a href="#" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><MdGroups size={16} /></a>
                </div>
            </div>
        </div>

        {/* Alt Telif Hakkı Bölümü (Sizin versiyonunuz korundu) */}
        <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
          <p className="mb-2">© {new Date().getFullYear()} Bürgertreff Wissen e.V. | Alle Rechte vorbehalten.</p>
          <div className="flex justify-center items-center gap-4 mb-4">
            <Link to="/kontakt" className="hover:text-white">Impressum</Link>
            <span className="text-gray-600">|</span>
            <a href="/satzung.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              Satzung
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Web Design by Turgay Celen
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;