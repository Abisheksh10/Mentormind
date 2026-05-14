import React from "react";
import { X } from "lucide-react";

export default function Modal({ open, title, subtitle, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl mm-card px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            {subtitle ? <p className="text-sm mm-muted mt-1">{subtitle}</p> : null}
          </div>

          <button
            onClick={onClose}
            className="mm-btn px-3 py-2"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
