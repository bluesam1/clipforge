import React from 'react';

interface EmptyStateProps {
  onImportClick?: () => void;
  title?: string;
  description?: string;
  showImportButton?: boolean;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  onImportClick,
  title = "No Video Clips",
  description = "Import video files to start editing your timeline",
  showImportButton = true,
  icon,
}) => {
  const defaultIcon = (
    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
      <svg
        className="w-8 h-8 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon || defaultIcon}
      
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {description}
      </p>
      
      {showImportButton && onImportClick && (
        <button
          onClick={onImportClick}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Import Videos
        </button>
      )}
      
      <div className="mt-8 text-sm text-gray-500">
        <p className="mb-2">Supported formats: MP4, MOV</p>
        <p>Drag and drop files or use the import button</p>
      </div>
    </div>
  );
};

export default EmptyState;
