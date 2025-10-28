import React from 'react';

interface ImportProgressProps {
  isVisible: boolean;
  current: number;
  total: number;
  currentFile?: string;
  onCancel?: () => void;
}

const ImportProgress: React.FC<ImportProgressProps> = ({
  isVisible,
  current,
  total,
  currentFile,
  onCancel
}) => {
  if (!isVisible) return null;

  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="import-progress-overlay">
      <div className="import-progress-modal">
        <div className="import-progress-header">
          <h3>Importing Videos</h3>
          <button 
            className="import-progress-cancel"
            onClick={onCancel}
            aria-label="Cancel import"
          >
            ×
          </button>
        </div>
        
        <div className="import-progress-content">
          <div className="import-progress-bar">
            <div 
              className="import-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="import-progress-text">
            <span className="import-progress-count">
              {current} of {total} files processed
            </span>
            <span className="import-progress-percentage">
              {Math.round(progress)}%
            </span>
          </div>
          
          {currentFile && (
            <div className="import-progress-current">
              Processing: {currentFile}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportProgress;
