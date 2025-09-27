/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // GÜNCELLENDİ: Tüm özel renklerinizin tanımlandığı 'colors' objesi
      colors: {
        // Not: Bu renk kodları varsayımsaldır. Kendi projenizdeki
        // doğru değerlerle değiştirebilirsiniz.
        'rcBlue': '#1E3A8A',        // Örnek Mavi
        'rcRed': '#EF4444',         // Örnek Kırmızı
        'rcDarkGray': '#374151',    // Örnek Koyu Gri
        'rcLightBlue': '#BFDBFE',   // Örnek Açık Mavi
        'rcAccentYellow': '#FBBF24', // Örnek Sarı
        
        // YENİ: Eksik olan gri renk eklendi (açık bir gri tonu)
        'rcGray': '#F3F4F6', 
      },
      
      // Kayan yazı animasyonu
      animation: {
        'marquee': 'marquee 15s linear infinite',
      },
      
      // Animasyonun keyframe'leri
      keyframes: {
        marquee: {
         '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      
      // Font aileleri
      fontFamily: {
        'market': ['"Permanent Marker"', 'cursive'],
        'fraktur': ['"Fraktur"', 'cursive'], 
        'dancing': ['"Dancing Script"', 'cursive']
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}