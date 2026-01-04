// src/components/Header.js
// DÜZELTME: Kayan yazı (Ticker) artık Supabase'den dinamik olarak çekiliyor.

import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Supabase istemcisini import et
import logoImage from '../assets/images/logo.jpg';
import { FaFacebookF, FaInstagram, FaTiktok, FaMastodon, FaChevronDown, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

// Kayan yazı bileşenini import ediyoruz
import AnnouncementTicker from './AnnouncementTicker';

// YENİ: Tarihi formatlamak için yardımcı fonksiyon
const formatTickerDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit', // 'yy' formatı için
         });
    } catch (e) {
        return '';
    }
};

const Header = () => {
    const navLinkStyles = ({ isActive }) => {
        return `uppercase font-semibold tracking-wide pb-2 border-b-4 transition-colors duration-300 ${isActive ? 'border-rcRed text-rcBlue' : 'border-transparent text-rcDarkGray hover:border-red-200'} whitespace-nowrap`;
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState(null);

    // --- DÜZELTME: Statik duyurular dinamik state'e dönüştü ---
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        // YENİ: Öne çıkan gelecek etkinlikleri çek
        const fetchFeaturedEvents = async () => {
            const today = new Date().toISOString(); // Bugünün tarihi

            const { data, error } = await supabase
                .from('ereignisse')
                .select('title, event_date, location')
                .eq('is_public', true)      // 1. Herkese açık olmalı
                .eq('is_featured', true)    // 2. Öne çıkan olarak işaretlenmiş olmalı
                .gte('event_date', today)   // 3. Tarihi gelecekte olmalı
                .order('event_date', { ascending: true }) // 4. En yakın tarihli olan önce
                .limit(5); // 5. En fazla 5 tane al

            if (error) {
                console.error("Fehler beim Laden der Ticker-Ankündigungen:", error);
                return;
            }

            // Veriyi istediğimiz kısa metin formatına dönüştür
            const formattedAnnouncements = data.map(event => {
                const date = formatTickerDate(event.event_date);
                let text = `${date}: ${event.title}`;
                if (event.location) {
                    text += ` - ${event.location}`;
                }
                return text;
            });

            setAnnouncements(formattedAnnouncements);
        };

        fetchFeaturedEvents();
    }, []); // Sayfa yüklendiğinde bir kez çalışır
    // --- BİTİŞ: Dinamik Veri Çekme ---


    const toggleSubmenu = (menuName) => {
        setOpenSubmenu(openSubmenu === menuName ? null : menuName);
    };
    const handleMobileLinkClick = () => {
        setIsMobileMenuOpen(false);
    };
    const handleSubmenuToggle = (e) => {
        e.stopPropagation();
        toggleSubmenu('angebote');
    };

    // Ana sayfa için özel ticker mesajı
    const staticTickerMessage = [
        "Wir wünschen allen eine Zeit voller guter Begegnungen und hoffen, Sie und euch im nächsten Jahr persönlich zu treffen."
    ];

    // Sadece Start sayfasında özel mesajı göster
    const isStartPage = window.location.pathname === "/";

    return (
        <>
            {/* Kayan yazı bandı (Her sayfada admin tarafından girilen duyurular) */}
            <AnnouncementTicker items={announcements} />
            
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="bg-rcBlue text-gray-300 py-2">
                    <div className="container mx-auto flex justify-center lg:justify-between items-center px-4">
                        <div className="hidden lg:block">
                            <p className="font-dancing text-xl text-white">"Miteinander füreinander"</p>
                        </div>
                        <div className="flex items-center gap-5">
                            <a href="https://www.facebook.com/profile.php?id=61585385846803" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaFacebookF size={16} /></a>
                            <a href="https://www.youtube.com/@buergertreff-wissen" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaYoutube size={16} /></a>
                            <a href="https://www.instagram.com/buergertreff.wissen/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaInstagram size={16} /></a>
                            <a href="mailto:buergertreff.wissen@gmail.com" className="hover:text-white transform hover:-translate-y-1 transition-all">@</a>
                        </div>
                    </div>
                </div>
                
                <div className="container mx-auto flex justify-between items-center p-4">
                    <div className="logo-container">
                        <Link to="/" className="flex items-center gap-2">
                            <img src={logoImage} alt="Bürgertreff Wissen Logo" className="h-12 md:h-16" />
                            <span className="text-2xl md:text-3xl font-sans font-bold text-rcBlue">Bürgertreff Wissen</span>
                        </Link>
                    </div>
                    <nav>
                        <ul className="hidden lg:flex items-center space-x-3">
                            <li><NavLink to="/" className={navLinkStyles}>Start</NavLink></li>
                            <li><NavLink to="/wir-uber-uns" className={navLinkStyles}>Wir über uns</NavLink></li>
                            <li><NavLink to="/machen-sie-mit" className={navLinkStyles}>Machen Sie Mit</NavLink></li>
                            <li className="relative" onMouseEnter={() => setIsDropdownOpen(true)} onMouseLeave={() => setIsDropdownOpen(false)}>
                                <NavLink to="/angebote" className={navLinkStyles}>Angebote<b className='text-rcRed'>&</b>Veranstaltungen</NavLink>
                                {isDropdownOpen && (
                                    <ul className="absolute left-0 top-full pt-2 w-56 bg-white shadow-lg rounded-md py-1">
                                        <li><NavLink to="/sprachtreffen" className="block px-4 py-2 text-gray-700 hover:bg-rcLightBlue">Sprachtreffen</NavLink></li>
                                        <li><NavLink to="/buergertreff-unterwegs" className="block px-4 py-2 text-gray-700 hover:bg-rcLightBlue">Bürgertreff Unterwegs</NavLink></li>
                                        <li><NavLink to="/nachbarschaftsboerse" className="block px-4 py-2 text-gray-700 hover:bg-rcLightBlue">Nachbarschaftsbörse</NavLink></li>
                                        <li><NavLink to="/ideenboerse" className="block px-4 py-2 text-gray-700 hover:bg-rcLightBlue">Ideenbörse</NavLink></li>
                                    </ul>
                                )}
                            </li>
                            <li><NavLink to="/sponsorlar" className={navLinkStyles}>Sponsoren</NavLink></li>
                            <li><NavLink to="/presse" className={navLinkStyles}>Presse</NavLink></li>
                            <li><NavLink to="/kontakt" className={navLinkStyles}>Kontakt</NavLink></li>
                        </ul>
                    </nav>
                    <div className="header-actions">
                        <button className="lg:hidden text-rcBlue z-50" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobil Menü (Değişiklik yok) */}
                <div className={`lg:hidden bg-white shadow-lg absolute w-full transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'transform translate-x-0' : 'transform -translate-x-full'}`}>
                    <ul className="flex flex-col items-center py-4">
                        <li className="py-2 w-full text-center uppercase"><NavLink to="/" onClick={handleMobileLinkClick}>Start</NavLink></li>
                        <li className="py-2 w-full text-center uppercase"><NavLink to="/wir-uber-uns" onClick={handleMobileLinkClick}>Wir über uns</NavLink></li>
                        <li className="py-2 w-full text-center uppercase"><NavLink to="/machen-sie-mit" onClick={handleMobileLinkClick}>Machen Sie Mit</NavLink></li>
                        <li className="py-2 w-full text-center">
                            <div className="flex justify-center items-center">
                                <NavLink to="/angebote" className="font-semibold px-4 uppercase" onClick={handleMobileLinkClick}>
                                    Angebote & Veranstaltungen
                                </NavLink>
                                <button onClick={handleSubmenuToggle} className="p-2">
                                    <FaChevronDown className={`transition-transform duration-300 ${openSubmenu === 'angebote' ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                            <ul className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 w-full ${openSubmenu === 'angebote' ? 'max-h-96' : 'max-h-0'}`}>
                                <li className="pt-2 uppercase"><NavLink to="/sprachtreffen" className="block py-2 text-gray-600" onClick={handleMobileLinkClick}>Sprachtreffen</NavLink></li>
                                <li className="uppercase"><NavLink to="/buergertreff-unterwegs" className="block py-2 text-gray-600" onClick={handleMobileLinkClick}>Bürgertreff Unterwegs</NavLink></li>
                                <li className="uppercase"><NavLink to="/nachbarschaftsboerse" className="block py-2 text-gray-600" onClick={handleMobileLinkClick}>Nachbarschaftsbörse</NavLink></li>
                                <li className="uppercase"><NavLink to="/ideenboerse" className="block py-2 text-gray-600" onClick={handleMobileLinkClick}>Ideenbörse</NavLink></li>
                            </ul>
                        </li>
                        <li className="py-2 w-full text-center uppercase"><NavLink to="/sponsorlar" onClick={handleMobileLinkClick}>Sponsoren</NavLink></li>
                        <li className="py-2 w-full text-center uppercase"><NavLink to="/presse" onClick={handleMobileLinkClick}>Presse</NavLink></li>
                        <li className="py-2 w-full text-center uppercase"><NavLink to="/kontakt" onClick={handleMobileLinkClick}>Kontakt</NavLink></li>
                    </ul>
                </div>
            </header>
        </>
    );
};

export default Header;