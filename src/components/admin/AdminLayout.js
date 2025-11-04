// src/components/admin/AdminLayout.js
// DÜZELTME: Mobil uyumluluk (responsive hamburger menü) eklendi.

import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

// YENİ: Gerekli ikonlar eklendi
import { 
    FaTachometerAlt, FaUsersCog, FaSignOutAlt, FaCalendarAlt, FaRegNewspaper,
    FaBars, // Hamburger ikonu
    FaTimes // Kapatma (X) ikonu
} from 'react-icons/fa'; 

// Sidebar-Link-Komponente (Değişiklik yok)
const SidebarLink = ({ to, icon, label, end = false }) => {
  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150 ${
      isActive
        ? 'bg-blue-900 text-white' // Aktif Link
        : 'text-blue-100 hover:bg-blue-700' // Pasif Link
    }`;
  return (
    <NavLink to={to} className={navLinkClass} end={end}>
      {icon}
      <span className="ml-3">{label}</span>
    </NavLink>
  );
};

// Ana Admin-Layout-Komponente
const AdminLayout = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // YENİ: Mobil menünün açık/kapalı durumunu tutan state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation(); // Aktuellen Pfad holen

  // YENİ: Kullanıcı başka bir sayfaya tıkladığında mobil menüyü otomatik kapat
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

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

  // Sayfa başlığı fonksiyonu (Dinamik)
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard';
    if (path.startsWith('/admin/ereignisse/new')) return 'Neues Ereignis erstellen';
    if (path.startsWith('/admin/ereignisse/')) return 'Ereignis bearbeiten';
    if (path.startsWith('/admin/ereignisse')) return 'Alle Ereignisse verwalten';
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
    <div className="relative flex h-screen bg-rcGray overflow-hidden">
      
      {/* === SIDEBAR (DÜZELTİLDİ: Mobil için responsive yapıldı) === */}
      {/* Mobil (varsayılan): Ekranı kaplar, 'fixed', 'z-50' ve 'transform' ile gizli.
        Masaüstü (lg:): 'relative', 'w-64' olur ve 'transform' sıfırlanır.
      */}
      <div className={`
        w-64 bg-rcBlue text-white flex flex-col shadow-lg
        fixed lg:relative h-full z-50
        transition-transform duration-300 ease-in-out
        ${isMenuOpen ? 'transform translate-x-0' : 'transform -translate-x-full'}
        lg:transform-none
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-blue-700">
          <span className="text-2xl font-bold">Admin Panel</span>
          {/* Mobil Kapatma Butonu (Sadece mobilde görünür) */}
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="lg:hidden text-blue-200 hover:text-white"
          >
            <FaTimes size={20} />
          </button>
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
          <SidebarLink
            to="/admin/presse" 
            icon={<FaRegNewspaper size={18} />}
            label="Presse Verwalten"
          />
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

      {/* === INHALTSBEREICH (DÜZELTİLDİ: Mobil için header eklendi) === */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Mobil/Desktop Üst Bar */}
        <header className="flex justify-between items-center bg-white shadow-md p-4 border-b border-gray-200">
          
          {/* Mobil Menü Açma Butonu (Sadece mobilde görünür) */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden text-rcBlue p-2"
          >
            <FaBars size={24} />
          </button>
          
          {/* Sayfa Başlığı */}
          <h1 className="text-xl md:text-2xl font-bold text-rcDarkGray ml-2 lg:ml-0">
            {getPageTitle()}
          </h1>
          
          {/* Sağ tarafta boşluk bırakmak için (veya buraya profil ikonu konulabilir) */}
          <div className="w-8"></div>
        </header>

        {/* Asıl İçerik Alanı (Kaydırılabilir) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet /> 
        </main>
      </div>

      {/* YENİ: Mobil menü açıkken arka planı karartan overlay */}
      {isMenuOpen && (
        <div 
          onClick={() => setIsMenuOpen(false)} 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
        ></div>
      )}
    </div>
  );
};

export default AdminLayout;