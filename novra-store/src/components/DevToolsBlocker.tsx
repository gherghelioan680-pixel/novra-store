"use client";

import { useEffect } from "react";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[data-allow-context]"));
}

function hasTextSelection(): boolean {
  const selection = window.getSelection();
  return Boolean(selection && selection.toString().length > 0);
}

export default function DevToolsBlocker() {
  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => {
      if (e.button !== 2) return;

      if (e.shiftKey || (e.ctrlKey && e.shiftKey)) {
        e.preventDefault();
        return;
      }

      if (isEditableTarget(e.target) || hasTextSelection()) return;
    };

    const blockKeys = (e: KeyboardEvent) => {
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }

      const key = e.key.toLowerCase();

      if (e.ctrlKey && e.shiftKey && (key === "i" || key === "j" || key === "c")) {
        e.preventDefault();
        return;
      }

      if (e.ctrlKey && key === "u") {
        e.preventDefault();
        return;
      }

      if (e.metaKey && e.altKey && (key === "i" || key === "j" || key === "c")) {
        e.preventDefault();
        return;
      }

      if (e.metaKey && e.altKey && key === "u") {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown", blockKeys);

    return () => {
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", blockKeys);
    };
  }, []);

  return null;
}
