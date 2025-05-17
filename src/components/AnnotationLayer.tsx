import React from 'react';
import { Annotation } from '../contexts/FileContext';

interface AnnotationLayerProps {
  annotations: Annotation[];
  dimensions: { width: number; height: number };
  scale: number;
}

const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  annotations,
  dimensions,
  scale,
}) => {
  if (annotations.length === 0) return null;

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: dimensions.width,
        height: dimensions.height,
      }}
    >
      {annotations.map((annotation) => (
        <div
          key={annotation.id}
          className="absolute border-2 rounded-sm"
          style={{
            left: annotation.x * scale,
            top: annotation.y * scale,
            width: annotation.width * scale,
            height: annotation.height * scale,
            borderColor: annotation.color,
            backgroundColor: `${annotation.color}33`, // Add opacity
          }}
          title={annotation.text}
        />
      ))}
    </div>
  );
};

export default AnnotationLayer;