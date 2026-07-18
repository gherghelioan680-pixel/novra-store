"use client";

import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";

type ShakeButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export default function ShakeButton({ href, children, className = "" }: ShakeButtonProps) {
  return (
    <motion.div
      animate={{
        x: [0, -2, 2, -2, 2, -1, 1, 0],
      }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        repeatDelay: 2.5,
        ease: "easeInOut",
      }}
    >
      <Link
        href={href}
        className={`inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 ${className}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}
