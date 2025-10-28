import React, { useState } from 'react';
import { useMediaLibrary } from '../contexts/MediaLibraryContext';

interface ImportButtonProps {
  onImport?: () => void;
  disabled?: boolean;
}

const ImportButton: React.FC<ImportButtonProps> = ({ onImport, disabled = false }) => {
  const [isImporting, setIsImporting] = useState(false);
  const { addClips, setError } = useMediaLibrary();

  const handleImport = async () => {
    if (isImporting) return;
    
    setIsImporting(true);
    setError(null);

    try {
      const result = await window.electronAPI.importVideoPicker();
      
      if (result.success && result.clips.length > 0) {
        addClips(result.clips);
        onImport?.();
        console.log(`Successfully imported ${result.clips.length} video clips`);
      }
      
      if (result.errors.length > 0) {
        setError(`Some files failed to import: ${result.errors.join(', ')}`);
      }
      
      if (!result.success && result.clips.length === 0) {
        setError('No files were imported');
      }
    } catch (error) {
      console.error('Import error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <button
      className={`flex items-center gap-2 px-6 py-3 border-none rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-base font-semibold cursor-pointer transition-all duration-300 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${
        isImporting ? 'importing' : ''
      }`}
      onClick={handleImport}
      disabled={disabled || isImporting}
      aria-label="Import video file"
      role="button"
    >
      <span className="text-lg">
        {isImporting ? '⏳' : '📁'}
      </span>
      <span className="font-semibold">
        {isImporting ? 'Importing...' : 'Import Video'}
      </span>
    </button>
  );
};

export default ImportButton;
