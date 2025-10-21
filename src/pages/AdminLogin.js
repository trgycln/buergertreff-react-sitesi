// src/pages/AdminLogin.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../supabaseClient';
import PageBanner from '../components/PageBanner'; // İsteğe bağlı banner
import loginBanner from '../assets/images/kontakt-banner.png'; // Örnek banner resmi

const AdminLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Oturum durumunu dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Eğer kullanıcı giriş yapmışsa, admin paneline yönlendir
        navigate('/admin/dashboard');
      }
    });

    // Component kaldırıldığında aboneliği temizle
    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // Eğer zaten giriş yapılmışsa, hemen yönlendir
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/admin/dashboard');
      }
    };
    checkSession();
  }, [navigate]);


  return (
    <div>
      {/* İsteğe bağlı: Sayfa üstüne bir banner ekleyebiliriz */}
      <PageBanner title="Admin Panel Login" imageUrl={loginBanner} />

      <div className="container mx-auto px-6 py-12 md:py-20 max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-lg">
           <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Admin Girişi</h2>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google', 'github']} // İstersen Google, Github gibi provider'ları ekleyebilirsin, şimdilik sadece e-posta/şifre
            // Sadece e-posta ve şifre ile girişi etkinleştirmek için:
            providers={[]}
            socialLayout="horizontal"
            theme="light" // 'dark' da olabilir
          />
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;