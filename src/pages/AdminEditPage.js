// src/pages/AdminEditPage.js
// KORRIGIERT & MIT DEBUGGING-LOGS

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

import AngeboteEditor from '../components/admin/AngeboteEditor';
import BuergertreffUnterwegsEditor from '../components/admin/BuergertreffUnterwegsEditor';

const editorMap = {
  'angebote': AngeboteEditor,
  'buergertreff-unterwegs': BuergertreffUnterwegsEditor,
};

export default function AdminEditPage() {
  const params = useParams(); // Hole das ganze params-Objekt
  const pageSlug = params.pageSlug; // Extrahiere den Slug
  console.log("AdminEditPage: useParams() Ergebnis:", params); // DEBUG 1: Was liefert useParams?
  console.log("AdminEditPage: Extrahierter pageSlug:", pageSlug); // DEBUG 2: Ist der Slug korrekt extrahiert?

  const [profile, setProfile] = useState(null);
  const [pageInfo, setPageInfo] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AdminEditPage: useEffect gestartet. Aktueller pageSlug:", pageSlug); // DEBUG 3: Wert beim Start des Effekts

    const checkPermissionAndLoad = async () => {
      console.log("AdminEditPage: checkPermissionAndLoad gestartet für pageSlug:", pageSlug); // DEBUG 4
      setLoading(true);
      setHasPermission(false);
      setPageInfo(null);

      // 1. Benutzer und Profil holen
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("AdminEditPage: Kein Benutzer gefunden.");
        setLoading(false); return;
      }

      const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (!profileData) {
        console.log("AdminEditPage: Kein Profil gefunden für User:", user.id);
        setLoading(false); return;
      }
      setProfile(profileData);
      console.log("AdminEditPage: Profil gefunden:", profileData);

      // 2. Seiteninformationen holen
      console.log("AdminEditPage: Suche Seiteninfo für slug:", pageSlug); // DEBUG 5: Mit welchem Slug wird gesucht?
      const { data: pageData, error: pageError } = await supabase
        .from('pages')
        .select('id, name, slug, target_table')
        .eq('slug', pageSlug) // Suche nach dem Slug aus der URL
        .maybeSingle();

      if (pageError) {
        console.error("AdminEditPage: Fehler beim Holen der Seiteninfo:", pageError);
      }
      console.log("AdminEditPage: Ergebnis der Seiteninfo-Suche:", pageData); // DEBUG 6: Was hat die DB zurückgegeben?

      if (!pageData) {
        console.warn("AdminEditPage: Seiteninfo nicht in DB gefunden für Slug:", pageSlug);
        setPageInfo({ name: `Ungültige Seite (${pageSlug})`});
        setLoading(false);
        return;
      }
      setPageInfo(pageData);

      // 3. Berechtigung prüfen
      if (profileData.role === 'super_admin') {
        console.log("AdminEditPage: User ist super_admin, Berechtigung erteilt.");
        setHasPermission(true);
      } else {
        console.log("AdminEditPage: Prüfe Berechtigung für page_admin, User:", user.id, "Page:", pageData.id);
        const { data: permissionData, error: permError } = await supabase
          .from('admin_permissions')
          .select('user_id')
          .match({ user_id: user.id, page_id: pageData.id })
          .maybeSingle();

        if (permissionData) {
          console.log("AdminEditPage: Berechtigung für page_admin gefunden.");
          setHasPermission(true);
        } else {
            console.warn("AdminEditPage: Keine explizite Berechtigung für page_admin gefunden.", permError);
        }
      }

      setLoading(false);
    };

    // Nur ausführen, wenn pageSlug NICHT undefined oder leer ist
    if (pageSlug) {
      checkPermissionAndLoad();
    } else {
      console.warn("AdminEditPage: useEffect abgebrochen, da pageSlug leer oder undefined ist.");
      setPageInfo({ name: `Ungültige Seite (${pageSlug})`}); // Setze Info für Fehlermeldung
      setHasPermission(false);
      setLoading(false);
    }

  }, [pageSlug]); // Effekt neu ausführen, wenn sich der Slug ändert

  // --- Render-Logik ---
  console.log("AdminEditPage: Render wird ausgeführt. Loading:", loading, "HasPermission:", hasPermission, "PageInfo:", pageInfo, "pageSlug:", pageSlug); // DEBUG 7: Zustand vor dem Rendern

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Prüfe Berechtigungen für '{pageSlug || 'unbekannt'}'...</div>;
  }

  const EditorComponent = pageSlug ? editorMap[pageSlug] : null; // Editor nur bei gültigem Slug suchen

  if (!hasPermission || !pageInfo || !EditorComponent) {
    // Verbesserte Fehlermeldung
    const errorReason = !pageSlug
        ? `Kein Seiten-Slug in der URL gefunden.`
        : !pageInfo || pageInfo.name.startsWith('Ungültige Seite') // Prüfe auf unseren eigenen Fehlertext
            ? `Die Seite mit dem URL-Teil "${pageSlug}" ist im Admin-System nicht korrekt definiert (DB-Eintrag fehlt?).`
            : !EditorComponent
                ? `Für die Seite "${pageInfo.name}" wurde kein passendes Bearbeitungsmodul (EditorComponent) gefunden.`
                : "Sie haben keine Berechtigung, diesen Bereich zu bearbeiten.";

    console.error("AdminEditPage: Render Abbruch - Grund:", errorReason); // DEBUG 8: Warum wird abgebrochen?

    return (
      <div className="container mx-auto p-8 bg-red-50 border border-red-200 rounded shadow">
        <h1 className="text-2xl font-bold text-rcRed mb-3">Zugriff verweigert oder Seite ungültig</h1>
        <p className="text-rcDarkGray mb-4">
          {errorReason} (Debug Info: pageSlug='{String(pageSlug)}', pageInfo={JSON.stringify(pageInfo)})
        </p>
        <Link to="/admin" className="text-rcBlue hover:underline font-semibold">
          &larr; Zurück zum Dashboard
        </Link>
      </div>
    );
  }

  // Fall: Berechtigung vorhanden und Seite gültig -> Lade die richtige Komponente
  console.log("AdminEditPage: Render Erfolgreich - Lade Editor für:", pageSlug); // DEBUG 9
  return (
    <EditorComponent pageInfo={pageInfo} />
  );
}