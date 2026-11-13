"use client"

import Image from "next/image";

export const WALLPAPERS = [
  { id: '1', full: '/background/image1.webp', thumb: '/thumbnails/image1-50kb.jpg' },
  { id: '2', full: '/background/image2.webp', thumb: '/thumbnails/image2-50kb.jpeg' },
  { id: '3', full: '/background/image3.webp', thumb: '/thumbnails/image3-50kb.jpg' },
  { id: '4', full: '/background/image4.webp', thumb: '/thumbnails/image4-50kb.jpg' },
  { id: '5', full: '/background/image5.webp', thumb: '/thumbnails/image5-50kb.jpg' },
  { id: '6', full: '/background/image6.webp', thumb: '/thumbnails/image6-50kb.jpeg' },
  { id: '7', full: '/background/image7.webp', thumb: '/thumbnails/image7-50kb.jpg' },
];

interface WallpaperAppProps {
  currentWallpaper: string;
  onSelectWallpaper: (path: string) => void;
}

export default function WallpaperApp({
  currentWallpaper,
  onSelectWallpaper,
}: WallpaperAppProps) {
  return (
    <div className="flex flex-col h-full w-full p-4 overflow-y-auto select-none bg-inherit text-white [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-slate-500">
      <h2 className="text-sm font-medium text-slate-300 mb-4">
        Select your desktop background wallpaper.
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {WALLPAPERS.map((item) => {
          const isSelected = currentWallpaper === item.full;

          return (
            <button
              key={item.id}
              onClick={() => onSelectWallpaper(item.full)}
              className={`relative group aspect-16/10 rounded-xl overflow-hidden cursor-pointer transition-transform duration-200 border-2 focus:outline-none will-change-transform ${
                isSelected
                  ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.5)] scale-[0.98]'
                  : 'border-transparent hover:border-slate-600 hover:scale-[0.99]'
              }`}
            >
              {/* Thumbnail using Next.js Image with fill */}
              <Image
                src={item.thumb}
                alt="Desktop Background Preview"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                draggable={false}
                className="object-cover pointer-events-none select-none"
              />

              {isSelected && (
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md z-10">
                  <svg
                    className="w-3.5 h-3.5 text-white stroke-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}