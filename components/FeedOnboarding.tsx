"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "confess-hub-onboarding-v2";

type Step = { title: string; body: string; icon: string };

export default function FeedOnboarding({ steps }: { steps: Step[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const done = window.localStorage.getItem(STORAGE_KEY) === "1";
    if (!done) {
      const timer = window.setTimeout(() => setOpen(true), 600);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, []);

  function finish() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  if (!open || steps.length === 0) return null;

  const step = steps[index] ?? steps[0];
  const last = index >= steps.length - 1;

  return (
    <div
      className="onboarding-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="onboarding-card">
        <div className="onboarding-visual" aria-hidden="true">
          <span className="onboarding-icon">{step.icon}</span>
          <span className="onboarding-orbit" />
        </div>
        <p className="eyebrow">Quick tour</p>
        <h2 id="onboarding-title">{step.title}</h2>
        <p className="onboarding-body">{step.body}</p>
        <div className="onboarding-dots" aria-hidden="true">
          {steps.map((_, dot) => (
            <span key={dot} className={dot === index ? "onboarding-dot active" : "onboarding-dot"} />
          ))}
        </div>
        <div className="onboarding-actions">
          <button type="button" className="text-button" onClick={finish}>
            Skip
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => (last ? finish() : setIndex((current) => current + 1))}
          >
            {last ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}