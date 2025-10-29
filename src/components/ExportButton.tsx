import React, { useState } from 'react';
import ExportDialog from './ExportDialog';
import type { ExportOptions, ExportStatus, ExportProgress } from '../types/export';

interface ExportButtonProps {
  onExport: (options: ExportOptions) => void;
  disabled?: boolean;
  exportStatus: ExportStatus;
  exportProgress: ExportProgress | null;
  totalDuration: number;
}

const ExportButton: React.FC<ExportButtonProps> = ({ 
  onExport,
  disabled = false,
  exportStatus,
  exportProgress,
  totalDuration
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isExporting = exportStatus === 'exporting';
  const progress = exportProgress?.percent || 0;

  const handleButtonClick = () => {
    if (!isExporting) {
      setIsDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleExport = (options: ExportOptions) => {
    onExport(options);
    // Keep dialog open to show progress
  };

  return (
    <>
      <button
        className={`flex items-center gap-2 px-6 py-3 border-none rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-base font-semibold cursor-pointer transition-all duration-300 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${
          isExporting ? 'exporting' : ''
        }`}
        onClick={handleButtonClick}
        disabled={disabled || isExporting}
        aria-label={isExporting ? `Exporting video (${progress.toFixed(0)}%)` : 'Export video'}
        role="button"
      >
        <span className="text-lg">
          {isExporting ? '⏳' : '💾'}
        </span>
        <span className="font-semibold">
          {isExporting ? `Exporting... ${progress.toFixed(0)}%` : 'Export Video'}
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

      <ExportDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onExport={handleExport}
        exportStatus={exportStatus}
        exportProgress={exportProgress}
        totalDuration={totalDuration}
      />
    </>
  );
};

export default ExportButton;
