"use client"

import { useState, useEffect, useMemo } from 'react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ClockAppProps {
  isMaximized?: boolean;
}

export default function ClockApp({ isMaximized = false }: ClockAppProps) {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Time calculations for rotating dials
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  // Rotation angles
  const ds = seconds * -6;
  const dm = minutes * -6;
  const dh = hours * -30;

  // Digital values
  const formattedTime = time.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const formattedDay = DAYS[time.getDay()];
  const formattedDate = `${time.getDate()} . ${MONTHS[time.getMonth()]}`;
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Static Dial Render Arrays
  const secondsTicks = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
  const minutesTicks = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
  const hourTicks = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const outerTicks = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full select-none overflow-hidden p-4">
      {/* Container Wrapper that controls smooth scaling */}
      <div
        className={`flex flex-col items-center justify-center transition-transform duration-300 ease-out origin-center ${
          isMaximized ? 'scale-85 md:scale-95' : 'scale-[0.58]'
        }`}
      >
        {/* Radial Clock Unit */}
        <div className="relative w-120 h-120 rounded-full bg-[#111] overflow-hidden shadow-[0_0_25px_3px_rgba(0,0,0,1),inset_0_0_10px_rgba(0,0,0,0.8)] font-['BenchNine',sans-serif]">
          
          {/* Red Center Indicator Spear */}
          <div className="absolute top-1/2 left-1/2 w-55 h-px bg-red-600 -translate-y-1/2 z-30 shadow-[0_3px_3px_rgba(0,0,0,0.4)] before:content-[''] before:absolute before:left-0.5 before:-top-1.75 before:border-[7px] before:border-transparent before:border-l-red-600 after:content-[''] after:absolute after:right-0 after:-top-1.75 after:border-[7px] after:border-transparent after:border-r-red-600" />

          {/* Analog Outer & Rotating Dial Container */}
          <div className="relative w-110 h-110 m-5 rounded-full bg-white z-10 shadow-[inset_0_0_25px_3px_rgba(0,0,0,1)] overflow-hidden">
            
            {/* Seconds Ring */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 z-20 transition-transform duration-200 ease-in-out"
              style={{ transform: `rotate(${ds}deg)` }}
            >
              {secondsTicks.map((s) => (
                <div
                  key={`sec-${s}`}
                  className="absolute left-0 top-0 w-8 h-5 -mt-2.5 -ml-4 flex items-center justify-center text-[13px] font-bold text-slate-800"
                  style={{ transform: `rotate(${6 * s}deg) translateX(185px)` }}
                >
                  {s}
                </div>
              ))}
            </div>

            {/* Minutes Ring */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 text-white z-20 transition-transform duration-200 ease-in-out after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-87.5 after:h-87.5 after:rounded-full after:bg-[#333] after:shadow-[inset_0_0_25px_2px_rgba(0,0,0,1)] after:-z-10"
              style={{ transform: `rotate(${dm}deg)` }}
            >
              {minutesTicks.map((m) => (
                <div
                  key={`min-${m}`}
                  className="absolute left-0 top-0 w-8 h-5 -mt-2.5 -ml-4 flex items-center justify-center text-[16px] font-semibold"
                  style={{ transform: `rotate(${6 * m}deg) translateX(142px)` }}
                >
                  {m}
                </div>
              ))}
            </div>

            {/* Hours Ring */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 text-slate-900 z-20 transition-transform duration-200 ease-in-out after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-62.5 after:h-62.5 after:rounded-full after:bg-white after:shadow-[inset_0_0_15px_2px_rgba(0,0,0,0.6)] after:-z-10"
              style={{ transform: `rotate(${dh}deg)` }}
            >
              {hourTicks.map((h) => (
                <div
                  key={`hr-${h}`}
                  className="absolute left-0 top-0 w-8 h-8 -mt-4 -ml-4 flex items-center justify-center text-[32px] font-normal"
                  style={{ transform: `rotate(${30 * h}deg) translateX(98px)` }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Outer Dial Ticks */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 z-10">
              {outerTicks.map((t) => (
                <span
                  key={`tick-${t}`}
                  className="absolute left-0 top-0 w-2 h-2 -mt-1 -ml-1 flex items-center justify-center overflow-hidden"
                  style={{ transform: `rotate(${6 * t}deg) translateX(212px)` }}
                >
                  <span className={`block ${t % 5 === 0 ? 'w-2.5 h-0.5 bg-slate-500' : 'w-1.5 h-px bg-slate-400'}`} />
                </span>
              ))}
            </div>
          </div>

          {/* Digital Overlay (Left Semi-Circle) */}
          <div className="absolute top-4.5 left-4.5 w-56 h-111 bg-[#090909] rounded-l-[220px] shadow-[5px_0_15px_rgba(0,0,0,1)] z-30 after:content-[''] after:absolute after:top-6.25 after:left-6.25 after:w-50 after:h-100 after:border-15 after:border-r-0 after:border-[#8e0a0a] after:rounded-l-[220px]">
            <div className="absolute right-1.25 top-27.5 bg-[#111] text-white rounded-[20px] px-5 py-0.5 text-[18px] shadow-[inset_0_0_10px_#000] tracking-wider z-10">
              {formattedDate}
            </div>

            <div className="absolute right-1.25 top-1/2 -translate-y-1/2 bg-[#111] text-white rounded-[50px] px-5 py-0.5 text-[26px] font-bold shadow-[inset_0_0_15px_#000] tracking-widest z-10">
              {formattedTime}
            </div>

            <div className="absolute right-1.25 bottom-25 bg-[#111] text-white rounded-[20px] px-5 py-0.5 text-[18px] shadow-[inset_0_0_15px_#000] tracking-wider z-10">
              {formattedDay}
            </div>
          </div>
        </div>

        {/* Centered Glassmorphic Time Zone Badge */}
        <div className="mt-10 flex items-center justify-center gap-2 px-5 py-2 bg-white/9 backdrop-blur-md border border-white/20 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.2)] text-slate-200 text-sm font-semibold tracking-wide">
          <span className="text-amber-400">📍</span>
          <span>{userTimeZone}</span>
        </div>
      </div>
    </div>
  );
}