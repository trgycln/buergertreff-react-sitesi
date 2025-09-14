// src/components/Header.js
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import logoImage from '../assets/images/logo.jpg';

import { FaFacebookF, FaInstagram, FaTiktok, FaMastodon, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { MdGroups } from 'react-icons/md';

const Header = () => {
    const navLinkStyles = ({ isActive }) => {
        return `uppercase font-semibold tracking-wider pb-2 border-b-4 transition-colors duration-300 ${isActive ? 'border-rcRed text-rcBlue' : 'border-transparent text-rcDarkGray hover:border-red-200'}`;
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            {/* --- TOP BAR (SOSYAL MEDYA) --- */}
            <div className="bg-rcBlue text-gray-300 py-2">
                <div className="container mx-auto flex justify-end items-center">
                    <div className="flex items-center gap-5">
                        <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaFacebookF size={15} /></a>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaInstagram size={15} /></a>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaTiktok size={15} /></a>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaXTwitter size={15} /></a>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaMastodon size={15} /></a>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><FaWhatsapp size={15} /></a>
                        <a href="/" target="_blank" rel="noopener noreferrer" className="hover:text-white transform hover:-translate-y-1 transition-all"><MdGroups size={15} /></a>
                    </div>
                </div>
            </div>
            
            {/* --- ANA HEADER (LOGO VE NAVİGASYON) --- */}
            <div className="container mx-auto flex justify-between items-center p-4">
                <div className="logo-container">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logoImage} alt="Bürgertreff Wissen Logo" className="h-12 md:h-16" />
                        <span className="text-lg md:text-xl font-bold text-rcBlue">Bürgertreff Wissen</span>
                    </Link>
                </div>

                <nav>
                    <ul className="hidden lg:flex items-center space-x-8">
                        <li><NavLink to="/" className={navLinkStyles}>Start</NavLink></li>
                        <li><NavLink to="/wir-uber-uns" className={navLinkStyles}>Wir über uns</NavLink></li>
                        <li><NavLink to="/machen-sie-mit" className={navLinkStyles}>Machen Sie Mit</NavLink></li>
                        <li className="relative" onMouseEnter={() => setIsDropdownOpen(true)} onMouseLeave={() => setIsDropdownOpen(false)}>
                            <NavLink to="/angebote-und-veranstaltungen" className={navLinkStyles}>Angebote<b className='text-red-700'>&</b>Veranstaltungen </NavLink>
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
                    <button className="lg:hidden text-rcBlue" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0_0_24_24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4_6h16M4_12h16m-7_6h7"></path></svg>
                    </button>
                </div>
            </div>

            {/* --- MOBİL MENÜ --- */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white shadow-md">
                    <ul className="flex flex-col items-center py-4">
                        <li className="py-2"><NavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>Start</NavLink></li>
                        <li className="py-2"><NavLink to="/wir-uber-uns" onClick={() => setIsMobileMenuOpen(false)}>Wir über uns</NavLink></li>
                        <li className="py-2"><NavLink to="/machen-sie-mit" onClick={() => setIsMobileMenuOpen(false)}>Machen Sie Mit</NavLink></li>
                        <li className="py-2"><NavLink to="/angebote-und-veranstaltungen" onClick={() => setIsMobileMenuOpen(false)}>Angebote</NavLink></li>
                        <li className="py-2"><NavLink to="/presse-uber-uns" onClick={() => setIsMobileMenuOpen(false)}>Presse</NavLink></li>
                        <li className="py-2"><NavLink to="/kontakt" onClick={() => setIsMobileMenuOpen(false)}>Kontakt</NavLink></li>
                    </ul>
                </div>
            )}
        </header>
    );
};

export default Header;