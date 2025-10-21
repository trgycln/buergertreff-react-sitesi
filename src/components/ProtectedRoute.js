// src/components/ProtectedRoute.js
import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ProtectedRoute = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching session:", error);
      }
      setSession(session);
      setLoading(false);
    };

    fetchSession();

    // Oturum değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        // Eğer oturum aniden null olursa (logout) ama loading bitmişse,
        // tekrar kontrol etmeye gerek yok, Navigate halleder.
        if (loading && !session) setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loading]); // loading state'i bağımlılıklara ekleyerek ilk yükleme sonrası tekrar çalışmasını sağla

  if (loading) {
    // Oturum bilgisi yüklenirken bekleme ekranı gösterebilirsin
    return <div>Loading...</div>;
  }

  // Oturum yoksa login sayfasına yönlendir, varsa iç içe rotaları göster
  return session ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default ProtectedRoute;