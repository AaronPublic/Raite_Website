"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function MotionDiv({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
