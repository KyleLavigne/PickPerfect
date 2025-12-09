// src/pages/TagAdminPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import useAuthedApi from "../hooks/useAuthedApi";

/**
 * All tag options you might care about in the admin UI.
 * These don't have to match 1:1 with the override lists;
 * they're just things you want to be able to toggle manually.
 */
const ALL_TAG_OPTIONS = [
    "Tank",
    "Frontline",
    "Bruiser",
    "Fighter",
    "Engage",
    "Hard Engage",
    "Initiator",
    "Disengage",
    "Peel",
    "Warden",
    "Assassin",
    "Burst",
    "Pick",
    "Marksman",
    "AD",
    "AP",
    "Mage",
    "Hypercarry",
    "Scaling",
    "Enchanter",
    "Healer",
    "Vision",
    "Utility",
    "Poke",
    "Siege",
    "Anti-Siege",
    "AoE",
    "Wombo",
    "Setup",
    "CC",
    "Hard CC",
    "Waveclear",
    "Splitpush",
    "Duelist",
    "Anti-Tank",
    "%HP Damage",
    "Global",
    "Cross-map",
    "Skirmisher",
    "Early Game",
    "Playmaker"
];

const ROLE_OPTIONS = ["All", "Top", "Jungle", "Middle", "Bottom", "Support"];

function TagChip({ label, active, onToggle }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={
                "px-2 py-1 rounded-full text-xs border transition " +
                (active
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-200"
                    : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-500")
            }
        >
            {label}
        </button>
    );
}

export default function TagAdminPage() {
    const [champions, setChampions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savingName, setSavingName] = useState(null);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");

    // Map<champName, tags[]>
    const [dirtyTags, setDirtyTags] = useState(() => new Map());

    const { authedFetch } = useAuthedApi();

    const fetchChampions = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (search.trim()) params.set("search", search.trim());
            if (roleFilter !== "All") params.set("role", roleFilter);

            const path =
                params.toString().length > 0
                    ? `/admin/champions?${params.toString()}`
                    : "/admin/champions";

            const data = await authedFetch(path);

            // Optional: sanity-check shape in dev
            if (Array.isArray(data) && data.length > 0) {
                console.debug("[TagAdmin] sample champion:", data[0]);
            }

            setChampions(Array.isArray(data) ? data : []);
            setDirtyTags(new Map()); // reset dirty state on reload
        } catch (err) {
            console.error(err);
            setError("Failed to load champions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChampions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleToggleTag = (champName, tag) => {
        setDirtyTags((prev) => {
            const map = new Map(prev);
            const champ = champions.find((c) => c.name === champName);
            const baseTags = champ?.tags || [];
            const current = map.get(champName) ?? baseTags;
            const has = current.includes(tag);
            const next = has ? current.filter((t) => t !== tag) : [...current, tag];
            map.set(champName, next);
            return map;
        });
    };

    const getEffectiveTags = (champName, champ) => {
        const overridden = dirtyTags.get(champName);
        return overridden ?? champ.tags ?? [];
    };

    const handleSave = async (champName) => {
        const tags = dirtyTags.get(champName);
        if (!tags) return; // nothing to save

        setSavingName(champName);
        setError(null);
        try {
            // Use champion name as identifier; authedFetch will prefix /api
            const updated = await authedFetch(`/champions/${encodeURIComponent(champName)}`, {
                method: "PATCH",
                body: JSON.stringify({ tags })
            });

            const newTags = updated?.tags ?? tags;

            setChampions((prev) =>
                prev.map((c) => (c.name === champName ? { ...c, tags: newTags } : c))
            );

            setDirtyTags((prev) => {
                const map = new Map(prev);
                map.delete(champName);
                return map;
            });
        } catch (err) {
            console.error(err);
            setError("Failed to save tags");
        } finally {
            setSavingName(null);
        }
    };

    const anyDirty = useMemo(() => dirtyTags.size > 0, [dirtyTags]);

    const handleRefresh = () => {
        fetchChampions();
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Champion Tag Admin
                        </h1>
                        <p className="text-sm text-neutral-400">
                            Click tags to toggle them on/off per champion. Save to persist to the
                            server.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleRefresh}
                            className="px-3 py-1.5 rounded-md text-sm border border-neutral-700 hover:border-neutral-500 bg-neutral-900"
                        >
                            Refresh
                        </button>
                        {anyDirty && (
                            <span className="text-xs text-amber-400 self-center">
                                You have unsaved tag changes.
                            </span>
                        )}
                    </div>
                </header>

                <section className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-1 gap-2">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search champions..."
                                className="flex-1 px-3 py-2 rounded-md bg-neutral-950 border border-neutral-800 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-3 py-2 rounded-md bg-neutral-950 border border-neutral-800 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                                {ROLE_OPTIONS.map((r) => (
                                    <option key={r} value={r}>
                                        {r === "All" ? "All roles" : r}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={fetchChampions}
                            className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
                        >
                            Apply Filters
                        </button>
                    </div>
                    <p className="text-xs text-neutral-500">
                        Showing {champions.length} champion{champions.length === 1 ? "" : "s"}
                    </p>
                </section>

                {error && (
                    <div className="bg-red-900/40 border border-red-800 text-red-200 text-sm rounded-md px-3 py-2">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-sm text-neutral-400">Loading champions…</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {champions.map((champ) => {
                            const champName = champ.name;
                            const effectiveTags = getEffectiveTags(champName, champ);
                            const isDirty = dirtyTags.has(champName);

                            return (
                                <div
                                    key={champName}
                                    className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 flex flex-col gap-3"
                                >
                                    <div className="flex items-center gap-3">
                                        {champ.iconUrl && (
                                            <img
                                                src={champ.iconUrl}
                                                alt={champ.name}
                                                className="w-10 h-10 rounded-lg object-cover border border-neutral-700"
                                            />
                                        )}
                                        <div>
                                            <div className="text-sm font-semibold">
                                                {champ.name}
                                            </div>
                                            <div className="text-xs text-neutral-400">
                                                {champ.roles?.join(" • ") || "No roles"}
                                            </div>
                                            <div className="text-[11px] text-neutral-500">
                                                key: {champ.key || "(none)"}
                                            </div>
                                        </div>
                                        <div className="ml-auto">
                                            <button
                                                onClick={() => handleSave(champName)}
                                                disabled={!isDirty || savingName === champName}
                                                className={
                                                    "px-3 py-1.5 rounded-md text-xs font-medium border transition " +
                                                    (isDirty
                                                        ? "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500"
                                                        : "bg-neutral-900 border-neutral-700 text-neutral-500 cursor-default")
                                                }
                                            >
                                                {savingName === champName
                                                    ? "Saving…"
                                                    : isDirty
                                                      ? "Save"
                                                      : "Saved"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5">
                                        {ALL_TAG_OPTIONS.map((tag) => (
                                            <TagChip
                                                key={tag}
                                                label={tag}
                                                active={effectiveTags.includes(tag)}
                                                onToggle={() => handleToggleTag(champName, tag)}
                                            />
                                        ))}
                                    </div>

                                    {effectiveTags.length > 0 && (
                                        <p className="text-[11px] text-neutral-500">
                                            Active tags: {effectiveTags.join(", ")}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
