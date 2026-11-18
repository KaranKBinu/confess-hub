"use client";

import { useThemePreference } from "@/components/ThemeProvider";
import type { ThemePreference } from "@/lib/theme";

type ThemePickerProps = {
  description?: string;
  onPersist?: (theme: ThemePreference) => Promise<void>;
};

const options: Array<{ value: ThemePreference; label: string; hint: string }> = [
  { value: "light", label: "Light", hint: "Warm paper tones (default)" },
  { value: "dark", label: "Dark", hint: "Easier on the eyes at night" },
];

export default function ThemePicker({ description, onPersist }: ThemePickerProps) {
  const { theme, setTheme } = useThemePreference();

  async function select(next: ThemePreference) {
    setTheme(next);
    if (onPersist) await onPersist(next);
  }

  return (
    <div className="theme-picker-block">
      {description ? <p className="field-hint">{description}</p> : null}
      <div className="theme-picker-grid" role="radiogroup" aria-label="Color theme">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={theme === option.value}
            className={theme === option.value ? "theme-pill active" : "theme-pill"}
            onClick={() => void select(option.value)}
          >
            <span className="theme-pill-label">{option.label}</span>
            <span className="theme-pill-hint">{option.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}