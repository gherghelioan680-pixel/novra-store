"use client";

import { useEffect } from "react";

/** Registers the shared service worker for offline shell + push notifications. */
export default function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* ignore registration errors */
    });
  }, []);

  return null;
}
