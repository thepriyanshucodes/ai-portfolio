"use client"
import Image from "next/image";
import { useState } from "react";

export default function Background({ full, thumb }: { full: string; thumb: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* instant, small, already-cached layer */}
      <Image
        src={thumb}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover blur-sm scale-105"
      />
      {/* optimized full-res layer fades in */}
      <Image
        src={full}
        alt=""
        fill
        priority
        sizes="100vw"
        quality={75}
        onLoad={() => setLoaded(true)}
        className={`object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}