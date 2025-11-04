// src/pages/AdminPermissions.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

export default function AdminPermissions() {
  const [profiles, setProfiles] = useState([]); // 'page_admin' rollü kullanıcılar
  const [pages, setPages] = useState([]); // 'pages' tablosundaki sayfalar
  const [permissions, setPermissions] = useState(new Set()); // Mevcut yetkiler
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // 1. Gerekli tüm verileri (Adminler, Sayfalar, Yetkiler) çek
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Sadece 'page_admin' rolündeki kullanıcıları çek
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('role', 'page_admin')
        .order('email');
        
      // Yönetilecek tüm sayfaları çek
      const { data: pagesData } = await supabase
        .from('pages')
        .select('id, name')
        .order('name');
        
      // Mevcut tüm yetkileri çek
      const { data: permissionsData } = await supabase
        .from('admin_permissions')
        .select('user_id, page_id');

      setProfiles(profilesData || []);
      setPages(pagesData || []);
      
      // Yetkileri hızlı kontrol için bir Set'e dönüştür (örn: "userID_pageID")
      const permissionsSet = new Set(
        permissionsData.map(p => `${p.user_id}_${p.page_id}`)
      );
      setPermissions(permissionsSet);
      setLoading(false);
    };

    fetchData();
  }, []);

  // 2. Checkbox değiştiğinde yetkiyi veritabanına ekle veya kaldır
  const handlePermissionChange = async (userId, pageId, hasPermission) => {
    setMessage('');
    const permissionKey = `${userId}_${pageId}`;
    
    if (hasPermission) {
      // Yetki zaten var, kaldırıyoruz (DELETE)
      const { error } = await supabase
        .from('admin_permissions')
        .delete()
        .match({ user_id: userId, page_id: pageId });
        
      if (error) {
        setMessage(`Fehler beim Entfernen: ${error.message}`);
      } else {
        setMessage('Berechtigung erfolgreich entfernt.');
        // State'i güncelle
        setPermissions(prev => {
          const newPermissions = new Set(prev);
          newPermissions.delete(permissionKey);
          return newPermissions;
        });
      }
    } else {
      // Yetki yok, ekliyoruz (INSERT)
      const { error } = await supabase
        .from('admin_permissions')
        .insert({ user_id: userId, page_id: pageId });
        
      if (error) {
        setMessage(`Fehler beim Hinzufügen: ${error.message}`);
      } else {
        setMessage('Berechtigung erfolgreich hinzugefügt.');
        // State'i güncelle
        setPermissions(prev => new Set(prev).add(permissionKey));
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Lade Berechtigungen...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen bg-rcGray">
      <div className="mb-4">
        {/* Tasarıma uygun 'Geri' linki */}
        <Link to="/admin" className="text-rcBlue font-semibold hover:underline">
          &larr; Zurück zum Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-rcBlue mb-6">
        Berechtigungen verwalten
      </h1>
      
      {/* Başarı/Hata mesajı */}
      {message && (
        <p className="mb-4 p-3 bg-green-100 text-green-800 rounded-md border border-green-300">
          {message}
        </p>
      )}

      {/* Yetkilendirme Tablosu */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-rcDarkGray uppercase tracking-wider">
                Admin (Page Admin)
              </th>
              {/* Sayfaları sütun başlığı olarak yazdır */}
              {pages.map(page => (
                <th key={page.id} className="px-6 py-3 text-center text-xs font-medium text-rcDarkGray uppercase tracking-wider">
                  {page.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {profiles.length === 0 && (
              <tr>
                <td colSpan={pages.length + 1} className="px-6 py-4 text-center text-gray-500">
                  Keine 'page_admin' Benutzer gefunden.
                </td>
              </tr>
            )}
            
            {/* Her 'page_admin' için bir satır oluştur */}
            {profiles.map(profile => (
              <tr key={profile.id} className="hover:bg-rcLightBlue/20">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-rcDarkGray">{profile.full_name || profile.email}</div>
                  <div className="text-sm text-gray-500">{profile.email}</div>
                </td>
                
                {/* Her sayfa için bir checkbox oluştur */}
                {pages.map(page => {
                  const hasPermission = permissions.has(`${profile.id}_${page.id}`);
                  return (
                    <td key={page.id} className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        // Tailwind config'inizdeki 'rcBlue' rengini kullanıyoruz
                        className="h-5 w-5 text-rcBlue border-gray-300 rounded focus:ring-rcBlue"
                        checked={hasPermission}
                        onChange={() => 
                          handlePermissionChange(profile.id, page.id, hasPermission)
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}