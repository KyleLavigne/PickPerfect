// src/components/RotatingBackground.jsx
import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

export default function RotatingBackground({
    intervalMs = 8000,
    blurPx = 6,
    darken = 0.75,
    maxChamps = 20
}) {
    const [splashes, setSplashes] = useState([]);
    const [index, setIndex] = useState(0);

    // Fetch splash list once
    useEffect(() => {
        let cancelled = false;

        async function loadSplashes() {
            try {
                const base = (API_BASE || "").replace(/\/$/, "");
                const url = `${base}/ddragon/splashes?limit=${encodeURIComponent(maxChamps)}`;

                const res = await fetch(url);

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    console.error(
                        "[RotatingBackground] splash API error:",
                        res.status,
                        res.statusText,
                        text
                    );
                    throw new Error(`HTTP ${res.status}`);
                }

                const json = await res.json();

                if (cancelled) return;

                let list = json.splashes || [];
                if (!Array.isArray(list) || list.length === 0) {
                    setSplashes([]);
                    return;
                }

                // Shuffle a bit and limit how many we use (in case backend returns more)
                list = shuffle(list).slice(0, maxChamps);
                setSplashes(list);
                setIndex(0);
            } catch (err) {
                if (!cancelled) {
                    console.error("[RotatingBackground] error:", err);
                    setSplashes([]);
                }
            }
        }

        loadSplashes();

        return () => {
            cancelled = true;
        };
    }, [maxChamps]);

    // Advance index every intervalMs
    useEffect(() => {
        if (!splashes.length) return;

        const id = setInterval(() => {
            setIndex((prev) => (prev + 1) % splashes.length);
        }, intervalMs);

        return () => clearInterval(id);
    }, [splashes, intervalMs]);

    if (!splashes.length) return null;

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
            {splashes.map((splash, i) => (
                <div
                    key={splash.key || splash.name || i}
                    className="
                        absolute inset-0
                        bg-cover bg-center
                        transition-opacity duration-3000 ease-in-out
                    "
                    style={{
                        backgroundImage: `url(${splash.splash})`,
                        opacity: i === index ? 1 : 0,
                        filter: `blur(${blurPx}px) brightness(${darken})`
                    }}
                    aria-hidden="true"
                />
            ))}
        </div>
    );
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
