"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface PromoSlide {
  _id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  mediaType?: "image" | "video";
  image?: string;
  video?: string;
  videoPoster?: string;
  link?: string;
  buttonText?: string;
  secondaryLink?: string;
  secondaryButtonText?: string;
}

const AUTOPLAY_MS = 6500;

const FALLBACK_SLIDE: PromoSlide = {
  _id: "fallback",
  eyebrow: "Elegance in Every Drape",
  title: "Modest Fashion, Elevated",
  subtitle:
    "Discover our curated collection of premium hijabs, abayas & modest wear crafted for the modern woman.",
  mediaType: "image",
  image: "/sc6.webp",
  link: "/products",
  buttonText: "Shop Now",
  secondaryLink: "/products?filter=new",
  secondaryButtonText: "New Arrivals",
};

export function PromotionCarousel({ slides }: { slides: PromoSlide[] }) {
  const items = slides.length > 0 ? slides : [FALLBACK_SLIDE];
  const [index, setIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);

  // Autoplay
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [next, items.length]);

  const slide = items[index];

  // Subtle GSAP parallax on scroll — re-bound to whichever slide is mounted
  useEffect(() => {
    if (!sectionRef.current || !mediaRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(mediaRef.current, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    });
    return () => ctx.revert();
  }, [slide._id]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[75vh] md:h-[90vh] overflow-hidden bg-secondary"
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={slide._id}
          ref={index === 0 ? mediaRef : undefined}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {slide.mediaType === "video" && slide.video ? (
            <video
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              src={slide.video}
              poster={slide.videoPoster}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : slide.image ? (
            <Image
              src={slide.image}
              alt={slide.title || "ModestStyle"}
              fill
              className="object-cover opacity-60"
              priority={index === 0}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-secondary to-secondary/70" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/80 via-secondary/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex items-center justify-center text-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide._id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-2xl space-y-6"
          >
            {slide.eyebrow && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="text-gold-400 text-sm tracking-[0.3em] uppercase"
              >
                {slide.eyebrow}
              </motion.p>
            )}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="font-display text-4xl md:text-6xl lg:text-7xl text-white leading-tight"
            >
              {slide.title}
            </motion.h1>
            {slide.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="text-white/70 text-base md:text-lg max-w-lg mx-auto"
              >
                {slide.subtitle}
              </motion.p>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="flex gap-4 justify-center pt-2"
            >
              {slide.link && (
                <Link
                  href={slide.link}
                  className="bg-gold-500 hover:bg-gold-600 text-white px-8 py-3.5 rounded-lg text-sm font-medium tracking-wide transition"
                >
                  {slide.buttonText || "Shop Now"}
                </Link>
              )}
              {slide.secondaryLink && (
                <Link
                  href={slide.secondaryLink}
                  className="border border-white/30 text-white hover:bg-white/10 px-8 py-3.5 rounded-lg text-sm font-medium tracking-wide transition"
                >
                  {slide.secondaryButtonText || "Explore"}
                </Link>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition z-10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white flex items-center justify-center transition z-10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {items.map((s, i) => (
              <button
                key={s._id}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-gold-400" : "w-1.5 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
