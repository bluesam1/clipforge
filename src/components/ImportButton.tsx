import React from 'react';

interface ImportButtonProps {
  onImport?: () => void;
  disabled?: boolean;
}

const ImportButton: React.FC<ImportButtonProps> = ({ onImport, disabled = false }) => {
  return (
    <button
      className="import-button"
      onClick={onImport}
      disabled={disabled}
      aria-label="Import video file"
      role="button"
    >
      <span className="button-icon">📁</span>
      <span className="button-text">Import Video</span>
    </button>
  );
};

export default ImportButton;
