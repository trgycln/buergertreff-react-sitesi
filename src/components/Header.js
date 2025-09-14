// src/components/Header.js
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logoImage from '../assets/images/logo.jpg'; // Sizin .jpg uzantınız korundu

// Gerekli tüm ikonlar
import { FaFacebookF, FaInstagram, FaTiktok, FaMastodon, FaWhatsapp, FaChevronDown, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { MdGroups } from 'react-icons/md';

const Header = () => {
    const navLinkStyles = ({ isActive }) => {
        return `uppercase font-semibold tracking-wider pb-2 border-b-4 transition-colors duration-300 ${isActive ? 'border-rcRed text-rcBlue' : 'border-transparent text-rcDarkGray hover:border-red-200'}`;
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState(null);

    // Alt menüyü açıp kapatan fonksiyon
    const toggleSubmenu = (menuName) => {
        setOpenSubmenu(openSubmenu === menuName ? null : menuName);
    };

    // Mobil menüdeki bir linke tıklandığında ana menüyü kapatır
    const handleMobileLinkClick = () => {
        setIsMobileMenuOpen(false);
    };
    
    // Sadece oku tıklayınca alt menüyü açar/kapatır
    const handleSubmenuToggle = (e) => {
        e.stopPropagation(); // Olayın diğer elementlere yayılmasını engeller
        toggleSubmenu('angebote');
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">

            {/* --- TOP BAR (SOSYAL MEDYA) --- */}
{/* --- GÜNCELLENMİŞ TOP BAR --- */}
            <div className="bg-rcBlue text-gray-300 py-2">
                <div className="container mx-auto flex justify-center lg:justify-between items-center">
                    {/* YENİ: Sol Taraf - Motto (Mobilde gizli) */}
                    <div className="hidden lg:block">
                        <p className="font-dancing text-xl text-white">"Miteinander füreinander"</p>
                    </div>

                    {/* Sağ Taraf - Sosyal Medya İkonları */}
                    <div className="flex items-center gap-5">
                        {/* ... (ikonlarınızın olduğu kod - dokunulmadı) ... */}
                        <a href="https://www.youtube.com/@buergertreff-wissen" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all">
                            <FaYoutube size={16} />
                        </a>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaFacebookF size={16} /></a>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaInstagram size={16} /></a>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaTiktok size={16} /></a>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaXTwitter size={16} /></a>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaMastodon size={16} /></a>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaWhatsapp size={16} /></a>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><MdGroups size={16} /></a>
                    </div>
                </div>
            </div>            
            {/* --- ANA HEADER (LOGO VE NAVİGASYON) --- */}
            <div className="container mx-auto flex justify-between items-center p-4">
                <div className="logo-container">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logoImage} alt="Bürgertreff Wissen Logo" className="h-12 md:h-16" />
                        <span className="text-3xl md:text-4xl font-fraktur text-rcBlue">Bürgertreff Wissen</span>
                    </Link>
                </div>

                <nav>
                    <ul className="hidden lg:flex items-center space-x-8">
                        <li><NavLink to="/" className={navLinkStyles}>Start</NavLink></li>
                        <li><NavLink to="/wir-uber-uns" className={navLinkStyles}>Wir über uns</NavLink></li>
                        <li><NavLink to="/machen-sie-mit" className={navLinkStyles}>Machen Sie Mit</NavLink></li>
                        <li className="relative" onMouseEnter={() => setIsDropdownOpen(true)} onMouseLeave={() => setIsDropdownOpen(false)}>
                            <NavLink to="/angebote-und-veranstaltungen" className={navLinkStyles}>Angebote<b className='text-rcRed'>&</b>Veranstaltungen </NavLink>
                            {isDropdownOpen && (
                                <ul className="absolute left-0 top-full pt-2 w-56 bg-white shadow-lg rounded-md py-1">
                                    <li><NavLink to="/angebote-und-veranstaltungen/sprachtreffen" className="block px-4 py-2 text-gray-700 hover:bg-rcLightBlue">Sprachtreffen</NavLink></li>
                                    <li><NavLink to="/angebote-und-veranstaltungen/buergertreff-unterwegs" className="block px-4 py-2 text-gray-700 hover:bg-rcLightBlue">Bürgertreff Unterwegs</NavLink></li>
                                    <li><NavLink to="/angebote-und-veranstaltungen/nachbarschaftsboerse" className="block px-4 py-2 text-gray-700 hover:bg-rcLightBlue">Nachbarschaftsbörse</NavLink></li>
                                    <li><NavLink to="/angebote-und-veranstaltungen/ideenboerse" className="block px-4 py-2 text-gray-700 hover:bg-rcLightBlue">Ideenbörse</NavLink></li>
                                </ul>
                            )}
                        </li>
                        <li><NavLink to="/presse-uber-uns" className={navLinkStyles}>Presse</NavLink></li>
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

            {/* --- GELİŞTİRİLMİŞ ANİMASYONLU MOBİL MENÜ --- */}
            <div className={`lg:hidden bg-white shadow-lg absolute w-full transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'transform translate-x-0' : 'transform -translate-x-full'}`}>
                <ul className="flex flex-col items-center py-4">
                    <li className="py-2 w-full text-center"><NavLink to="/" onClick={handleMobileLinkClick}>Start</NavLink></li>
                    <li className="py-2 w-full text-center"><NavLink to="/wir-uber-uns" onClick={handleMobileLinkClick}>Wir über uns</NavLink></li>
                    <li className="py-2 w-full text-center"><NavLink to="/machen-sie-mit" onClick={handleMobileLinkClick}>Machen Sie Mit</NavLink></li>
                    <li className="py-2 w-full text-center">
                        <div className="flex justify-center items-center">
                            <NavLink to="/angebote-und-veranstaltungen" className="font-semibold px-4" onClick={handleMobileLinkClick}>
                                Angebote & Veranstaltungen
                            </NavLink>
                            <button onClick={handleSubmenuToggle} className="p-2">
                                <FaChevronDown className={`transition-transform duration-300 ${openSubmenu === 'angebote' ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                        <ul className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 w-full ${openSubmenu === 'angebote' ? 'max-h-96' : 'max-h-0'}`}>
                            <li className="pt-2"><NavLink to="/angebote-und-veranstaltungen/sprachtreffen" className="block py-2 text-gray-600" onClick={handleMobileLinkClick}>Sprachtreffen</NavLink></li>
                            <li><NavLink to="/angebote-und-veranstaltungen/buergertreff-unterwegs" className="block py-2 text-gray-600" onClick={handleMobileLinkClick}>Bürgertreff Unterwegs</NavLink></li>
                            <li><NavLink to="/angebote-und-veranstaltungen/nachbarschaftsboerse" className="block py-2 text-gray-600" onClick={handleMobileLinkClick}>Nachbarschaftsbörse</NavLink></li>
                            <li><NavLink to="/angebote-und-veranstaltungen/ideenboerse" className="block py-2 text-gray-600" onClick={handleMobileLinkClick}>Ideenbörse</NavLink></li>
                        </ul>
                    </li>
                    <li className="py-2 w-full text-center"><NavLink to="/presse-uber-uns" onClick={handleMobileLinkClick}>Presse</NavLink></li>
                    <li className="py-2 w-full text-center"><NavLink to="/kontakt" onClick={handleMobileLinkClick}>Kontakt</NavLink></li>
                </ul>
            </div>
        </header>
    );
};

export default Header;