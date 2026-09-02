// src/pages/Sponsorlar.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBuilding, 
  FaExternalLinkAlt, 
  FaInfoCircle, 
  FaHandHoldingHeart, 
  FaAward
} from 'react-icons/fa';

import PageBanner from '../components/PageBanner';
import sponsorBanner from '../assets/images/sponsorenbanner.png';
import { supabase } from '../supabaseClient';
import { fetchMergedSponsors } from '../utils/sponsorUtils';
import { Helmet } from 'react-helmet-async';

// Tutar aralıklarına göre kademe ve rozet belirleyici (Tutarlar sayfada asla yazılmaz!)
export const getDonorTier = (amount) => {
  const val = parseFloat(amount) || 0;
  if (val >= 1000) return { name: 'Platin-Förderer', badgeIcon: '💎' };
  if (val >= 500) return { name: 'Gold-Förderer', badgeIcon: '🥇' };
  if (val >= 200) return { name: 'Silber-Förderer', badgeIcon: '🥈' };
  return { name: 'Bronze-Förderer', badgeIcon: '🥉' };
};

// Başlangıç / Yedek Veri (100 € ve üzeri 17 bağışçı)
const INITIAL_INSTITUTIONS = [
  { id: 'inst-1', name: 'Rotary-Hilfwerk RC Westerwald e.V.', category: 'institution', website_url: 'https://westerwald.rotary.de/', logo_url: '', totalAmount: 2500 },
  { id: 'inst-2', name: 'Sparkasse Westerwald-Sieg', category: 'institution', website_url: 'https://www.sk-westerwald-sieg.de/', logo_url: '', totalAmount: 1000 },
  { id: 'inst-3', name: 'Deutsche Stiftung für Engagement und Ehrenamt (DSEE)', category: 'institution', website_url: 'https://www.deutsche-stiftung-engagement-und-ehrenamt.de/', logo_url: '', totalAmount: 600 },
  { id: 'inst-4', name: 'Westerwald Bank eG', category: 'institution', website_url: 'https://www.westerwaldbank.de/', logo_url: '', totalAmount: 500 },
  { id: 'inst-5', name: 'Kölschbach Haustechnik GmbH', category: 'institution', website_url: 'https://www.koelschbach.de/', logo_url: '', totalAmount: 100 },
  { id: 'inst-6', name: 'Verbandsgemeinde Wissen', category: 'institution', website_url: 'https://www.rathaus-wissen.de/', logo_url: '', totalAmount: 100 },
];

const INITIAL_PERSONS = [
  { id: 'p-1', name: 'Peter Schmallenbach', category: 'person', totalAmount: 600 },
  { id: 'p-2', name: 'Armin Uber', category: 'person', totalAmount: 500 },
  { id: 'p-3', name: 'Elke Lapp', category: 'person', totalAmount: 250 },
  { id: 'p-4', name: 'Helga Nellen', category: 'person', totalAmount: 220 },
  { id: 'p-5', name: 'Rose Falkenroth', category: 'person', totalAmount: 200 },
  { id: 'p-6', name: 'Carmen Hellinghausen', category: 'person', totalAmount: 100 },
  { id: 'p-7', name: 'Dirk und Gisela Lotz', category: 'person', totalAmount: 100 },
  { id: 'p-8', name: 'Elke Bleeser', category: 'person', totalAmount: 100 },
  { id: 'p-9', name: 'Thomas Schäfer', category: 'person', totalAmount: 100 },
  { id: 'p-10', name: 'Ulla Heling', category: 'person', totalAmount: 100 },
  { id: 'p-11', name: 'Mariya Willmeroth', category: 'person', totalAmount: 100 },
];

// Kurumsal Kart Bileşeni
const InstitutionCard = ({ name, logo_url, website_url, description, totalAmount }) => {
  const tier = getDonorTier(totalAmount);

  // Eğer website varsa, tüm yuvarlak çerçeve bir link olsun; yoksa div
  const CardWrapper = website_url ? 'a' : 'div';
  const wrapperProps = website_url
    ? {
        href: website_url,
        target: '_blank',
        rel: 'noopener noreferrer',
        title: `${name} Website besuchen`,
      }
    : {};

  return (
    <div className="flex flex-col items-center justify-start text-center group">
      {/* Tier Badge */}
      <div className="text-3xl drop-shadow-sm mb-3 transition-transform group-hover:scale-110" title={tier.name}>
        {tier.badgeIcon}
      </div>

      {/* Yuvarlak Çerçeveli Logo / Link Alanı */}
      <CardWrapper
        {...wrapperProps}
        className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center p-6 transition-all duration-300 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 relative"
      >
        {logo_url ? (
          <img
            src={logo_url}
            alt={name}
            className="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition-all"
          />
        ) : (
          <div className="flex flex-col items-center justify-center px-2">
            <FaBuilding className="text-rcBlue/30 text-4xl mb-2" />
            <span className="text-xs font-bold text-gray-400 leading-snug line-clamp-2">
              {name}
            </span>
          </div>
        )}
      </CardWrapper>

      {/* İsim ve Açıklama (Yuvarlağın altında) */}
      <h3 className="font-bold text-gray-800 text-sm md:text-base mt-5 px-2 group-hover:text-rcBlue transition-colors line-clamp-2">
        {name}
      </h3>
      {description && (
        <p className="text-xs text-gray-400 mt-1 px-2 line-clamp-2 max-w-[200px] mx-auto">{description}</p>
      )}
    </div>
  );
};

// Bireysel Bağışçı İsim Rozeti (Düzgün Liste Görünümü)
const PersonBadge = ({ name, totalAmount }) => {
  const tier = getDonorTier(totalAmount);

  return (
    <div 
      title={tier.name}
      className="flex items-center gap-4 py-3 px-5 bg-white rounded-xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-100 hover:-translate-y-0.5 group w-full"
    >
      <div className="text-2xl drop-shadow-sm flex-shrink-0 w-8 text-center transition-transform group-hover:scale-110">
        {tier.badgeIcon}
      </div>
      <span className="text-base font-medium text-gray-800 group-hover:text-rcBlue transition-colors truncate">
        {name}
      </span>
    </div>
  );
};

const Sponsorlar = () => {
  const [institutions, setInstitutions] = useState([]);
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const { institutions, persons } = await fetchMergedSponsors();
        
        if (institutions.length > 0 || persons.length > 0) {
          setInstitutions(institutions);
          setPersons(persons);
        } else {
          setInstitutions(INITIAL_INSTITUTIONS);
          setPersons(INITIAL_PERSONS);
        }
      } catch (err) {
        console.error('Sponsorlar yüklenirken hata:', err);
        setInstitutions(INITIAL_INSTITUTIONS);
        setPersons(INITIAL_PERSONS);
      } finally {
        setLoading(false);
      }
    };
    fetchSponsors();
  }, []);

  return (
    <>
      <Helmet>
        <title>Unsere Förderer & Unterstützer | Bürgertreff Wissen e.V.</title>
        <meta
          name="description"
          content="Ein herzliches Dankeschön an alle Unternehmen, Organisationen und privaten Förderer, die den Bürgertreff Wissen e.V. unterstützen."
        />
      </Helmet>

      <PageBanner
        title="Förderer & Unterstützer"
        imageUrl={sponsorBanner}
      />

      <div className="bg-gradient-to-b from-gray-50 via-white to-gray-50 py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Giriş & Teşekkür Başlığı */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-rcBlue mb-5 shadow-inner">
              <FaHandHoldingHeart className="text-3xl" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-rcDarkGray mb-4 tracking-tight">
              Gemeinsam für unsere Gemeinschaft
            </h1>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6">
              Die Angebote, Begegnungen und Hilfen des <strong className="text-rcDarkGray font-semibold">Bürgertreff Wissen e.V.</strong> werden maßgeblich durch ehrenamtliches Engagement und großzügige Zuwendungen ermöglicht. Wir danken allen Partnern, Unternehmen und privaten Förderern, die unsere Vereinsarbeit nachhaltig unterstützen.
            </p>

            {/* Kategori / Kademe Rozetleri Açıklama Çubuğu (Lejant) */}
            <div className="inline-flex flex-wrap items-center justify-center gap-3 md:gap-5 bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm text-xs text-gray-700">
              <span className="font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <FaAward className="text-gray-300" /> Förderstufen:
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700 font-bold">
                <span className="text-lg drop-shadow-sm">💎</span> Platin
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-600 font-bold">
                <span className="text-lg drop-shadow-sm">🥇</span> Gold
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-500 font-bold">
                <span className="text-lg drop-shadow-sm">🥈</span> Silber
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold">
                <span className="text-lg drop-shadow-sm">🥉</span> Bronze
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-rcBlue border-t-transparent"></div>
              <p className="text-gray-500 mt-2 text-sm">Förderer werden geladen...</p>
            </div>
          ) : (
            <>
              {/* BÖLÜM 1: Kurumsal Partnerler & Sponsoren */}
              {institutions.length > 0 && (
                <section className="mb-16">
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-200 pb-3">
                    <FaBuilding className="text-rcBlue text-xl" />
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-rcDarkGray">
                        Institutionelle Partner & Unternehmen
                      </h2>
                      <p className="text-xs md:text-sm text-gray-500">
                        Organisationen, Stiftungen und Unternehmen, die uns zur Seite stehen
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {institutions.map((inst) => (
                      <InstitutionCard key={inst.id} {...inst} />
                    ))}
                  </div>
                </section>
              )}

              {/* BÖLÜM 2: Bireysel Bağışçılarımız (Onur Duvarı) */}
              {persons.length > 0 && (
                <section className="mb-16">
                  <div className="flex items-center gap-3 mb-8 border-b border-gray-200 pb-3">
                    <FaAward className="text-amber-500 text-xl" />
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-rcDarkGray">
                        Private Förderer & Spender (Ehrentafel)
                      </h2>
                      <p className="text-xs md:text-sm text-gray-500">
                        Herzlichen Dank an alle Bürgerinnen und Bürger für ihre persönliche Unterstützung
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    {persons.map((person) => (
                      <PersonBadge key={person.id} {...person} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* BÖLÜM 3: Destek Olmak İster misiniz? & Spendenkonto */}
          <section className="mt-16 bg-gradient-to-br from-rcBlue to-blue-900 text-white rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                  Mitmachen & Unterstützen
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                  Möchten auch Sie den Bürgertreff unterstützen?
                </h2>
                <p className="text-blue-100 text-sm md:text-base leading-relaxed">
                  Jede Spende hilft uns, Begegnungsmöglichkeiten für alle Generationen zu schaffen und soziale Projekte in unserer Region zu verwirklichen. Als gemeinnütziger Verein stellen wir Ihnen selbstverständlich gerne eine steuerlich absetzbare <strong className="text-white">Zuwendungsbestätigung (Spendenbescheinigung)</strong> aus.
                </p>
                <p className="text-xs text-blue-200/90 italic flex items-center gap-1.5">
                  <FaInfoCircle size={14} className="flex-shrink-0" />
                  Spenden ab 100 € werden auf Wunsch gerne mit der entsprechenden Förderstufe gewürdigt.
                </p>
              </div>

              {/* Banka Bilgileri Kutusu */}
              <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-3 text-sm">
                <h3 className="font-bold text-white text-base border-b border-white/20 pb-2 flex items-center justify-between">
                  <span>Spendenkonto</span>
                  <span className="text-xs font-normal text-blue-200">Bürgertreff Wissen e.V.</span>
                </h3>
                
                <div className="space-y-1.5 text-xs md:text-sm">
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-blue-200">Bank:</span>
                    <span className="font-medium text-white">Sparkasse Westerwald-Sieg</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-blue-200">IBAN:</span>
                    <span className="font-mono font-semibold text-white tracking-wide select-all">DE27 5735 1030 0055 0844 38</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-blue-200">BIC:</span>
                    <span className="font-mono text-white select-all">MALADE51AKI</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Link
                    to="/machen-sie-mit"
                    className="flex-1 text-center bg-white text-rcBlue hover:bg-blue-50 font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    Mehr erfahren
                  </Link>
                  <Link
                    to="/kontakt"
                    className="flex-1 text-center bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-colors border border-white/30"
                  >
                    Kontakt aufnehmen
                  </Link>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

export default Sponsorlar;