import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { FileProvider } from './contexts/FileContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ThemeProvider>
      <FileProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
          <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
            <Sidebar isOpen={sidebarOpen} />
            <MainContent sidebarOpen={sidebarOpen} />
          </div>
        </div>
      </FileProvider>
    </ThemeProvider>
  );
}

export default App;