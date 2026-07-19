"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

export type ScrollRevealVariant = "fade-up" | "fade-in" | "slide-left" | "slide-right" | "scale-up";

type ScrollRevealProps = {
  children: ReactNode;
  variant?: ScrollRevealVariant;
  delay?: number;
  className?: string;
  as?: ElementType;
  parallax?: boolean;
};

const VARIANT_CLASS: Record<ScrollRevealVariant, string> = {
  "fade-up": "scroll-reveal-fade-up",
  "fade-in": "scroll-reveal-fade-in",
  "slide-left": "scroll-reveal-slide-left",
  "slide-right": "scroll-reveal-slide-right",
  "scale-up": "scroll-reveal-scale-up",
};

export default function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  className = "",
  as: Tag = "div",
  parallax = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!parallax || !visible) return;
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * 0.035;
      el.style.setProperty("--parallax-y", `${offset}px`);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [parallax, visible]);

  return (
    <Tag
      ref={ref}
      className={`scroll-reveal ${VARIANT_CLASS[variant]} ${visible ? "scroll-reveal-visible" : ""} ${parallax ? "scroll-reveal-parallax" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
