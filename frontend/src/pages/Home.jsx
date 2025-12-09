import React from "react";
import { Link } from "react-router-dom";
import RotatingBackground from "../components/RotatingBackground";

export default function HomePage() {
    return (
        <div className="relative min-h-screen text-slate-50 overflow-hidden">
            {/* Optional: if you’re using this as a global background elsewhere,
                you can either keep this here or remove the import */}
            {/* <RotatingBackground /> */}

            {/* Foreground content on top */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-2/3 bg-neutral-950/70 rounded-xl backdrop-blur-sm z-10">
                {/* Main content */}
                <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 md:py-12">
                    {/* Hero */}
                    <section className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Live-draft companion for League of Legends
                            </div>

                            <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl md:text-5xl">
                                Draft smarter, not harder.
                            </h1>

                            <p className="mt-4 max-w-xl text-sm text-slate-200 md:text-base">
                                Use role-aware recommendations, ban filters, and champion insights
                                to win champ select before the game even starts. Track both team
                                compositions as you go so you can spot gaps, over-laps, and risky
                                blind picks at a glance.
                            </p>

                            <p className="mt-3 max-w-xl text-xs text-slate-300 md:text-sm">
                                The draft helper reads from your champion database and roles JSON,
                                filters out already-picked and banned champions, and surfaces
                                lane-specific suggestions that respond to your comp and the
                                enemy&apos;s comp in real time.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    to="/draft"
                                    className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/30 transition hover:brightness-110"
                                >
                                    Start a Draft
                                </Link>
                                <Link
                                    to="/champions"
                                    className="inline-flex items-center justify-center rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800/80"
                                >
                                    Browse Champions
                                </Link>
                            </div>

                            <p className="mt-3 text-[11px] text-slate-300">
                                Picks, bans, and role filters stay in sync with your backend. Drafts
                                can be saved and loaded so you can revisit scrim plans, prep for
                                series, or experiment with different ban phases.
                            </p>
                        </div>

                        {/* Right-side cards */}
                        <div className="space-y-3">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                        Draft Snapshot
                                    </div>
                                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                                        Team overview
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-slate-100">
                                    See recommended picks by role, avoid bad overlaps, and respect
                                    enemy threats based on bans &amp; current picks. Quickly read
                                    which lanes still need engage, frontline, or reliable damage.
                                </p>
                                <p className="mt-2 text-[11px] text-slate-300">
                                    Use this as a prep tool for clash, flex stacks, or competitive
                                    sets: save drafts between games and adjust your answers to enemy
                                    comfort picks and meta power picks.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <FeatureCard
                                    title="Role-aware pool"
                                    body="Filter champs by Top/Jungle/Mid/Bot/Support based on your saved roles JSON and tags."
                                    emoji="🎯"
                                />
                                <FeatureCard
                                    title="Smart bans"
                                    body="Automatically remove banned & picked champs from suggestion lists so you never accidentally recommend a taken pick."
                                    emoji="⛔"
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <FeatureCard
                                    title="Team balance"
                                    body="Keep an eye on damage mix and frontline. Avoid 5 AD dive comps or full squish teams by seeing your comp shape as you draft."
                                    emoji="⚖️"
                                />
                                <FeatureCard
                                    title="Patch-proof data"
                                    body="Champion icons & details stay synced with Data Dragon via your backend, so you don’t have to manually update images or stats."
                                    emoji="📡"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Lower section */}
                    <section className="grid gap-6 md:grid-cols-3">
                        <QuickLinkCard
                            title="Jump into a draft"
                            description="Open the draft tool and start adding picks & bans for both teams. Use lane slots to keep everything organized and easy to read."
                            to="/draft"
                            label="Open Draft Tool"
                        />
                        <QuickLinkCard
                            title="Champion library"
                            description="Review roles, tags, and Data Dragon details for each champion. Use this to clean up your roles JSON or discover flex picks."
                            to="/champions"
                            label="View Champions"
                        />
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-200">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                How to use
                            </div>
                            <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                                <li>• Start a draft and select a side (Blue / Red).</li>
                                <li>
                                    • Click a lane slot or ban slot to select it, then click a
                                    champion card to assign that pick or ban.
                                </li>
                                <li>
                                    • Use the search bar &amp; role filter to narrow your pool while
                                    recommendations update based on both team comps.
                                </li>
                                <li>
                                    • Save drafts you like so you can revisit specific ban phases,
                                    level 1 plans, or champ select scripts for future games.
                                </li>
                                <li>
                                    • Browse the champion page to verify roles, tags, and to keep
                                    your data aligned with the latest patch.
                                </li>
                            </ul>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}

function FeatureCard({ title, body, emoji }) {
    return (
        <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-sm">
            <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-base">
                    {emoji}
                </div>
                <div className="text-[13px] font-semibold text-slate-100">{title}</div>
            </div>
            <p className="mt-2 text-[11px] text-slate-300">{body}</p>
        </div>
    );
}

function QuickLinkCard({ title, description, to, label }) {
    return (
        <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {title}
                </div>
                <p className="mt-2 text-sm text-slate-200">{description}</p>
            </div>
            <Link
                to={to}
                className="mt-4 inline-flex w-fit items-center justify-center rounded-full border border-emerald-400/70 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20"
            >
                {label}
            </Link>
        </div>
    );
}
