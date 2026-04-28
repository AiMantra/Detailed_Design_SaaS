/** localStorage key — must match inline script in index.html */
export const THEME_STORAGE_KEY = "appTheme";

export function readStoredTheme() {
  if (typeof window === "undefined") return "light";
  const value = sessionStorage.getItem(THEME_STORAGE_KEY);
  if (value === "light" || value === "dark" || value === "system") return value;
  return "light";
}

/**
 * Applies Tailwind v4 class-based dark mode (see @custom-variant in index.css).
 * @param {"light" | "dark" | "system"} theme
 */
export function applyThemeToDocument(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    root.classList.toggle(
      "dark",
      window.matchMedia("(prefers-color-scheme: dark)").matches,
    );
  }
}
