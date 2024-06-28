// ThemeToggle.tsx
"use client";
import { useTheme } from "next-themes";

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M12.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
      <path
        strokeLinecap="round"
        d="M10 5.5v-1M13.182 6.818l.707-.707M14.5 10h1M13.182 13.182l.707.707M10 15.5v-1M6.11 13.889l.708-.707M4.5 10h1M6.11 6.111l.708.707"
      />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path d="M15.224 11.724a5.5 5.5 0 0 1-6.949-6.949 5.5 5.5 0 1 0 6.949 6.949Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  function disableTransitionsTemporarily() {
    document.documentElement.classList.add("[&_*]:!transition-none");
    window.setTimeout(() => {
      document.documentElement.classList.remove("[&_*]:!transition-none");
    }, 0);
  }

  function toggleMode() {
    disableTransitionsTemporarily();
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      className="flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5"
      aria-label="Toggle dark mode"
      onClick={toggleMode}
    >
      <SunIcon className="h-8 w-8 stroke-slate-900 dark:hidden" />
      <MoonIcon className="hidden h-8 w-8 stroke-slate-900 dark:block" />
    </button>
  );
}
