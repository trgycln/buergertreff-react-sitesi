// src/components/Header.js
// DÜZELTME: Kayan yazı (Ticker) artık Supabase'den dinamik olarak çekiliyor.

import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Supabase istemcisini import et
import logoImage from '../assets/images/logo.jpg';
import { FaFacebookF, FaInstagram, FaTiktok, FaMastodon, FaChevronDown, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { dateToKey, expandRecurringEntries, getComparableEventDate, isEventInPast, mergeUpcomingEvents, parseLocalDate } from '../utils/calendarUtils';

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
        const fetchTickerEntries = async () => {
            const today = parseLocalDate(new Date());
            const horizon = new Date(today);
            horizon.setDate(horizon.getDate() + 30);

            const todayKey = dateToKey(today);
            const horizonKey = dateToKey(horizon);

            const [recurringResponse, singleResponse, ereignisseResponse] = await Promise.all([
                supabase
                    .from('calendar_recurring_entries')
                    .select('*')
                    .eq('is_public', true)
                    .eq('is_active', true)
                    .gte('end_date', todayKey)
                    .lte('start_date', horizonKey),
                supabase
                    .from('calendar_single_entries')
                    .select('*')
                    .eq('is_public', true)
                    .eq('is_active', true)
                    .gte('entry_date', todayKey)
                    .lte('entry_date', horizonKey),
                supabase
                    .from('ereignisse')
                    .select('id, title, category, location, event_date, end_time, is_big_event')
                    .eq('is_public', true)
                    .order('event_date', { ascending: true }),
            ]);

            if (recurringResponse.error || singleResponse.error) {
                console.error("Fehler beim Laden der Ticker-Ankündigungen:", recurringResponse.error || singleResponse.error);
                return;
            }

            const now = new Date();

            const ereignisseOccurrences = (ereignisseResponse.data || [])
                .filter((e) => {
                    if (!e.event_date) return true;
                    return !isEventInPast(e.event_date, now);
                })
                .map((e) => {
                    const eventDate = getComparableEventDate(e.event_date);
                    return {
                        dateKey: eventDate ? dateToKey(eventDate) : null,
                        title: e.title,
                        category: e.category,
                        location: e.location,
                        startTime: eventDate ? String(eventDate.toTimeString()).slice(0, 5) : null,
                        endTime: e.end_time ? String(e.end_time).slice(0, 5) : null,
                        sortKey: eventDate ? eventDate.getTime() : Number.MAX_SAFE_INTEGER,
                        isPriority: true,
                        isBigEvent: e.is_big_event || false,
                    };
                });

            const recurringOccurrences = expandRecurringEntries(recurringResponse.data || [], today, horizon).map((entry) => ({
                dateKey: entry.dateKey,
                title: entry.title,
                category: entry.category,
                location: entry.location,
                startTime: entry.startTime,
                sortKey: parseLocalDate(entry.dateKey)?.getTime() || Number.MAX_SAFE_INTEGER,
                isPriority: false,
            }));

            const singleOccurrences = (singleResponse.data || []).map((entry) => ({
                dateKey: entry.entry_date,
                title: entry.title,
                category: entry.category,
                location: entry.location,
                startTime: entry.start_time,
                sortKey: parseLocalDate(entry.entry_date)?.getTime() || Number.MAX_SAFE_INTEGER,
                isPriority: false,
            }));

            const sortByDateKey = (a, b) => {
                const aKey = a.dateKey || '';
                const bKey = b.dateKey || '';
                if (aKey !== bKey) return aKey.localeCompare(bKey);
                const leftTime = a.startTime ? String(a.startTime).slice(0, 5) : '99:99';
                const rightTime = b.startTime ? String(b.startTime).slice(0, 5) : '99:99';
                if (leftTime !== rightTime) return leftTime.localeCompare(rightTime);
                return String(a.title || '').localeCompare(String(b.title || ''), 'de');
            };

            const allMerged = mergeUpcomingEvents([...ereignisseOccurrences, ...recurringOccurrences, ...singleOccurrences]);

            const priorityItems = allMerged.filter((e) => e.isPriority).sort(sortByDateKey);
            const calendarItems = allMerged.filter((e) => !e.isPriority).sort(sortByDateKey);
            const remainingSlots = Math.max(0, 5 - priorityItems.length);
            // Büyük etkinlikler her zaman en başa alınır
            const bigEvents = priorityItems.filter((e) => e.isBigEvent);
            const normalPriority = priorityItems.filter((e) => !e.isBigEvent);
            const combined = [...bigEvents, ...normalPriority, ...calendarItems.slice(0, remainingSlots)];

            const formattedAnnouncements = combined.map((entry) => {
                const date = formatTickerDate(entry.dateKey);
                const startTime = entry.startTime ? String(entry.startTime).slice(0, 5) : null;
                const endTime = entry.endTime ? String(entry.endTime).slice(0, 5) : null;
                let timeText = null;
                if (startTime && endTime) {
                    timeText = `${startTime}–${endTime} Uhr`;
                } else if (startTime) {
                    timeText = `${startTime} Uhr`;
                }
                let text = `${date}: ${entry.title}`;
                if (timeText) {
                    text += ` (${timeText})`;
                }
                if (entry.location) {
                    text += ` – ${entry.location}`;
                }
                return { text, isBig: entry.isBigEvent || false };
            });

            setAnnouncements(formattedAnnouncements);
        };

        fetchTickerEntries();
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
    const staticTickerMessage = [];

    // Sadece Start sayfasında özel mesajı göster
    const isStartPage = window.location.pathname === "/";
    const tickerItems = announcements.length > 0 ? announcements : (isStartPage ? staticTickerMessage : []);

    return (
        <>
            {/* Kayan yazı bandı (Her sayfada admin tarafından girilen duyurular) */}
            <AnnouncementTicker items={tickerItems} />
            
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
                                        <li><NavLink to="/sprachtreffen" className="block px-4 py-2 text-gray-700 hover:bg-rcLightBlue">Offener Treff</NavLink></li>
                                        <li><NavLink to="/terminkalender" className="block px-4 py-2 text-gray-700 hover:bg-rcLightBlue">Terminkalender</NavLink></li>
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
                                <li className="pt-2 uppercase"><NavLink to="/sprachtreffen" className="block py-2 text-gray-600" onClick={handleMobileLinkClick}>Offener Treff</NavLink></li>
                                <li className="uppercase"><NavLink to="/terminkalender" className="block py-2 text-gray-600" onClick={handleMobileLinkClick}>Terminkalender</NavLink></li>
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