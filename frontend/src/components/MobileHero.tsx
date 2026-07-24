// src/components/MobileHero.tsx
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const SLIDES = [
  {
    image: "/group-photo-1.jpeg",
    title: "Navigate university life",
    accent: "with clarity",
    body: "Schedules, attendance and news — one place, built for OOU Computer Engineering.",
  },
  {
    image: "/group-photo-2.jpg",
    title: "Mark attendance",
    accent: "in one tap",
    body: "Check in the moment your lecturer opens the window, right from your seat.",
  },
  {
    image: "/group-photo-3.jpeg",
    title: "Never miss",
    accent: "department news",
    body: "Announcements from lecturers and admins, straight to you.",
  },
];

export default function MobileHero() {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50 && index < SLIDES.length - 1) setIndex(index + 1);
    else if (delta > 50 && index > 0) setIndex(index - 1);
  };

  const slide = SLIDES[index];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col md:hidden">
      <div className="flex justify-center pt-6 pb-4">
        <div className="flex items-center gap-2">
          <Image src="/oou-crest.jpg" alt="" className="h-7 w-7 object-contain rounded-full" />
          <span className="text-white font-medium text-base">Campus Connect</span>
        </div>
      </div>

      <div
        className="relative flex-1 mx-4 rounded-[28px] overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={slide.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        <div className="absolute bottom-8 left-0 right-0 px-6">
          <h1 className="text-white text-3xl font-medium leading-tight mb-2">
            {slide.title}
            <br />
            <span className="font-voice italic font-normal text-green-400">
              {slide.accent}
            </span>
          </h1>
          <p className="text-white/70 text-sm leading-relaxed mb-5 max-w-xs">
            {slide.body}
          </p>

          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-green-400" : "w-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 pt-5 pb-8 flex gap-3">
        <Link
          href="/signin"
          className="flex-1 text-center bg-white text-black rounded-full py-3.5 text-sm font-medium"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="flex-1 text-center border border-white/25 text-white rounded-full py-3.5 text-sm font-medium"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}