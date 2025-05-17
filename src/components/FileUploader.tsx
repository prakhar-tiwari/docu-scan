import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, FileText, FileImage } from 'lucide-react';
import { useFileContext } from '../contexts/FileContext';

interface FileUploaderProps {
  isOpen: boolean;
  onClose: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ isOpen, onClose }) => {
  const { addFiles } = useFileContext();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Filter for only images and PDFs
      const validFiles = acceptedFiles.filter(
        (file) => file.type.startsWith('image/') || file.type === 'application/pdf'
      );

      if (validFiles.length > 0) {
        addFiles(validFiles);
        onClose();
      }
    },
    [addFiles, onClose]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-xl font-semibold mb-6">Upload Documents</h2>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="flex items-center justify-center mb-4 space-x-2">
            <FileImage className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            <FileText className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
          
          {isDragActive ? (
            <p className="text-blue-500">Drop the files here...</p>
          ) : (
            <>
              <p className="mb-2">
                <span className="font-medium">Click to browse</span> or drag and drop
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Upload multiple images (JPG, PNG) and PDFs
              </p>
            </>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md mr-2"
          >
            Cancel
          </button>
          
          <button
            {...getRootProps()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span>Upload</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;