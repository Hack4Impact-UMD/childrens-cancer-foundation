import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './DeadlineBannerStyle.css';

interface BannerProps {
  deadline: Date;
}

const Banner: React.FC<BannerProps> = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const timeDifference = deadlineDate.getTime() - now.getTime();

      if (timeDifference <= 0) {
        setTimeLeft('Deadline has passed!');
        setIsBannerVisible(false);
      }

      setTimeLeft(`DUE ON ${new Date(deadline).toLocaleDateString()}`);
    };

    updateTimeLeft();
  }, [deadline]);

  const handleCloseBanner = () => {
    setIsBannerVisible(false);
  };

  if (!isBannerVisible) return null;

  return (
    <div className='banner'>
        <div className='text-container'>
            <span className='text'><b className='text'>REMINDER:</b> In progress application <b className='text'>{timeLeft}!</b></span>
        </div>
      <button className='closeButton' onClick={handleCloseBanner}>X</button>
    </div>
  );
};

Banner.propTypes = {
  deadline: PropTypes.instanceOf(Date).isRequired,
};

export default Banner;
