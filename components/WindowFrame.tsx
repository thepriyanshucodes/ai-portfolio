"use client"

import React, { useState, useRef, useEffect } from 'react';

interface WindowFrameProps {
  id: string;
  title: string;
  topicon: React.ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  zIndex: number;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onToggleMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  children: React.ReactNode;
}

// Default window size (desktop) and the room we leave around it on small screens
const WIN_W = 640;
const WIN_H = 440;
const SIDE_MARGIN = 16;   // total horizontal breathing room on small screens
const BOTTOM_RESERVE = 112; // keeps the window clear of the taskbar on small screens

function getWindowSize() {
  if (typeof window === 'undefined') return { w: WIN_W, h: WIN_H };
  return {
    w: Math.min(WIN_W, window.innerWidth - SIDE_MARGIN),
    h: Math.max(240, Math.min(WIN_H, window.innerHeight - BOTTOM_RESERVE)),
  };
}

function clampPosition(x: number, y: number, w: number) {
  const maxX = window.innerWidth - 100;
  const maxY = window.innerHeight - 100;
  return {
    x: Math.max(100 - w, Math.min(maxX, x)), // always keep 100px of the title bar reachable
    y: Math.max(0, Math.min(maxY, y)),
  };
}

export default function WindowFrame({
  id,
  title,
  topicon,
  isOpen,
  isMinimized,
  isMaximized,
  isFocused,
  zIndex,
  onClose,
  onMinimize,
  onToggleMaximize,
  onFocus,
  children,
}: WindowFrameProps) {
  const [isControlsHovered, setIsControlsHovered] = useState(false);

  const [size, setSize] = useState({ w: WIN_W, h: WIN_H });
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didInitRef = useRef(false);

  // Size + center on mount, and keep inside the viewport on resize / rotate
  useEffect(() => {
    const sync = () => {
      const next = getWindowSize();
      setSize(next);

      if (!didInitRef.current) {
        didInitRef.current = true;
        setPosition({
          x: Math.max(0, (window.innerWidth - next.w) / 2),
          y: window.innerWidth < 640 ? 16 : 80,
        });
      } else {
        setPosition((p) => clampPosition(p.x, p.y, next.w));
      }
    };

    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  if (!isOpen || isMinimized) return null;

  // --- DRAG HANDLERS ---
  const handlePointerDownHeader = (e: React.PointerEvent<HTMLDivElement>) => {
    onFocus(id);
    if (isMaximized) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveHeader = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isMaximized) return;

    setPosition(
      clampPosition(
        e.clientX - dragStartRef.current.x,
        e.clientY - dragStartRef.current.y,
        size.w
      )
    );
  };

  const handlePointerUpHeader = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      onPointerDown={() => onFocus(id)}
      style={{
        zIndex,
        transform: isMaximized
          ? 'none'
          : `translate3d(${position.x}px, ${position.y}px, 0)`,
        ...(isMaximized ? {} : { width: size.w, height: size.h }),
      }}
      className={`absolute top-0 left-0 flex flex-col bg-slate-900/90 backdrop-blur-2xl border border-white/20 shadow-2xl transition-shadow duration-150 overflow-hidden ${
        isMaximized ? 'inset-0 w-full h-dvh rounded-none' : 'rounded-xl sm:rounded-2xl'
      } ${isFocused ? 'ring-1 ring-white/30' : 'opacity-95'}`}
    >
      {/* Draggable Title Bar */}
      <div
        onPointerDown={handlePointerDownHeader}
        onPointerMove={handlePointerMoveHeader}
        onPointerUp={handlePointerUpHeader}
        onPointerCancel={handlePointerUpHeader}
        className={`relative flex items-center justify-between px-3 sm:px-4 h-11 bg-slate-800/80 border-b border-white/10 select-none touch-none ${
          isMaximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        {/* Traffic Light Controls (bigger touch targets on small screens) */}
        <div
          className="flex items-center gap-2 z-20"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseEnter={() => setIsControlsHovered(true)}
          onMouseLeave={() => setIsControlsHovered(false)}
        >
          {/* Yellow Dot: Minimize */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize(id);
              setIsControlsHovered(false)
            }}
            title="Minimize"
            className="w-5 h-5 sm:w-3.5 sm:h-3.5 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
          >
            {isControlsHovered && (
              <span className="text-[9px] font-bold text-slate-950 leading-none">−</span>
            )}
          </button>

          {/* Green Dot: Maximize / Restore */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMaximize(id);
              setIsControlsHovered(false)
            }}
            title={isMaximized ? 'Restore' : 'Maximize'}
            className="w-5 h-5 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
          >
            {isControlsHovered && (
              <span className="text-[8px] font-bold text-slate-950 leading-none">
                {isMaximized ? '❐' : '□'}
              </span>
            )}
          </button>

          {/* Red Dot: Terminate */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(id);
              setIsControlsHovered(false)
            }}
            title="Close"
            className="w-5 h-5 sm:w-3.5 sm:h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
          >
            {isControlsHovered && (
              <span className="text-[9px] font-bold text-slate-950 leading-none">✕</span>
            )}
          </button>
        </div>

        {/* Center Title + Interface Icon */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none text-slate-200 text-xs font-medium">
          <span className="text-sm">{topicon}</span>
          <span className="truncate max-w-[40%]">{title}</span>
        </div>

        <div className="w-12" />
      </div>

      {/* App Content Body */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 text-slate-100">
        {children}
      </div>
    </div>
  );
}