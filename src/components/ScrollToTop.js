// src/components/ScrollToTop.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    // useLocation kancası, mevcut URL'deki yolu (pathname) ve çapayı (hash) verir.
    const { pathname, hash } = useLocation();

    useEffect(() => {
        // Eğer linkin sonunda bir çapa (#) varsa...
        if (hash) {
            // Tarayıcıya, o ID'ye sahip elementi bulmasını söylüyoruz.
            const element = document.getElementById(hash.substring(1));
            if (element) {
                // Eğer element bulunduysa, o elementin olduğu yere akıcı bir şekilde kay.
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // Eğer çapa yoksa, her zamanki gibi sayfanın en üstüne (0, 0) git.
            window.scrollTo(0, 0);
        }
    }, [pathname, hash]); // Bu etki, hem yol hem de çapa her değiştiğinde çalışır.

    return null; // Bu bileşen ekranda hiçbir şey göstermez.
};

export default ScrollToTop;