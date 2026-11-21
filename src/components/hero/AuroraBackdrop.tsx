"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useDelayedPointer } from "./useDelayedPointer";

type AuroraBackdropProps = {
  video: string;
  poster: string;
};

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

export function AuroraBackdrop({ video, poster }: AuroraBackdropProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [videoReady, setVideoReady] = useState(false);
  const { ref: mediaRef, transform } = useDelayedPointer<HTMLDivElement>(
    shouldReduceMotion,
  );

  useEffect(() => {
    const element = videoRef.current;
    const container = mediaRef.current;
    if (!element || !container) return;

    const connection = (navigator as NavigatorWithConnection).connection;
    if (shouldReduceMotion || connection?.saveData) {
      element.pause();
      setVideoReady(false);
      return;
    }

    let inView = true;
    const syncPlayback = () => {
      if (document.hidden || !inView) {
        element.pause();
        return;
      }

      void element.play().catch(() => setVideoReady(false));
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    });

    observer.observe(container);
    document.addEventListener("visibilitychange", syncPlayback);
    syncPlayback();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      element.pause();
    };
  }, [mediaRef, shouldReduceMotion]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        ref={mediaRef}
        className="hero-media absolute -inset-5"
        style={{ transform }}
      >
        <Image
          src={poster}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center] md:object-center"
        />
        <video
          ref={videoRef}
          className="hero-video absolute inset-0 h-full w-full object-cover object-[70%_center] md:object-center"
          data-ready={videoReady ? "true" : "false"}
          src={video}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          tabIndex={-1}
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
        />
      </motion.div>
      <div className="hero-wash absolute inset-0" />
      <div className="hero-ambient absolute inset-0" />
      <div className="hero-grain absolute inset-0" />
      <div className="hero-vignette absolute inset-0" />
    </div>
  );
}
