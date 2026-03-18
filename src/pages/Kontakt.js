// src/pages/Kontakt.js
import React, { useEffect, useState } from 'react';
import PageBanner from '../components/PageBanner';
import ContributionNotice from '../components/ContributionNotice';
import { supabase } from '../supabaseClient';
// Gerekli tüm ikonları tek bir yerden import ediyoruz
import { FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

import kontaktBannerImage from '../assets/images/kontakt-banner.png';
import { Helmet } from 'react-helmet-async';

const HEADER_SOCIAL_LINKS = {
    facebook: 'https://www.facebook.com/profile.php?id=61585385846803',
    youtube: 'https://www.youtube.com/@buergertreff-wissen',
    instagram: 'https://www.instagram.com/buergertreff.wissen/',
};

const IMPRESSUM_SETTING_KEYS = [
  'org_name',
  'org_address',
  'org_postal_code',
  'org_city',
  'org_phone',
  'org_email',
  'org_website',
  'org_facebook',
  'org_instagram',
  'org_twitter',
  'org_tax_id',
  'exemption_date',
  'exemption_office',
  'treasurer_name',
  'org_purpose',
];

const DEFAULT_IMPRESSUM = {
  org_name: 'Bürgertreff Wissen e.V.',
  org_address: 'Marktstr. 8',
  org_postal_code: '57537',
  org_city: 'Wissen',
  org_phone: '0163 6999513',
  org_email: 'buergertreff.wissen@gmail.com',
  org_website: 'www.buergertreff-wissen.de',
    org_facebook: HEADER_SOCIAL_LINKS.facebook,
    org_instagram: HEADER_SOCIAL_LINKS.instagram,
  org_twitter: '',
  org_tax_id: '',
  exemption_date: '',
  exemption_office: '',
  treasurer_name: 'Erika Uber',
  org_purpose: '',
};

const Kontakt = () => {
    const [impressumData, setImpressumData] = useState(DEFAULT_IMPRESSUM);
    const mapSrc = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2598.8647!2d7.7329841!3d50.7820911!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47bea2ee081cae1f%3A0xf18edd7f856004fa!2sMarktstra%C3%9Fe%208%2C%2057537%20Wissen!5e0!3m2!1sde!2sde!4v1740999999999";

    useEffect(() => {
        const loadImpressumSettings = async () => {
            const { data, error } = await supabase
                .from('site_settings')
                .select('key, value')
                .in('key', IMPRESSUM_SETTING_KEYS);

            if (error || !data) {
                return;
            }

            const loaded = { ...DEFAULT_IMPRESSUM };
            data.forEach(({ key, value }) => {
                if (typeof value === 'string') {
                    const trimmed = value.trim();
                    if (trimmed) {
                        loaded[key] = trimmed;
                    }
                    return;
                }

                if (value !== null && value !== undefined) {
                    loaded[key] = value;
                }
            });

            setImpressumData(loaded);
        };

        loadImpressumSettings();
    }, []);

    const websiteHref = impressumData.org_website
        ? (impressumData.org_website.startsWith('http://') || impressumData.org_website.startsWith('https://')
            ? impressumData.org_website
            : `https://${impressumData.org_website}`)
        : '';

    const formattedExemptionDate = impressumData.exemption_date
        ? new Date(impressumData.exemption_date).toLocaleDateString('de-DE')
        : '';

    const facebookLink = impressumData.org_facebook || HEADER_SOCIAL_LINKS.facebook;
    const instagramLink = impressumData.org_instagram || HEADER_SOCIAL_LINKS.instagram;
    const twitterLink = impressumData.org_twitter || '';

    return (

<>
<Helmet>
    <title>Kontakt & Anfahrt | Bürgertreff Wissen e.V.</title>
    <meta 
        name="description" 
        content="Kontaktieren Sie den Bürgertreff Wissen e.V. Finden Sie unsere Adresse, Telefonnummer und E-Mail für Anfragen, Unterstützung oder allgemeine Informationen in Wissen/Sieg."
    />
</Helmet>

        <div>
            <PageBanner title="Kontakt & Impressum" imageUrl={kontaktBannerImage} />

            <main className="py-12 md:py-20 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* --- SOL SÜTUN: İLETİŞİM BİLGİLERİ --- */}
                        <div className="space-y-10"> {/* Bölümler arasına boşluk koymak için */}
                            
                            {/* İletişim Detayları */}
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-6">Nehmen Sie Kontakt auf</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <FaMapMarkerAlt className="text-red-600 text-xl mr-4 mt-1" />
                                        <div>
                                            <h3 className="font-semibold text-gray-700">Anschrift</h3>
                                            <p className="text-gray-600">
                                                Bürgertreff Wissen e.V.<br />
                                                Marktstr. 8<br />
                                                57537 Wissen
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <FaPhone className="text-red-600 text-xl mr-4 mt-1" />
                                        <div>
                                            <h3 className="font-semibold text-gray-700">Telefon</h3>
                                            <p className="text-gray-600"><a href="tel:+4916369995513" className="hover:text-red-600 transition">0163 6999513</a></p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <FaEnvelope className="text-red-600 text-xl mr-4 mt-1" />
                                        <div>
                                            <h3 className="font-semibold text-gray-700">E-Mail</h3>
                                            <a href="mailto:buergertreff.wissen@gmail.com" className="text-red-600 hover:underline">
                                                buergertreff.wissen@gmail.com
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Sosyal Medya Bölümü */}
                           

                            {/* Harita Bölümü */}
                            <div>
                                <div className="flex items-center mb-4">
                                    <FaMapMarkerAlt className="text-red-600 text-xl mr-3" />
                                    <h3 className="font-semibold text-gray-700">Standort</h3>
                                </div>
                                <div className="bg-white p-2 rounded-lg shadow-md">
                                    <iframe
                                        src={mapSrc}
                                        title="Bürgertreff Wissen Standort"
                                        className="w-full h-80"
                                        style={{ border: 0 }}
                                        allowFullScreen=""
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    ></iframe>
                                </div>
                            </div>

                        </div>

                        {/* --- SAĞ SÜTUN: KÜNYE (IMPRESSUM) --- */}
                        <div className="bg-white p-8 rounded-lg shadow-md">
                            <h2 className="text-3xl font-bold text-gray-800 mb-6">Impressum</h2>
                            <div className="text-gray-600 space-y-4">
                                <h3 className="font-semibold text-gray-700">Verein</h3>
                                <p>
                                    {impressumData.org_name || '—'}
                                    <br />
                                    {impressumData.org_address || '—'}
                                    <br />
                                    {(impressumData.org_postal_code || '')} {(impressumData.org_city || '')}
                                </p>

                                <h3 className="font-semibold text-gray-700">Kontakt</h3>
                                <p>
                                    Telefon:{' '}
                                    {impressumData.org_phone ? (
                                        <a href={`tel:${impressumData.org_phone.replace(/\s+/g, '')}`} className="text-red-600 hover:underline">
                                            {impressumData.org_phone}
                                        </a>
                                    ) : '—'}
                                    <br />
                                    E-Mail:{' '}
                                    {impressumData.org_email ? (
                                        <a href={`mailto:${impressumData.org_email}`} className="text-red-600 hover:underline">
                                            {impressumData.org_email}
                                        </a>
                                    ) : '—'}
                                    <br />
                                    Website:{' '}
                                    {websiteHref ? (
                                        <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                                            {impressumData.org_website}
                                        </a>
                                    ) : '—'}
                                </p>

                                <h3 className="font-semibold text-gray-700">Steuerliche Angaben</h3>
                                <p>
                                    Steuernummer: {impressumData.org_tax_id || '—'}
                                    <br />
                                    Finanzamt: {impressumData.exemption_office || '—'}
                                    <br />
                                    Freistellungsbescheid vom: {formattedExemptionDate || '—'}
                                </p>

                                <h3 className="font-semibold text-gray-700">Verantwortliche Person</h3>
                                <p>
                                    1. Erika Uber
                                    <br />
                                    2. Turgay Celen
                                </p>

                                <h3 className="font-semibold text-gray-700">Vereinszweck</h3>
                                <p>{impressumData.org_purpose || '—'}</p>

                                <h3 className="font-semibold text-gray-700">Social Media</h3>
                                <p>
                                    Facebook:{' '}
                                    {facebookLink ? (
                                        <a href={facebookLink} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                                            facebook.com/profile.php?id=61585385846803
                                        </a>
                                    ) : '—'}
                                    <br />
                                    YouTube:{' '}
                                    <a href={HEADER_SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                                        youtube.com/@buergertreff-wissen
                                    </a>
                                    <br />
                                    Instagram:{' '}
                                    {instagramLink ? (
                                        <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                                            instagram.com/buergertreff.wissen
                                        </a>
                                    ) : '—'}
                                    <br />
                                    X/Twitter:{' '}
                                    {twitterLink ? (
                                        <a href={twitterLink} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">
                                            x.com
                                        </a>
                                    ) : '—'}
                                </p>

                                <h3 className="font-semibold text-gray-700 mt-6">Bankverbindung</h3>
                                <p>IBAN: DE27 5735 1030 0055 0844 38<br/>Bank: Sparkasse Westerwald-Sieg<br/>Kontoinhaber: Bürgertreff Wissen e.V.</p>
                                <ContributionNotice compact className="max-w-md" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
</>
    );
};

export default Kontakt;