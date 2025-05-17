import React from 'react';
import { Menu, Moon, Sun, Upload } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useFileContext } from '../contexts/FileContext';
import FileUploader from './FileUploader';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between px-4 transition-colors duration-200">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mr-4"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold">DocuScan</h1>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Upload</span>
        </button>
        
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {uploadModalOpen && (
        <FileUploader isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
      )}
    </header>
  );
};

export default Header;