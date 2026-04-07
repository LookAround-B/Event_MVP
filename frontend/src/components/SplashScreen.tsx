'use client';

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShaderAnimation } from '@/components/shader-lines';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, 3500);

    const finishTimer = window.setTimeout(() => {
      onFinish();
    }, 4500);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          <div
            className="absolute inset-0 z-0 opacity-70"
            style={{
              background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 16%, rgba(0,0,0,0) 38%), linear-gradient(180deg, rgba(26,26,26,0.92) 0%, rgba(0,0,0,1) 100%)'
            }}
          />

          <div className="absolute inset-0 z-0">
            <ShaderAnimation />
          </div>

          {/* Subtle dark veil so text is legible */}
          <div className="absolute inset-0 z-[1] bg-black/55" />

          <div
            className="absolute inset-0 z-[2]"
            style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.7) 100%)' }}
          />

          {/* Brand mark */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.9, ease: "easeOut" }}
            className="relative z-10 text-center px-6"
          >
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase mb-3 drop-shadow-2xl">
              <span className="text-white">EQ</span>
              <span className="text-primary">WI</span>
            </h1>

            {/* Divider glow */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.9, duration: 0.7, ease: "easeOut" }}
              className="h-[1px] w-40 mx-auto mb-5"
              style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.7), transparent)" }}
            />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="text-[11px] md:text-xs tracking-[0.45em] text-white/50 uppercase font-mono"
            >
              Equestrian Event Platform
            </motion.p>
          </motion.div>

          {/* Progress bar */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 w-56 max-w-[calc(100vw-3rem)]">
            <div className="h-[1px] w-full bg-white/10 relative overflow-hidden rounded-full">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-y-0 w-24 rounded-full"
                style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
