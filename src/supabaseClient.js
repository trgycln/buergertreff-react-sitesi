// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Make sure they are set in your .env file.");
}

// Supabase client'ı daha uzun timeout ve auto-refresh ayarlarıyla oluştur
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-web'
    }
  }
});

// Heartbeat mekanizması - Her 4 dakikada bir basit bir sorgu gönder
// Supabase free tier'ı 5 dakikada pasif duruma geçer, biz 4 dakikada bir sinyal gönderiyoruz
const HEARTBEAT_INTERVAL = 4 * 60 * 1000; // 4 dakika
let heartbeatTimer = null;

// Basit bir health check tablosu oluşturmanız önerilir:
// CREATE TABLE IF NOT EXISTS health_check (id INT PRIMARY KEY, last_ping TIMESTAMP);
// INSERT INTO health_check (id, last_ping) VALUES (1, NOW()) ON CONFLICT (id) DO UPDATE SET last_ping = NOW();

const sendHeartbeat = async () => {
  try {
    // Herhangi bir tablodan basit bir sorgu yaparak veritabanını aktif tut
    // Burada 'events' tablosunu kullanıyorum, sizde var olan bir tablo kullanabilirsiniz
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, bu normal
      console.warn('Heartbeat sorgusu hatası:', error.message);
    } else {
      console.log('✓ Supabase bağlantısı aktif tutuldu');
    }
  } catch (err) {
    console.error('Heartbeat hatası:', err);
  }
};

// Heartbeat'i başlat
export const startHeartbeat = () => {
  if (heartbeatTimer) {
    console.log('Heartbeat zaten çalışıyor');
    return;
  }
  
  console.log('Supabase heartbeat başlatıldı (her 4 dakika)');
  
  // İlk heartbeat'i hemen gönder
  sendHeartbeat();
  
  // Sonrasında düzenli aralıklarla gönder
  heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
};

// Heartbeat'i durdur (gerekirse)
export const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    console.log('Supabase heartbeat durduruldu');
  }
};

// Bağlantı durumunu kontrol et ve gerekirse yeniden bağlan
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Bağlantı kontrolü başarısız:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Bağlantı kontrolü hatası:', err);
    return false;
  }
};

// Sayfa yüklendiğinde heartbeat'i otomatik başlat
if (typeof window !== 'undefined') {
  // Sayfa yüklenince başlat
  window.addEventListener('load', startHeartbeat);
  
  // Sayfa görünür olduğunda da kontrol et
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      startHeartbeat();
      checkConnection();
    }
  });
}