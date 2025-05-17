import { createWorker } from 'tesseract.js';
import * as PDFJS from 'pdfjs-dist';

// Initialize PDF.js worker
PDFJS.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;

export const processImage = async (file: File): Promise<string> => {
  try {
    const worker = await createWorker();
    const base64 = await fileToBase64(file);
    const { data } = await worker.recognize(base64);
    await worker.terminate();
    return data.text;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
};

export const processPdf = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await fileToArrayBuffer(file);
    const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error('Failed to process PDF');
  }
};

export const processSelectedRegion = async (
  image: HTMLImageElement,
  selection: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  try {
    // Create a canvas to crop the selected region
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // Calculate the scale factor between the displayed image and original image
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Scale the selection coordinates to match the original image dimensions
    const scaledSelection = {
      x: selection.x * scaleX,
      y: selection.y * scaleY,
      width: selection.width * scaleX,
      height: selection.height * scaleY
    };

    // Set canvas dimensions to scaled selection size
    canvas.width = scaledSelection.width;
    canvas.height = scaledSelection.height;

    // Draw the selected portion of the original image
    ctx.drawImage(
      image,
      scaledSelection.x,
      scaledSelection.y,
      scaledSelection.width,
      scaledSelection.height,
      0,
      0,
      scaledSelection.width,
      scaledSelection.height
    );

    // Convert canvas to base64
    const base64 = canvas.toDataURL('image/png');

    // Process the selected region with Tesseract
    const worker = await createWorker();
    const { data } = await worker.recognize(base64);
    await worker.terminate();

    return data.text.trim();
  } catch (error) {
    console.error('Error processing selected region:', error);
    throw new Error('Failed to process selected region');
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = (error) => reject(error);
  });
};