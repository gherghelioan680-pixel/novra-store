"use client";

import { useEffect } from "react";
import { startVisitorHeartbeat } from "@/lib/visitors-client";

/** Înregistrează sesiuni vizitatori pe tot site-ul (heartbeat la 60s). */
export default function VisitorTracker() {
  useEffect(() => startVisitorHeartbeat(), []);
  return null;
}
