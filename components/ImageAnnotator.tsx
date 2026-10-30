
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PencilIcon, TypeIcon, UndoIcon, TrashIcon, RectangleIcon, CircleIcon, EraserIcon } from './icons';

interface ImageAnnotatorProps {
  src: string;
  onComplete: (dataUrl: string) => void;
  onCancel: () => void;
}

type Annotation = 
  | { type: 'path'; points: { x: number; y: number }[]; color: string; lineWidth: number; mode: 'source-over' | 'destination-out'; }
  | { type: 'text'; text: string; x: number; y: number; color: string; font: string; }
  | { type: 'rectangle'; x: number; y: number; width: number; height: number; color: string; lineWidth: number; }
  | { type: 'circle'; cx: number; cy: number; radius: number; color: string; lineWidth: number; };

type Tool = 'draw' | 'text' | 'rectangle' | 'circle' | 'eraser';

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

const ImageAnnotator: React.FC<ImageAnnotatorProps> = ({ src, onComplete, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  
  const [tool, setTool] = useState<Tool>('draw');
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<Annotation[]>([]);
  const [isTextInputVisible, setIsTextInputVisible] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });
  const [currentText, setCurrentText] = useState('');

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageRef.current) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    history.forEach(item => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (item.type === 'path') {
        ctx.globalCompositeOperation = item.mode;
        ctx.strokeStyle = item.color;
        ctx.lineWidth = item.lineWidth;
        ctx.beginPath();
        item.points.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      } else if (item.type === 'text') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = item.color;
        ctx.font = item.font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(item.text, item.x, item.y);
      } else if (item.type === 'rectangle') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = item.color;
        ctx.lineWidth = item.lineWidth;
        ctx.strokeRect(item.x, item.y, item.width, item.height);
      } else if (item.type === 'circle') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = item.color;
        ctx.lineWidth = item.lineWidth;
        ctx.beginPath();
        ctx.arc(item.cx, item.cy, Math.abs(item.radius), 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }, [history]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 600;
      let { width, height } = img;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      imageRef.current = img;
      redrawCanvas();
    };
  }, [src, redrawCanvas]);

  const getCanvasCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    // Get mouse position relative to the element
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    
    // Apply scaling to get coordinates on the drawing buffer
    return {
      x: canvasX * scaleX,
      y: canvasY * scaleY,
    };
  };

  const startInteraction = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (tool === 'text') return;
    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(event);
    startPointRef.current = { x, y };

    let newAnnotation: Annotation | null = null;
    switch (tool) {
        case 'draw':
        case 'eraser':
            newAnnotation = { type: 'path', points: [{ x, y }], color, lineWidth: brushSize, mode: tool === 'draw' ? 'source-over' : 'destination-out' };
            break;
        case 'rectangle':
            newAnnotation = { type: 'rectangle', x, y, width: 0, height: 0, color, lineWidth: brushSize };
            break;
        case 'circle':
            newAnnotation = { type: 'circle', cx: x, cy: y, radius: 0, color, lineWidth: brushSize };
            break;
    }
    if (newAnnotation) {
        setHistory(prev => [...prev, newAnnotation!]);
    }
  };

  const moveInteraction = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    event.preventDefault();
    const { x, y } = getCanvasCoordinates(event);
    
    setHistory(prev => {
        const currentHistory = [...prev];
        const lastItem = currentHistory[currentHistory.length - 1];
        if (!lastItem) return currentHistory;

        switch (lastItem.type) {
            case 'path':
                lastItem.points.push({ x, y });
                break;
            case 'rectangle':
                if(startPointRef.current) {
                    lastItem.x = Math.min(x, startPointRef.current.x);
                    lastItem.y = Math.min(y, startPointRef.current.y);
                    lastItem.width = Math.abs(x - startPointRef.current.x);
                    lastItem.height = Math.abs(y - startPointRef.current.y);
                }
                break;
            case 'circle':
                if(startPointRef.current) {
                    const dx = x - startPointRef.current.x;
                    const dy = y - startPointRef.current.y;
                    lastItem.radius = Math.sqrt(dx * dx + dy * dy);
                }
                break;
        }
        return currentHistory;
    });
    redrawCanvas();
  };

  const stopInteraction = () => {
    setIsDrawing(false);
    startPointRef.current = null;
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (tool !== 'text') return;
    const { x, y } = getCanvasCoordinates(event);
    setTextInputPosition({ x, y });
    setIsTextInputVisible(true);
  };
  
  const handleTextSubmit = () => {
    if (currentText.trim() === '') {
        setIsTextInputVisible(false);
        setCurrentText('');
        return;
    };
    const newText: Annotation = {
        type: 'text',
        text: currentText,
        x: textInputPosition.x,
        y: textInputPosition.y,
        color,
        font: `bold ${brushSize * 5 + 10}px sans-serif`
    };
    setHistory(prev => [...prev, newText]);
    setIsTextInputVisible(false);
    setCurrentText('');
  };

  const handleUndo = () => {
    setHistory(prev => prev.slice(0, -1));
    redrawCanvas();
  };

  const handleClear = () => {
    setHistory([]);
    redrawCanvas();
  };
  
  const handleComplete = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onComplete(canvas.toDataURL('image/jpeg'));
    }
  };

  const ToolButton: React.FC<{ myTool: Tool, label: string, children: React.ReactNode }> = ({ myTool, label, children }) => (
    <button onClick={() => setTool(myTool)} className={`p-2 rounded-md transition-colors ${tool === myTool ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`} aria-label={label}>
        {children}
    </button>
  );

  return (
    <div className="w-full space-y-4 p-2 sm:p-4 bg-gray-800 border border-gray-700 rounded-lg">
      <div className="relative w-full flex justify-center items-center">
        <canvas
          ref={canvasRef}
          className="rounded-md max-w-full h-auto cursor-crosshair"
          onMouseDown={startInteraction}
          onMouseMove={moveInteraction}
          onMouseUp={stopInteraction}
          onMouseLeave={stopInteraction}
          onTouchStart={startInteraction}
          onTouchMove={moveInteraction}
          onTouchEnd={stopInteraction}
          onClick={handleCanvasClick}
        />
        {isTextInputVisible && (
          <div style={{ position: 'absolute', left: textInputPosition.x, top: textInputPosition.y, transform: 'translate(-2px, -2px)' }}>
            <input
              type="text"
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              onBlur={handleTextSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              autoFocus
              className="bg-gray-900/80 text-white p-1 border border-cyan-400 rounded-sm outline-none"
              style={{ fontSize: `${brushSize * 5 + 10}px`, fontFamily: 'sans-serif', fontWeight: 'bold', color }}
            />
          </div>
        )}
      </div>

       <div className="bg-gray-900/50 p-2 rounded-lg flex flex-wrap justify-center items-center gap-4">
            <div className="flex items-center gap-2 p-1 bg-gray-800 rounded-md">
                <ToolButton myTool="draw" label="Drawing tool"><PencilIcon className="w-5 h-5" /></ToolButton>
                <ToolButton myTool="text" label="Text tool"><TypeIcon className="w-5 h-5" /></ToolButton>
                <ToolButton myTool="rectangle" label="Rectangle tool"><RectangleIcon className="w-5 h-5" /></ToolButton>
                <ToolButton myTool="circle" label="Circle tool"><CircleIcon className="w-5 h-5" /></ToolButton>
                <ToolButton myTool="eraser" label="Eraser tool"><EraserIcon className="w-5 h-5" /></ToolButton>
            </div>
            
            <div className="flex items-center gap-2 p-1 bg-gray-800 rounded-md">
                {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ backgroundColor: c }} className={`w-7 h-7 rounded-full transition-transform transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white' : ''}`} aria-label={`Color ${c}`}></button>
                ))}
            </div>

            <div className="flex items-center gap-3 p-1 px-3 bg-gray-800 rounded-md">
                <label htmlFor="brushSize" className="text-sm font-semibold text-gray-400">Size</label>
                <input 
                    id="brushSize"
                    type="range" 
                    min="1" 
                    max="20" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-24 cursor-pointer"
                />
            </div>

             <div className="flex items-center gap-2 p-1 bg-gray-800 rounded-md">
                <button onClick={handleUndo} disabled={history.length === 0} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Undo"><UndoIcon className="w-5 h-5" /></button>
                <button onClick={handleClear} disabled={history.length === 0} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Clear all"><TrashIcon className="w-5 h-5" /></button>
            </div>
      </div>
      
      <div className="flex gap-4 pt-4 border-t border-gray-700">
        <button onClick={onCancel} className="w-full px-4 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
        <button onClick={handleComplete} className="w-full px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors">Confirm Annotations</button>
      </div>
    </div>
  );
};

export default ImageAnnotator;