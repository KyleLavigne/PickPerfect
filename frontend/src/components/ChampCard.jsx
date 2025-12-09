import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
const CDN = "https://ddragon.leagueoflegends.com/cdn";

export default function ChampCard({ champ, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const [ddChamp, setDdChamp] = useState(null);
    const [version, setVersion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);

    const handleCardClick = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    const handlePick = () => {
        onSelect?.(champ);
        setIsOpen(false);
    };

    // Fetch details from your backend when modal opens
    useEffect(() => {
        if (!isOpen) return;
        if (ddChamp) return; // already loaded once for this champ

        let cancelled = false;

        const fetchDetails = async () => {
            try {
                setLoading(true);
                setLoadError(null);

                const res = await fetch(
                    `${API_BASE}/ddragon/champions/${encodeURIComponent(champ.key)}`
                );
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const json = await res.json();
                if (cancelled) return;

                // json should be { version, champ }
                setVersion(json.version || null);
                setDdChamp(json.champ || json.data || json); // be a bit defensive
            } catch (err) {
                if (!cancelled) {
                    console.error("Error loading champ details:", err);
                    setLoadError("Could not load champion details.");
                    setDdChamp(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchDetails();

        return () => {
            cancelled = true;
        };
    }, [isOpen, champ.key, ddChamp]);

    const ddLore = ddChamp?.lore;
    const ddPassive = ddChamp?.passive;
    const ddSpells = ddChamp?.spells || [];
    const ddTags = ddChamp?.tags || champ.tags || [];

    return (
        <>
            {/* Card */}
            <button
                onClick={handleCardClick}
                aria-label={`View info for ${champ.name}`}
                className="
          flex flex-col items-center
          rounded-xl border border-neutral-700
          bg-neutral-950 px-3 py-3 text-neutral-50 shadow-sm
          transition hover:-translate-y-0.5 hover:border-emerald-400
          hover:shadow-lg hover:shadow-emerald-500/20
          w-full min-w-[140px] max-w-[220px]
        "
            >
                <img
                    src={champ.iconUrl}
                    alt={champ.name}
                    className="h-16 w-16 rounded-lg object-cover"
                />
                <div className="mt-2 text-sm font-semibold">{champ.name}</div>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {champ.roles?.slice(0, 2).map((r) => (
                        <span
                            key={r}
                            className="rounded-full border border-neutral-400 px-2 py-0.5 text-[11px] font-medium"
                        >
                            {r}
                        </span>
                    ))}
                    {champ.tags?.slice(0, 2).map((t) => (
                        <span
                            key={t}
                            className="rounded-full border border-dashed border-neutral-500/80 px-2 py-0.5 text-[11px] text-neutral-300"
                        >
                            {t}
                        </span>
                    ))}
                </div>
            </button>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                    onClick={handleClose}
                >
                    <div
                        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-700 bg-neutral-950 p-5 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <img
                                    src={champ.iconUrl}
                                    alt={champ.name}
                                    className="h-16 w-16 md:h-20 md:w-20 rounded-xl object-cover"
                                />
                                <div>
                                    <h2 className="text-lg font-semibold leading-tight">
                                        {champ.name}
                                    </h2>
                                    {(champ.title || ddChamp?.title) && (
                                        <p className="mt-1 text-xs text-neutral-300">
                                            {champ.title || ddChamp?.title}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                aria-label="Close champion details"
                                className="rounded-full p-1 text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-100"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="mt-4 text-sm leading-relaxed text-neutral-100">
                            {/* Roles / Tags */}
                            <div className="mb-3 flex flex-wrap gap-2">
                                {champ.roles.map((r) => (
                                    <span
                                        key={`role-${r}`}
                                        className="rounded-full border border-emerald-400/80 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200"
                                    >
                                        {r}
                                    </span>
                                ))}

                                {ddTags.map((tag, idx) => (
                                    <span
                                        key={`tag-${tag}-${idx}`}
                                        className="rounded-full border border-neutral-500/80 bg-neutral-800/60 px-2.5 py-0.5 text-[11px] text-neutral-200"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Status */}
                            {loading && (
                                <p className="text-xs text-neutral-400">
                                    Loading champion details…
                                </p>
                            )}
                            {!loading && loadError && (
                                <p className="text-xs text-red-400">{loadError}</p>
                            )}

                            {/* Lore */}
                            {!loading && !loadError && ddLore && (
                                <p className="mb-4 text-sm text-neutral-200">{ddLore}</p>
                            )}

                            {/* Passive + Spells with icons */}
                            {!loading && !loadError && ddChamp && version && (
                                <div className="mt-3 flex flex-col gap-3">
                                    {ddPassive && (
                                        <AbilityBlock
                                            keyLabel="P"
                                            name={ddPassive.name}
                                            description={ddPassive.description}
                                            iconUrl={`${CDN}/${version}/img/passive/${ddPassive.image.full}`}
                                        />
                                    )}

                                    {ddSpells.map((spell, index) => (
                                        <AbilityBlock
                                            key={spell.id || spell.name}
                                            keyLabel={["Q", "W", "E", "R"][index] || "•"}
                                            name={spell.name}
                                            description={spell.description}
                                            iconUrl={`${CDN}/${version}/img/spell/${spell.image.full}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-5 flex justify-end gap-2">
                            {onSelect && (
                                <button
                                    type="button"
                                    onClick={handlePick}
                                    className="rounded-full bg-linear-to-tr from-emerald-400 via-emerald-500 to-emerald-600 px-4 py-1.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:brightness-110"
                                >
                                    Pick {champ.name}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded-full border border-neutral-600 px-4 py-1.5 text-sm text-neutral-100 transition hover:bg-neutral-800"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function AbilityBlock({ keyLabel, name, description, iconUrl }) {
    return (
        <div className="flex gap-3 rounded-lg border border-slate-700 bg-slate-900/70 p-3">
            {/* Icon */}
            <img
                src={iconUrl}
                alt={name}
                className="h-10 w-10 rounded-md border border-slate-600 object-cover"
            />

            <div>
                <div className="mb-1 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-cyan-400 text-[11px] font-bold">
                        {keyLabel}
                    </span>
                    <span className="text-sm font-semibold">{name}</span>
                </div>
                <p
                    className="text-xs leading-snug text-neutral-200"
                    dangerouslySetInnerHTML={{ __html: description }}
                />
            </div>
        </div>
    );
}
