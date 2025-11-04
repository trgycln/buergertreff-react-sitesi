// src/pages/AdminDashboard.js
// DÜZELTME: Eksik 'FaCalendarAlt' ikonu import edildi.

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
// DÜZELTME: FaCalendarAlt eklendi
import { FaPlus, FaList, FaRegNewspaper, FaUsersCog, FaTachometerAlt, FaCalendarAlt } from 'react-icons/fa';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUser(user);

      const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profileData) { setLoading(false); return; }
      setProfile(profileData);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">Lade Dashboard...</div>;
  }

  if (!user || !profile) {
    return <div className="p-8 bg-red-100 text-rcRed rounded shadow">Fehler: Benutzerdaten konnten nicht geladen werden.</div>;
  }

  const isSuperAdmin = profile.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Begrüßung */}
      <p className="text-xl text-rcDarkGray">
        Willkommen zurück, <span className="font-semibold">{user.email}</span>!
      </p>

      {/* Super-Admin Werkzeuge */}
      {isSuperAdmin && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-rcBlue">Super-Admin Werkzeuge</h2>
          <p className="text-sm text-rcDarkGray mb-3">Weisen Sie anderen Administratoren Berechtigungen für Inhaltsbereiche zu.</p>
          <Link
            to="/admin/berechtigungen"
            className="inline-block px-4 py-2 bg-rcBlue text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors"
          >
            <FaUsersCog className="inline-block mr-2" />
            Berechtigungen verwalten
          </Link>
        </div>
      )}

      {/* --- Kısayollar Grid Yapısı --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* --- Kısayol Kutusu: Ereignisse --- */}
        <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-rcDarkGray mb-4 flex items-center">
            {/* DÜZELTME: Bu ikon artık import edildi */}
            <FaCalendarAlt className="mr-3 text-rcBlue" />
            Schnellzugriffe: Ereignisse
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            Öffentliche und interne Veranstaltungen, Ausflüge oder Treffen verwalten.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/admin/ereignisse/neu"
              className="flex items-center justify-center px-5 py-3 bg-rcBlue text-white text-sm font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-2" />
              Neues Ereignis
            </Link>
            <Link
              to="/admin/ereignisse"
              className="flex items-center justify-center px-5 py-3 bg-rcDarkGray text-white text-sm font-semibold rounded-lg shadow hover:bg-gray-700 transition-colors"
            >
              <FaList className="mr-2" />
              Alle verwalten
            </Link>
          </div>
        </div>

        {/* --- Kısayol Kutusu: Presse --- */}
        <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold text-rcDarkGray mb-4 flex items-center">
            <FaRegNewspaper className="mr-3 text-rcBlue" />
            Schnellzugriffe: Presse
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            Presseartikel verwalten, die auf der öffentlichen Website angezeigt werden.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/admin/presse/neu"
              className="flex items-center justify-center px-5 py-3 bg-rcBlue text-white text-sm font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-2" />
              Neuer Artikel
            </Link>
            <Link
              to="/admin/presse"
              className="flex items-center justify-center px-5 py-3 bg-rcDarkGray text-white text-sm font-semibold rounded-lg shadow hover:bg-gray-700 transition-colors"
            >
              <FaList className="mr-2" />
              Alle verwalten
            </Link>
          </div>
        </div>

      </div>
      {/* --- BİTİŞ: Kısayollar Grid Yapısı --- */}

    </div>
  );
}