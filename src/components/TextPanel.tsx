import React, { useState } from 'react';
import { Copy, Search, FileText, Sparkles, Download, FileOutput } from 'lucide-react';
import { FileType, useFileContext } from '../contexts/FileContext';
import SearchHighlighter from './SearchHighlighter';
import { generateSummary } from '../utils/geminiUtils';

interface TextPanelProps {
  file: FileType;
}

const TextPanel: React.FC<TextPanelProps> = ({ file }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState(file.text);
  const [activeTab, setActiveTab] = useState<'text' | 'summary'>('text');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const { updateFileText, updateFileSummary, searchText, setSearchText, exportToWord, exportToPdf, exportAnnotatedImage } = useFileContext();
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Update local state when file text changes
  React.useEffect(() => {
    setEditableText(file.text);
  }, [file.text]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(activeTab === 'text' ? file.text : file.summary);
  };

  const handleSaveEdit = () => {
    updateFileText(file.id, editableText);
    setIsEditing(false);
  };

  const handleGenerateSummary = async () => {
    try {
      setIsGeneratingSummary(true);
      setSummaryError(null);
      const summary = await generateSummary(file.text);
      updateFileSummary(file.id, summary);
      setActiveTab('summary');
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryError('Failed to generate summary. Please try again later.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleExport = (type: 'word' | 'pdf' | 'annotated') => {
    const filename = file.file.name.split('.')[0];
    if (type === 'word') {
      exportToWord(activeTab === 'text' ? file.text : file.summary, filename);
    } else if (type === 'pdf') {
      exportToPdf(activeTab === 'text' ? file.text : file.summary, filename);
    } else if (type === 'annotated') {
      exportAnnotatedImage(file.id, filename);
    }
    setShowExportMenu(false);
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('text')}
            className={`pb-1 font-medium ${activeTab === 'text'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            Extracted Text
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-1 font-medium ${activeTab === 'summary'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            AI Summary
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'text' && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 p-1"
              title="Edit text"
            >
              <FileText className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={handleCopyText}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 p-1"
            title="Copy to clipboard"
          >
            <Copy className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 p-1"
              title="Export"
            >
              <Download className="h-4 w-4" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleExport('word')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <FileOutput className="h-4 w-4 mr-2" />
                  Export as Word
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <FileOutput className="h-4 w-4 mr-2" />
                  Export as PDF
                </button>
                {file.type === 'image' && (
                  <button
                    onClick={() => handleExport('annotated')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <FileOutput className="h-4 w-4 mr-2" />
                    Export Annotated Image
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'text' && (
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search in text..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      )}

      {activeTab === 'text' ? (
        isEditing ? (
          <div className="flex-1 flex flex-col">
            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              className="flex-1 p-4 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 transition-colors resize-none"
            />

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setEditableText(file.text);
                  setIsEditing(false);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
            {file.text ? (
              <SearchHighlighter
                text={file.text}
                searchTerm={searchText}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                {file.isProcessing
                  ? 'Processing document...'
                  : 'No text extracted'}
              </p>
            )}
          </div>
        )
      ) : (
        <div className="flex-1 flex flex-col">
          {file.summary ? (
            <div className="flex-1 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <p>{file.summary}</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
              <Sparkles className="h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Generate AI Summary</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-sm">
                Let AI analyze your document and create a concise summary of the key points.
              </p>
              {summaryError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-red-600 dark:text-red-400 text-sm">{summaryError}</p>
                </div>
              )}
              <button
                onClick={handleGenerateSummary}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md flex items-center"
                disabled={!file.text || file.isProcessing || isGeneratingSummary}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isGeneratingSummary ? 'Generating Summary...' : 'Generate Summary'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TextPanel;