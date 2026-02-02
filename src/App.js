// App.js
import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// YENİ: SEO için HelmetProvider ekliyoruz
import { HelmetProvider } from 'react-helmet-async';

// Supabase heartbeat mekanizmasını import et
import { startHeartbeat } from './supabaseClient';

// --- Public Components & Pages ---
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Start from './pages/Start';
import WirUberUns from './pages/WirUberUns'; // Dosya adınızın WirUeberUns.js veya WirUberUns.js olduğundan emin olun
import Angebote from './pages/Angebote';
import Nachbarschaftsboerse from './pages/Nachbarschaftsboerse';
import Sprachtreffen from './pages/Sprachtreffen';
import Ideenboerse from './pages/Ideenboerse';
import BuergertreffUnterwegs from './pages/BuergertreffUnterwegs';
import MachenSieMit from './pages/MachenSieMit';
import Presse from './pages/Presse';
import Kontakt from './pages/Kontakt';
import Beitrittsformular from './pages/Beitrittsformular';
import Danke from './pages/Danke';
import Sponsorlar from './pages/Sponsorlar';
import EreignisDetail from './pages/EreignisDetail';

// --- Admin Pages & Components ---
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminPermissions from './pages/AdminPermissions';
import AdminEditPage from './pages/AdminEditPage'; 
import BuergertreffUnterwegsForm from './pages/BuergertreffUnterwegsForm'; 
import EreignisList from './components/admin/EreignisList'; 
import EreignisForm from './components/admin/EreignisForm'; 
import PresseList from './pages/admin/PresseList';
import PresseForm from './pages/admin/PresseForm';
import Buchhaltung from './pages/admin/Buchhaltung';

// Admin Sicherheit & Layout
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';

// Public Layout
const MainLayout = ({ children }) => (
  <> <Header /> {children} <Footer /> </>
);

function App() {
  // Uygulama başladığında Supabase heartbeat'i başlat
  useEffect(() => {
    startHeartbeat();
    console.log('Supabase keep-alive mekanizması aktif edildi');
    
    // Cleanup function - component unmount olduğunda
    return () => {
      // stopHeartbeat(); // İstenirse kapatılabilir ama genelde açık kalmalı
    };
  }, []);

  return (
    // YENİ: Tüm uygulamayı HelmetProvider ile sarmalıyoruz
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* === ADMIN LOGIN (Layout-los) === */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* === KORUMALI ADMIN BEREICH (Mit AdminLayout/Sidebar) === */}
          <Route
            path="/admin"
            element={ <ProtectedRoute level="admin"><AdminLayout /></ProtectedRoute> }
          >
            {/* Dashboard */}
            <Route index element={<AdminDashboard />} />

            {/* Berechtigungen (Nur Super Admin) */}
            <Route
              path="berechtigungen"
              element={ <ProtectedRoute level="super_admin"><AdminPermissions /></ProtectedRoute> }
            />

            {/* --- ZENTRALE EREIGNISVERWALTUNG --- */}
            <Route
              path="ereignisse" 
              element={ <ProtectedRoute level="admin"><EreignisList /></ProtectedRoute> }
            />
            <Route
              path="ereignisse/new"
              element={ <ProtectedRoute level="admin"><EreignisForm /></ProtectedRoute> } 
            />
            <Route
              path="ereignisse/edit/:id"
              element={ <ProtectedRoute level="admin"><EreignisForm /></ProtectedRoute> } 
            />

            {/* --- SPEZIFISCHE SEITEN-EDITOREN --- */}
            <Route
              path="edit/:pageSlug" 
              element={ <ProtectedRoute level="admin"><AdminEditPage /></ProtectedRoute> } 
            />

            {/* --- SPEZIFISCHE Formular-Routen für "Bürgertreff Unterwegs" Archiv --- */}
            <Route
              path="edit/buergertreff-unterwegs/new"
              element={ <ProtectedRoute level="admin"><BuergertreffUnterwegsForm /></ProtectedRoute> }
            />
            <Route
              path="edit/buergertreff-unterwegs/edit/:id"
              element={ <ProtectedRoute level="admin"><BuergertreffUnterwegsForm /></ProtectedRoute> }
            />

            {/* Presse Rotaları */}
            <Route path="presse" element={<PresseList />} />
            <Route path="presse/neu" element={<PresseForm />} />
            <Route path="presse/:id" element={<PresseForm />} />

            {/* MUHASEBE (Sadece Sayman) */}
            <Route 
              path="buchhaltung" 
              element={ <ProtectedRoute level="treasurer"><Buchhaltung /></ProtectedRoute> } 
            />

          </Route> {/* Ende /admin */}


          {/* === PUBLIC ROTALAR (Alle mit MainLayout) === */}
          <Route path="/" element={<MainLayout><Start /></MainLayout>} />
          
          {/* DİKKAT: Dosya adınız WirUeberUns.js ise importu kontrol edin */}
          <Route path="/wir-uber-uns" element={<MainLayout><WirUberUns /></MainLayout>} />
          
          <Route path="/angebote" element={<MainLayout><Angebote /></MainLayout>} />
          <Route path="/nachbarschaftsboerse" element={<MainLayout><Nachbarschaftsboerse /></MainLayout>} />
          <Route path="/sprachtreffen" element={<MainLayout><Sprachtreffen /></MainLayout>} />
          <Route path="/ideenboerse" element={<MainLayout><Ideenboerse /></MainLayout>} />
          <Route path="/buergertreff-unterwegs" element={<MainLayout><BuergertreffUnterwegs /></MainLayout>} />
          <Route path="/machen-sie-mit" element={<MainLayout><MachenSieMit /></MainLayout>} />
          <Route path="/presse" element={<MainLayout><Presse /></MainLayout>} />
          <Route path="/kontakt" element={<MainLayout><Kontakt /></MainLayout>} />
          <Route path="/beitrittsformular" element={<MainLayout><Beitrittsformular /></MainLayout>} />
          <Route path="/danke" element={<MainLayout><Danke /></MainLayout>} />
          <Route path="/sponsorlar" element={<MainLayout><Sponsorlar /></MainLayout>} />
          
          {/* DÜZELTME: Detay sayfası da Layout içinde olmalı */}
          <Route path="/angebote/:id" element={<MainLayout><EreignisDetail /></MainLayout>} />
          
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;