'use client';
import { useRef, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Palette, Eraser, RotateCcw, Download, X } from 'lucide-react';

interface WhiteboardProps {
  socket: Socket | null;
  roomId: string;
  onClose: () => void;
}

export default function Whiteboard({ socket, roomId, onClose }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [drawHistory, setDrawHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    contextRef.current = context;

    // Save initial canvas state
    saveToHistory();
  }, []);

  const saveToHistory = () => {
    if (!contextRef.current || !canvasRef.current) return;
    const imageData = contextRef.current.getImageData(
      0, 0, 
      canvasRef.current.width, 
      canvasRef.current.height
    );
    setDrawHistory(prev => [...prev.slice(0, historyIndex + 1), imageData]);
    setHistoryIndex(prev => prev + 1);
  };

  const startDrawing = ({ nativeEvent }: React.MouseEvent) => {
    const { offsetX, offsetY } = nativeEvent;
    if (!contextRef.current) return;

    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);

    socket?.emit('draw-start', { roomId, x: offsetX, y: offsetY, color, lineWidth, tool });
  };

  const draw = ({ nativeEvent }: React.MouseEvent) => {
    if (!isDrawing || !contextRef.current) return;

    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();

    socket?.emit('draw-move', { roomId, x: offsetX, y: offsetY });
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
    saveToHistory();
    socket?.emit('draw-end', { roomId });
  };

  const handleUndo = () => {
    if (historyIndex > 0 && contextRef.current && canvasRef.current) {
      const prevState = drawHistory[historyIndex - 1];
      contextRef.current.putImageData(prevState, 0, 0);
      setHistoryIndex(prev => prev - 1);
      socket?.emit('draw-undo', { roomId });
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('draw-start', ({ x, y, color, lineWidth, tool }) => {
      if (!contextRef.current) return;
      contextRef.current.beginPath();
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = tool === 'eraser' ? 20 : lineWidth;
      contextRef.current.moveTo(x, y);
    });

    socket.on('draw-move', ({ x, y }) => {
      if (!contextRef.current) return;
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    });

    socket.on('draw-end', () => {
      if (!contextRef.current) return;
      contextRef.current.closePath();
      saveToHistory();
    });

    socket.on('draw-undo', () => {
      if (historyIndex > 0 && contextRef.current && canvasRef.current) {
        const prevState = drawHistory[historyIndex - 1];
        contextRef.current.putImageData(prevState, 0, 0);
        setHistoryIndex(prev => prev - 1);
      }
    });

    return () => {
      socket.off('draw-start');
      socket.off('draw-move');
      socket.off('draw-end');
      socket.off('draw-undo');
    };
  }, [socket, historyIndex, drawHistory]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-32"
          />
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded ${tool === 'pen' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          >
            <Palette size={20} />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          >
            <Eraser size={20} />
          </button>
          <button
            onClick={handleUndo}
            className="p-2 rounded hover:bg-gray-100"
            disabled={historyIndex <= 0}
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded hover:bg-gray-100"
          >
            <Download size={20} />
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-full touch-none"
        />
      </div>
    </div>
  );
} 