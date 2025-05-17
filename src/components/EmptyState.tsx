import React from 'react';
import { Upload, FileText } from 'lucide-react';
import FileUploader from './FileUploader';

const EmptyState: React.FC = () => {
  const [isUploaderOpen, setIsUploaderOpen] = React.useState(false);

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto p-8 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <FileText className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
        
        <h2 className="text-xl font-semibold mb-2">No Document Selected</h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Upload an image or PDF to extract text, annotate, and generate summaries.
        </p>
        
        <button
          onClick={() => setIsUploaderOpen(true)}
          className="flex items-center justify-center mx-auto space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Upload a Document</span>
        </button>
      </div>
      
      {isUploaderOpen && (
        <FileUploader isOpen={isUploaderOpen} onClose={() => setIsUploaderOpen(false)} />
      )}
    </div>
  );
};

export default EmptyState;