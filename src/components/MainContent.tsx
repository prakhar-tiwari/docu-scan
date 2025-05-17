import React from 'react';
import { useFileContext } from '../contexts/FileContext';
import DocumentViewer from './DocumentViewer';
import TextPanel from './TextPanel';
import EmptyState from './EmptyState';

interface MainContentProps {
  sidebarOpen: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ sidebarOpen }) => {
  const { currentFile } = useFileContext();

  if (!currentFile) {
    return <EmptyState />;
  }

  return (
    <div className={`flex-1 h-full overflow-hidden transition-all duration-200 flex`}>
      <div className="flex-1 flex flex-col md:flex-row h-full">
        <div className="w-full md:w-3/5 h-1/2 md:h-full overflow-auto p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
          <DocumentViewer file={currentFile} />
        </div>
        
        <div className="w-full md:w-2/5 h-1/2 md:h-full overflow-auto">
          <TextPanel file={currentFile} />
        </div>
      </div>
    </div>
  );
};

export default MainContent;