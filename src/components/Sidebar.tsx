import React from 'react';
import { File, Trash2 } from 'lucide-react';
import { useFileContext } from '../contexts/FileContext';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { files, currentFile, setCurrentFile, removeFile } = useFileContext();

  if (!isOpen) return null;

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-700 h-full bg-white dark:bg-gray-800 transition-all duration-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Documents</h2>
        
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No documents uploaded</p>
            <p className="text-sm mt-2">Upload a document to get started</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li 
                key={file.id}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                  currentFile?.id === file.id 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setCurrentFile(file)}
              >
                <div className="flex items-center space-x-2 overflow-hidden">
                  <File className="h-4 w-4 shrink-0" />
                  <span className="truncate text-sm">
                    {file.file.name}
                    {file.isProcessing && " (processing...)"}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                  aria-label="Delete file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;