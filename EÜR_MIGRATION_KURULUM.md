# EÜR KÜÇÜLERİN UYGULAMAYA AKTARILMASı - KURULUM KILAVUZU

## ✅ Ne Yapıldı?

Mevcut `accounting_transactions` tablosundaki tüm veriler otomatik olarak `accounting_eur_records` tablosuna dönüştürülerek **Dört Vergi Alanı (Sphären)** yapısına göre düzenlenmiştir.

---

## 📋 KURULUM ADIMLARI

### **ADIM 1️⃣: Yeni EÜR Tablosunu Oluştur**

1. **Supabase Dashboard** aç
2. **SQL Editor** bölümüne git
3. [`update_eur_records_table.sql`](../update_eur_records_table.sql) dosyasındaki SQL kodunu kopyala
4. SQL Editor'e yapıştır
5. **▶️ RUN** butonuna tıkla
6. Başarı mesajı bekle ✅

**Bu adım Supabase'de yapılmalı - lokal olarak değil!**

---

### **ADIM 2️⃣: Verileri Migre Et (OTOMATİK)**

Uygulama ilk kez başlatıldığında, otomatik olarak:

1. **App.js** içinde `initializeEURRecords()` fonksiyonu çalışır
2. Mevcut tüm `accounting_transactions` verileri taranır
3. Her transaction **Dört Sphäre'den birine** otomatik atanır:
   - **Ideeller** (İdeyel Alan) - Aidatlar, Bağışlar
   - **Vermögensv** (Mal Varlığı) - Banka Faizleri
   - **Zweckbetrieb** (Amaç İşletmesi) - Etkinlikler
   - **Wirtschaftlich** (İktisadi) - Kâr Amaçlı
4. Her transaction `EÜR-YYYY-XXXXX` formatında Buchungsnummer alır
5. Veriler **accounting_eur_records** tablosuna batch olarak yazılır

**Tarayıcı konsolunda şöyle bir log göreceksin:**
```
✅ EÜR kaydı başarılı: 250 kayıt başarıyla migre edildi
```

---

## 🔍 VERİ DÖNÜŞTÜRME KURALLARI

### **Kategori → Sphäre Otomatik Eşleştirmesi**

Kategori adı otomatik olarak taranır ve şu kurallara göre sphäre atanır:

| Kategori Anahtar Sözcüğü | Atanan Sphäre |
|---|---|
| Zins, Konto, Kredit, Bank, Faiz | **Vermögensv** |
| Kurs, Event, Aktivität, Veranstaltung, Seminar, Etkinlik | **Zweckbetrieb** |
| Verkauf, Reklam, Kaffee, Bar, Shop, Satış | **Wirtschaftlich** |
| Diğer (Aidat, Bağış, vs.) | **Ideeller** (Varsayılan) |

**Örnek:**
- "Üye Aidatı" → Kategoriyiz mi? → **Ideeller**
- "Banka Faizi" → Konto/Bank var → **Vermögensv**
- "Seminer Geliri" → Seminer var → **Zweckbetrieb**

---

## 📊 VERITABANINDA OLUŞAN YAPI

### **Tablo Sütunları:**

```
accounting_eur_records:
├── id (PK)
├── fiscal_year (Mali Yıl)
├── entry_date (İşlem Tarihi - Zu- und Abflussprinzip)
├── buchungsnummer (Kayıt Numarası: EÜR-2026-00001)
├── vorgang (İşlem Açıklaması)
├── belegnummer (Dayanak Belge No)
├── amount_gross (Brüt Tutar)
├── amount_net (Net Tutar)
├── amount_vat (KDV Tutarı)
├── vat_rate (KDV Oranı)
├── sphaere (İdeyel, Vermögensv, Zweckbetrieb, Wirtschaftlich)
├── transaction_type (Gelir/Gider)
├── sub_category (Kategori Adı)
├── document_url (Belge Dosyası)
├── stored_location (Fiziksel Depolama)
└── notes (Notlar: "Otomatik Migration")
```

---

## 🚀 MIGRATION STATÜSÜ KONTROL ETME

### **Tarayıcı Konsolunda:**

```javascript
// Browser Console'da
import { getEURStatistics } from './utils/eurInitializer';
await getEURStatistics(2026); // Mali yıl parametresi
```

**Çıktı:**
```javascript
{
  ideeller: { income: 15000, expense: 8000 },
  vermögensv: { income: 250, expense: 50 },
  zweckbetrieb: { income: 3000, expense: 1500 },
  wirtschaftlich: { income: 2000, expense: 800 }
}
```

---

## 🔧 MANUEL KONTROL (SQL)

Supabase SQL Editor'ünde şu query çalıştır:

```sql
-- Kaç kayıt migre edildi?
SELECT COUNT(*) as toplam FROM accounting_eur_records;

-- Yıl bazında dağılım
SELECT fiscal_year, COUNT(*) FROM accounting_eur_records 
GROUP BY fiscal_year ORDER BY fiscal_year DESC;

-- Sphäre bazında dağılım
SELECT sphaere, transaction_type, SUM(amount_gross) 
FROM accounting_eur_records 
GROUP BY sphaere, transaction_type;
```

---

## ⚙️ YAPILANDIRMA: KATEGORY → SPHÄRE EŞLEŞTİRMESİ

Eğer otomatik eşleştirme yanlış ise, [`eurInitializer.js`](../src/utils/eurInitializer.js) dosyasında bu satırları düzenleyebilirsin:

```javascript
const catLower = catName.toLowerCase();
if (catLower.match(/zins|konto|kredit|bank|faiz/)) {
  sphaere = 'vermögensv'; // ← BURAYA KENDİ KURALLARI EKLE
}
```

---

## 📱 WEB ARAYÜZÜNDE KULLANMA

**Kurulum tamamlandıktan sonra:**

1. **http://localhost:3000/admin/buchhaltung** aç
2. **"Resmi Belgeler"** sekmesine tıkla
3. **"EÜR"** kartını seç
4. **"İşlem Kayıtları"** ve **"Özet ve Raporlar"** sekmelerini gez

**Göreceklerin:**
- ✅ Tüm geçmiş veriler listele
- ✅ Her sphäre için otomatik Gelir-Gider-Net hesaplamaları
- ✅ Yeni kayıtlar ekleme/düzenleme/silme yeteneği
- ✅ Filtreler (Mali Yıl, Sphäre, Tür)

---

## 🔐 VERILERIN GÜVENLİĞİ

- ✅ `created_by: 'system'` ile işaretlenen veriler migre edilmiş verileri gösterir
- ✅ Orijinal `accounting_transactions` verileri **KORUNMAKTADIR** (silinmiyor)
- ✅ İstersen `clearEURRecords()` fonksiyonu ile sadece migre verileri silebilirsin

---

## 🆘 SORUN GIDERME

### "Migration hatası"
**Çözüm:** 
1. Supabase veritabanı bağlantısını kontrol et
2. `update_eur_records_table.sql` işlediğinden emin ol
3. Tarayıcı konsolundaki hata mesajını oku

### "Hiç veri görülmüyor"
**Çözüm:**
1. Uygulamayı tamamen kapat ve yeniden başlat
2. Browser cache'i temizle (Ctrl+Shift+Delete)
3. Supabase'de tabloyu manuel kontrol et

### "Sphäre yanlış atandı"
**Çözüm:**
1. İlgili kaydı EÜR arayüzünde manuel düzenle
2. Ya da kategori adını değiştir ve yeniden migre ettir

---

## 📝 ÖZET

| Adım | Nerede | Ne Yapılacak |
|---|---|---|
| 1 | Supabase SQL | `update_eur_records_table.sql` çalıştır |
| 2 | React (Otomatik) | App başlatıldığında migration tetiklenir |
| 3 | Web Arayüzü | `/admin/buchhaltung` → Resmi Belgeler → EÜR |

**Tamamlandı!** 🎉 Artık tüm muhasebe verilerin Alman e.V. standartlarına uygun EÜR formatında tutulmuştur.
