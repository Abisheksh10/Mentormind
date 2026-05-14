import React, { useState } from "react";
import { Menu, X } from "lucide-react";

export default function AppShell({ sidebar, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="mm-shell">
      {/* ✅ Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-40 border-b border-[var(--mm-border)] bg-[rgba(7,11,24,0.80)] backdrop-blur">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[rgba(47,107,255,0.18)] border border-[rgba(47,107,255,0.35)] flex items-center justify-center">
              <span className="text-[18px] font-bold text-[var(--mm-blue)]">⟠</span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Mentor Mind</p>
              <p className="text-[10px] mm-muted mt-1">AI-Powered Progress</p>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="mm-btn px-3 py-2"
            aria-label="Open Menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* ✅ Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* panel */}
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-[320px] border-r border-[var(--mm-border)] bg-[rgba(7,11,24,0.95)] backdrop-blur">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--mm-border)]">
              <p className="font-semibold">Menu</p>
              <button
                onClick={() => setMobileOpen(false)}
                className="mm-btn px-3 py-2"
                aria-label="Close Menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* close drawer when any nav is clicked */}
            <div onClick={() => setMobileOpen(false)}>{sidebar}</div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* ✅ Desktop Sidebar */}
        <aside className="hidden md:block w-[280px] min-h-screen border-r border-[var(--mm-border)] bg-[rgba(7,11,24,0.55)] backdrop-blur">
          {sidebar}
        </aside>

        {/* ✅ Main */}
        <main className="flex-1 min-h-screen">
          {/* desktop padding vs mobile padding */}
          <div className="px-4 py-5 md:px-10 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}