// Netlify Scheduled Function - Supabase'i aktif tutan heartbeat
// Bu function her 5 dakikada bir otomatik çalışır (kimse siteyi açmasa bile!)

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('🔄 Supabase keep-alive çalışıyor...');
  
  try {
    // Supabase credentials - Netlify environment variables'dan gelecek
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials eksik!');
    }
    
    // Supabase client oluştur
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Basit bir sorgu yaparak database'i uyandır
    // events tablosundan 1 kayıt çek (veya var olan herhangi bir tablonuz)
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Sorgu hatası:', error.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        })
      };
    }
    
    console.log('✅ Supabase başarıyla uyandırıldı!');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Supabase aktif tutuldu',
        timestamp: new Date().toISOString(),
        data: data ? 'Veri bulundu' : 'Tablo boş'
      })
    };
    
  } catch (error) {
    console.error('❌ Keep-alive hatası:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
