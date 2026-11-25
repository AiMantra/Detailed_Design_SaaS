import { CSMS_BASE_URL, CSMS_LETTER_FILTER_ID } from "../constants/projectSources";

const letterCache = new Map();

const LETTER_NUMBER_KEYS = [
  "letter_num",
  "letter_no",
  "letter_number",
  "letterNo",
  "letterno",
  "letter_no_text",
  "inward_no",
  "outward_no",
  "letter_ref",
  "ref_no",
  "reference_no",
];

const SUBJECT_KEYS = [
  "lettertype",
  "letter_type",
  "subject",
  "letter_subject",
  "title",
  "letter_title",
  "description",
];

function pickFirst(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && String(value).trim() && String(value).trim() !== "null") {
      return String(value).trim();
    }
  }
  return "";
}

function collectArrays(node, out = []) {
  if (node == null) return out;
  if (Array.isArray(node)) {
    out.push(node);
    node.forEach((child) => collectArrays(child, out));
    return out;
  }
  if (typeof node === "object") {
    Object.values(node).forEach((child) => collectArrays(child, out));
  }
  return out;
}

function normalizeLetter(item) {
  if (!item || typeof item !== "object") return null;
  const number = pickFirst(item, LETTER_NUMBER_KEYS);
  if (!number) return null;
  return {
    id: String(item.id || item.letter_id || item.uuid || number),
    number,
    subject: pickFirst(item, SUBJECT_KEYS),
    letterType: item.lettertype || item.letter_type || "",
    workPerformedBy: item.workperformedby || "",
    status: item.status || "",
  };
}

export function parseLetterRecords(payload) {
  const arrays = collectArrays(payload);
  const seen = new Set();
  const letters = [];

  for (const arr of arrays) {
    for (const item of arr) {
      const letter = normalizeLetter(item);
      if (!letter) continue;
      const key = letter.number.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      letters.push(letter);
    }
  }

  return letters.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
}

export function composeWorklogNote(note, letterNumber) {
  const text = stripLetterFromNote(note);
  const letter = String(letterNumber || "").trim();
  if (!letter) return text;
  if (!text) return `Letter No: ${letter}`;
  return `Letter No: ${letter} — ${text}`;
}

export function parseLetterFromNote(note) {
  const text = String(note || "").trim();
  const match = text.match(/Letter\s*No\.?\s*:\s*-?\s*(.+)/i);
  if (!match) return "";
  return match[1].split(/\s+[—]\s+/)[0].trim();
}

export function stripLetterFromNote(note) {
  return String(note || "")
    .replace(/Letter\s*No\.?\s*:\s*-?\s*.+?(?:\s+[—]\s+)?/i, "")
    .trim();
}

export function letterRecordUrl(projectId) {
  return `${CSMS_BASE_URL}/siteproject/letterrecordfilterletter/${projectId}/null/null/null/null/${CSMS_LETTER_FILTER_ID}/`;
}

export async function fetchProjectLetters(projectId) {
  const pid = String(projectId || "").trim();
  if (!pid) return [];
  if (letterCache.has(pid)) return letterCache.get(pid);

  const token = sessionStorage.getItem("authToken");
  const response = await fetch(letterRecordUrl(pid), {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load letter numbers (${response.status})`);
  }

  const payload = await response.json();
  const letters = parseLetterRecords(payload);
  if (letters.length) letterCache.set(pid, letters);
  return letters;
}
