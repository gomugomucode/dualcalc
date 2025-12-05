
import React from 'react';

interface CalculatorButtonProps {
  label: string;
  onClick: (label: string) => void;
  className?: string;
}

const CalculatorButton: React.FC<CalculatorButtonProps> = ({ label, onClick, className = '' }) => {
  // Base classes for all buttons
  // Removed 'aspect-square' to allow flexbox/grid sizing
  // Added 'h-full w-full' to fill the grid cell
  const baseClasses = 'h-full w-full text-xl md:text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-orange-500 transition-colors duration-200 flex items-center justify-center shadow-sm';

  // Default styling for number buttons
  const defaultClasses = 'bg-gray-800 hover:bg-gray-700 rounded-2xl';

  // Combine all classes
  const combinedClasses = `${baseClasses} ${className || defaultClasses}`;

  const handleClick = () => {
    // Attempt to vibrate the device for tactile feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10); // Short 10ms pulse
    }
    onClick(label);
  };

  return (
    <button
      onClick={handleClick}
      className={combinedClasses}
    >
      {label}
    </button>
  );
};

export default CalculatorButton;
