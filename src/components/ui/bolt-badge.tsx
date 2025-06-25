import React from 'react';

interface BoltBadgeProps {
  variant?: 'white' | 'black' | 'text';
  className?: string;
}

export const BoltBadge: React.FC<BoltBadgeProps> = ({ 
  variant = 'black', 
  className = '' 
}) => {
  const getBadgeImage = () => {
    switch (variant) {
      case 'white':
        return '/badge/white_circle_360x360.png';
      case 'black':
        return '/badge/black_circle_360x360.png';
      case 'text':
        return '/badge/logotext_poweredby_360w.png';
      default:
        return '/badge/black_circle_360x360.png';
    }
  };

  const getBadgeAlt = () => {
    switch (variant) {
      case 'white':
        return 'Built with Bolt.new - White Badge';
      case 'black':
        return 'Built with Bolt.new - Black Badge';
      case 'text':
        return 'Powered by Bolt.new';
      default:
        return 'Built with Bolt.new';
    }
  };

  return (
    <a
      href="https://bolt.new/"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block transition-opacity hover:opacity-80 ${className}`}
      aria-label="Built with Bolt.new"
    >
      <img
        src={getBadgeImage()}
        alt={getBadgeAlt()}
        className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain"
        loading="lazy"
      />
    </a>
  );
};
