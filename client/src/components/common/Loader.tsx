import React from 'react';

interface LoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Loader: React.FC<LoaderProps> = ({ fullScreen = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4'
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Pulsing outer ring */}
        <div className={`rounded-full border-brand-primary/20 border-t-brand-primary animate-spin ${sizeClasses[size]}`} />
        {/* Glow glow glow */}
        <div className="absolute inset-0 rounded-full bg-brand-primary/10 blur-xl animate-pulse" />
      </div>
      {fullScreen && (
        <p className="text-sm font-medium text-gray-400 tracking-wider animate-pulse">
          Loading IntellMeet...
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090a0f] backdrop-blur-sm">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export default Loader;
