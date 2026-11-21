'use client';

import React, { useState, useEffect } from 'react';
import { Film, Play, Pause, ChevronUp, ChevronDown, Sparkles, Check, Eye, SunMedium } from 'lucide-react';

export interface VideoOption {
  id: string;
  name: string;
  src: string;
  tag: string;
  style: 'obsidian' | 'purple' | 'cyan' | 'matrix';
}

export const VIDEO_OPTIONS: VideoOption[] = [
  {
    id: 'vault-of-knowledge',
    name: 'The Vault of Knowledge',
    src: '/videos/vault-of-knowledge.mp4',
    tag: 'Monolithic Vault',
    style: 'obsidian',
  },
  {
    id: 'tech-network',
    name: 'Tech Neural Network',
    src: '/videos/tech-network.mp4',
    tag: 'Knowledge Nodes',
    style: 'cyan',
  },
  {
    id: 'starry-sky',
    name: 'Starry Sky & Nebula',
    src: '/videos/starry-sky.mp4',
    tag: 'Cosmic Drift',
    style: 'obsidian',
  },
  {
    id: 'particles-flow',
    name: 'Particles Flow',
    src: '/videos/particles-flow.mp4',
    tag: 'Ambient Dust',
    style: 'cyan',
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    src: '/videos/cyber-neon.mp4',
    tag: 'Cyber Grid',
    style: 'purple',
  },
  {
    id: 'matrix-code',
    name: 'Matrix Code',
    src: '/videos/matrix-code.webm',
    tag: 'Binary Stream',
    style: 'matrix',
  },
];

export default function VideoThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string>('vault-of-knowledge');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [videoOpacity, setVideoOpacity] = useState<number>(0.85); // Vivid cinematic default

  useEffect(() => {
    const savedId = localStorage.getItem('klu_bg_video_id');
    const savedEnabled = localStorage.getItem('klu_bg_video_enabled');
    const savedOpacity = localStorage.getItem('klu_bg_video_opacity');
    if (savedId) setCurrentVideoId(savedId);
    if (savedEnabled !== null) setIsEnabled(savedEnabled === 'true');
    if (savedOpacity) setVideoOpacity(parseFloat(savedOpacity));
  }, []);

  const selectVideo = (id: string) => {
    setCurrentVideoId(id);
    setIsEnabled(true);
    localStorage.setItem('klu_bg_video_id', id);
    localStorage.setItem('klu_bg_video_enabled', 'true');
    window.dispatchEvent(
      new CustomEvent('klu_bg_video_change', {
        detail: { videoId: id, enabled: true, opacity: videoOpacity },
      })
    );
  };

  const changeOpacity = (val: number) => {
    setVideoOpacity(val);
    localStorage.setItem('klu_bg_video_opacity', String(val));
    window.dispatchEvent(
      new CustomEvent('klu_bg_video_change', {
        detail: { videoId: currentVideoId, enabled: isEnabled, opacity: val },
      })
    );
  };

  const toggleEnabled = () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    localStorage.setItem('klu_bg_video_enabled', String(nextState));
    window.dispatchEvent(
      new CustomEvent('klu_bg_video_change', {
        detail: { videoId: currentVideoId, enabled: nextState, opacity: videoOpacity },
      })
    );
  };

  const currentOption = VIDEO_OPTIONS.find((v) => v.id === currentVideoId) || VIDEO_OPTIONS[0];

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      {/* Expanded Selection Card */}
      {isOpen && (
        <div className="mb-2 p-3.5 rounded-2xl bg-[#0D1527]/95 border border-purple-500/40 shadow-2xl shadow-purple-950/80 backdrop-blur-2xl w-72 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
            <span className="text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
              <Film className="h-4 w-4 text-[#38BDF8]" />
              <span>Background Video UI</span>
            </span>
            <button
              onClick={toggleEnabled}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold transition flex items-center gap-1 ${
                isEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-white/10 text-white/50 border border-white/10'
              }`}
            >
              {isEnabled ? '● Active' : '○ Paused'}
            </button>
          </div>

          {/* Visibility / Intensity Presets */}
          <div className="mb-3 p-2 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-white/70">
              <span className="flex items-center gap-1">
                <SunMedium className="h-3 w-3 text-amber-300" />
                Video Visibility
              </span>
              <span className="font-bold text-[#38BDF8]">{Math.round(videoOpacity * 100)}%</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => changeOpacity(0.85)}
                className={`py-1 rounded-lg text-center transition font-bold ${
                  videoOpacity >= 0.8
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                Vivid (85%)
              </button>
              <button
                type="button"
                onClick={() => changeOpacity(0.65)}
                className={`py-1 rounded-lg text-center transition font-bold ${
                  videoOpacity >= 0.6 && videoOpacity < 0.8
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                Balanced
              </button>
              <button
                type="button"
                onClick={() => changeOpacity(0.45)}
                className={`py-1 rounded-lg text-center transition font-bold ${
                  videoOpacity < 0.6
                    ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                Subtle
              </button>
            </div>
          </div>

          {/* Video Track Selection */}
          <div className="space-y-1">
            {VIDEO_OPTIONS.map((video) => {
              const isSelected = currentVideoId === video.id && isEnabled;
              return (
                <button
                  key={video.id}
                  onClick={() => selectVideo(video.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-mono transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/20 text-white border border-purple-500/40 font-bold'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40">{video.tag}</span>
                    <span>{video.name}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#38BDF8]" />}
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40 font-mono">
            <span>Client-side ambient loop</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#D8B4FE] hover:text-white font-bold"
            >
              Close ✕
            </button>
          </div>
        </div>
      )}

      {/* Floating Launcher Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#131B2E]/95 hover:bg-[#1E293B] border border-white/20 text-white shadow-xl backdrop-blur-md transition active:scale-95 group font-mono text-xs"
        title="Change ambient background video visibility & preset"
      >
        <span className="relative flex h-2 w-2">
          {isEnabled && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isEnabled ? 'bg-[#38BDF8]' : 'bg-white/30'
            }`}
          />
        </span>
        <Film className="h-3.5 w-3.5 text-[#D8B4FE] group-hover:text-white transition" />
        <span className="text-[11px] font-bold text-white/90 group-hover:text-white hidden sm:inline">
          {isEnabled ? `${currentOption.name} (${Math.round(videoOpacity * 100)}%)` : 'Video Off'}
        </span>
        {isOpen ? (
          <ChevronDown className="h-3 w-3 text-white/50" />
        ) : (
          <ChevronUp className="h-3 w-3 text-white/50" />
        )}
      </button>
    </div>
  );
}
