"use client"

import { type AppConfig } from './../types/window.types';

interface TaskbarProps {
  apps: AppConfig[];
  onAppClick: (id: string) => void;
  isAnyAppMaximized: boolean
}

export default function Taskbar({ apps, onAppClick, isAnyAppMaximized }: TaskbarProps) {
  return (
    <div
      className={`${
          isAnyAppMaximized ? 'translate-y-100 pointer-events-none' : ''
        } absolute left-1/2 -translate-x-1/2
        bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-6
        max-w-[calc(100vw-1rem)]
        flex items-center gap-1.5 sm:gap-2.5 p-2 sm:p-3
        bg-white/9 backdrop-blur-[5px] border border-white/30 rounded-2xl sm:rounded-[20px]
        shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(255,255,255,0.1),inset_0_0_10px_5px_rgba(255,255,255,0.5)]
        transition-transform duration-300 ease-out
        z-50 before:absolute before:top-0 before:left-0 before:right-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/80 before:to-transparent`}
    >
      {apps.map((app) => {
        const isAskMe = app.id === 'askMe';
        const isOpened = app.status === 'open';
        const isMinimized = app.status === 'minimized';

        return (
          <div key={app.id} className="relative flex flex-col items-center shrink-0">
            <button
              onClick={() => onAppClick(app.id)}
              className={`relative z-10 flex items-center justify-center hover:-translate-y-4 hover:scale-110 active:scale-95 transition-all duration-200 ease-out rounded-xl touch-manipulation ${
                isAskMe
                  ? 'h-10 sm:h-12 bg-white px-3 sm:px-4 gap-1.5 sm:gap-2 text-slate-800 text-xs sm:text-sm font-semibold'
                  : 'w-11 h-11 sm:w-14 sm:h-14'
              }`}
            >
              {/* Non-AskMe icons are scaled to fill the button so they shrink with it */}
              <span
                className={
                  isAskMe
                    ? 'flex items-center justify-center'
                    : 'flex items-center justify-center w-full h-full [&_img]:w-full [&_img]:h-full [&_svg]:w-full [&_svg]:h-full [&_img]:object-contain'
                }
              >
                {app.icon}
              </span>
              {isAskMe && <span className="whitespace-nowrap">{app.title}</span>}
            </button>

            {/* Indicator Dot (Blue for active/focused, White for background/minimized) */}
            {app.status !== 'closed' && (
              <span
                className={`absolute -bottom-1.5 w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                  isOpened && app.isFocused ? 'bg-blue-400 shadow-[0_0_6px_#60a5fa]' : ''
                } ${isMinimized || (isOpened && !app.isFocused) ? 'bg-white/90' : ''}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}