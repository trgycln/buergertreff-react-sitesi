// src/components/ImageCarousel.js
import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';

const ImageCarousel = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);

    const goToPrevious = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    const openLightbox = (image) => {
        setLightboxImage(image);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
        setLightboxImage(null);
    };
    
    // Lightbox içindeki navigasyon fonksiyonları
    const goToLightboxPrevious = (e) => {
        e.stopPropagation(); // Arka plana tıklamayı engelle
        const currentImageIndex = images.indexOf(lightboxImage);
        const newIndex = (currentImageIndex - 1 + images.length) % images.length;
        setLightboxImage(images[newIndex]);
    };

    const goToLightboxNext = (e) => {
        e.stopPropagation(); // Arka plana tıklamayı engelle
        const currentImageIndex = images.indexOf(lightboxImage);
        const newIndex = (currentImageIndex + 1) % images.length;
        setLightboxImage(images[newIndex]);
    };

    return (
        <div className="relative h-96 w-full"> {/* Yükseklik ve genişlik ayarlandı */}
            <div className="relative w-full h-full overflow-hidden rounded-lg shadow-lg">
                <img 
                    src={images[currentIndex]} 
                    alt={`Carousel Image ${currentIndex + 1}`} 
                    className="w-full h-full object-cover cursor-pointer" 
                    onClick={() => openLightbox(images[currentIndex])}
                />
                
                <button onClick={goToPrevious} className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors z-10"><FaChevronLeft /></button>
                <button onClick={goToNext} className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors z-10"><FaChevronRight /></button>
            </div>

            {lightboxOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={closeLightbox}>
                    <div className="relative max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <button onClick={closeLightbox} className="absolute -top-10 right-0 text-white text-3xl hover:text-gray-300 transition-colors z-50"><FaTimes /></button>
                        <img src={lightboxImage} alt="" className="max-w-full max-h-[90vh] object-contain" />
                        <button onClick={goToLightboxPrevious} className="absolute top-1/2 -left-12 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors z-50"><FaChevronLeft /></button>
                        <button onClick={goToLightboxNext} className="absolute top-1/2 -right-12 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors z-50"><FaChevronRight /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageCarousel;