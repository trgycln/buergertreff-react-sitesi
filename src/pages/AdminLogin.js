// src/pages/AdminLogin.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Passwort Zurücksetzen State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  
  const navigate = useNavigate();

  // Eğer kullanıcı zaten giriş yapmışsa, onu doğrudan /admin'e yönlendir
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/admin');
      }
    };
    checkSession();
  }, [navigate]);

  const handleResetRequest = async () => {
    if (!resetEmail) {
      setResetError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    setResetMessage('');

    try {
      // redirectTo: sıfırlama linkine tıklandığında kullanıcının gideceği sayfa
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        setResetError(error.message);
      } else {
        setResetMessage('Ein Link zum Zurücksetzen des Passworts wurde an Ihre E-Mail-Adresse gesendet.');
      }
    } catch (err) {
      setResetError('Fehler beim Senden: ' + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      // Başarılıysa /admin'e yönlendir. 
      // ProtectedRoute oradaki rol kontrolünü yapacaktır.
      navigate('/admin'); 
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12"> 
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Admin-Bereich Login</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          {/* ... (Login form HTML'i önceki cevaptaki gibi kalabilir) ... */}
          {/* Email input, Password input, Hata mesajı ve Buton */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-Mail</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Passwort</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
            {loading ? 'Logge ein...' : 'Einloggen'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Passwort vergessen?
            </button>
          </div>
        </form>

        {/* Passwort Zurücksetzen Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900">Passwort zurücksetzen</h3>
              <p className="text-sm text-gray-600">
                Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link, mit dem Sie ein neues Passwort festlegen können.
              </p>
              
              {resetMessage && (
                <div className="p-3 bg-green-50 text-green-800 text-sm rounded border border-green-200">
                  {resetMessage}
                </div>
              )}

              {resetError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                  {resetError}
                </div>
              )}

              {!resetMessage && (
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="beispiel@domain.de"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetMessage('');
                    setResetError('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-md hover:bg-gray-100"
                >
                  Schließen
                </button>
                {!resetMessage && (
                  <button
                    type="button"
                    disabled={resetLoading}
                    onClick={handleResetRequest}
                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-md disabled:bg-gray-400"
                  >
                    {resetLoading ? 'Wird gesendet...' : 'Link senden'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}