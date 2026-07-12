import Script from "next/script";
import { CAMPAIGN_END_DATE, COUNTDOWN_TIMER_ID } from "@/lib/countdown";

/** Vanilla JS countdown tick — runs even if React hydration is delayed on mobile Safari */
export default function CountdownFallbackScript() {
  const endIso = CAMPAIGN_END_DATE.toISOString();

  return (
    <Script id="countdown-fallback" strategy="beforeInteractive">
      {`
(function () {
  var END = new Date(${JSON.stringify(endIso)}).getTime();
  var TIMER_ID = ${JSON.stringify(COUNTDOWN_TIMER_ID)};
  var DIGIT_IDS = ["countdown-days", "countdown-hours", "countdown-minutes", "countdown-seconds"];
  function pad(n) { return String(n).padStart(2, "0"); }
  function tick() {
    var root = document.getElementById(TIMER_ID);
    if (root && root.getAttribute("data-hydrated") === "true") return;
    var diff = END - Date.now();
    if (diff <= 0) return;
    var vals = [
      Math.floor(diff / 86400000),
      Math.floor((diff / 3600000) % 24),
      Math.floor((diff / 60000) % 60),
      Math.floor((diff / 1000) % 60),
    ];
    for (var i = 0; i < DIGIT_IDS.length; i++) {
      var el = document.getElementById(DIGIT_IDS[i]);
      if (el) el.textContent = pad(vals[i]);
    }
  }
  function start() {
    tick();
    if (window.__novraCountdownInterval) {
      window.clearInterval(window.__novraCountdownInterval);
    }
    window.__novraCountdownInterval = window.setInterval(function () {
      var root = document.getElementById(TIMER_ID);
      if (root && root.getAttribute("data-hydrated") === "true") {
        if (window.__novraCountdownInterval) {
          window.clearInterval(window.__novraCountdownInterval);
          window.__novraCountdownInterval = null;
        }
        return;
      }
      tick();
    }, 1000);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") tick();
    });
  }
  if (window.__novraCountdownFallbackStarted) return;
  window.__novraCountdownFallbackStarted = true;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
      `}
    </Script>
  );
}
