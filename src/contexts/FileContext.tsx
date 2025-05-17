import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Document, Packer, Paragraph } from 'docx';
import { jsPDF } from 'jspdf';

export type FileType = {
  id: string;
  file: File;
  preview: string;
  text: string;
  type: 'image' | 'pdf';
  isProcessing: boolean;
  annotations: Annotation[];
  summary: string;
};

export type Annotation = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
};

type UndoRedoState = {
  past: FileType[][];
  present: FileType[];
  future: FileType[][];
};

type FileContextType = {
  currentFile: FileType | null;
  files: FileType[];
  addFiles: (files: File[]) => void;
  setCurrentFile: (file: FileType | null) => void;
  updateFileText: (id: string, text: string) => void;
  updateFileSummary: (id: string, summary: string) => void;
  addAnnotation: (fileId: string, annotation: Omit<Annotation, 'id'>) => void;
  removeAnnotation: (fileId: string, annotationId: string) => void;
  removeFile: (id: string) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  exportToWord: (text: string, filename: string) => void;
  exportToPdf: (text: string, filename: string) => void;
  exportAnnotatedImage: (fileId: string, filename: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearAnnotations: (fileId: string) => void;
};

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
};

export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [undoRedoState, setUndoRedoState] = useState<UndoRedoState>({
    past: [],
    present: [],
    future: [],
  });
  const [currentFile, setCurrentFile] = useState<FileType | null>(null);
  const [searchText, setSearchText] = useState('');

  const updateHistory = (newPresent: FileType[]) => {
    setUndoRedoState(prevState => ({
      past: [...prevState.past, prevState.present],
      present: newPresent,
      future: [],
    }));
  };

  const undo = () => {
    setUndoRedoState(prevState => {
      if (prevState.past.length === 0) return prevState;
      const previous = prevState.past[prevState.past.length - 1];
      const newPast = prevState.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [prevState.present, ...prevState.future],
      };
    });
  };

  const redo = () => {
    setUndoRedoState(prevState => {
      if (prevState.future.length === 0) return prevState;
      const next = prevState.future[0];
      const newFuture = prevState.future.slice(1);
      return {
        past: [...prevState.past, prevState.present],
        present: next,
        future: newFuture,
      };
    });
  };

  const addFiles = (newFiles: File[]) => {
    const newFileObjects = newFiles.map(file => {
      const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';
      const preview = URL.createObjectURL(file);
      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        preview,
        text: '',
        type: fileType,
        isProcessing: true,
        annotations: [],
        summary: '',
      };
    });
    
    const newPresent = [...undoRedoState.present, ...newFileObjects];
    updateHistory(newPresent);
    
    if (!currentFile) {
      setCurrentFile(newFileObjects[0]);
    }
  };

  const clearAnnotations = (fileId: string) => {
    const newPresent = undoRedoState.present.map(file =>
      file.id === fileId ? { ...file, annotations: [] } : file
    );
    updateHistory(newPresent);
    
    if (currentFile?.id === fileId) {
      setCurrentFile(prev => prev ? { ...prev, annotations: [] } : null);
    }
  };

  const addAnnotation = (fileId: string, annotation: Omit<Annotation, 'id'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: Date.now().toString(),
    };
    
    const newPresent = undoRedoState.present.map(file =>
      file.id === fileId
        ? { ...file, annotations: [...file.annotations, newAnnotation] }
        : file
    );
    updateHistory(newPresent);
    
    if (currentFile?.id === fileId) {
      setCurrentFile(prev =>
        prev
          ? { ...prev, annotations: [...prev.annotations, newAnnotation] }
          : null
      );
    }
  };

  const removeAnnotation = (fileId: string, annotationId: string) => {
    const newPresent = undoRedoState.present.map(file =>
      file.id === fileId
        ? {
            ...file,
            annotations: file.annotations.filter(a => a.id !== annotationId),
          }
        : file
    );
    updateHistory(newPresent);
    
    if (currentFile?.id === fileId) {
      setCurrentFile(prev =>
        prev
          ? {
              ...prev,
              annotations: prev.annotations.filter(a => a.id !== annotationId),
            }
          : null
      );
    }
  };

  const removeFile = (id: string) => {
    const newPresent = undoRedoState.present.filter(file => file.id !== id);
    updateHistory(newPresent);
    
    if (currentFile?.id === id) {
      const remainingFiles = undoRedoState.present.filter(file => file.id !== id);
      setCurrentFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
    }
  };

  const updateFileText = (id: string, text: string) => {
    const newPresent = undoRedoState.present.map(file =>
      file.id === id ? { ...file, text, isProcessing: false } : file
    );
    updateHistory(newPresent);
    
    if (currentFile?.id === id) {
      setCurrentFile(prev =>
        prev ? { ...prev, text, isProcessing: false } : null
      );
    }
  };

  const updateFileSummary = (id: string, summary: string) => {
    const newPresent = undoRedoState.present.map(file =>
      file.id === id ? { ...file, summary } : file
    );
    updateHistory(newPresent);
    
    if (currentFile?.id === id) {
      setCurrentFile(prev =>
        prev ? { ...prev, summary } : null
      );
    }
  };

  const exportToWord = async (text: string, filename: string) => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: text
          })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPdf = (text: string, filename: string) => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 15, 15);
    doc.save(`${filename}.pdf`);
  };

  const exportAnnotatedImage = async (fileId: string, filename: string) => {
    const file = undoRedoState.present.find(f => f.id === fileId);
    if (!file || file.type !== 'image') return;

    const img = new Image();
    img.src = file.preview;
    await new Promise(resolve => img.onload = resolve);

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Draw annotations
    file.annotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color + '33';
      ctx.lineWidth = 2;
      ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
      ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height);
    });

    // Export as PDF
    const pdf = new jsPDF({
      orientation: img.width > img.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [img.width, img.height]
    });
    
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, img.width, img.height);
    pdf.save(`${filename}.pdf`);
  };

  return (
    <FileContext.Provider
      value={{
        currentFile,
        files: undoRedoState.present,
        addFiles,
        setCurrentFile,
        updateFileText,
        updateFileSummary,
        addAnnotation,
        removeAnnotation,
        removeFile,
        searchText,
        setSearchText,
        exportToWord,
        exportToPdf,
        exportAnnotatedImage,
        undo,
        redo,
        canUndo: undoRedoState.past.length > 0,
        canRedo: undoRedoState.future.length > 0,
        clearAnnotations,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};