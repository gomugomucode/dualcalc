
import React, { useState, useEffect } from 'react';

interface HistoryPanelProps {
  history: string[];
  onClose: () => void;
  onClear: () => void;
  onItemClick: (entry: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onClose, onClear, onItemClick }) => {
  const [visible, setVisible] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    // Animate in on mount
    setVisible(true);

    // Prevent background scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300); // Match animation duration
  };

  const handleClearClick = () => {
    setShowConfirm(true);
  };

  const confirmClear = () => {
    onClear();
    setShowConfirm(false);
  };

  return (
    <div 
      className={`fixed inset-0 bg-black z-20 flex flex-col justify-end transition-opacity duration-300 ${visible ? 'bg-opacity-50' : 'bg-opacity-0'}`} 
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
    >
      <div 
        className={`bg-gray-900 text-white w-full rounded-t-3xl p-4 shadow-lg flex flex-col max-h-[60%] transition-transform duration-300 ease-out relative ${visible ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-3">
          <h2 id="history-title" className="text-xl font-semibold">History</h2>
          <button
            onClick={handleClearClick}
            className="text-orange-500 hover:text-orange-400 font-semibold disabled:text-gray-500 transition-colors"
            disabled={history.length === 0}
            aria-label="Clear history"
          >
            Clear
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto text-right pr-2">
          {history.length === 0 ? (
            <p className="text-gray-400 text-center mt-8">No history yet</p>
          ) : (
            <ul>
              {history.map((entry, index) => {
                const [expr, result] = entry.split(' = ');
                return (
                  <li key={index} className="mb-4">
                    <button 
                      onClick={() => onItemClick(entry)}
                      className="w-full text-right hover:bg-gray-800 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <div className="text-gray-400 text-lg break-words">{expr} =</div>
                      <div className="text-3xl font-light">{result}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className="mt-4 w-full bg-gray-700 text-white font-semibold py-3 px-4 rounded-full hover:bg-gray-600 transition-colors"
          aria-label="Close history"
        >
          Close
        </button>

        {/* Confirmation Overlay */}
        {showConfirm && (
          <div className="absolute inset-0 bg-gray-900/95 rounded-t-3xl flex flex-col items-center justify-center p-6 z-10 transition-opacity animate-in fade-in">
             <div className="text-center w-full max-w-xs">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center mb-4 text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Clear all history?</h3>
                <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmClear}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-sm transition-colors"
                  >
                    Clear All
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
