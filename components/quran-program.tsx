"use client";

// The Quran program is intentionally embedded inside My Calendar.
// Keeping the implementation in the existing Quran module avoids duplicating
// the state/persistence logic while the standalone navigation entry is removed.
export { default } from "../app/quran/page";
