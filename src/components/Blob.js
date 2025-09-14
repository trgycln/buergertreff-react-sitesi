// src/components/Blob.js
import React from 'react';

// Yeni 'color' prop'unu ekledik. Varsayılan renk rcLightBlue.
const Blob = ({ className, color = '#eef4ff' }) => {
    return (
        <div className={className}>
            <svg id="visual" viewBox="0 0 900 600" width="900" height="600" xmlns="http://www.w3.org/2000/svg" version="1.1">
                <g transform="translate(460 300)">
                    {/* 'fill' özelliği artık dışarıdan gelen 'color' prop'unu kullanıyor */}
                    <path d="M129.5 -125.6C163.7 -92.9 184.4 -46.4 184.5 0.2C184.6 46.8 164.1 93.7 129.4 121.9C94.7 150.1 47.3 159.7 2.3 158.4C-42.8 157.1 -85.6 145 -111.9 116.4C-138.2 87.8 -148 43.9 -145.3 1.9C-142.6 -40.1 -127.4 -80.2 -99.3 -113.6C-71.2 -147 -35.6 -173.7 5.7 -179.3C47 -184.9 94.1 -169.2 129.5 -125.6" fill={color}></path>
                </g>
            </svg>
        </div>
    );
};

export default Blob;