// tailwind-test/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rcBlue: '#1a3a6d',       // Refugee Council ana mavisi
        rcRed: '#e42b20',        // Refugee Council ana kırmızısı
        rcLightBlue: '#eef4ff',  // Açık mavi arka planlar için
        rcGray: '#f8f8f8',       // Açık gri arka planlar için
        rcDarkGray: '#333333',   // Koyu gri metinler için
        rcAccentYellow: '#f2c94c', // Vurgu sarısı
        rcAccentGreen: '#27ae60', // Vurgu yeşili
        rcAccentOrange: '#f2994a', // Vurgu turuncusu
        rcAccentPurple: '#9b59b6', // Vurgu moru
      },
      fontFamily: {
        // Genellikle sans-serif bir font kullanılır, örneğin 'Inter' veya 'Open Sans'
        // Bu fontları Google Fonts'tan dahil etmeniz gerekebilir (aşağıda açıklanacak)
        sans: ['Inter', 'sans-serif'], 
        dancing: ['Dancing Script', 'cursive']
      },
      container: {
        center: true, // Konteynerleri otomatik ortala
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
        screens: {
        '2xl': '1600px', // Varsayılan en geniş boyut olan 1536px yerine 1600px kullan.
                         // Bu değeri '1800px' gibi daha da artırabilirsiniz.
      },
      },
    },
  },
  plugins: [],
}