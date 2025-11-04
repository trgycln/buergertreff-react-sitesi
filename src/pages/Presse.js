// src/pages/Presse.js
// DÜZELTME: Sayfa artık statik verileri değil, Supabase'den dinamik verileri çekiyor.

import React, { useState, useEffect } from 'react'; // useEffect eklendi
import { supabase } from '../supabaseClient'; // Supabase eklendi
import PageBanner from '../components/PageBanner';
import ArticleCard from '../components/ArticleCard';
import Modal from 'react-modal';

// Resimleri import edelim
import presseBannerImage from '../assets/images/presse-banner.png';
// DÜZELTME: Statik resim importları kaldırıldı (presse1, presse2, vb.)
// Resimler artık veritabanından 'image_url' olarak geliyor.

Modal.setAppElement('#root');

const Presse = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // --- YENİ: Dinamik veriler için state'ler ---
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // --- BİTİŞ: YENİ ---

    // DÜZELTME: Statik 'articles' dizisi kaldırıldı.

    // --- YENİ: Supabase'den verileri çekme ---
    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('presse_articles')
                .select('*')
                .eq('is_public', true) // Sadece 'public' olarak işaretlenenler
                .order('article_date', { ascending: false }); // En yeni tarihli olan en üstte

            if (error) {
                console.error("Fehler beim Laden der Presseartikel:", error);
                setError("Presseartikel konnten nicht geladen werden.");
            } else {
                setArticles(data);
            }
            setLoading(false);
        };

        fetchArticles();
    }, []); // Sayfa yüklendiğinde bir kez çalışır
    // --- BİTİŞ: YENİ ---


    const openModal = (image) => {
        setSelectedImage(image);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedImage(null);
    };

    // --- YENİ: Yüklenme ve Hata durumları için render fonksiyonları ---
    const renderContent = () => {
        if (loading) {
            return <p className="text-center text-lg text-gray-500">Lade Presseartikel...</p>;
        }

        if (error) {
            return <p className="text-center text-lg text-rcRed">{error}</p>;
        }

        if (articles.length === 0) {
            return <p className="text-center text-lg text-gray-500">Aktuell sind keine Presseartikel vorhanden.</p>;
        }

        // Başarılı: Makaleleri render et
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article) => (
                    <ArticleCard 
                        key={article.id} // 'index' yerine 'id' kullanmak daha iyidir
                        publication={article.publication}
                        date={article.article_date} // Formatlama gerekirse ArticleCard içinde yapılabilir
                        title={article.title}
                        imageUrl={article.image_url} // Veritabanından gelen URL
                        onClick={() => openModal(article.image_url)} // Tıklayınca veritabanı URL'sini aç
                    />
                ))}
            </div>
        );
    };
    // --- BİTİŞ: YENİ ---

    return (
        <div>
            <PageBanner 
                title="Presse über uns"
                imageUrl={presseBannerImage}
            />

            <main className="py-12 md:py-20 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-800">Wir in den Medien</h2>
                        <p className="mt-4 text-lg text-gray-600">
                            Klicken Sie auf einen Artikel, um die vollständige Ansicht zu öffnen.
                        </p>
                    </div>

                    {/* DÜZELTME: Statik grid yerine dinamik render fonksiyonu çağrılır */}
                    {renderContent()}

                </div>
            </main>

            {/* Modal (Büyütme) bölümü aynı kaldı */}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                contentLabel="Presseartikel"
                className="max-w-4xl max-h-[90vh] p-4 bg-white rounded-lg shadow-xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                overlayClassName="fixed inset-0 bg-black bg-opacity-75"
            >
                <button onClick={closeModal} className="absolute top-4 right-4 text-2xl font-bold text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center">&times;</button>
                <img src={selectedImage} alt="Presseartikel in Großansicht" className="w-full h-full object-contain" />
            </Modal>
        </div>
    );
};

export default Presse;