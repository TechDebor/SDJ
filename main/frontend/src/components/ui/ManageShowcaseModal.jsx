import React, { useEffect, useMemo, useState } from "react";
import { Loader2, SlidersHorizontal, X } from "lucide-react";

/**
 * ManageShowcaseModal.jsx
 *
 * Single, self-contained, responsive Manage Showcase modal.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - initialSlides?: [{ badge, title, subtitle, cta, icon? }, ...]
 * - onSave?: async (slides, selectedIndex) => void
 *
 * onSave is optional. If provided, it is called with the complete updated
 * slides array and the currently edited slide index.
 */
const DEFAULT_SLIDES = [
  {
    badge: "ENTERPRISE WORKFORCE VELOCITY",
    title: "Autonomous Task Allocation & Sprint Delivery",
    subtitle:
      "Streamline departmental assignments, track subtasks in real time, and monitor SLA progress.",
    cta: "View Operational Dashboard",
    icon: "zap",
  },
  {
    badge: "COMPLIANCE & GOVERNANCE",
    title: "Automated Indian Statutory Payroll Engine",
    subtitle:
      "Instant itemized payslips with EPF (12%), Professional Tax (₹200), and TDS calculation.",
    cta: "Explore Payroll Statements",
    icon: "shield-check",
  },
  {
    badge: "OPERATIONAL TELEMETRY",
    title: "Live Biometric Attendance & Shift Control",
    subtitle:
      "Precise shift tracking, customizable idle pauses (Tea/Lunch/Restroom), and advance leave planning.",
    cta: "Inspect Duty Timesheets",
    icon: "clock",
  },
];

function cloneSlides(slides) {
  return (slides?.length ? slides : DEFAULT_SLIDES).slice(0, 3).map((slide) => ({
    _id: slide?._id,
    badge: slide?.badge ?? "",
    title: slide?.title ?? "",
    subtitle: slide?.subtitle ?? "",
    cta: slide?.cta ?? "",
    icon: slide?.icon ?? "",
    isActive: slide?.isActive ?? true
  }));
}

export default function ManageShowcaseModal({
  open,
  onClose,
  initialSlides = DEFAULT_SLIDES,
  onSave,
}) {
  const [slides, setSlides] = useState(() => cloneSlides(initialSlides));
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const selectedSlide = useMemo(
    () => slides[selectedIndex] || slides[0],
    [slides, selectedIndex]
  );

  useEffect(() => {
    if (!open) return;

    setSlides(cloneSlides(initialSlides));
    setSelectedIndex(0);
    setSaving(false);
  }, [open, initialSlides]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, saving, onClose]);

  if (!open) return null;

  const updateField = (field, value) => {
    setSlides((current) =>
      current.map((slide, index) =>
        index === selectedIndex ? { ...slide, [field]: value } : slide
      )
    );
  };

  const handleTabChange = (index) => {
    if (!saving) setSelectedIndex(index);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const slide = slides[selectedIndex];

    if (!slide.badge.trim() || !slide.title.trim() || !slide.subtitle.trim()) {
      return;
    }

    try {
      setSaving(true);
      await onSave?.(slides, selectedIndex);
      onClose?.();
    } catch (error) {
      // Parent can show its own toast/error. Keep modal open on failure.
      console.error("Failed to save showcase slide:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-showcase-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose?.();
        }
      }}
    >
      <div className="flex max-h-[94vh] w-full max-w-[680px] flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-800 bg-slate-950 px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-blue-600 text-white shadow-lg shadow-blue-900/30">
              <SlidersHorizontal className="h-[17px] w-[17px]" />
            </div>

            <div className="min-w-0">
              <h2
                id="manage-showcase-title"
                className="truncate text-[14px] font-extrabold leading-tight tracking-tight text-white sm:text-[15px]"
              >
                Manage Operations Showcase Banners
              </h2>
              <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-400 sm:text-[11px]">
                Update organizational banners visible on employee dashboards.
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close modal"
            disabled={saving}
            onClick={() => onClose?.()}
            className="shrink-0 rounded-2xl p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2 scrollbar-none">
            {["Slide 1", "Slide 2", "Slide 3"].map((label, index) => {
              const active = selectedIndex === index;

              return (
                <button
                  key={label}
                  type="button"
                  disabled={saving}
                  onClick={() => handleTabChange(index)}
                  className={[
                    "shrink-0 rounded-2xl px-3 py-1.5 text-[12px] font-semibold transition-all",
                    active
                      ? "border border-blue-300 bg-blue-100 text-blue-900 shadow-sm"
                      : "border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    saving ? "cursor-not-allowed opacity-60" : "",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 pt-5">
            <Field
              label="Badge Tagline"
              required
              value={selectedSlide?.badge ?? ""}
              onChange={(value) => updateField("badge", value)}
              placeholder="ENTERPRISE WORKFORCE VELOCITY"
              disabled={saving}
              inputClassName="uppercase tracking-[0.01em]"
            />

            <Field
              label="Headline Title"
              required
              value={selectedSlide?.title ?? ""}
              onChange={(value) => updateField("title", value)}
              placeholder="Autonomous Task Allocation & Sprint Delivery"
              disabled={saving}
              inputClassName="font-bold text-slate-800"
            />

            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-slate-700">
                Supporting Description <span className="text-rose-500">*</span>
              </label>

              <textarea
                value={selectedSlide?.subtitle ?? ""}
                onChange={(event) => updateField("subtitle", event.target.value)}
                disabled={saving}
                rows={3}
                required
                placeholder="Describe the banner..."
                className="block min-h-[76px] w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            <Field
              label="Call-To-Action (CTA) Label"
              value={selectedSlide?.cta ?? ""}
              onChange={(value) => updateField("cta", value)}
              placeholder="View Operational Dashboard"
              disabled={saving}
            />

            {/* Footer */}
            <div className="flex flex-col-reverse gap-2.5 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => onClose?.()}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[12px] font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[12px] font-extrabold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {saving ? "Saving..." : "Save Banner"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  value,
  onChange,
  placeholder,
  disabled,
  inputClassName = "",
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-bold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={[
          "block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] text-slate-700 outline-none transition",
          "placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          "disabled:cursor-not-allowed disabled:bg-slate-50",
          inputClassName,
        ].join(" ")}
      />
    </div>
  );
}
