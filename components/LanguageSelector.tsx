"use client";

import { useEffect, useState } from "react";

export type LanguageCode = "en" | "ml" | "hi";

const languages: { code: LanguageCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ml", label: "മലയാളം" },
  { code: "hi", label: "हिन्दी" },
];

const STORAGE_KEY = "confess-hub-language";

export default function LanguageSelector() {
  const [language, setLanguage] = useState<LanguageCode>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ml" || stored === "hi") {
      setLanguage(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  function changeLanguage(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLanguage = event.target.value as LanguageCode;
    setLanguage(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.dispatchEvent(
      new CustomEvent("confess-hub-language-change", { detail: nextLanguage }),
    );
  }

  return (
    <label htmlFor="language-select">
      <select
        id="language-select"
        className="language-select"
        value={language}
        onChange={changeLanguage}
        aria-label="Choose language"
      >
        {languages.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
