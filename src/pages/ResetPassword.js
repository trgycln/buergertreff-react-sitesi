// src/pages/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { FaLock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Supabase auth oturumunu kontrol et
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('ResetPassword session check:', session);
    };

    checkSession();
  }, []);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin');
        }, 3000);
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-100">
        
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-rcBlue mb-3">
            <FaLock size={22} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Neues Passwort festlegen
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Geben Sie Ihr neues Passwort für den Admin-Zugang ein.
          </p>
        </div>

        {success ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center space-y-3">
            <div className="flex justify-center text-green-500">
              <FaCheckCircle size={32} />
            </div>
            <p className="text-green-800 font-semibold">
              Passwort erfolgreich aktualisiert!
            </p>
            <p className="text-sm text-green-600">
              Sie werden in Kürze automatisch zum Admin-Bereich weitergeleitet...
            </p>
            <div className="pt-2">
              <Link
                to="/admin"
                className="inline-block px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
              >
                Zum Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-sm text-red-700">
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700"
              >
                Neues Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Mindestens 6 Zeichen"
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcBlue focus:border-rcBlue"
              />
            </div>

            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-gray-700"
              >
                Neues Passwort bestätigen
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Passwort wiederholen"
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcBlue focus:border-rcBlue"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 font-medium text-white bg-rcBlue rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rcBlue disabled:bg-gray-400 transition-colors shadow-sm"
            >
              {loading ? 'Wird gespeichert...' : 'Passwort speichern'}
            </button>

            <div className="text-center pt-2">
              <Link 
                to="/admin-login" 
                className="text-sm font-medium text-rcBlue hover:underline"
              >
                Zurück zur Anmeldung
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
