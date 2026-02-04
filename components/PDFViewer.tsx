
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ClipRegion } from '../types';

interface PDFViewerProps {
  file: File | null;
  label: string;
  onClipReady: (base64: string) => void;
  onSelectionChange: (region: ClipRegion | null) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, label, onClipReady, onSelectionChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRegion, setCurrentRegion] = useState<ClipRegion | null>(null);
  const [pdfPage, setPdfPage] = useState<any>(null);

  const renderPDF = useCallback(async () => {
    if (!file || !canvasRef.current) return;

    const fileReader = new FileReader();
    fileReader.onload = async () => {
      const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
      const pdf = await (window as any).pdfjsLib.getDocument(typedArray).promise;
      const page = await pdf.getPage(1);
      setPdfPage(page);

      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      await page.render(renderContext).promise;

      // Match overlay canvas size
      if (overlayRef.current) {
        overlayRef.current.width = canvas.width;
        overlayRef.current.height = canvas.height;
      }
    };
    fileReader.readAsArrayBuffer(file);
  }, [file]);

  useEffect(() => {
    renderPDF();
  }, [renderPDF]);

  const drawOverlay = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (currentRegion) {
      // Background dimming
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Selection clear
      ctx.clearRect(currentRegion.x, currentRegion.y, currentRegion.width, currentRegion.height);
      
      // Border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(currentRegion.x, currentRegion.y, currentRegion.width, currentRegion.height);
    }
  }, [currentRegion]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const region: ClipRegion = {
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y)
    };
    setCurrentRegion(region);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (currentRegion && currentRegion.width > 5 && currentRegion.height > 5) {
      onSelectionChange(currentRegion);
      extractClip(currentRegion);
    }
  };

  const extractClip = async (region: ClipRegion) => {
    if (!canvasRef.current) return;
    
    const hiddenCanvas = document.createElement('canvas');
    hiddenCanvas.width = region.width * 2; // Higher res
    hiddenCanvas.height = region.height * 2;
    const ctx = hiddenCanvas.getContext('2d');
    if (!ctx) return;

    // We draw from the source canvas to the hidden canvas at double scale for better OCR
    ctx.drawImage(
      canvasRef.current,
      region.x, region.y, region.width, region.height,
      0, 0, hiddenCanvas.width, hiddenCanvas.height
    );

    const base64 = hiddenCanvas.toDataURL('image/jpeg', 0.95);
    onClipReady(base64);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 bg-slate-900 border-b border-slate-800">
        <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        {currentRegion && (
          <button 
            onClick={() => { setCurrentRegion(null); onSelectionChange(null); }}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Clear Selection
          </button>
        )}
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-auto bg-slate-950 p-4 custom-scrollbar flex items-start justify-center"
      >
        {!file ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm italic">Upload PDF to begin</p>
          </div>
        ) : (
          <div className="relative shadow-2xl shadow-black/50">
            <canvas ref={canvasRef} className="block" />
            <canvas 
              ref={overlayRef} 
              className="absolute top-0 left-0 cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
