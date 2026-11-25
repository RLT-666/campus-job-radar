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
    // 减少动态偏好或省流量模式：只保留海报静态画面，不启动视频。
    // 注意：这里不直接 setVideoReady(false)——effect 体内同步 setState
    // 会触发 react-hooks/set-state-in-effect 报错（级联渲染）。
    // 视频暂停后浏览器会异步派发 pause 事件，由 <video> 的 onPause
    // 处理器统一把 ready 状态归零，行为一致且符合 React 规则。
    if (shouldReduceMotion || connection?.saveData) {
      element.pause();
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
          // 播放/暂停事件驱动 ready 状态（异步事件回调，符合 React 规则）：
          // 恢复播放（含切回前台）立即显示视频；暂停（含省流量分支）退回海报
          onPlay={() => setVideoReady(true)}
          onPause={() => setVideoReady(false)}
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
