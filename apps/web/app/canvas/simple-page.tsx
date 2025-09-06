'use client';

import { useEffect, useState } from 'react';
import { SimpleDrawingCanvas } from '@/components/canvas/SimpleDrawingCanvas';

export default function SimpleCanvasPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Set isMounted to true after component mounts and get window dimensions
  useEffect(() => {
    setIsMounted(true);
    
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 64, // Account for header
      });
    };
    
    // Set initial dimensions
    updateDimensions();
    
    // Update dimensions on window resize
    window.addEventListener('resize', updateDimensions);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const handleSave = (lines: any[]) => {
    console.log('Saved drawing with', lines.length, 'lines');
    // Here you could save to a database or local storage
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900">Drawing Canvas</h1>
          <p className="text-sm text-gray-500">Draw something amazing!</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-4">
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <SimpleDrawingCanvas 
            width={dimensions.width - 64} // Account for padding
            height={Math.max(600, dimensions.height - 100)} // Minimum height of 600px
            onSave={handleSave}
            readOnly={false}
          />
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <p className="text-sm text-gray-500">Draw and create to your heart's content!</p>
          <div className="flex space-x-4">
            <button 
              onClick={() => document.querySelector('canvas')?.click()} // Trigger save
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Save Drawing
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
