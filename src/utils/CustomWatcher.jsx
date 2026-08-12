// src/utils/clockTamperWatcher.js

const CHECK_INTERVAL_MS = 1000;   // fast backup check while tab is visible
const DRIFT_THRESHOLD_MS = 3000;

let baselineDateNow = Date.now();
let baselinePerfNow = performance.now();
let hasHandledTamper = false;
let intervalId = null;

const resetBaseline = () => {
    baselineDateNow = Date.now();
    baselinePerfNow = performance.now();
};

const handleSystemDateTamper = (drift) => {
    if (hasHandledTamper) return; // hard guard, first line, synchronous
    hasHandledTamper = true;      // lock immediately — no other call can pass this point

    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    console.warn(`Clock tamper detected. Drift: ${drift}ms`);
    alert(
        "Your device's date/time was changed. The portal will refresh — please correct your system date to continue."
    );
    window.location.reload();
};

const checkDrift = () => {
    if (hasHandledTamper) return true; // already handled, nothing to do

    const currentDateNow = Date.now();
    const currentPerfNow = performance.now();

    const realElapsed = currentPerfNow - baselinePerfNow;
    const dateElapsed = currentDateNow - baselineDateNow;
    const drift = Math.abs(dateElapsed - realElapsed);

    console.log(`Clock check → dateElapsed=${dateElapsed}ms realElapsed=${realElapsed.toFixed(0)}ms drift=${drift.toFixed(0)}ms`);

    if (drift > DRIFT_THRESHOLD_MS) {
        handleSystemDateTamper(drift);
        return true;
    }
    return false;
};

const recheckImmediately = () => {
    console.log(`[${new Date().toISOString()}] recheckImmediately called, visibilityState=${document.visibilityState}`);
    if (hasHandledTamper) return;
    const tampered = checkDrift();
    if (!tampered) resetBaseline();
};

export const startClockTamperWatcher = () => {
    document.addEventListener("visibilitychange", () => {
        console.log(`[${new Date().toISOString()}] visibilitychange fired, state=${document.visibilityState}`);
        if (document.visibilityState === "visible") recheckImmediately();
    });
    window.addEventListener("focus", () => {
        console.log(`[${new Date().toISOString()}] focus event fired`);
        recheckImmediately();
    });
    window.addEventListener("pageshow", () => {
        console.log(`[${new Date().toISOString()}] pageshow event fired`);
        recheckImmediately();
    });

    intervalId = setInterval(recheckImmediately, CHECK_INTERVAL_MS);
};