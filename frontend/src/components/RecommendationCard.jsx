import React from "react";

export default function RecommendationCard({ rec, onSelect }) {
    // rec = { champId, name, roles, tags, highlights, ... }

    const highlightLines = rec.highlights ?? [];

    return (
        <div className="relative group">
            <button
                type="button"
                onClick={() => onSelect?.(rec)}
                className="flex w-full items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 py-2 text-left hover:border-emerald-500 hover:bg-neutral-900"
            >
                {rec.iconUrl && (
                    <img
                        src={rec.iconUrl}
                        alt={rec.name}
                        className="h-8 w-8 rounded-md object-cover border border-neutral-700"
                    />
                )}
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-50">{rec.name}</span>
                    <span className="text-[11px] text-neutral-400">
                        {rec.roles?.join(" • ") || "No roles"}
                    </span>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-xs text-emerald-400 font-semibold">
                        {rec.total.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-neutral-500">Score</div>
                </div>
            </button>

            {/* Tooltip on hover */}
            {highlightLines.length > 0 && (
                <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-72 -translate-x-1/2 rounded-lg bg-neutral-950/95 px-3 py-2 text-[11px] text-neutral-50 shadow-xl ring-1 ring-black/60 group-hover:block">
                    <p className="mb-1 font-semibold text-emerald-300">What {rec.name} adds</p>
                    <ul className="space-y-0.5 list-disc list-inside">
                        {highlightLines.map((line, idx) => (
                            <li key={idx}>{line}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
