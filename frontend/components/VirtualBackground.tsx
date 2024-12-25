'use client';
import { useState, useEffect } from 'react';

interface VirtualBackgroundProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

export default function VirtualBackground({ videoRef }: VirtualBackgroundProps) {
  const [background, setBackground] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const applyBackground = () => {
      const video = videoRef.current;
      if (!video) return;

      // Example: Apply CSS filter for blur
      video.style.filter = background ? 'blur(10px)' : 'none';
    };

    applyBackground();
  }, [background, videoRef]);

  return (
    <div className="fixed left-4 top-24 w-64 bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Virtual Background</h3>
      </div>
      <div className="p-4">
        <button
          onClick={() => setBackground(background ? null : 'blur')}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          {background ? 'Remove Background' : 'Apply Blur'}
        </button>
      </div>
    </div>
  );
} 