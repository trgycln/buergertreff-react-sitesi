import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
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
import ScrollToTop from './components/ScrollToTop';
import Sponsorlar from './pages/Sponsorlar'; // YENİ: Sponsorlar sayfasını import et

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/wir-uber-uns" element={<WirUberUns />} />
        <Route path="/angebote" element={<Angebote />} />
        <Route path="/nachbarschaftsboerse" element={<Nachbarschaftsboerse />} />
        <Route path="/sprachtreffen" element={<Sprachtreffen />} />
        <Route path="/ideenboerse" element={<Ideenboerse />} />
        <Route path="/buergertreff-unterwegs" element={<BuergertreffUnterwegs />} />
        <Route path="/machen-sie-mit" element={<MachenSieMit />} />
        <Route path="/presse" element={<Presse />} />
        <Route path="/kontakt" element={<Kontakt />} />
        <Route path="/beitrittsformular" element={<Beitrittsformular />} />
        <Route path="/danke" element={<Danke />} />
        <Route path="/sponsorlar" element={<Sponsorlar />} /> {/* YENİ: Sponsorlar için rota ekle */}
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;