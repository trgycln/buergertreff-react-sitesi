# 🚀 Supabase Keep-Alive Kurulum Rehberi

## ✅ Tamamlanan Adımlar

1. ✅ Netlify Function oluşturuldu: `netlify/functions/keep-alive.js`
2. ✅ `netlify.toml` yapılandırıldı
3. ✅ Frontend'de heartbeat mekanizması eklendi (siteye girildiğinde çalışır)

---

## 📋 YAPMANIZ GEREKENLER

### Adım 1: Netlify'a Deploy Edin
```bash
git add .
git commit -m "Supabase keep-alive mekanizması eklendi"
git push
```

Netlify otomatik deploy edecek.

---

### Adım 2: Function URL'ini Bulun

Deploy tamamlandığında, function şu adreste olacak:
```
https://buergertreff-wissen.de/.netlify/functions/keep-alive
```

Bu URL'i test edin - böyle bir sonuç görmeli:
```json
{
  "success": true,
  "message": "Supabase aktif tutuldu",
  "timestamp": "2026-02-02T..."
}
```

---

### Adım 3: Ücretsiz Cron Servisi Kurulumu

**Neden?** Netlify'nin ücretsiz planı scheduled functions'ı desteklemiyor. O yüzden dışarıdan bir cron servisi kullanacağız.

#### 🌐 cron-job.org (ÖNERİLEN - ÜCRETSİZ)

1. **Hesap Oluşturun**: https://cron-job.org/en/
2. **"Create Cronjob" tıklayın**
3. **Ayarları girin**:
   - **Title**: `Supabase Keep-Alive`
   - **URL**: `https://buergertreff-wissen.de/.netlify/functions/keep-alive`
   - **Schedule**: 
     - Execution: `Every 5 minutes` VEYA `Every 4 minutes`
   - **Enable**: ✅ İşaretli
4. **Save**

---

### Adım 4: Test Edin

1. Function'ı tarayıcıda açın: `https://SITENIZ.netlify.app/.netlify/functions/keep-alive`
2. Başarılı mesaj görmelisiniz
3. cron-job.org'da "Execution History" bbuergertreff-wissen.derı takip edin

---

## 🎯 Sonuç

✅ Artık **7/24 her 4-5 dakikada bir** Supabase'inize istek gidecek  
✅ Kimse siteyi açmasa bile database asla pasif duruma geçmeyecek  
✅ **Tamamen ücretsiz** çözüm  

---

## 🔧 Sorun Giderme

### Function çalışmıyor?
- Netlify Dashboard → Functions → Logs kontrol edin
- Environment Variables eklenmiş mi? (REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY)

### Cron çalışmıyor?
- cron-job.org'da "Execution History" kontrol edin
- URL doğru mu? (https:// ile başlamalı)

### Supabase hala uyuyor?
- Function'dan dönen response'u kontrol edin
- Supabase Dashboard → Logs'dan istekleri görün

---

## 📊 Alternatif Çözümler

### Seçenek 2: UptimeRobot (Ücretsiz)
1. https://uptimerobot.com/ hesap oluştur
2. "Add New Monitor" → HTTP(s)
3. URL: `https://buergertreff-wissen.de/.netlify/functions/keep-alive`
4. Interval: 5 minutes

### Seçenek 3: EasyCron (Ücretsiz)
- https://www.easycron.com/
- Aylık 1000 execution limiti var

---

## 💰 Maliyet
- **Netlify Function**: Ücretsiz (ayda 125.000 invocation)
- **cron-job.org**: Ücretsiz
- **Toplam**: 0 TL / ay

Ayda yaklaşık **8,640 request** gidecek (5 dakikada bir = ayda 8640)
Netlify limiti: 125,000 → Sorun yok! ✅
