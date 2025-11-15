"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CursorEffect() {
  const [isVisible, setIsVisible] = useState(false);
  const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 200 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    let trailId = 0;

    const moveCursor = (e: MouseEvent) => {
      setIsVisible(true);
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      // Add trail point
      const newTrail = {
        x: e.clientX,
        y: e.clientY,
        id: trailId++,
      };

      setTrail((prev) => {
        const updated = [...prev, newTrail];
        // Keep only last 20 trail points
        return updated.slice(-20);
      });
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // Clean up old trail points
    const trailCleanup = setInterval(() => {
      setTrail((prev) => prev.slice(1));
    }, 50);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      clearInterval(trailCleanup);
    };
  }, [cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <>
      {/* Trail effect */}
      {trail.map((point, index) => {
        const opacity = (index / trail.length) * 0.5;
        const scale = (index / trail.length) * 0.8;
        
        return (
          <motion.div
            key={point.id}
            className="pointer-events-none fixed z-50 mix-blend-screen"
            style={{
              left: point.x,
              top: point.y,
              x: "-50%",
              y: "-50%",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity, scale }}
            exit={{ opacity: 0 }}
          >
            <div
              className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-pink-600"
              style={{
                filter: "blur(2px)",
              }}
            />
          </motion.div>
        );
      })}

      {/* Main cursor circle with delay */}
      <motion.div
        className="pointer-events-none fixed z-50 mix-blend-difference"
        style={{
          left: cursorXSpring,
          top: cursorYSpring,
          x: "-50%",
          y: "-50%",
        }}
      >
        <div className="w-10 h-10 rounded-full border-2 border-red-500" />
      </motion.div>

      {/* Inner dot */}
      <motion.div
        className="pointer-events-none fixed z-50"
        style={{
          left: cursorX,
          top: cursorY,
          x: "-50%",
          y: "-50%",
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
      </motion.div>
    </>
  );
}
