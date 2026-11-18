"use client";

import { useEffect, useState } from "react";
import type { LanguageCode } from "@/components/LanguageSelector";

const languages: { code: LanguageCode; label: string; hint: string }[] = [
  { code: "en", label: "English", hint: "Global feed language" },
  { code: "ml", label: "മലയാളം", hint: "Malayalam stories and filters" },
  { code: "hi", label: "हिन्दी", hint: "Hindi stories and filters" },
];

const STORAGE_KEY = "confess-hub-language";

export default function LanguagePicker({ description }: { description?: string }) {
  const [language, setLanguage] = useState<LanguageCode>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ml" || stored === "hi") {
      setLanguage(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  function pick(nextLanguage: LanguageCode) {
    setLanguage(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.dispatchEvent(new CustomEvent("confess-hub-language-change", { detail: nextLanguage }));
  }

  return (
    <div className="language-picker-block">
      {description ? <p className="field-hint">{description}</p> : null}
      <div className="language-picker-grid" role="radiogroup" aria-label="Choose feed language">
        {languages.map((option) => (
          <button
            key={option.code}
            type="button"
            role="radio"
            aria-checked={language === option.code}
            className={language === option.code ? "language-pill active" : "language-pill"}
            onClick={() => pick(option.code)}
          >
            <span className="language-pill-label">{option.label}</span>
            <span className="language-pill-hint">{option.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}