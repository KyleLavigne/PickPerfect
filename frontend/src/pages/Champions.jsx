// src/pages/Champions.jsx
import React, { useEffect } from "react";
import { useStore } from "../state/useStore";
import RoleFilter from "../components/RoleFilter";
import SearchBar from "../components/SearchBar";
import ChampCard from "../components/ChampCard";

export default function Champions() {
    const { champions, loadChampions, loading, filters, loadRoles } = useStore();

    // initial load
    useEffect(() => {
        loadRoles();
        loadChampions();
    }, [loadRoles, loadChampions]);

    // reload when filters change
    useEffect(() => {
        loadChampions();
    }, [filters.role, filters.q, filters.tag, loadChampions]);

    return (
        <div className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden text-slate-50">
            {/* 🌌 Centered dark glass overlay */}
            <div
                className="
          absolute inset-y-0 left-1/2 -translate-x-1/2 w-2/3
          bg-neutral-950/70 rounded-xl backdrop-blur-sm z-10
        "
            />

            {/* 🧩 Content container */}
            <div
                className="
          relative z-20 mx-auto w-2/3 max-w-7xl
          px-8 py-10 sm:px-10 sm:py-12
        "
            >
                {/* Top row filters */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <RoleFilter />
                    <SearchBar />
                </div>

                {/* Loading */}
                {loading && <div className="py-4 text-neutral-300 text-sm">Loading champions…</div>}

                {/* Champion Grid — MORE COLUMNS, MORE PANEL USE */}
                <div
                    className="
            grid gap-5
            grid-cols-2
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-5
            xl:grid-cols-6
            2xl:grid-cols-7
          "
                >
                    {champions.map((ch) => (
                        <ChampCard key={ch.key} champ={ch} />
                    ))}
                </div>
            </div>
        </div>
    );
}
