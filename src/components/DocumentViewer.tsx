import React, { useEffect, useRef, useState } from 'react';
import { FileType, useFileContext } from '../contexts/FileContext';
import { processImage, processPdf, processSelectedRegion } from '../utils/ocrUtils';
import AnnotationLayer from './AnnotationLayer';
import SelectionLayer from './SelectionLayer';
import { Languages, Type, AlertCircle, Palette, Undo, Redo } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

interface DocumentViewerProps {
  file: FileType;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ file }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [translationError, setTranslationError] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [markerColor, setMarkerColor] = useState('#FF0000');
  const { updateFileText, searchText, addAnnotation, clearAnnotations, undo, redo, canUndo, canRedo } = useFileContext();

  useEffect(() => {
    if (file.isProcessing) {
      const processFile = async () => {
        try {
          let text = '';
          if (file.type === 'image') {
            text = await processImage(file.file);
          } else if (file.type === 'pdf') {
            text = await processPdf(file.file);
          }
          updateFileText(file.id, text);
        } catch (error) {
          console.error('OCR processing error:', error);
          updateFileText(file.id, 'Error processing document');
        }
      };
      processFile();
    }
  }, [file, updateFileText]);

  useEffect(() => {
    const handleImageLoad = () => {
      if (imageRef.current && canvasRef.current && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const imgNaturalWidth = imageRef.current.naturalWidth;
        const imgNaturalHeight = imageRef.current.naturalHeight;
        let width = Math.min(containerWidth, imgNaturalWidth);
        let height = (imgNaturalHeight * width) / imgNaturalWidth;
        setDimensions({ width, height });
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };

    if (imageRef.current) {
      imageRef.current.addEventListener('load', handleImageLoad);
      if (imageRef.current.complete) {
        handleImageLoad();
      }
    }

    return () => {
      if (imageRef.current) {
        imageRef.current.removeEventListener('load', handleImageLoad);
      }
    };
  }, [file]);

  const handleSelectionComplete = async (selection: { x: number; y: number; width: number; height: number }) => {
    setSelection(selection);
    
    if (isAnnotating) {
      // If in annotation mode, directly create annotation without OCR
      addAnnotation(file.id, {
        ...selection,
        text: '',
        color: markerColor
      });
      return;
    }

    // If in selection mode, perform OCR
    if (isSelecting && imageRef.current) {
      const text = await processSelectedRegion(imageRef.current, selection);
      setSelectedText(text);
      setTranslatedText('');
      setTranslationError('');
    }
  };

  const handleCancelSelection = () => {
    setIsSelecting(false);
    setSelection(null);
    setSelectedText('');
    setTranslatedText('');
    setTranslationError('');
  };

  const handleCancelAnnotation = () => {
    setIsAnnotating(false);
    clearAnnotations(file.id);
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    setTranslationError('');
    setTranslatedText('');

    try {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: selectedText,
          source: 'auto',
          target: 'hi',
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`Translation failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.translatedText) {
        setTranslatedText(data.translatedText);
      } else {
        throw new Error('Invalid response from translation service');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationError('Translation failed. Please try again later.');
    } finally {
      setIsTranslating(false);
    }
  };

  const renderDocumentContent = () => {
    if (file.type === 'image') {
      return (
        <div className="relative inline-block">
          <img
            ref={imageRef}
            src={file.preview}
            alt="Document"
            className="max-w-full h-auto"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 pointer-events-none"
            width={dimensions.width}
            height={dimensions.height}
          />
          <AnnotationLayer
            annotations={file.annotations}
            dimensions={dimensions}
            scale={1}
          />
          {(isSelecting || isAnnotating) && (
            <SelectionLayer
              dimensions={dimensions}
              onSelectionComplete={handleSelectionComplete}
            />
          )}
          {selection && !isAnnotating && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/20"
              style={{
                left: selection.x,
                top: selection.y,
                width: selection.width,
                height: selection.height,
              }}
            />
          )}
        </div>
      );
    } else if (file.type === 'pdf') {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <iframe
            src={file.preview + '#toolbar=0'}
            className="w-full h-full"
            title="PDF Document"
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div ref={containerRef} className="h-full overflow-auto">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Document Viewer</h2>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-2 rounded-md ${
              canUndo
                ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-2 rounded-md ${
              canRedo
                ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-1"
            >
              <Palette className="h-4 w-4" />
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: markerColor }}
              />
            </button>
            
            {showColorPicker && (
              <div className="absolute right-0 mt-2 z-10 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <HexColorPicker color={markerColor} onChange={setMarkerColor} />
              </div>
            )}
          </div>

          <button
            onClick={() => isAnnotating ? handleCancelAnnotation() : setIsAnnotating(true)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              isAnnotating
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {isAnnotating ? 'Cancel Annotation' : 'Add Annotation'}
          </button>
          
          <button
            onClick={() => isSelecting ? handleCancelSelection() : setIsSelecting(true)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              isSelecting
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {isSelecting ? 'Cancel Selection' : 'Select Text'}
          </button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden">
        {file.isProcessing ? (
          <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Processing document...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {renderDocumentContent()}
            
            {selectedText && (
              <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Type className="h-4 w-4" />
                    <h3 className="font-medium">Selected Text</h3>
                  </div>
                  <button
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className={`flex items-center space-x-1 px-2 py-1 ${
                      isTranslating
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white rounded-md transition-colors`}
                  >
                    <Languages className="h-4 w-4" />
                    <span>{isTranslating ? 'Translating...' : 'Translate to Hindi'}</span>
                  </button>
                </div>
                
                <p className="text-sm">{selectedText}</p>
                
                {translationError && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">{translationError}</p>
                    </div>
                  </div>
                )}
                
                {translatedText && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium mb-1">Hindi Translation</h4>
                    <p className="text-sm">{translatedText}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;