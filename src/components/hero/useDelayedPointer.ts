"use client";

import { useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef } from "react";

const DISTANCE = 10;
const DELAY_MS = 100;
const BUFFER_SIZE = 32;
const IDLE_MS = 750;

type PointerSample = {
  time: number;
  x: number;
  y: number;
};

export function useDelayedPointer<T extends HTMLElement>(disabled: boolean) {
  const ref = useRef<T>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { duration: 0.5, bounce: 0.1 });
  const springY = useSpring(y, { duration: 0.5, bounce: 0.1 });
  const transform = useMotionTemplate`translate3d(${springX}px, ${springY}px, 0) scale(1.04)`;

  useEffect(() => {
    const element = ref.current;
    const precisePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );

    if (disabled || !element || !precisePointer.matches) {
      x.set(0);
      y.set(0);
      return;
    }

    const samples: PointerSample[] = Array.from(
      { length: BUFFER_SIZE },
      () => ({ time: 0, x: 0, y: 0 }),
    );
    const boundsElement = element.parentElement ?? element;
    let head = 0;
    let count = 0;
    let frame = 0;
    let inView = true;
    let lastMove = performance.now();

    const addSample = (time: number, nextX: number, nextY: number) => {
      samples[head] = { time, x: nextX, y: nextY };
      head = (head + 1) % BUFFER_SIZE;
      count = Math.min(count + 1, BUFFER_SIZE);
    };

    const readDelayedSample = (time: number) => {
      const targetTime = time - DELAY_MS;
      const oldest = (head - count + BUFFER_SIZE) % BUFFER_SIZE;
      let before = samples[oldest];
      let after = before;

      for (let index = 1; index < count; index += 1) {
        const candidate = samples[(oldest + index) % BUFFER_SIZE];
        if (candidate.time >= targetTime) {
          after = candidate;
          break;
        }
        before = candidate;
        after = candidate;
      }

      const duration = after.time - before.time;
      if (duration <= 0) return before;

      const progress = Math.min(
        1,
        Math.max(0, (targetTime - before.time) / duration),
      );
      return {
        x: before.x + (after.x - before.x) * progress,
        y: before.y + (after.y - before.y) * progress,
      };
    };

    const tick = (time: number) => {
      frame = 0;
      if (!inView || document.hidden) return;

      const point = readDelayedSample(time);
      x.set(point.x);
      y.set(point.y);

      if (time - lastMove < IDLE_MS) {
        frame = requestAnimationFrame(tick);
      }
    };

    const start = () => {
      if (!frame && inView && !document.hidden) {
        frame = requestAnimationFrame(tick);
      }
    };

    const reset = () => {
      const now = performance.now();
      lastMove = now;
      addSample(now, 0, 0);
      start();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      const bounds = boundsElement.getBoundingClientRect();
      const inside =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;

      if (!inside) {
        reset();
        return;
      }

      const normalizedX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      const normalizedY = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
      const now = performance.now();
      if (now - lastMove > IDLE_MS) {
        head = 0;
        count = 0;
        addSample(now - DELAY_MS, 0, 0);
      }

      lastMove = now;
      addSample(now, normalizedX * DISTANCE, normalizedY * DISTANCE);
      start();
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      x.set(0);
      y.set(0);
    };

    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else reset();
    };

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) reset();
      else stop();
    });

    addSample(performance.now(), 0, 0);
    observer.observe(element);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer.disconnect();
      stop();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [disabled, x, y]);

  return { ref, transform };
}
