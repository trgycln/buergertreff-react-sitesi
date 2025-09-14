// src/components/VideoPlayer.js
import React, { useState } from 'react';
import Modal from 'react-modal';
import { FaPlayCircle, FaTimes } from 'react-icons/fa';

Modal.setAppElement('#root');

const VideoPlayer = ({ videoId, thumbnailSrc }) => {
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const openModal = () => setModalIsOpen(true);
    const closeModal = () => setModalIsOpen(false);

    return (
        <div>
            <div 
                onClick={openModal} 
                className="relative cursor-pointer group rounded-lg shadow-lg overflow-hidden h-96 w-full"
            >
                <img src={thumbnailSrc} alt="Video Thumbnail" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <FaPlayCircle className="text-white text-7xl opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                contentLabel="Video Player"
                className="bg-transparent border-none p-0 w-full h-full flex items-center justify-center"
                overlayClassName="fixed inset-0 bg-black bg-opacity-80 z-50"
            >
                <div className="relative w-full max-w-4xl aspect-video">
                    <button onClick={closeModal} className="absolute -top-10 right-0 text-white text-3xl hover:text-gray-300 z-50">
                        <FaTimes />
                    </button>
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </Modal>
        </div>
    );
};

export default VideoPlayer;