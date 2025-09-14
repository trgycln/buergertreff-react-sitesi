// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- EKSİK OLAN SAYFA İMPORTLARI BURADA ---
import Header from './components/Header';
import Footer from './components/Footer';
import Start from './pages/Start';
import WirUberUns from './pages/WirUberUns';
import MachenSieMit from './pages/MachenSieMit';
import Angebote from './pages/Angebote';
import Sprachtreffen from './pages/Sprachtreffen';
import BuergertreffUnterwegs from './pages/BuergertreffUnterwegs';
import Nachbarschaftsboerse from './pages/Nachbarschaftsboerse';
import Ideenboerse from './pages/Ideenboerse';
import Presse from './pages/Presse';
import Kontakt from './pages/Kontakt';
import Beitrittsformular from './pages/Beitrittsformular';
import ScrollToTop from './components/ScrollToTop';
// --- TÜM İMPORTLAR EKLENDİ ---

function App() {
  return (
    <Router>
      <ScrollToTop /> 
      {/* Bu ana kutu, siteye "Boxed" görünümü verir */}
      <div className="max-w-screen-2xl mx-auto bg-white shadow-2xl">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Start />} />
            <Route path="/wir-uber-uns" element={<WirUberUns />} />
            <Route path="/machen-sie-mit" element={<MachenSieMit />} />
            <Route path="/angebote-und-veranstaltungen" element={<Angebote />} />
            <Route path="/angebote-und-veranstaltungen/sprachtreffen" element={<Sprachtreffen />} />
            <Route path="/angebote-und-veranstaltungen/buergertreff-unterwegs" element={<BuergertreffUnterwegs />} />
            <Route path="/angebote-und-veranstaltungen/nachbarschaftsboerse" element={<Nachbarschaftsboerse />} />
            <Route path="/angebote-und-veranstaltungen/ideenboerse" element={<Ideenboerse />} /> 
            <Route path="/presse-uber-uns" element={<Presse />} />
            <Route path="/kontakt" element={<Kontakt />} />
             <Route path="/beitrittsformular" element={<Beitrittsformular />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;