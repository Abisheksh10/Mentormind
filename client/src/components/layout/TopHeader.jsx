import React from "react";

export default function TopHeader({ title, subtitle }) {
  return (
    <div className="flex items-center justify-between px-4 md:px-6 py-4">
      <div>
        <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
        <p className="text-xs md:text-sm text-zinc-400">{subtitle}</p>
      </div>

      <div className="flex gap-2">
        <div className="px-3 py-1 rounded-full border border-zinc-800 text-xs text-zinc-300">
          Gemini Flash 2.5
        </div>
      </div>
    </div>
  );
}
