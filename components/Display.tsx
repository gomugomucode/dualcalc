
import React, { useState, useRef, useEffect } from 'react';
import { AngleMode } from '../types';

interface DisplayProps {
  expression: string;
  displayValue: string;
  angleMode: AngleMode;
  onPaste?: (text: string) => boolean;
}

const Display: React.FC<DisplayProps> = ({ expression, displayValue, angleMode, onPaste }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  // Clear toast after animation
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Close menu when clicking outside
  useEffect(() => {
    const closeMenu = () => setMenuOpen(false);
    if (menuOpen) {
      window.addEventListener('click', closeMenu);
      return () => window.removeEventListener('click', closeMenu);
    }
  }, [menuOpen]);

  const handlePointerDown = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      setMenuOpen(true);
      // Haptic feedback if available
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 600); // 600ms for long press
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePointerLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent closing menu immediately
    try {
      await navigator.clipboard.writeText(displayValue);
      setToast({ message: 'Copied!', visible: true });
    } catch (err) {
      console.error('Failed to copy', err);
      setToast({ message: 'Copy failed', visible: true });
    }
    setMenuOpen(false);
  };

  const handlePasteAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const text = await navigator.clipboard.readText();
      if (onPaste && onPaste(text)) {
         // Paste successful handled by parent
      } else {
        setToast({ message: 'Invalid Number', visible: true });
      }
    } catch (err) {
      console.error('Failed to paste', err);
      setToast({ message: 'Paste failed', visible: true });
    }
    setMenuOpen(false);
  };

  // Function to format the display value with commas for readability
  const formatDisplayValue = (value: string) => {
    // Return text as-is if it's an error message or NaN
    if (Number.isNaN(Number(value)) || value.includes('e')) {
      return value;
    }
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };
  
  // Check if current display value is an error state
  const isError = ['Error', "Can't divide by 0", 'Invalid Input', 'Format Error'].includes(displayValue);
  
  return (
    <div 
      className="relative text-right break-words h-48 flex flex-col justify-end border border-gray-700 bg-gray-900/50 rounded-3xl p-4 box-border w-full select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()} // Prevent native context menu
    >
      {/* Angle Mode Indicator */}
      <div className="absolute top-3 left-4 text-gray-500 text-xs font-bold tracking-wider">
        {angleMode.toUpperCase()}
      </div>

      {/* Expression History */}
      <div className="text-gray-400 text-lg mb-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {expression}
      </div>
      
      {/* Main Display */}
      <div className={`text-5xl tracking-tight overflow-x-auto whitespace-nowrap scrollbar-hide ${isError ? 'text-red-500 font-normal' : 'text-white font-light'}`}>
        {formatDisplayValue(displayValue)}
      </div>

      {/* Context Menu Popup */}
      {menuOpen && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 flex overflow-hidden">
          <button 
            onClick={handleCopy}
            className="px-4 py-2 text-white hover:bg-gray-700 active:bg-gray-600 font-medium text-sm border-r border-gray-700"
          >
            Copy
          </button>
          <button 
            onClick={handlePasteAction}
            className="px-4 py-2 text-white hover:bg-gray-700 active:bg-gray-600 font-medium text-sm"
          >
            Paste
          </button>
        </div>
      )}

      {/* Toast Notification */}
      <div 
        className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-3 rounded-full transition-opacity duration-300 pointer-events-none ${toast.visible ? 'opacity-100' : 'opacity-0'}`}
      >
        {toast.message}
      </div>
    </div>
  );
};

export default Display;
