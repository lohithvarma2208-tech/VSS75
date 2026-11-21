'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface BackgroundVideoProps {
  src?: string;
  opacity?: number;
  className?: string;
  overlayStyle?: 'obsidian' | 'purple' | 'cyan' | 'matrix';
  blur?: boolean;
  brightness?: number; // 1.4 = +40% brightness boost
}

export default function BackgroundVideo({
  src = '/videos/vault-of-knowledge.mp4',
  opacity = 0.85, // Ultra-clear cinematic visibility
  className = '',
  overlayStyle = 'obsidian',
  blur = false,
  brightness = 1.4, // Boost brightness by 40%
}: BackgroundVideoProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [src]);

  // Translucent glass tints rather than opaque blackouts, letting the video shine through
  const overlayGradients = {
    obsidian:
      'bg-gradient-to-b from-black/30 via-transparent to-black/50',
    purple:
      'bg-gradient-to-b from-purple-950/25 via-transparent to-black/50',
    cyan:
      'bg-gradient-to-b from-cyan-950/25 via-transparent to-black/50',
    matrix:
      'bg-gradient-to-b from-emerald-950/25 via-transparent to-black/50',
  };

  if (hasError) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10 select-none ${className}`}
      aria-hidden="true"
    >
      {/* High-visibility Background Video Stream with +40% Brightness Boost */}
      <video
        ref={videoRef}
        key={src}
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        onLoadedData={() => setIsVideoLoaded(true)}
        onError={() => setHasError(true)}
        style={{
          opacity: isVideoLoaded ? opacity : 0,
          filter: `brightness(${brightness}) contrast(1.06) ${blur ? 'blur(1px)' : ''}`,
        }}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
      >
        <source src={src} type={src.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
      </video>

      {/* Light glass gradient overlay: protects text contrast without burying the video */}
      <div className={`absolute inset-0 w-full h-full ${overlayGradients[overlayStyle]}`} />

      {/* Soft edge vignette */}
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_45%,rgba(7,10,17,0.6)_100%)] opacity-30" />
    </div>
  );
}
