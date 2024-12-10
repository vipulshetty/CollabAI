'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Eraser, RotateCcw, Download } from 'lucide-react';

interface WhiteboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Whiteboard({ isOpen, onClose }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas to a more standard size
    canvas.width = 640 * 2; // Standard width (scaled for retina)
    canvas.height = 360 * 2; // 16:9 aspect ratio (scaled for retina)

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = tool === 'eraser' ? 'white' : 'black';
    context.lineWidth = 2;
    contextRef.current = context;
  }, [tool]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent) => {
    if (!contextRef.current) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent) => {
    if (!isDrawing || !contextRef.current) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = dataUrl;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div className="bg-white rounded-lg p-4 w-[640px] h-[460px]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setTool('pencil')}
              className={`p-2 rounded ${tool === 'pencil' ? 'bg-blue-100' : ''}`}
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-100' : ''}`}
            >
              <Eraser className="w-5 h-5" />
            </button>
            <button
              onClick={clearCanvas}
              className="p-2 rounded hover:bg-gray-100"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={downloadCanvas}
              className="p-2 rounded hover:bg-gray-100"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-[360px] border rounded bg-white"
          style={{ cursor: tool === 'pencil' ? 'crosshair' : 'default' }}
        />
      </div>
    </motion.div>
  );
} 