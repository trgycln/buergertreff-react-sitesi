// src/components/Layout.js
import React from 'react';
import { Helmet } from 'react-helmet-async';

// Layout bileşeni, tüm sayfanızı sarar ve SEO verilerini (title, description) alır.
const Layout = ({ children, title, description }) => {
    // Ana URL'niz: https://buergertreff.wissen.de
    const siteUrl = "https://buergertreff.wissen.de";
    const defaultTitle = "Bürgertreff Wissen | Miteinander füreinander";
    const defaultDescription = "Bürgertreff Wissen e.V. – Ein offener Ort für Begegnungen, Unterstützung und bürgerschaftliches Engagement im Großraum Wissen/Sieg.";

    return (
        <>
            <Helmet>
                {/* Dinamik Başlık: Eğer başlık yoksa, varsayılanı kullanır */}
                <title>{title ? `${title} | Bürgertreff Wissen` : defaultTitle}</title> 
                
                {/* Dinamik Açıklama: Eğer açıklama yoksa, varsayılanı kullanır */}
                <meta name="description" content={description || defaultDescription} />
                
                {/* Genel Meta Etiketler (Tüm Sayfalar İçin) */}
                <meta property="og:url" content={siteUrl} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={title || defaultTitle} />

                {/* Eğer Footer ve Header gibi bileşenleriniz varsa buraya ekleyebilirsiniz */}
            </Helmet>
            
            {/* Sayfanın asıl içeriği buraya gelir */}
            {children}
            
            {/* Eğer Footer'ınız varsa buraya ekleyebilirsiniz */}
        </>
    );
};

export default Layout;