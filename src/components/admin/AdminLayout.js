// src/components/admin/AdminLayout.js
// DÜZELTME: "Presse Verwalten" linki ve ikonu eklendi.

import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
// YENİ: FaRegNewspaper ikonu eklendi
import { FaTachometerAlt, FaUsersCog, FaSignOutAlt, FaCalendarAlt, FaRegNewspaper } from 'react-icons/fa'; 

// Sidebar-Link-Komponente (unverändert)
const SidebarLink = ({ to, icon, label, end = false }) => {
  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150 ${
      isActive
        ? 'bg-blue-900 text-white' // Aktiver Link
        : 'text-blue-100 hover:bg-blue-700' // Passiver Link
    }`;
  return (
    <NavLink to={to} className={navLinkClass} end={end}>
      {icon}
      <span className="ml-3">{label}</span>
    </NavLink>
  );
};

// Haupt-Admin-Layout-Komponente
const AdminLayout = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); 

  useEffect(() => {
    const getUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setRole(profile.role);
      }
      setLoading(false);
    };
    getUserRole();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin-login');
  };

  const isSuperAdmin = role === 'super_admin';

  // getPageTitle fonksiyonu güncellendi
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard';
    if (path.startsWith('/admin/ereignisse/neu')) return 'Neues Ereignis erstellen';
    if (path.startsWith('/admin/ereignisse/')) return 'Ereignis bearbeiten';
    if (path.startsWith('/admin/ereignisse')) return 'Alle Ereignisse verwalten';
    
    // YENİ: Presse sayfaları için başlıklar
    if (path.startsWith('/admin/presse/neu')) return 'Neuen Presseartikel anlegen';
    if (path.startsWith('/admin/presse/')) return 'Presseartikel bearbeiten';
    if (path.startsWith('/admin/presse')) return 'Presse verwalten';

    if (path.startsWith('/admin/berechtigungen')) return 'Berechtigungen verwalten';
    return 'Admin Panel';
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center">Lade Administrator-Panel...</div>;
  }

  return (
    <div className="flex h-screen bg-rcGray">
      {/* === SIDEBAR (DÜZELTİLDİ: Presse linki eklendi) === */}
      <div className="w-64 flex-shrink-0 bg-rcBlue text-white flex flex-col shadow-lg">
        <div className="h-16 flex items-center justify-center px-4 text-2xl font-bold border-b border-blue-700">
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarLink
            to="/admin" 
            icon={<FaTachometerAlt size={18} />}
            label="Dashboard"
            end={true} 
          />
          <SidebarLink
            to="/admin/ereignisse" 
            icon={<FaCalendarAlt size={18} />}
            label="Alle Ereignisse"
          />
          
          {/* YENİ: Presse Yönetim Linki */}
          <SidebarLink
            to="/admin/presse" 
            icon={<FaRegNewspaper size={18} />}
            label="Presse Verwalten"
          />

          {/* Nur für Super Admin */}
          {isSuperAdmin && (
            <SidebarLink
              to="/admin/berechtigungen"
              icon={<FaUsersCog size={18} />}
              label="Berechtigungen"
            />
          )}
        </nav>
        <div className="p-4 border-t border-blue-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-md text-blue-100 hover:bg-blue-700 transition-colors duration-150"
          >
            <FaSignOutAlt size={18} />
            <span className="ml-3">Abmelden</span>
          </button>
        </div>
      </div>

      {/* === INHALTSBEREICH (Rechte Seite) === */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
       <h1 className="text-2xl font-bold text-rcDarkGray mb-6">{getPageTitle()}</h1>
        <Outlet /> 
      </main>
    </div>
  );
};

export default AdminLayout;