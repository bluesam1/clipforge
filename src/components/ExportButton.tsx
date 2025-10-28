import React from 'react';

interface ExportButtonProps {
  onExport?: () => void;
  disabled?: boolean;
  isExporting?: boolean;
  progress?: number;
}

const ExportButton: React.FC<ExportButtonProps> = ({ 
  onExport, 
  disabled = false, 
  isExporting = false,
  progress = 0 
}) => {
  return (
    <button
      className={`flex items-center gap-2 px-6 py-3 border-none rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-base font-semibold cursor-pointer transition-all duration-300 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${
        isExporting ? 'exporting' : ''
      }`}
      onClick={onExport}
      disabled={disabled || isExporting}
      aria-label={isExporting ? `Exporting video (${progress}%)` : 'Export video'}
      role="button"
    >
      <span className="text-lg">
        {isExporting ? '⏳' : '💾'}
      </span>
      <span className="font-semibold">
        {isExporting ? `Exporting... ${progress}%` : 'Export Video'}
      </span>
      {isExporting && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
          <div 
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </button>
  );
};

export default ExportButton;
