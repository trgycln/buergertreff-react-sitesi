import React from 'react';

const Hero = ({ imageUrl, videoUrl, children }) => {
  return (
    <div className="relative h-screen flex items-center justify-center text-center text-white px-4 overflow-hidden">
      {videoUrl ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
          src={videoUrl}
        />
      ) : (
        <div
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${imageUrl})` }}
        ></div>
      )}
      <div className="absolute inset-0 bg-rcBlue opacity-60 z-10"></div>
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
};

export default Hero;