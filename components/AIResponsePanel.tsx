
import React, { useEffect, useState } from 'react';

interface AIResponsePanelProps {
  isOpen: boolean;
  isLoading: boolean;
  response: string;
  onClose: () => void;
}

const AIResponsePanel: React.FC<AIResponsePanelProps> = ({ isOpen, isLoading, response, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible && !isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className={`bg-gray-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col max-h-[80vh] transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-800 px-5 py-4 flex justify-between items-center border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <h2 className="text-lg font-semibold text-white">AI Explanation</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-purple-300 text-sm animate-pulse">Thinking...</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-gray-200 whitespace-pre-wrap text-base leading-relaxed">
                {response}
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-800/50 px-5 py-3 border-t border-gray-700 shrink-0 flex justify-end">
            <button 
                onClick={onClose}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full font-medium text-sm transition-all shadow-lg"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default AIResponsePanel;
