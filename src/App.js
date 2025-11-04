// App.js
// KORRIGIERT: Placeholder für EreignisForm entfernt und korrekte Komponente eingefügt.

import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- Public Components & Pages ---
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Start from './pages/Start';
import WirUberUns from './pages/WirUberUns';
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

// --- Admin Pages & Components ---
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminPermissions from './pages/AdminPermissions';
import AdminEditPage from './pages/AdminEditPage'; // Der Router für /edit/:slug
import BuergertreffUnterwegsForm from './pages/BuergertreffUnterwegsForm'; // Das Formular für Unterwegs
import EreignisList from './components/admin/EreignisList'; // Die zentrale Ereignisliste
import EreignisForm from './components/admin/EreignisForm'; // Das zentrale Ereignisformular
import EreignisDetail from './pages/EreignisDetail';
import PresseList from './pages/admin/PresseList';
import PresseForm from './pages/admin/PresseForm';


// Admin Sicherheit & Layout
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';

// Public Layout
const MainLayout = ({ children }) => (
  <> <Header /> {children} <Footer /> </>
);

function App() {
  return (
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
          {/* Die Liste aller Ereignisse */}
          <Route
            path="ereignisse" // Direkte Route zur Liste
            element={ <ProtectedRoute level="admin"><EreignisList /></ProtectedRoute> }
          />
          {/* Das Formular für NEUE Ereignisse */}
          <Route
            path="ereignisse/new"
            element={ <ProtectedRoute level="admin"><EreignisForm /></ProtectedRoute> } // *** KORRIGIERT ***
          />
          {/* Das Formular zum BEARBEITEN von Ereignissen */}
          <Route
            path="ereignisse/edit/:id"
            element={ <ProtectedRoute level="admin"><EreignisForm /></ProtectedRoute> } // *** KORRIGIERT ***
          />

          {/* --- SPEZIFISCHE SEITEN-EDITOREN (über generische Route) --- */}
          {/* Diese EINE Route fängt /admin/edit/angebote UND /admin/edit/buergertreff-unterwegs ab */}
          <Route
            path="edit/:pageSlug" // Die generische Route mit Parameter
            element={ <ProtectedRoute level="admin"><AdminEditPage /></ProtectedRoute> } // Lädt den Router, der dann den richtigen Editor wählt
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

          {/* YENİ: Presse Rotaları */}
    <Route path="presse" element={<PresseList />} />
    <Route path="presse/neu" element={<PresseForm />} />
    <Route path="presse/:id" element={<PresseForm />} />

        </Route> {/* Ende /admin */}


        {/* === PUBLIC ROTALAR (Alle mit MainLayout) === */}
        <Route path="/" element={<MainLayout><Start /></MainLayout>} />
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
        <Route path="/angebote/:id" element={<EreignisDetail />} />
      </Routes>
    </Router>
  );
}

export default App;