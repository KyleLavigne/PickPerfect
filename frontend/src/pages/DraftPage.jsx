import React, { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

/**
 * DraftPage.jsx — lane-filtered recommendations + user draft saving
 */

const DEFAULT_LIMIT = 60;
const RECS_LIMIT = 12;
const LANE_ORDER = ["Top", "Jungle", "Middle", "Bottom", "Support"];
const STORAGE_KEY = "draft-helper-v1";

// Utility: classnames
function cn(...xs) {
    return xs.filter(Boolean).join(" ");
}

// Normalize / derive a unique string key for a champion
const champKey = (c) =>
    c ? String(c.key ?? c.id ?? c.name ?? Math.random().toString(36).slice(2)) : "";

// Map slot key to lane role
const slotKeyToRole = (slotKey) => {
    if (!slotKey) return null;
    const k = String(slotKey).toLowerCase();
    if (k.includes("top")) return "Top";
    if (k.includes("jungle")) return "Jungle";
    if (k.includes("mid") || k.includes("middle")) return "Middle";
    if (k.includes("bot") || k.includes("adc") || k.includes("bottom")) return "Bottom";
    if (k.includes("sup") || k.includes("support")) return "Support";
    return slotKey.charAt(0).toUpperCase() + slotKey.slice(1);
};

const createEmptyPicks = () => ({
    Top: null,
    Jungle: null,
    Middle: null,
    Bottom: null,
    Support: null
});

const createEmptyBans = () => ({
    Blue: [null, null, null, null, null],
    Red: [null, null, null, null, null]
});

export default function DraftPage({ fetchChampions }) {
    const API_BASE =
        (typeof window !== "undefined" && window.__DRAFT_API_BASE) ||
        import.meta.env.VITE_API_BASE ||
        ""; // empty = use relative /api

    // --- Auth0 ---
    const { isAuthenticated, getAccessTokenSilently, isLoading } = useAuth0();
    const isAuthed = isAuthenticated && !isLoading;

    // --- Draft state (picks / bans) ---
    const [bluePicks, setBluePicks] = useState(createEmptyPicks);
    const [redPicks, setRedPicks] = useState(createEmptyPicks);
    const [bans, setBans] = useState(createEmptyBans);

    // Active selection: { team:"Blue"|"Red", kind:"pick"|"ban", slotKey: lane | banIndex }
    const [activeSlot, setActiveSlot] = useState(null);

    // --- Search state ---
    const [query, setQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);

    // --- Recommendations state ---
    const [recs, setRecs] = useState([]);
    const [recsRole, setRecsRole] = useState(null);
    const [loadingRecs, setLoadingRecs] = useState(false);

    // --- Draft saving state ---
    const [draftName, setDraftName] = useState("");
    const [currentDraftId, setCurrentDraftId] = useState(null);
    const [userDrafts, setUserDrafts] = useState([]);
    const [loadingDrafts, setLoadingDrafts] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [draftError, setDraftError] = useState("");

    // --- Hydrate draft from localStorage on mount ---
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);

            if (parsed.bluePicks) {
                setBluePicks((prev) => ({ ...prev, ...parsed.bluePicks }));
            }
            if (parsed.redPicks) {
                setRedPicks((prev) => ({ ...prev, ...parsed.redPicks }));
            }
            if (parsed.bans) {
                setBans((prev) => ({
                    Blue: Array.isArray(parsed.bans.Blue) ? [...parsed.bans.Blue] : prev.Blue,
                    Red: Array.isArray(parsed.bans.Red) ? [...parsed.bans.Red] : prev.Red
                }));
            }
        } catch (e) {
            console.error("Failed to load draft from storage:", e);
        }
    }, []);

    // --- Persist draft to localStorage whenever picks/bans change ---
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const payload = { bluePicks, redPicks, bans };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch (e) {
            console.error("Failed to save draft to storage:", e);
        }
    }, [bluePicks, redPicks, bans]);

    const clearDraft = () => {
        const emptyPicks = createEmptyPicks();
        const emptyBans = createEmptyBans();
        setBluePicks(emptyPicks);
        setRedPicks(emptyPicks);
        setBans(emptyBans);
        setActiveSlot(null);
        setCurrentDraftId(null);
        if (typeof window !== "undefined") {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (e) {
                console.error("Failed to clear draft from storage:", e);
            }
        }
    };

    // --- Keys of any taken champs ---
    const usedChampionKeys = useMemo(() => {
        const ids = new Set();
        const add = (c) => {
            const k = champKey(c);
            if (k) ids.add(k);
        };
        Object.values(bluePicks).forEach(add);
        Object.values(redPicks).forEach(add);
        bans.Blue.forEach(add);
        bans.Red.forEach(add);
        return ids;
    }, [bluePicks, redPicks, bans]);

    // --- Champions API helper ---
    const apiFetchChampions = async ({ search = "", role = "", limit = DEFAULT_LIMIT } = {}) => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (role) params.set("role", role);
        if (limit) params.set("limit", String(limit));

        const base = (API_BASE || "").replace(/\/$/, "");
        const url = base
            ? `${base}/champions?${params.toString()}`
            : `/api/champions?${params.toString()}`;

        let res;
        try {
            res = await fetch(url);
        } catch (err) {
            console.error("Failed to reach champion API:", url, err);
            throw err;
        }

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error(`Champion API responded with ${res.status}: ${res.statusText}`, text);
            throw new Error(`Failed to fetch champions: ${res.status}`);
        }

        return res.json();
    };

    const doSearch = async () => {
        setLoading(true);
        try {
            const data = await (fetchChampions || apiFetchChampions)({
                search: query.trim(),
                role: roleFilter || "",
                limit: DEFAULT_LIMIT
            });
            setResults(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Search error:", e);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const id = setTimeout(doSearch, 200);
        return () => clearTimeout(id);
    }, [query, roleFilter]);

    // --- Visible champs (hide used) ---
    const visibleResults = useMemo(() => {
        const q = query.trim().toLowerCase();

        return results.filter((c) => {
            const k = champKey(c);
            if (!k || usedChampionKeys.has(k)) return false;
            if (q && !c.name.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [results, usedChampionKeys, query]);

    // helper: map picks object into ally/enemy team for backend heuristic
    const mapPicksToTeam = (picks) =>
        Object.entries(picks)
            .filter(([, champ]) => champ)
            .map(([lane, champ]) => ({
                id: champ.key ?? champ.id ?? champ.name,
                role: lane
            }));

    // --- Load recommendations via backend heuristic ---
    const loadRecommendations = async (laneRole) => {
        if (!laneRole) {
            setRecsRole(null);
            setRecs([]);
            return;
        }

        setRecsRole(laneRole);

        // If no API base is configured (e.g. in tests), just skip recs
        const base = (API_BASE || "").replace(/\/$/, "");
        const url = base ? `${base}/draft/recommend` : `/api/draft/recommend`;
        if (!API_BASE && url.startsWith("/api")) {
            // In dev without backend wired, don't spam failing calls
            setRecs([]);
            return;
        }

        setLoadingRecs(true);
        try {
            const isMyTeamRed = activeSlot?.team === "Red";
            const myTeamPicks = isMyTeamRed ? redPicks : bluePicks;
            const enemyTeamPicks = isMyTeamRed ? bluePicks : redPicks;

            const allyTeam = mapPicksToTeam(myTeamPicks);
            const enemyTeam = mapPicksToTeam(enemyTeamPicks);

            const bansAll = [...bans.Blue, ...bans.Red]
                .filter(Boolean)
                .map((c) => c.key ?? c.id ?? c.name);

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    role: laneRole,
                    allyTeam,
                    enemyTeam,
                    bans: bansAll,
                    // you can later make this dynamic ("early"/"mid"/"late")
                    phase: "mid"
                })
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                console.error("draft/recommend error:", res.status, text);
                setRecs([]);
                return;
            }

            const data = await res.json().catch(() => ({}));
            const recsFromServer = Array.isArray(data.recommendations) ? data.recommendations : [];

            // Backend heuristic already returns sorted, tagged suggestions
            setRecs(recsFromServer.slice(0, RECS_LIMIT));
        } catch (e) {
            console.error("Recommendations error:", e);
            setRecs([]);
        } finally {
            setLoadingRecs(false);
        }
    };

    useEffect(() => {
        if (!activeSlot || activeSlot.kind !== "pick") {
            setRecs([]);
            setRecsRole(null);
            return;
        }
        const lane = slotKeyToRole(activeSlot.slotKey);
        loadRecommendations(lane);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSlot, bluePicks, redPicks, bans]);

    // --- Assign champ to slot ---
    const assignChampionToActiveSlot = (champ) => {
        if (!activeSlot) return;

        const k = champKey(champ);
        if (k && usedChampionKeys.has(k)) {
            console.warn("Champion already picked or banned:", champ.name);
            return;
        }

        if (activeSlot.kind === "pick") {
            const lane = slotKeyToRole(activeSlot.slotKey);
            if (activeSlot.team === "Blue") {
                setBluePicks((prev) => ({ ...prev, [lane]: champ }));
            } else {
                setRedPicks((prev) => ({ ...prev, [lane]: champ }));
            }
        } else if (activeSlot.kind === "ban") {
            const idx = Number(activeSlot.slotKey);
            if (Number.isInteger(idx)) {
                setBans((prev) => {
                    const side = prev[activeSlot.team] || [];
                    const nextSide = [...side];
                    nextSide[idx] = champ;
                    return { ...prev, [activeSlot.team]: nextSide };
                });
            }
        }
    };

    // --- Authenticated fetch helper for /drafts ---
    const authFetchJson = async (url, options = {}) => {
        if (!isAuthed) {
            throw new Error("You must be logged in to save drafts.");
        }

        const token = await getAccessTokenSilently();

        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        };

        const res = await fetch(url, { ...options, headers });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            const msg = data.message || data.error || `Request failed: ${res.status}`;
            throw new Error(msg);
        }
        return data;
    };

    const loadUserDrafts = async () => {
        if (!API_BASE || !isAuthed) return;
        setLoadingDrafts(true);
        setDraftError("");
        try {
            const base = (API_BASE || "").replace(/\/$/, "");
            const data = await authFetchJson(`${base}/drafts`);
            setUserDrafts(Array.isArray(data.drafts) ? data.drafts : []);
        } catch (err) {
            console.error(err);
            setDraftError(err.message || "Failed to load drafts");
        } finally {
            setLoadingDrafts(false);
        }
    };

    // Load user's drafts when auth + API ready
    useEffect(() => {
        if (isAuthed && API_BASE) {
            loadUserDrafts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthed, API_BASE]);

    const buildStatePayload = () => ({
        bluePicks,
        redPicks,
        bans
    });

    const handleSaveDraft = async () => {
        if (!isAuthed || !API_BASE) {
            setDraftError("You must be logged in to save drafts.");
            return;
        }
        const nameToUse = draftName.trim() || "Untitled Draft";

        setSavingDraft(true);
        setDraftError("");
        try {
            const body = JSON.stringify({
                name: nameToUse,
                state: buildStatePayload(),
                side: "both",
                notes: ""
            });

            const base = (API_BASE || "").replace(/\/$/, "");
            let data;
            if (currentDraftId) {
                data = await authFetchJson(`${base}/drafts/${currentDraftId}`, {
                    method: "PUT",
                    body
                });
            } else {
                data = await authFetchJson(`${base}/drafts`, {
                    method: "POST",
                    body
                });
            }

            const saved = data.draft;
            setCurrentDraftId(saved?._id || null);
            setDraftName(saved?.name || nameToUse);
            await loadUserDrafts();
        } catch (err) {
            console.error(err);
            setDraftError(err.message || "Failed to save draft");
        } finally {
            setSavingDraft(false);
        }
    };

    const handleSaveAsNew = async () => {
        if (!isAuthed || !API_BASE) {
            setDraftError("You must be logged in to save drafts.");
            return;
        }
        const nameToUse = draftName.trim() || "Untitled Draft";

        setSavingDraft(true);
        setDraftError("");
        try {
            const body = JSON.stringify({
                name: nameToUse,
                state: buildStatePayload(),
                side: "both",
                notes: ""
            });

            const base = (API_BASE || "").replace(/\/$/, "");
            const data = await authFetchJson(`${base}/drafts`, {
                method: "POST",
                body
            });

            const saved = data.draft;
            setCurrentDraftId(saved?._id || null);
            setDraftName(saved?.name || nameToUse);
            await loadUserDrafts();
        } catch (err) {
            console.error(err);
            setDraftError(err.message || "Failed to save draft");
        } finally {
            setSavingDraft(false);
        }
    };

    const handleSelectDraft = (draftId) => {
        if (!draftId) {
            setCurrentDraftId(null);
            return;
        }
        const d = userDrafts.find((x) => String(x._id) === String(draftId));
        if (!d) return;

        const state = d.state || {};
        const nextBlue = state.bluePicks || createEmptyPicks();
        const nextRed = state.redPicks || createEmptyPicks();
        const nextBans = state.bans || createEmptyBans();

        setBluePicks(nextBlue);
        setRedPicks(nextRed);
        setBans({
            Blue: Array.isArray(nextBans.Blue) ? nextBans.Blue : createEmptyBans().Blue,
            Red: Array.isArray(nextBans.Red) ? nextBans.Red : createEmptyBans().Red
        });
        setCurrentDraftId(d._id);
        setDraftName(d.name || "");
        setActiveSlot(null);
    };

    const handleDeleteDraft = async () => {
        if (!currentDraftId || !isAuthed || !API_BASE) {
            setDraftError("No draft selected or not logged in.");
            return;
        }
        setSavingDraft(true);
        setDraftError("");
        try {
            const base = (API_BASE || "").replace(/\/$/, "");
            await authFetchJson(`${base}/drafts/${currentDraftId}`, {
                method: "DELETE"
            });
            setCurrentDraftId(null);
            setDraftName("");
            await loadUserDrafts(); // refresh list from server
        } catch (err) {
            console.error(err);
            setDraftError(err.message || "Failed to delete draft");
        } finally {
            setSavingDraft(false);
        }
    };

    // --- Small presentational pieces ---
    const ChampTile = ({ champ, onClick }) => {
        const k = champKey(champ);
        return (
            <button
                onClick={onClick}
                className="group flex items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 px-3 py-2 transition hover:bg-neutral-800"
                aria-label={`Pick ${champ.name}`}
                key={k}
            >
                <img
                    src={champ.iconUrl}
                    alt={champ.name}
                    className="h-10 w-10 rounded-lg object-cover"
                    loading="lazy"
                    width={40}
                    height={40}
                />
                <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-neutral-100 leading-tight">
                        {champ.name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                        {(champ.roles || []).slice(0, 3).map((r) => (
                            <span
                                key={`${r}_${k}`}
                                className="inline-block rounded-md border border-neutral-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-300"
                            >
                                {r}
                            </span>
                        ))}
                    </div>
                </div>
            </button>
        );
    };

    const SlotButton = ({ label, champ, selected, onSelect }) => (
        <button
            onClick={onSelect}
            className={cn(
                "flex items-center gap-3 rounded-2xl border px-3 py-2 text-left transition",
                selected
                    ? "border-indigo-500/70 bg-indigo-950/40"
                    : "border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800"
            )}
        >
            <div className="h-10 w-10 rounded-lg bg-neutral-800 flex items-center justify-center overflow-hidden">
                {champ?.iconUrl ? (
                    <img
                        src={champ.iconUrl}
                        alt={champ?.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <span className="text-xs text-neutral-400">Empty</span>
                )}
            </div>
            <div className="flex-1">
                <div className="text-[11px] uppercase tracking-wide text-neutral-400">{label}</div>
                <div className="text-sm font-medium text-neutral-100">{champ?.name || "—"}</div>
            </div>
        </button>
    );

    const BanButton = ({ idx, champ, selected, onSelect }) => (
        <button
            onClick={onSelect}
            className={cn(
                "flex items-center gap-2 rounded-xl border px-2 py-1.5 text-left transition",
                selected
                    ? "border-rose-500/70 bg-rose-950/40"
                    : "border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800"
            )}
            aria-label={`Ban slot ${idx + 1}`}
        >
            <div className="h-8 w-8 rounded-md bg-neutral-800 flex items-center justify-center overflow-hidden">
                {champ?.iconUrl ? (
                    <img
                        src={champ.iconUrl}
                        alt={champ?.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <span className="text-[10px] text-neutral-400">#{idx + 1}</span>
                )}
            </div>
            <div className="text-xs text-neutral-200">{champ?.name || "—"}</div>
        </button>
    );

    const activeLaneForTitle =
        activeSlot?.kind === "pick" ? slotKeyToRole(activeSlot.slotKey) : null;

    // --- Render ---
    return (
        <div className="mx-auto max-w-7xl px-4 py-6 text-neutral-100">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
                {/* LEFT: Draft board + search results */}
                <div className="space-y-6">
                    {/* Draft meta + server-side save/load */}
                    <section className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] uppercase tracking-wide text-neutral-500">
                                    Draft Name
                                </span>
                                <input
                                    value={draftName}
                                    onChange={(e) => setDraftName(e.target.value)}
                                    placeholder="My scrim draft vs engage..."
                                    className="w-64 min-w-[200px] rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                />
                            </div>

                            {isAuthed ? (
                                <>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSaveDraft}
                                            disabled={savingDraft}
                                            className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
                                        >
                                            {currentDraftId ? "Save Changes" : "Save Draft"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveAsNew}
                                            disabled={savingDraft}
                                            className="rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 disabled:opacity-60"
                                        >
                                            Save As New
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeleteDraft}
                                            disabled={savingDraft || !currentDraftId}
                                            className="rounded-xl border border-rose-700/70 bg-rose-950/40 px-3 py-2 text-xs font-medium text-rose-200 hover:bg-rose-900/60 disabled:opacity-50"
                                        >
                                            Delete
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <label className="text-[11px] uppercase tracking-wide text-neutral-500">
                                            My Drafts
                                        </label>
                                        <select
                                            className="min-w-[200px] rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                            value={currentDraftId || ""}
                                            onChange={(e) => handleSelectDraft(e.target.value)}
                                        >
                                            <option value="">
                                                {loadingDrafts
                                                    ? "Loading drafts..."
                                                    : "Select a saved draft"}
                                            </option>
                                            {userDrafts.map((d) => (
                                                <option key={d._id} value={d._id}>
                                                    {d.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-neutral-500">
                                    Log in to save drafts to your account. Local draft state still
                                    auto-saves on this device.
                                </p>
                            )}

                            <div className="ml-auto">
                                <button
                                    type="button"
                                    onClick={clearDraft}
                                    className="rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800"
                                >
                                    Clear draft
                                </button>
                            </div>
                        </div>

                        {draftError && (
                            <p className="mt-2 text-xs text-rose-400">Error: {draftError}</p>
                        )}
                    </section>

                    {/* Draft board */}
                    <section className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                            Draft Board
                        </h2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Blue team */}
                            <div>
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                                    Blue Picks
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {LANE_ORDER.map((lane) => (
                                        <SlotButton
                                            key={`blue-${lane}`}
                                            label={lane}
                                            champ={bluePicks[lane]}
                                            selected={
                                                activeSlot?.team === "Blue" &&
                                                activeSlot?.kind === "pick" &&
                                                slotKeyToRole(activeSlot.slotKey) === lane
                                            }
                                            onSelect={() =>
                                                setActiveSlot({
                                                    team: "Blue",
                                                    kind: "pick",
                                                    slotKey: lane
                                                })
                                            }
                                        />
                                    ))}
                                </div>

                                <div className="mt-4">
                                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-300">
                                        Blue Bans
                                    </div>
                                    <div className="grid grid-cols-5 gap-2">
                                        {bans.Blue.map((ban, i) => (
                                            <BanButton
                                                key={`ban-blue-${i}`}
                                                idx={i}
                                                champ={ban}
                                                selected={
                                                    activeSlot?.team === "Blue" &&
                                                    activeSlot?.kind === "ban" &&
                                                    Number(activeSlot.slotKey) === i
                                                }
                                                onSelect={() =>
                                                    setActiveSlot({
                                                        team: "Blue",
                                                        kind: "ban",
                                                        slotKey: i
                                                    })
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Red team */}
                            <div>
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
                                    Red Picks
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {LANE_ORDER.map((lane) => (
                                        <SlotButton
                                            key={`red-${lane}`}
                                            label={lane}
                                            champ={redPicks[lane]}
                                            selected={
                                                activeSlot?.team === "Red" &&
                                                activeSlot?.kind === "pick" &&
                                                slotKeyToRole(activeSlot.slotKey) === lane
                                            }
                                            onSelect={() =>
                                                setActiveSlot({
                                                    team: "Red",
                                                    kind: "pick",
                                                    slotKey: lane
                                                })
                                            }
                                        />
                                    ))}
                                </div>

                                <div className="mt-4">
                                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-300">
                                        Red Bans
                                    </div>
                                    <div className="grid grid-cols-5 gap-2">
                                        {bans.Red.map((ban, i) => (
                                            <BanButton
                                                key={`ban-red-${i}`}
                                                idx={i}
                                                champ={ban}
                                                selected={
                                                    activeSlot?.team === "Red" &&
                                                    activeSlot?.kind === "ban" &&
                                                    Number(activeSlot.slotKey) === i
                                                }
                                                onSelect={() =>
                                                    setActiveSlot({
                                                        team: "Red",
                                                        kind: "ban",
                                                        slotKey: i
                                                    })
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-neutral-400">
                            Tip: click a slot first to select it, then click a champion to assign.
                        </p>
                    </section>

                    {/* Search + Filters */}
                    <section className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search champions..."
                                className="w-64 min-w-[200px] rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            >
                                <option value="">All Roles</option>
                                {LANE_ORDER.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </section>

                    {/* Search results */}
                    <section className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                            Champions
                            {roleFilter && (
                                <span className="ml-2 text-neutral-500">({roleFilter})</span>
                            )}
                        </h2>
                        {loading ? (
                            <div className="py-8 text-center text-sm text-neutral-400">
                                Loading…
                            </div>
                        ) : visibleResults.length === 0 ? (
                            <div className="py-8 text-center text-sm text-neutral-500">
                                No results
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                {visibleResults.map((c) => {
                                    const k = champKey(c);
                                    return (
                                        <button
                                            key={k}
                                            disabled={!activeSlot}
                                            onClick={() => assignChampionToActiveSlot(c)}
                                            className={cn(
                                                "group rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3 text-left transition",
                                                !activeSlot
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : "hover:bg-neutral-800"
                                            )}
                                        >
                                            <img
                                                src={c.iconUrl}
                                                alt={c.name}
                                                className="h-16 w-16 rounded-lg object-cover"
                                                loading="lazy"
                                                width={64}
                                                height={64}
                                            />
                                            <div className="mt-2 text-sm font-semibold">
                                                {c.name}
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {(c.roles || []).slice(0, 3).map((r) => (
                                                    <span
                                                        key={`${r}_${k}`}
                                                        className="inline-block rounded-md border border-neutral-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-300"
                                                    >
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                {/* RIGHT: Recommendations */}
                <aside className="sticky top-4 h-max rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
                    <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                        Recommendations
                    </div>

                    {activeLaneForTitle ? (
                        <div className="mb-4 text-xs text-neutral-400">
                            Showing{" "}
                            <span className="font-semibold text-neutral-200">
                                {activeLaneForTitle}
                            </span>{" "}
                            suggestions for the selected slot.
                        </div>
                    ) : (
                        <div className="mb-4 text-xs text-neutral-500">
                            Select a <span className="text-neutral-300">pick slot</span> to see
                            lane-specific suggestions.
                        </div>
                    )}

                    {loadingRecs ? (
                        <div className="py-6 text-center text-sm text-neutral-400">
                            Loading suggestions…
                        </div>
                    ) : !activeLaneForTitle ? (
                        <div className="py-2 text-sm text-neutral-500">—</div>
                    ) : recs.length === 0 ? (
                        <div className="py-2 text-sm text-neutral-500">
                            No available {recsRole} champions left (already picked or banned), or
                            recommendations are unavailable.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {recs.map((c) => (
                                <div key={champKey(c)} className="relative group">
                                    <ChampTile
                                        champ={c}
                                        onClick={() => assignChampionToActiveSlot(c)}
                                    />

                                    {Array.isArray(c.highlights) && c.highlights.length > 0 && (
                                        <div
                                            className="
                                            hidden
                                            group-hover:block
                                            absolute left-1/2 top-full 
                                            mt-2 w-72 -translate-x-1/2
                                            rounded-lg bg-neutral-950/95 
                                            px-3 py-2 
                                            text-[11px] text-neutral-50 
                                            shadow-xl ring-1 ring-black/60
                                            pointer-events-none
                                            z-50
                                            "
                                        >
                                            <p className="mb-1 font-semibold text-emerald-300">
                                                What {c.name} adds
                                            </p>

                                            <ul className="space-y-0.5 list-disc list-inside">
                                                {c.highlights.map((line, idx) => (
                                                    <li key={idx}>{line}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
                        <div className="text-xs text-neutral-400">
                            Suggestions are generated by a server-side heuristic that looks at team
                            needs (frontline, engage, AP/AD mix, CC, waveclear), synergies,
                            counters, and lane fit, while excluding already-picked and banned
                            champions.
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
