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
      className={`export-button ${isExporting ? 'exporting' : ''}`}
      onClick={onExport}
      disabled={disabled || isExporting}
      aria-label={isExporting ? `Exporting video (${progress}%)` : 'Export video'}
      role="button"
    >
      <span className="button-icon">
        {isExporting ? '⏳' : '💾'}
      </span>
      <span className="button-text">
        {isExporting ? `Exporting... ${progress}%` : 'Export Video'}
      </span>
      {isExporting && (
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </button>
  );
};

export default ExportButton;
