// src/pages/Presse.js
import React, { useState } from 'react';
import PageBanner from '../components/PageBanner';
import ArticleCard from '../components/ArticleCard';
import Modal from 'react-modal';

// Resimleri import edelim
import presseBannerImage from '../assets/images/presse-banner.png';
import presse1 from '../assets/images/presse-1.jpg';
import presse2 from '../assets/images/presse-2.jpg';
import presse3 from '../assets/images/presse-3.jpg';
import presse4 from '../assets/images/presse-4.jpg'; 
import presse5 from '../assets/images/presse-5.jpg'; 
import presse6 from '../assets/images/presse-6.jpg'; 
import presse7 from '../assets/images/presse-7.jpg'; 
import presse8 from '../assets/images/presse-8.jpg'; 


Modal.setAppElement('#root');

const Presse = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const openModal = (image) => {
        setSelectedImage(image);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedImage(null);
    };

    // Diziyi 6 habere çıkaralım
    const articles = [
        {
            publication: "Rhein-Zeitung",
            date: "12 September 2025",
            title: "Bürgertreff Wissen: Ein neuer Ort der Begegnung",
            image: presse1 
        },
        {
            publication: "Wochen-Kurier",
            date: "10 September 2025",
            title: "Wie der Bürgertreff die Nachbarschaftshilfe neu belebt",
            image: presse2
        },
        {
            publication: "AK-Kurier",
            date: "05 September 2025",
            title: "Erfolgreicher Start für das 'Sprachtreffen'",
            image: presse3
        },
        {
            publication: "Siegener Zeitung",
            date: "01 September 2025",
            title: "Bürgertreff Unterwegs: Gemeinsam die Heimat entdecken",
            image: presse4
        },
        {
            publication: "LokalAnzeiger",
            date: "28 August 2025",
            title: "Ehrenamt im Fokus: Das Engagement im Bürgertreff",
            image: presse5
        },
        {
            publication: "Rhein-Zeitung",
            date: "25 August 2025",
            title: "Nachbarschaftsbörse verbindet Generationen",
            image: presse6
        },
          {
            publication: "Rhein-Zeitung",
            date: "20 September 2025",
            title: "Erkennungszeichen für Wissener Bürgertreff - Komm ren",
            image: presse7
        },
           {
            publication: "Wissener",
            date: "24 September 2025",
            title: "Neues vom Bürgertreff Wissen Logo und E-Mail Adresse ",
            image: presse8
        }
    ];

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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {articles.map((article, index) => (
                            <ArticleCard 
                                key={index}
                                publication={article.publication}
                                date={article.date}
                                title={article.title}
                                imageUrl={article.image}
                                onClick={() => openModal(article.image)}
                            />
                        ))}
                    </div>
                </div>
            </main>

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