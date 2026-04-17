// src/components/Footer.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaMastodon,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { supabase } from "../supabaseClient";

const Footer = () => {
  const [footerSponsors, setFooterSponsors] = useState([]);

  useEffect(() => {
    const fetchSponsors = async () => {
      const { data } = await supabase
        .from("sponsors")
        .select("id, name, logo_url, website_url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      setFooterSponsors(data || []);
    };
    fetchSponsors();
  }, []);

  return (
    <footer className="bg-rcBlue text-white">
      <div className="container mx-auto pt-16 pb-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          
          <div>
            <h3 className="text-lg font-bold mb-4">Unsere Sponsoren</h3>
            <div className="flex flex-col space-y-4">
                <div className="flex flex-wrap gap-4 items-center">
                    {footerSponsors.map((sponsor) => (
                        <a 
                            key={sponsor.id} 
                            href={sponsor.website_url || '#'}
                            title={sponsor.name}
                            target={sponsor.website_url ? '_blank' : '_self'}
                            rel="noopener noreferrer" 
                            className="group"
                        >
                            <div className="w-12 h-12 bg-white rounded-full p-1 shadow-sm flex justify-center items-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-md overflow-hidden">
                                {sponsor.logo_url ? (
                                    <img src={sponsor.logo_url} alt={sponsor.name} className="w-10 h-10 object-contain" />
                                ) : (
                                    <span className="text-[8px] font-bold text-rcDarkGray text-center leading-tight px-1">{sponsor.name}</span>
                                )}
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
              <li><a href="tel:+4916369995513" className="hover:text-white">0163 6999513</a></li>
              <li><a href="mailto:buergertreff.wissen@gmail.com" className="hover:text-white">buergertreff.wissen@gmail.com</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Folgen Sie uns</h3>
            <div className="flex flex-wrap items-center gap-5">
              <a href="https://www.facebook.com/profile.php?id=61585385846803" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaFacebookF size={16} /></a>
              <a href="https://www.youtube.com/@buergertreff-wissen" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaYoutube size={24} /></a>
              <a href="https://www.instagram.com/buergertreff.wissen/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors"><FaInstagram size={16} /></a>
              <a href="mailto:buergertreff.wissen@gmail.com" className="text-gray-300 hover:text-white transition-colors">@</a>
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