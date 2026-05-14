import React from "react";

export default function PageHeader({ title, subtitle, right }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight">{title}</h1>
        <p className="mt-1 mm-muted text-sm">{subtitle}</p>
      </div>

      {right ? <div className="flex items-center gap-3">{right}</div> : null}
    </div>
  );
}
