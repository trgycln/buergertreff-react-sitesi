// src/components/Header.js
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logoImage from '../assets/images/logo.jpg';
import { FaFacebookF, FaInstagram, FaChevronDown, FaWhatsapp } from 'react-icons/fa';

const Header = () => {
    // Modern, rahat ve şık menü butonu stilleri (Soft pill / aktif highlight)
    const navLinkStyles = ({ isActive }) => {
        return `text-[15px] font-semibold tracking-normal px-3.5 py-2 rounded-xl transition-all duration-200 whitespace-nowrap inline-flex items-center ${
            isActive
                ? 'text-rcBlue bg-blue-50/90 font-bold shadow-sm'
                : 'text-gray-700 hover:text-rcBlue hover:bg-gray-100/70'
        }`;
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState(null);

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

    return (
        <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50 transition-all">
            {/* Üst İnce Bilgi & Sosyal Medya Çubuğu */}
            <div className="bg-rcBlue text-gray-300 py-1.5">
                <div className="container mx-auto flex justify-center lg:justify-between items-center px-4 md:px-6">
                    <div className="hidden lg:block">
                        <p className="font-dancing text-xl text-white tracking-wide">"Miteinander füreinander"</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="https://chat.whatsapp.com/FqBNBrOmcnL7CTXPL9yRnm" target="_blank" rel="noopener noreferrer" title="WhatsApp Gruppe" className="hover:text-green-400 transform hover:scale-110 transition-all flex items-center text-green-400"><FaWhatsapp size={17} /></a>
                        <a href="https://www.facebook.com/profile.php?id=61585385846803" target="_blank" rel="noopener noreferrer" title="Facebook" className="hover:text-white transform hover:scale-110 transition-all"><FaFacebookF size={15} /></a>
                        <a href="https://www.instagram.com/buergertreff.wissen/" target="_blank" rel="noopener noreferrer" title="Instagram" className="hover:text-white transform hover:scale-110 transition-all"><FaInstagram size={16} /></a>
                    </div>
                </div>
            </div>
            
            {/* Ana Menü Çubuğu */}
            <div className="container mx-auto flex justify-between items-center px-4 md:px-6 py-3.5">
                {/* Logo & Başlık */}
                <div className="logo-container">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src={logoImage} alt="Bürgertreff Wissen Logo" className="h-11 md:h-14 object-contain rounded-full shadow-sm group-hover:scale-105 transition-transform duration-300" />
                        <span className="text-xl sm:text-2xl md:text-[26px] font-sans font-bold text-rcBlue tracking-tight group-hover:text-rcRed transition-colors">
                            Bürgertreff Wissen
                        </span>
                    </Link>
                </div>

                {/* Masaüstü Menü Linkleri */}
                <nav>
                    <ul className="hidden md:flex items-center gap-1.5 lg:gap-2">
                        <li><NavLink to="/" className={navLinkStyles}>Start</NavLink></li>
                        <li><NavLink to="/wir-uber-uns" className={navLinkStyles}>Wir über uns</NavLink></li>
                        
                        {/* Angebote Dropdown */}
                        <li 
                            className="relative"
                            onMouseEnter={() => setIsDropdownOpen(true)}
                            onMouseLeave={() => setIsDropdownOpen(false)}
                        >
                            <NavLink to="/angebote" className={navLinkStyles}>
                                <span>Angebote</span>
                                <FaChevronDown className={`ml-1.5 h-3 w-3 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-rcBlue' : ''}`} />
                            </NavLink>
                            {isDropdownOpen && (
                                <div className="absolute left-0 mt-1 w-64 bg-white/95 backdrop-blur-md shadow-xl rounded-2xl p-2 border border-gray-100 z-50 animate-slide-up-fade">
                                    <Link to="/nachbarschaftsboerse" className="block px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:text-rcBlue hover:bg-blue-50/70 rounded-xl transition-all">
                                        Nachbarschaftsbörse
                                    </Link>
                                    <Link to="/sprachtreffen" className="block px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:text-rcBlue hover:bg-blue-50/70 rounded-xl transition-all">
                                        Sprachtreffen
                                    </Link>
                                    <Link to="/ideenboerse" className="block px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:text-rcBlue hover:bg-blue-50/70 rounded-xl transition-all">
                                        Ideenbörse
                                    </Link>
                                    <Link to="/buergertreff-unterwegs" className="block px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:text-rcBlue hover:bg-blue-50/70 rounded-xl transition-all">
                                        Bürgertreff Unterwegs
                                    </Link>
                                </div>
                            )}
                        </li>
                        
                        <li><NavLink to="/terminkalender" className={navLinkStyles}>Terminkalender</NavLink></li>
                        <li><NavLink to="/presse" className={navLinkStyles}>Presse</NavLink></li>
                        <li><NavLink to="/sponsoren" className={navLinkStyles}>Sponsoren</NavLink></li>
                        <li><NavLink to="/kontakt" className={navLinkStyles}>Kontakt</NavLink></li>
                    </ul>

                    {/* Mobil Menü Açma Butonu */}
                    <div className="md:hidden">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                            className="text-gray-700 hover:text-rcBlue focus:outline-none p-2 rounded-xl hover:bg-gray-100 transition-colors"
                            aria-label="Menü öffnen"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16m-7 6h7"></path>
                            </svg>
                        </button>
                    </div>
                </nav>
            </div>
            
            {/* Mobil Açılır Menü */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-xl px-4 py-3 space-y-1.5 animate-slide-up-fade">
                    <NavLink to="/" onClick={handleMobileLinkClick} className="block py-2.5 px-3 text-gray-800 font-semibold rounded-xl hover:bg-blue-50 hover:text-rcBlue transition-colors">Start</NavLink>
                    <NavLink to="/wir-uber-uns" onClick={handleMobileLinkClick} className="block py-2.5 px-3 text-gray-800 font-semibold rounded-xl hover:bg-blue-50 hover:text-rcBlue transition-colors">Wir über uns</NavLink>
                    <div>
                        <div className="flex justify-between items-center py-2.5 px-3 text-gray-800 font-semibold rounded-xl hover:bg-gray-50 cursor-pointer transition-colors" onClick={handleSubmenuToggle}>
                            <Link to="/angebote" onClick={handleMobileLinkClick}>Angebote</Link>
                            <FaChevronDown className={`transform transition-transform text-gray-400 ${openSubmenu === 'angebote' ? 'rotate-180 text-rcBlue' : ''}`} />
                        </div>
                        {openSubmenu === 'angebote' && (
                            <div className="pl-4 py-1.5 space-y-1 bg-gray-50/80 rounded-xl my-1 border border-gray-100">
                                <Link to="/nachbarschaftsboerse" onClick={handleMobileLinkClick} className="block py-2 px-3 text-sm font-medium text-gray-700 hover:text-rcBlue">Nachbarschaftsbörse</Link>
                                <Link to="/sprachtreffen" onClick={handleMobileLinkClick} className="block py-2 px-3 text-sm font-medium text-gray-700 hover:text-rcBlue">Sprachtreffen</Link>
                                <Link to="/ideenboerse" onClick={handleMobileLinkClick} className="block py-2 px-3 text-sm font-medium text-gray-700 hover:text-rcBlue">Ideenbörse</Link>
                                <Link to="/buergertreff-unterwegs" onClick={handleMobileLinkClick} className="block py-2 px-3 text-sm font-medium text-gray-700 hover:text-rcBlue">Bürgertreff Unterwegs</Link>
                            </div>
                        )}
                    </div>
                    <NavLink to="/terminkalender" onClick={handleMobileLinkClick} className="block py-2.5 px-3 text-gray-800 font-semibold rounded-xl hover:bg-blue-50 hover:text-rcBlue transition-colors">Terminkalender</NavLink>
                    <NavLink to="/presse" onClick={handleMobileLinkClick} className="block py-2.5 px-3 text-gray-800 font-semibold rounded-xl hover:bg-blue-50 hover:text-rcBlue transition-colors">Presse</NavLink>
                    <NavLink to="/sponsoren" onClick={handleMobileLinkClick} className="block py-2.5 px-3 text-gray-800 font-semibold rounded-xl hover:bg-blue-50 hover:text-rcBlue transition-colors">Sponsoren</NavLink>
                    <NavLink to="/kontakt" onClick={handleMobileLinkClick} className="block py-2.5 px-3 text-gray-800 font-semibold rounded-xl hover:bg-blue-50 hover:text-rcBlue transition-colors">Kontakt</NavLink>
                </div>
            )}
        </header>
    );
};

export default Header;