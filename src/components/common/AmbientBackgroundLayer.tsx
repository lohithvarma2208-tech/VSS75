'use client';

import React, { useState, useEffect } from 'react';
import BackgroundVideo from './BackgroundVideo';
import { VIDEO_OPTIONS } from './VideoThemeSwitcher';

interface AmbientBackgroundLayerProps {
  defaultVideoId?: string;
  opacity?: number;
}

export default function AmbientBackgroundLayer({
  defaultVideoId = 'vault-of-knowledge',
  opacity = 0.85, // Ultra-clear cinematic visibility
}: AmbientBackgroundLayerProps) {
  const [activeVideoId, setActiveVideoId] = useState<string>(defaultVideoId);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [currentOpacity, setCurrentOpacity] = useState<number>(opacity);

  useEffect(() => {
    // Check localStorage
    const savedId = localStorage.getItem('klu_bg_video_id');
    const savedEnabled = localStorage.getItem('klu_bg_video_enabled');
    const savedOpacity = localStorage.getItem('klu_bg_video_opacity');

    if (savedId) {
      setActiveVideoId(savedId);
    } else {
      setActiveVideoId(defaultVideoId);
    }
    if (savedEnabled !== null) {
      setIsEnabled(savedEnabled === 'true');
    }
    if (savedOpacity) {
      setCurrentOpacity(parseFloat(savedOpacity));
    }

    const handleVideoChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ videoId?: string; enabled?: boolean; opacity?: number }>;
      if (customEvent.detail) {
        if (customEvent.detail.videoId) {
          setActiveVideoId(customEvent.detail.videoId);
        }
        if (customEvent.detail.enabled !== undefined) {
          setIsEnabled(customEvent.detail.enabled);
        }
        if (customEvent.detail.opacity !== undefined) {
          setCurrentOpacity(customEvent.detail.opacity);
        }
      }
    };

    window.addEventListener('klu_bg_video_change', handleVideoChange);
    return () => window.removeEventListener('klu_bg_video_change', handleVideoChange);
  }, [defaultVideoId]);

  if (!isEnabled) {
    return null;
  }

  const selectedVideo =
    VIDEO_OPTIONS.find((v) => v.id === activeVideoId) ||
    VIDEO_OPTIONS.find((v) => v.id === defaultVideoId) ||
    VIDEO_OPTIONS[0];

  return (
    <BackgroundVideo
      key={selectedVideo.id}
      src={selectedVideo.src}
      opacity={currentOpacity}
      overlayStyle={selectedVideo.style}
      brightness={1.4}
    />
  );
}
