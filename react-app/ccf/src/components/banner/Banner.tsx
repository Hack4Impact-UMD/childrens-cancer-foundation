import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Banner.css';
import CloseIcon from '@mui/icons-material/Close';

interface BannerProps {
  children: React.ReactNode;
}

const Banner: React.FC<BannerProps> = ({ children }) => {
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  const handleCloseBanner = () => {
    setIsBannerVisible(false);
  };

  if (!isBannerVisible) return null;

  return (
    <div className='banner'>
        <div className='textContainer'>
            {children}
        </div>
      <button className='closeButton' onClick={handleCloseBanner}><CloseIcon></CloseIcon></button>
    </div>
  );
};

export default Banner;