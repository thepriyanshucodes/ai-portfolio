"use client"
import { useState } from 'react';
import DesktopGrid from '../components/desktop';
import Taskbar from '../components/taskbar';
import WindowFrame from '../components/WindowFrame';
import { type AppConfig } from './../types/window.types';
import ClockApp from "../components/clockApp"
import WallpaperApp from "../components/wallpaper"
import NotesApp from "../components/notesApp"
import AskMeApp from "../components/askMeApp"
import Image from 'next/image';
import ContactApp from '@/components/contactApp';

// App Configurations
const INITIAL_APPS: AppConfig[] = [
  {
    id: 'notepad',
    title: 'Notepad',
    icon: <Image alt="notepad" width={56} height={56} src="/icon/notes.png" draggable={false} priority />,
    topicon: <span className="text-xl">📝</span>,
    status: 'closed',
    isFocused: false,
    isMaximized: false,
    zIndex: 10,
  },
  {
    id: 'clock',
    title: 'Clock',
    icon: <Image alt="clock" width={56} height={56} src="/icon/clock.png" draggable={false} priority />,
    topicon: <span className="text-xl">⏰</span>,
    status: 'closed',
    isFocused: false,
    isMaximized: false,
    zIndex: 10,
  },
  {
    id: 'contact',
    title: 'Contact Me',
    icon: <Image alt="contact" width={56} height={56} src="/icon/contactMe.png" draggable={false} priority />,
    topicon: <span className="text-xl">📬</span>,
    status: 'closed',
    isFocused: false,
    isMaximized: false,
    zIndex: 10,
  },
  {
    id: 'wallpaper',
    title: 'Wallpaper',
    icon: <Image alt="wallpaper" width={56} height={56} src="/icon/wallpaper.png" draggable={false} priority />,
    topicon: <span className="text-xl">💻</span>,
    status: 'closed',
    isFocused: false,
    isMaximized: false,
    zIndex: 10,
  },
  {
    id: 'askMe',
    title: 'Ask Me',
    icon: <AskMeIcon />,
    topicon: <AskMeIcon />,
    status: 'closed',
    isFocused: false,
    isMaximized: false,
    zIndex: 10,
  },
];

interface AppRenderProps {
  app: {
    id: string;
    status: "closed" | "open" | "minimized";
    isMaximized: boolean;
  };
  currentWallpaper: string;
  setCurrentWallpaper: (wallpaper: string) => void;
}

export const APP_COMPONENTS: Record<
  string,
  (props: AppRenderProps) => React.ReactNode
> = {
  askMe: ({ app }) => <AskMeApp isMaximized={app.isMaximized} />,
  notepad: ({ app }) => <NotesApp appStatus={app.status} />,
  clock: ({ app }) => <ClockApp isMaximized={app.isMaximized} />,
  contact: () => <ContactApp />,
  wallpaper: ({ currentWallpaper, setCurrentWallpaper }) => (
    <WallpaperApp
      currentWallpaper={currentWallpaper}
      onSelectWallpaper={setCurrentWallpaper}
    />
  ),
};


export default function Home() {
  const [apps, setApps] = useState<AppConfig[]>(INITIAL_APPS);
  const [currentWallpaper, setCurrentWallpaper] = useState<string>('/background/image4.webp');

  const isAnyAppMaximized = apps.some((w) => w.status === 'open' && w.isMaximized);

  // Focus Window & Bring to Front
  const handleFocusWindow = (id: string) => {
    setApps((prevApps) => {
      // Find current highest zIndex across all windows
      const maxZ = Math.max(...prevApps.map((app) => app.zIndex || 0), 20);
      const nextZ = maxZ + 1;

      return prevApps.map((app) => ({
        ...app,
        isFocused: app.id === id,
        zIndex: app.id === id ? nextZ : app.zIndex,
      }));
    });
  };

  // Taskbar Click Logic
  const handleTaskbarAppClick = (id: string) => {
    const targetApp = apps.find((a) => a.id === id);

    if (!targetApp) return;


    // Case 1: App is closed or minimized -> Open/Restore and focus
    if (targetApp.status === 'closed' || targetApp.status === 'minimized') {
      setApps((prevApps) =>
        prevApps.map((app) =>
          app.id === id ? { ...app, status: 'open' } : app
        )
      );
      handleFocusWindow(id);
      return;
    }

    // Case 2: App is open and focused -> Minimize to background
    if (targetApp.status === 'open' && targetApp.isFocused) {
      setApps((prevApps) =>
        prevApps.map((app) =>
          app.id === id ? { ...app, status: 'minimized', isFocused: false } : app
        )
      );
      return;
    }

    // Case 3: App is open but not focused -> Bring to front
    if (targetApp.status === 'open' && !targetApp.isFocused) {
      handleFocusWindow(id);
    }
  };

  // Traffic Light Actions
  const handleCloseWindow = (id: string) => {
    setApps((prevApps) =>
      prevApps.map((app) =>
        app.id === id
          ? { ...app, status: 'closed', isFocused: false, isMaximized: false }
          : app
      )
    );
  };

  const handleMinimizeWindow = (id: string) => {
    setApps((prevApps) =>
      prevApps.map((app) =>
        app.id === id ? { ...app, status: 'minimized', isFocused: false } : app
      )
    );
  };

  const handleToggleMaximizeWindow = (id: string) => {
    setApps((prevApps) =>
      prevApps.map((app) =>
        app.id === id ? { ...app, isMaximized: !app.isMaximized } : app
      )
    );
    handleFocusWindow(id);
  };

  return (
    <div 
      className="relative h-screen w-full bg-cover bg-center bg-no-repeat overflow-hidden select-none"
      style={{ backgroundImage: `url(${currentWallpaper})`}}
      >
      {/* Interactive Desktop Grid */}
      <DesktopGrid />

      {/* Render Active Window Frames */}
      {apps.map((app) => (
        <WindowFrame
          key={app.id}
          id={app.id}
          title={app.title}
          topicon={app.topicon}
          isOpen={app.status === 'open'}
          isMinimized={app.status === 'minimized'}
          isMaximized={app.isMaximized}
          isFocused={app.isFocused}
          zIndex={app.zIndex}
          onClose={handleCloseWindow}
          onMinimize={handleMinimizeWindow}
          onToggleMaximize={handleToggleMaximizeWindow}
          onFocus={handleFocusWindow}
        >
          {(() => {
            const RenderApp = APP_COMPONENTS[app.id];
            return RenderApp ? (
              RenderApp({ app, currentWallpaper, setCurrentWallpaper })
            ) : null;
          })()}
        </WindowFrame>
      ))}

      {/* Floating Bottom Glass Taskbar */}
      <Taskbar apps={apps} onAppClick={handleTaskbarAppClick} isAnyAppMaximized={isAnyAppMaximized} />
    </div>
  );
}

function AskMeIcon() {

  return <span className="inline-flex items-start leading-none select-none text-blue-600">
            <span className="text-base">✦</span>
            <span className="text-[10px] -ml-px -mt-px">✦</span>
          </span>
}