// src/components/admin/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // Sizin supabaseClient.js dosyanızın yolu

const ProtectedRoute = ({ children, level }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // 1. Oturumu al
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // 2. Oturum varsa, kullanıcının ROLÜNÜ al
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }
      }
      setLoading(false);
    };

    getSession();

    // Oturum değişikliklerini dinle (Login/Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Oturum kapandığında profili sıfırla
        if (!session) {
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    // Yükleniyor... (Buraya bir yüklenme animasyonu eklenebilir)
    return <div className="flex justify-center items-center min-h-screen">Lade...</div>;
  }

  // 3. KONTROL: Oturum YOKSA, login sayfasına yönlendir
  if (!session) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  // 4. KONTROL: Oturum VAR ama profil (rol) yüklenmemişse (bir hata varsa)
  if (!profile) {
    // Veya bir hata sayfasına yönlendir
    return <Navigate to="/" replace />; 
  }

  // 5. YETKİ KONTROLÜ
  // a) 'super_admin' gerektiren bir sayfa ise
  if (level === 'super_admin' && profile.role !== 'super_admin') {
    // Kullanıcı 'super_admin' değilse, ana admin sayfasına at
    return <Navigate to="/admin" replace />;
  }
  // b) 'admin' (herhangi bir admin) gerektiren bir sayfa ise
  // (Rol 'super_admin' VEYA 'page_admin' ise izin verilir)
  if (level === 'admin' && (profile.role !== 'super_admin' && profile.role !== 'page_admin')) {
     // Kullanıcı admin değilse, anasayfaya at
    return <Navigate to="/" replace />;
  }

  // 6. HER ŞEY YOLUNDAYSA: Sayfayı göster
  return children;
};

export default ProtectedRoute;