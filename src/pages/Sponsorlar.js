// src/Sponsorlar.js
import React, { useEffect, useState } from 'react';
import { FaHandshake } from 'react-icons/fa';

import PageBanner from '../components/PageBanner';
import sponsorBanner from '../assets/images/sponsorenbanner.png';
import { supabase } from '../supabaseClient';

import { Helmet } from 'react-helmet-async';

const SponsorCircle = ({ name, logo_url, website_url }) => (
  <a
    href={website_url || '#'}
    target={website_url ? '_blank' : '_self'}
    rel="noopener noreferrer"
    title={name}
    className="group flex justify-center items-center"
  >
    <div className="w-40 h-40 bg-white rounded-full shadow-lg p-4 flex justify-center items-center transition-all duration-300 ease-in-out group-hover:shadow-2xl group-hover:scale-105 border-4 border-transparent group-hover:border-rcRed overflow-hidden">
      {logo_url ? (
        <img
          src={logo_url}
          alt={name}
          className="w-28 h-28 object-contain"
        />
      ) : (
        <span className="text-sm font-semibold text-rcDarkGray text-center leading-tight px-2">{name}</span>
      )}
    </div>
  </a>
);

const Sponsorlar = () => {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSponsors = async () => {
      const { data } = await supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      setSponsors(data || []);
      setLoading(false);
    };
    fetchSponsors();
  }, []);

  return (
    <>
      <Helmet>
        <title>Unsere Sponsoren & Unterstützer | Bürgertreff Wissen e.V.</title>
        <meta
          name="description"
          content="Vielen Dank an unsere großzügigen Sponsoren und Partner, die die Arbeit des Bürgertreff Wissen e.V. ermöglichen und unser Engagement in der Gemeinschaft unterstützen."
        />
      </Helmet>

      <PageBanner
        title="Sponsoren & Partner"
        imageUrl={sponsorBanner}
      />

      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <FaHandshake className="text-rcRed text-5xl mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-rcBlue mb-4">Unsere Sponsoren und Unterstützer</h1>
            <p className="text-lg text-rcDarkGray max-w-3xl mx-auto">
              Wir danken unseren Partnern für ihre wertvolle Unterstützung. Ohne ihre Beiträge könnten wir unsere Arbeit für die Gemeinschaft nicht verwirklichen.
            </p>
          </div>

          {loading ? (
            <p className="text-center text-gray-500">Lade Sponsoren...</p>
          ) : sponsors.length === 0 ? (
            <p className="text-center text-gray-500 italic">Aktuell sind keine Sponsoren eingetragen.</p>
          ) : (
            <div className="flex flex-wrap justify-center items-center gap-12">
              {sponsors.map((sponsor) => (
                <SponsorCircle key={sponsor.id} {...sponsor} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sponsorlar;